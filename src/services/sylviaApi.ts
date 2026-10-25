import {
  BackendHealth,
  AgentCard,
  ApprovalRequest,
  ApprovalResult,
  CalendarEvent,
  GmailDraftResult,
  GmailMessage,
  ToolExecution,
  WorkspaceHealth,
} from '../types';

export interface ParsedADKResponse {
  reply: string;
  specialist: string;
  contextId?: string;
  taskId?: string;
  toolExecutions: ToolExecution[];
  approvalRequest?: ApprovalRequest;
  gmailMessages: GmailMessage[];
  calendarEvents: CalendarEvent[];
  workspaceResult?: Record<string, unknown>;
  rawAdkResult?: unknown;
  streamingUsed?: boolean;
}

export interface ADKStreamTraceEvent {
  type: 'tool_call' | 'tool_response' | 'status' | 'text' | 'other';
  id?: string;
  toolName?: string;
  status?: string;
  message?: string;
  details?: unknown;
}

const DEFAULT_LIVE_BACKEND = 'https://sylvia-agent-516232832461.africa-south1.run.app';

class SylviaApiService {
  private backendUrl: string;
  private currentContextId: string | null = null;
  private currentTaskId: string | null = null;
  private isDemoModeActive = false;

  constructor() {
    this.backendUrl = import.meta.env.VITE_SYLVIA_API_URL || DEFAULT_LIVE_BACKEND;
  }

  public getBaseUrl(): string { return this.backendUrl; }
  public setBaseUrl(url: string): void { this.backendUrl = url.trim().replace(/\/+$/, '') || DEFAULT_LIVE_BACKEND; }
  public getContextId(): string | null { return this.currentContextId; }
  public setContextId(id: string | null): void { this.currentContextId = id; }
  public resetConversation(): void { this.currentContextId = null; this.currentTaskId = null; }
  public isDemoMode(): boolean { return this.isDemoModeActive; }
  public setDemoMode(active: boolean): void { this.isDemoModeActive = active; }

  private buildAgentRequest(userMessage: string): string {
    const lower = userMessage.toLowerCase();
    const workspaceIntent = /gmail|email|inbox|calendar|meeting|schedule/.test(lower);
    if (!workspaceIntent) return userMessage;
    return [
      'WORKSPACE OPERATION REQUEST.',
      'Use the real connected Google Workspace tools through the Workspace Specialist.',
      'Do not simulate or invent Gmail messages, calendar events, draft IDs, message IDs, thread IDs, recipients, or operation results.',
      'For read requests, actually query the connected Workspace tool and return the records it provides.',
      'For write requests, prepare the operation and request human approval through the ADK tool-confirmation mechanism.',
      'After approval, only report an external write as successful when the actual tool function response confirms success with structured result data.',
      `USER REQUEST: ${userMessage}`,
    ].join('\n');
  }

  private async postA2A(payload: unknown): Promise<any> {
    let proxyError: Error | null = null;
    try {
      const response = await fetch('/a2a/app', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload),
      });
      const text = await response.text();
      const body = (() => { try { return JSON.parse(text); } catch { return null; } })();
      if (!response.ok) throw new Error(body?.error?.message || `A2A proxy returned HTTP ${response.status}`);
      if (!body) throw new Error('A2A proxy returned a non-JSON response.');
      return body;
    } catch (err) {
      proxyError = err instanceof Error ? err : new Error(String(err));
    }
    try {
      const response = await fetch(`${this.backendUrl}/a2a/app`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || `Google ADK backend returned HTTP ${response.status}`);
      return body;
    } catch (err) {
      const directError = err instanceof Error ? err : new Error(String(err));
      throw new Error(proxyError ? `${directError.message} (proxy: ${proxyError.message})` : directError.message);
    }
  }

  private isStreamingUnsupported(value: any): boolean {
    const message = String(value?.error?.message || value?.message || value?.error || '').toLowerCase();
    return value?.error?.code === -32601 ||
      message.includes('streaming is not supported') ||
      message.includes('streaming not supported') ||
      message.includes('unsupportedoperationerror') ||
      (message.includes('message/stream') && (message.includes('unsupported') || message.includes('not supported')));
  }

  private async postA2AStream(
    payload: any,
    onTraceEvent?: (event: ADKStreamTraceEvent) => void,
  ): Promise<{ supported: boolean; body?: any }> {
    const response = await fetch('/a2a/app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream, application/json' },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/event-stream')) {
      const text = await response.text();
      let body: any = null;
      try { body = JSON.parse(text); } catch { /* handled below */ }
      if (this.isStreamingUnsupported(body) || this.isStreamingUnsupported({ message: text })) {
        return { supported: false };
      }
      if (!response.ok) {
        throw new Error(body?.error?.message || ('ADK streaming endpoint returned HTTP ' + response.status));
      }
      if (body?.result || body?.error) return { supported: true, body };
      throw new Error('ADK stream endpoint returned neither an event stream nor a valid JSON-RPC envelope.');
    }

    if (!response.ok || !response.body) {
      const bodyText = await response.text().catch(() => '');
      if (this.isStreamingUnsupported({ message: bodyText })) return { supported: false };
      throw new Error('ADK stream failed with HTTP ' + response.status);
    }

    const decoder = new TextDecoder();
    const reader = response.body.getReader();
    let buffer = '';
    let taskId: string | undefined;
    let contextId: string | undefined;
    let taskStatus: any;
    let finalEnvelope: any;
    const artifacts = new Map<string, any>();
    const statusHistory: any[] = [];
    const emitted = new Set<string>();

    const notifyParts = (parts: any[], metadata?: any) => {
      for (const part of parts || []) {
        const partMetadata = part?.metadata || {};
        const data = part?.data && typeof part.data === 'object' ? part.data : {};
        const type = String(
          partMetadata.adk_type || partMetadata.adkType || partMetadata.type ||
          data.adk_type || data.adkType || data.type || '',
        ).toLowerCase();
        const id = data.id != null ? String(data.id) : undefined;
        const toolName = data.name != null ? String(data.name) : undefined;
        if (type === 'function_call' || type === 'tool_call') {
          const key = 'call:' + (id || '') + ':' + (toolName || '');
          if (emitted.has(key)) continue;
          emitted.add(key);
          onTraceEvent?.({ type: 'tool_call', id, toolName, status: 'running', details: data.args || data.input });
        } else if (type === 'function_response' || type === 'tool_response') {
          const key = 'response:' + (id || '') + ':' + (toolName || '');
          if (emitted.has(key)) continue;
          emitted.add(key);
          const payloadResult = data.response || data.output || data.result || data;
          onTraceEvent?.({
            type: 'tool_response', id, toolName,
            status: payloadResult?.error ? 'failed' : 'completed',
            details: payloadResult,
          });
        } else if (typeof part?.text === 'string' && part.text.trim() && metadata?.adk_author) {
          onTraceEvent?.({ type: 'text', message: part.text, details: { author: metadata.adk_author } });
        }
      }
    };

    const consumeEvent = (packet: string) => {
      const dataLines = packet.split(/\r?\n/).filter(line => line.startsWith('data:'));
      if (!dataLines.length) return;
      const raw = dataLines.map(line => line.slice(5).replace(/^ /, '')).join('\n');
      if (!raw || raw === '[DONE]') return;

      let event: any;
      try { event = JSON.parse(raw); } catch { return; }
      if (event?.error && this.isStreamingUnsupported(event)) {
        throw new Error('ADK_STREAM_UNSUPPORTED:' + (event.error.message || event.message || 'streaming unsupported'));
      }
      if (event?.result && (event.result.artifacts || event.result.history || event.result.status)) {
        finalEnvelope = event;
        const result = event.result;
        taskId = result.id ? String(result.id) : taskId;
        contextId = result.contextId ? String(result.contextId) : contextId;
        taskStatus = result.status || taskStatus;
        for (const artifact of result.artifacts || []) {
          if (!artifact?.parts) continue;
          const id = String(artifact.artifactId || artifact.artifact_id || artifacts.size);
          artifacts.set(id, artifact);
          notifyParts(artifact.parts, artifact.metadata);
        }
        return;
      }

      const task = event?.task || (String(event?.kind || '').toLowerCase() === 'task' ? event : null);
      if (task) {
        if (task.id) taskId = String(task.id);
        if (task.contextId) contextId = String(task.contextId);
        if (task.status) taskStatus = task.status;
        for (const artifact of task.artifacts || []) {
          if (!artifact?.parts) continue;
          const id = String(artifact.artifactId || artifact.artifact_id || artifacts.size);
          artifacts.set(id, artifact);
          notifyParts(artifact.parts, artifact.metadata);
        }
        for (const message of task.history || []) {
          if (message?.parts) {
            statusHistory.push(message);
            notifyParts(message.parts, message.metadata);
          }
        }
      }

      if (event?.taskId) taskId = String(event.taskId);
      if (event?.contextId) contextId = String(event.contextId);

      const kind = String(event?.kind || event?.type || '').toLowerCase().replace(/_/g, '-');
      if (event?.artifact?.parts) {
        const artifact = event.artifact;
        const id = String(artifact.artifactId || artifact.artifact_id || artifacts.size);
        const existing = artifacts.get(id);
        const append = event.append === true;
        const merged = existing && append
          ? { ...existing, ...artifact, parts: [...(existing.parts || []), ...(artifact.parts || [])] }
          : artifact;
        artifacts.set(id, merged);
        notifyParts(artifact.parts, artifact.metadata);
      }
      if (event?.status) {
        taskStatus = event.status;
        const state = String(event.status.state || event.status.status || '').toLowerCase();
        onTraceEvent?.({
          type: 'status',
          status: state || kind || 'working',
          message: String(event.status.message?.parts?.map((part: any) => part?.text || '').filter(Boolean).join(' ') || ''),
        });
        if (event.status.message?.parts) {
          statusHistory.push(event.status.message);
          notifyParts(event.status.message.parts, event.status.message.metadata);
        }
      } else if (kind.includes('status') || event?.state) {
        onTraceEvent?.({ type: 'status', status: String(event?.state || kind || ''), message: String(event?.message || '') });
      }
    };

    const consumeBuffer = (force = false) => {
      const packets = buffer.split(/\r?\n\r?\n/);
      buffer = force ? '' : (packets.pop() || '');
      for (const packet of packets) consumeEvent(packet);
      if (force && buffer.trim()) consumeEvent(buffer);
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        consumeBuffer();
      }
      buffer += decoder.decode();
      consumeBuffer(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.startsWith('ADK_STREAM_UNSUPPORTED:')) return { supported: false };
      throw error;
    } finally {
      reader.releaseLock();
    }

    if (finalEnvelope) return { supported: true, body: finalEnvelope };
    if (!taskId && !contextId && artifacts.size === 0 && statusHistory.length === 0) {
      throw new Error('ADK stream ended without task, artifact, or status events.');
    }

    const artifactList = [...artifacts.values()];
    const history = [
      ...artifactList.map(artifact => ({ role: 'assistant', parts: artifact.parts || [], metadata: artifact.metadata || {} })),
      ...statusHistory.map(message => ({ role: message.role || 'assistant', parts: message.parts || [], metadata: message.metadata || {} })),
    ];
    return {
      supported: true,
      body: {
        jsonrpc: '2.0',
        id: payload.id,
        result: {
          id: taskId,
          contextId: contextId,
          status: taskStatus || { state: 'completed' },
          artifacts: artifactList,
          history,
        },
      },
    };
  }

  public async checkHealth(): Promise<BackendHealth> {
    const startTime = performance.now();
    try {
      const response = await fetch('/api/health', { method: 'GET', headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => null);
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        connected: Boolean(response.ok && data?.adkStatus === 'connected'),
        status: response.ok && data?.adkStatus === 'connected' ? 'ok' : 'degraded',
        backendUrl: data?.liveAdkBackend || this.backendUrl,
        latencyMs,
        lastChecked: new Date().toISOString(),
        adkConnected: Boolean(response.ok && data?.adkStatus === 'connected'),
        a2aVersion: 'A2A/2.0-JSONRPC (Google ADK Live Backend)',
        isDemoMode: false,
        error: response.ok && data?.adkStatus === 'connected' ? undefined : (data?.error || `ADK health endpoint returned HTTP ${response.status}`),
      };
    } catch (err: unknown) {
      return {
        connected: false,
        status: 'offline',
        backendUrl: this.backendUrl,
        lastChecked: new Date().toISOString(),
        adkConnected: false,
        isDemoMode: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  public async checkWorkspaceHealth(): Promise<WorkspaceHealth> {
    const response = await this.postA2A({
      jsonrpc: '2.0', id: `workspace_health_${Date.now()}`, method: 'message/send',
      params: {
        ...(this.currentContextId ? { contextId: this.currentContextId } : {}),
        message: {
          messageId: `workspace_health_msg_${Date.now()}`,
          role: 'user',
          parts: [{ text: 'Use the real workspace_health_check tool. Return the structured tool result. Do not create, modify, draft, or send anything.' }],
        },
      },
    });
    if (response?.error) throw new Error(response.error.message || 'Workspace health request failed.');
    const parsed = this.parseADKResponse(response);
    const raw = parsed.workspaceResult as any;
    if (!raw || typeof raw !== 'object' || typeof raw.authenticated !== 'boolean') {
      throw new Error('Workspace health response was not returned by the real workspace_health_check tool.');
    }
    return {
      source: 'backend',
      authenticated: Boolean(raw.authenticated),
      gmailConnected: Boolean(raw.gmail?.connected),
      gmailEmail: raw.gmail?.email ? String(raw.gmail.email) : undefined,
      calendarConnected: Boolean(raw.calendar?.connected),
      calendarCount: raw.calendar?.calendar_count != null ? Number(raw.calendar.calendar_count) : undefined,
      error: String(raw.gmail?.error || raw.calendar?.error || '') || undefined,
      checkedAt: new Date().toISOString(),
    };
  }

  public async getAgentCard(): Promise<AgentCard> {
    return {
      name: 'SYLVIA',
      description: 'Collaborative Digital Operator running on Google ADK with Root Agent, Context Analyst, Decision Partner, Action Planner, and Workspace Specialist.',
      version: '2.0.0', protocolVersion: 'A2A/2.0-JSONRPC', author: 'Google ADK Sylvia Team',
      capabilities: ['GOOGLE_ADK_ROOT_AGENT','CONTEXT_ANALYST','DECISION_PARTNER','ACTION_PLANNER','WORKSPACE_SPECIALIST','GMAIL_TOOLS','CALENDAR_TOOLS','DECISION_DNA','CONTEXT_MEMORY_FIRESTORE','HUMAN_IN_THE_LOOP_APPROVAL'],
      skills: [
        { name: 'get_current_mission', description: 'Retrieve persistent active mission state from Firestore' },
        { name: 'get_decision_dna', description: 'Retrieve human operator Decision DNA rules, values, and constraints' },
        { name: 'context_memory_health_check', description: 'Validate Firestore persistent context memory store' },
        { name: 'save_decision_dna_preference', description: 'Persist preference or rule to Decision DNA' },
        { name: 'save_context_memory', description: 'Store structured context memory item' },
        { name: 'create_gmail_draft', description: 'Create a Gmail draft with human-in-the-loop authorization and structured result verification' },
        { name: 'schedule_calendar_event', description: 'Schedule or adjust Google Calendar event' },
        { name: 'start_or_update_mission', description: 'Deconstruct complex goals into actionable multi-step missions' },
      ],
    };
  }

  public async sendA2AMessage(
    userMessage: string,
    onTraceEvent?: (event: ADKStreamTraceEvent) => void,
  ): Promise<ParsedADKResponse> {
    const lower = userMessage.toLowerCase();
    const workspaceIntent = /gmail|email|inbox|calendar|meeting|schedule/.test(lower);
    const payload: any = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'message/stream',
      params: {
        ...(this.currentContextId ? { contextId: this.currentContextId } : {}),
        message: {
          messageId: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
          role: 'user',
          parts: [{ text: this.buildAgentRequest(userMessage) }],
        },
      },
    };

    const streamed = await this.postA2AStream(payload, onTraceEvent);
    let body = streamed.body;
    if (!streamed.supported) {
      onTraceEvent?.({
        type: 'status',
        status: 'streaming_unavailable',
        message: 'The ADK backend has not enabled A2A streaming; Sylvia will show verified tool results when the run finishes.',
      });
      payload.method = 'message/send';
      body = await this.postA2A(payload);
    }
    if (body?.error) throw new Error(body.error.message || ('A2A error (' + body.error.code + ')'));
    const parsed = this.parseADKResponse(body);
    parsed.streamingUsed = streamed.supported;

    if (workspaceIntent && !parsed.approvalRequest) {
      const gmailRead = /gmail|email|inbox/.test(lower);
      const calendarRead = /calendar|meeting|schedule/.test(lower);
      if (gmailRead && parsed.gmailMessages.length === 0 && !parsed.toolExecutions.some(t => t.toolName === 'GMAIL' && t.status === 'completed')) {
        parsed.reply = 'I could not verify live Gmail data from the connected Workspace Specialist. I will not display or invent inbox records.\n\nBackend response: ' + parsed.reply;
      }
      if (calendarRead && parsed.calendarEvents.length === 0 && !parsed.toolExecutions.some(t => t.toolName === 'CALENDAR' && t.status === 'completed')) {
        parsed.reply = 'I could not verify live Calendar data from the connected Workspace Specialist. I will not display or invent calendar events.\n\nBackend response: ' + parsed.reply;
      }
    }
    return parsed;
  }

  private parseGmailMessage(value: any): GmailMessage | null {
    if (!value || typeof value !== 'object') return null;
    const rawFrom = String(value.from || value.sender || '');
    const match = rawFrom.match(/<([^>]+)>/);
    const id = String(value.id || value.messageId || value.message_id || '').trim();
    if (!id) return null;
    const senderEmail = String(value.senderEmail || value.from_email || match?.[1] || '');
    const sender = String(value.sender || (match ? rawFrom.replace(match[0], '').trim() : rawFrom) || senderEmail || 'Unknown sender');
    return {
      id,
      threadId: value.thread_id != null ? String(value.thread_id) : value.threadId != null ? String(value.threadId) : undefined,
      messageId: value.message_id != null ? String(value.message_id) : value.messageId != null ? String(value.messageId) : undefined,
      sender, senderEmail,
      subject: String(value.subject || '(No subject)'),
      preview: String(value.snippet || value.preview || value.body || ''),
      body: value.body ? String(value.body) : undefined,
      date: String(value.date || value.internal_date || value.internalDate || 'Unknown date'),
      unread: Boolean(value.unread ?? (Array.isArray(value.labels) && value.labels.includes('UNREAD'))),
      requiresReply: typeof value.requiresReply === 'boolean' ? value.requiresReply : typeof value.requires_reply === 'boolean' ? value.requires_reply : undefined,
      labels: Array.isArray(value.labels) ? value.labels.map(String) : undefined,
    };
  }

  private parseCalendarEvent(value: any): CalendarEvent | null {
    if (!value || typeof value !== 'object') return null;
    const id = String(value.id || value.event_id || '').trim();
    if (!id) return null;
    return {
      id,
      title: String(value.title || value.summary || '(Untitled event)'),
      startTime: String(value.startTime || value.start || value.start_time || ''),
      endTime: String(value.endTime || value.end || value.end_time || ''),
      location: value.location ? String(value.location) : undefined,
      calendarName: String(value.calendarName || value.calendar || 'Google Calendar'),
      durationMinutes: Number(value.durationMinutes || value.duration_minutes || 0),
      attendees: Array.isArray(value.attendees) ? value.attendees.map(String) : undefined,
      period: value.period === 'tomorrow' || value.period === 'upcoming' ? value.period : 'today',
    };
  }

  private extractFunctionData(result: any): Array<{ kind: 'call' | 'response'; id?: string; name?: string; data: any; metadata: any }> {
    const output: Array<{ kind: 'call' | 'response'; id?: string; name?: string; data: any; metadata: any }> = [];
    const histories = Array.isArray(result?.history) ? result.history : [];
    for (const item of histories) {
      const parts = Array.isArray(item?.parts) ? item.parts : [];
      for (const part of parts) {
        const data = part?.data;
        if (!data || typeof data !== 'object') continue;
        const metadata = part?.metadata || {};
        const type = String(metadata.adk_type || metadata.adkType || data.adk_type || data.adkType || '').toLowerCase();
        if (type !== 'function_call' && type !== 'function_response') continue;
        output.push({
          kind: type === 'function_call' ? 'call' : 'response',
          id: data.id != null ? String(data.id) : undefined,
          name: data.name != null ? String(data.name) : undefined,
          data,
          metadata,
        });
      }
    }
    return output;
  }

  private unwrapToolResponse(data: any): Record<string, unknown> | undefined {
    if (!data || typeof data !== 'object') return undefined;
    if (data.response && typeof data.response === 'object') return data.response as Record<string, unknown>;
    if (data.result && typeof data.result === 'object') return data.result as Record<string, unknown>;
    if (data.data && typeof data.data === 'object') return data.data as Record<string, unknown>;
    return data as Record<string, unknown>;
  }

  private parseADKResponse(adkJson: any): ParsedADKResponse {
    const result = adkJson?.result || {};
    if (result.contextId) this.currentContextId = String(result.contextId);
    if (result.id) this.currentTaskId = String(result.id);

    let replyText = '';
    for (const artifact of Array.isArray(result.artifacts) ? result.artifacts : []) {
      const textPart = Array.isArray(artifact?.parts) ? artifact.parts.find((p: any) => p?.kind === 'text' || typeof p?.text === 'string') : null;
      if (textPart?.text) { replyText = String(textPart.text); break; }
    }
    if (!replyText) {
      for (let i = Array.isArray(result.history) ? result.history.length - 1 : -1; i >= 0; i--) {
        const item = result.history[i];
        if (!['agent','assistant','model'].includes(item?.role)) continue;
        const part = Array.isArray(item?.parts) ? item.parts.find((p: any) => (p?.kind === 'text' || typeof p?.text === 'string') && !p?.data) : null;
        if (part?.text) { replyText = String(part.text); break; }
      }
    }
    if (!replyText) replyText = 'Sylvia completed the request through the Google ADK backend.';

    const functionData = this.extractFunctionData(result);
    const responseById = new Map<string, any>();
    for (const item of functionData) if (item.kind === 'response' && item.id) responseById.set(item.id, item.data);

    const toolExecutions: ToolExecution[] = [];
    const gmailMessages: GmailMessage[] = [];
    const calendarEvents: CalendarEvent[] = [];
    let workspaceResult: Record<string, unknown> | undefined;

    for (const item of functionData) {
      if (item.kind !== 'call' || item.name === 'adk_request_confirmation') continue;
      const response = item.id ? responseById.get(item.id) : undefined;
      const responseBody = this.unwrapToolResponse(response);
      const toolName = item.name || 'adk_tool';
      let category: ToolExecution['toolName'] = 'SPECIALIST';
      if (toolName.toLowerCase().includes('gmail') || toolName.toLowerCase().includes('email')) category = 'GMAIL';
      else if (toolName.toLowerCase().includes('calendar') || toolName.toLowerCase().includes('schedule')) category = 'CALENDAR';
      else if (toolName.toLowerCase().includes('mission') || toolName.toLowerCase().includes('step')) category = 'MISSION';
      else if (toolName.toLowerCase().includes('memory') || toolName.toLowerCase().includes('dna')) category = 'MEMORY';
      const failed = Boolean(responseBody?.error) || Boolean(response?.error);
      toolExecutions.push({
        id: item.id || `tool_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        toolName: category,
        action: toolName.replace(/_/g, ' ').toUpperCase(),
        status: failed ? 'failed' : response ? 'completed' : 'running',
        result: responseBody ? JSON.stringify(responseBody).slice(0, 1200) : undefined,
        details: responseBody || item.data?.args,
      });

      if (toolName === 'workspace_health_check' && responseBody) workspaceResult = responseBody;

      if (category === 'GMAIL' && responseBody) {
        workspaceResult = responseBody;
        const rawMessages = Array.isArray(responseBody.messages)
          ? responseBody.messages
          : Array.isArray(responseBody.emails)
            ? responseBody.emails
            : responseBody.message && typeof responseBody.message === 'object'
              ? [responseBody.message]
              : [];
        for (const raw of rawMessages) {
          const parsed = this.parseGmailMessage(raw);
          if (parsed && !gmailMessages.some(existing => existing.id === parsed.id)) gmailMessages.push(parsed);
        }
      }
      if (category === 'CALENDAR' && responseBody) {
        workspaceResult = responseBody;
        for (const raw of Array.isArray(responseBody.events) ? responseBody.events : []) {
          const parsed = this.parseCalendarEvent(raw);
          if (parsed && !calendarEvents.some(existing => existing.id === parsed.id)) calendarEvents.push(parsed);
        }
      }
    }

    let approvalRequest: ApprovalRequest | undefined;
    const confirmationCall = functionData.find(item => item.kind === 'call' && item.name === 'adk_request_confirmation');
    if (confirmationCall) {
      const args = confirmationCall.data?.args || {};
      const original = args.originalFunctionCall || {};
      const confirmation = args.toolConfirmation || {};
      const originalName = String(original.name || 'WORKSPACE_WRITE');
      let actionType: ApprovalRequest['actionType'] = 'WORKSPACE_WRITE';
      if (originalName.toLowerCase().includes('gmail')) actionType = originalName.toLowerCase().includes('send') ? 'GMAIL_SEND' : 'GMAIL_DRAFT';
      else if (originalName.toLowerCase().includes('calendar') || originalName.toLowerCase().includes('schedule')) actionType = 'CALENDAR_CREATE';
      const originalArgs = original.args || {};
      const targetMessageId = String(originalArgs.message_id || confirmation.payload?.message_id || '').trim();
      const sourceMessage = targetMessageId ? gmailMessages.find(message => message.id === targetMessageId) : undefined;
      const contextId = result.contextId ? String(result.contextId) : this.currentContextId || undefined;
      const taskId = result.id ? String(result.id) : this.currentTaskId || undefined;
      approvalRequest = {
        id: `approval_${confirmationCall.id || Date.now()}`,
        actionType,
        title: confirmation.hint || `Approve ${originalName.replace(/_/g, ' ')}`,
        description: confirmation.hint || `Sylvia is requesting human approval for ${originalName.replace(/_/g, ' ')}.`,
        recipient: originalArgs.recipient || originalArgs.to || sourceMessage?.senderEmail || sourceMessage?.sender,
        subject: originalArgs.subject || (sourceMessage?.subject ? `Re: ${sourceMessage.subject.replace(/^Re:\s*/i, '')}` : undefined),
        bodyPreview: originalArgs.body || originalArgs.bodyPreview || confirmation.payload?.body,
        scheduledTime: originalArgs.start_time || originalArgs.startTime,
        status: 'WAITING',
        riskLevel: actionType === 'GMAIL_SEND' ? 'HIGH' : 'MEDIUM',
        metadata: { originalFunctionCall: original, toolConfirmation: confirmation, sourceMessageId: targetMessageId || undefined },
        confirmationCallId: confirmationCall.id,
        confirmationName: confirmationCall.name,
        originalFunctionCallId: original.id,
        confirmationPayload: confirmation.payload && typeof confirmation.payload === 'object' ? confirmation.payload : undefined,
        contextId,
        taskId,
        createdAt: new Date().toISOString(),
      };
    }

    const specialist = String(result.metadata?.adk_author || 'Sylvia');
    return {
      reply: replyText,
      specialist: specialist.charAt(0).toUpperCase() + specialist.slice(1),
      contextId: result.contextId ? String(result.contextId) : this.currentContextId || undefined,
      taskId: result.id ? String(result.id) : this.currentTaskId || undefined,
      toolExecutions,
      approvalRequest,
      gmailMessages,
      calendarEvents,
      workspaceResult,
      rawAdkResult: result,
    };
  }

  public async submitApproval(approval: ApprovalRequest, decision: 'APPROVED' | 'CANCELLED'): Promise<ApprovalResult> {
    if (!approval.confirmationCallId || !approval.confirmationName) {
      return {
        success: false, decision,
        reply: 'The live ADK approval request is missing its confirmation call identifier. No external action was executed.',
        toolExecutions: [],
        error: 'Missing ADK confirmation call identifier',
      };
    }

    const confirmationResponse: Record<string, unknown> = { confirmed: decision === 'APPROVED' };
    if (decision === 'APPROVED' && approval.confirmationPayload) confirmationResponse.payload = approval.confirmationPayload;

    const payload = {
      jsonrpc: '2.0', id: Date.now(), method: 'message/send',
      params: {
        ...(approval.contextId ? { contextId: approval.contextId } : this.currentContextId ? { contextId: this.currentContextId } : {}),
        ...(approval.taskId || this.currentTaskId ? { taskId: approval.taskId || this.currentTaskId } : {}),
        message: {
          messageId: `approval_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          role: 'user',
          parts: [{
            kind: 'data',
            data: { id: approval.confirmationCallId, name: approval.confirmationName, response: confirmationResponse },
            metadata: { adk_type: 'function_response' },
          }],
        },
      },
    };

    try {
      const body = await this.postA2A(payload);
      if (body?.error) return { success: false, decision, reply: body.error.message || 'ADK rejected the approval response.', toolExecutions: [], rawAdkResult: body?.result, error: body.error.message };
      const parsed = this.parseADKResponse(body);
      const gmailTool = parsed.toolExecutions.find(tool => tool.toolName === 'GMAIL' && tool.status === 'completed');
      const raw = parsed.workspaceResult || {};
      const rawDraftCandidate = raw.draft && typeof raw.draft === 'object' ? raw.draft as Record<string, unknown> : raw;
      const rawDraft = rawDraftCandidate.result && typeof rawDraftCandidate.result === 'object' ? rawDraftCandidate.result as Record<string, unknown> : rawDraftCandidate;
      const draftIdCandidate = rawDraft.draftId || rawDraft.draft_id || (rawDraft.id && approval.actionType === 'GMAIL_DRAFT' ? rawDraft.id : undefined);
      const draftId = typeof draftIdCandidate === 'string' && draftIdCandidate.trim() ? draftIdCandidate.trim() : undefined;
      const messageIdCandidate = rawDraft.messageId || rawDraft.message_id;
      const threadIdCandidate = rawDraft.threadId || rawDraft.thread_id;
      const messageId = messageIdCandidate ? String(messageIdCandidate) : undefined;
      const threadId = threadIdCandidate ? String(threadIdCandidate) : undefined;
      const operationSuccess = rawDraft.draft_created === true || raw.draft_created === true || raw.success === true || rawDraft.success === true;
      const verified = rawDraft.verified === true || rawDraft.verification === 'verified' || rawDraft.status === 'verified';
      const draftCreated = approval.actionType === 'GMAIL_DRAFT' && Boolean(gmailTool && operationSuccess && draftId);
      const draft: GmailDraftResult | undefined = approval.actionType === 'GMAIL_DRAFT' ? {
        success: draftCreated,
        verified,
        draftId,
        messageId,
        threadId,
        recipient: approval.recipient,
        subject: approval.subject,
        error: !draftCreated ? String(raw.error || rawDraft.error || '') || undefined : undefined,
      } : undefined;
      const success = decision === 'CANCELLED'
        ? Boolean((parsed.rawAdkResult as any)?.status?.state === 'completed') && !parsed.approvalRequest && !parsed.toolExecutions.some(tool => tool.status === 'completed' && tool.toolName === 'GMAIL')
        : draftCreated;
      const error = success
        ? undefined
        : decision === 'CANCELLED'
          ? 'The cancellation could not be confirmed by the live ADK backend.'
          : draft?.error || 'The live ADK response did not provide a successful Gmail draft result with a real draft ID.';
      return {
        success, decision, reply: parsed.reply, toolExecutions: parsed.toolExecutions, draft, rawAdkResult: parsed.rawAdkResult,
        error,
      };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      return { success: false, decision, reply: error, toolExecutions: [], error };
    }
  }
}

export const sylviaApi = new SylviaApiService();
