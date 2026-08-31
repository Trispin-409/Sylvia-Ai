import {
  BackendHealth,
  AgentCard,
  ApprovalRequest,
  ApprovalResult,
  CalendarEvent,
  GmailDraftResult,
  GmailMessage,
  ToolExecution,
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

  public async checkHealth(): Promise<BackendHealth> {
    const startTime = performance.now();
    try {
      const response = await fetch('/api/health', { method: 'GET', headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => null);
      const latencyMs = Math.round(performance.now() - startTime);
      if (response.ok && data?.adkStatus === 'connected') {
        return {
          connected: true, status: 'ok', backendUrl: data.liveAdkBackend || this.backendUrl, latencyMs,
          lastChecked: new Date().toISOString(), adkConnected: true,
          a2aVersion: 'A2A/2.0-JSONRPC (Google ADK Live Backend)', isDemoMode: false,
        };
      }
    } catch {
      // Direct probe below.
    }
    try {
      const response = await this.postA2A({
        jsonrpc: '2.0', id: 'health_check', method: 'message/send',
        params: { message: { messageId: `health_${Date.now()}`, role: 'user', parts: [{ text: 'Respond with exactly: SYLVIA_HEALTH_OK' }] } },
      });
      const latencyMs = Math.round(performance.now() - startTime);
      const connected = !response?.error && Boolean(response?.result);
      return {
        connected, status: connected ? 'ok' : 'degraded', backendUrl: this.backendUrl, latencyMs,
        lastChecked: new Date().toISOString(), adkConnected: connected,
        a2aVersion: 'A2A/2.0-JSONRPC (Google ADK Live)', isDemoMode: false,
        error: connected ? undefined : (response?.error?.message || 'ADK health probe failed'),
      };
    } catch (err: unknown) {
      return {
        connected: false, status: 'offline', backendUrl: this.backendUrl, lastChecked: new Date().toISOString(),
        adkConnected: false, isDemoMode: false, error: err instanceof Error ? err.message : String(err),
      };
    }
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
        { name: 'create_gmail_draft', description: 'Create and verify a Gmail draft with human-in-the-loop authorization' },
        { name: 'schedule_calendar_event', description: 'Schedule or adjust Google Calendar event' },
        { name: 'start_or_update_mission', description: 'Deconstruct complex goals into actionable multi-step missions' },
      ],
    };
  }

  public async sendA2AMessage(userMessage: string): Promise<ParsedADKResponse> {
    const lower = userMessage.toLowerCase();
    const workspaceIntent = /gmail|email|inbox|calendar|meeting|schedule/.test(lower);
    const payload = {
      jsonrpc: '2.0', id: Date.now(), method: 'message/send',
      params: {
        ...(this.currentContextId ? { contextId: this.currentContextId } : {}),
        message: { messageId: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, role: 'user', parts: [{ text: this.buildAgentRequest(userMessage) }] },
      },
    };
    const body = await this.postA2A(payload);
    if (body?.error) throw new Error(body.error.message || `A2A error (${body.error.code})`);
    const parsed = this.parseADKResponse(body);

    // A natural-language claim is not evidence of a Workspace operation.
    // For read requests, require at least one real tool response before displaying
    // the agent's Gmail/Calendar facts as authoritative UI data.
    if (workspaceIntent && !parsed.approvalRequest) {
      const gmailRead = /gmail|email|inbox/.test(lower);
      const calendarRead = /calendar|meeting|schedule/.test(lower);
      if (gmailRead && parsed.gmailMessages.length === 0 && !parsed.toolExecutions.some(t => t.toolName === 'GMAIL' && t.status === 'completed')) {
        parsed.reply = `I could not verify live Gmail data from the connected Workspace Specialist. I will not display or invent inbox records.\n\nBackend response: ${parsed.reply}`;
      }
      if (calendarRead && parsed.calendarEvents.length === 0 && !parsed.toolExecutions.some(t => t.toolName === 'CALENDAR' && t.status === 'completed')) {
        parsed.reply = `I could not verify live Calendar data from the connected Workspace Specialist. I will not display or invent calendar events.\n\nBackend response: ${parsed.reply}`;
      }
    }
    return parsed;
  }

  private parseGmailMessage(value: any): GmailMessage | null {
    if (!value || typeof value !== 'object') return null;
    const rawFrom = String(value.from || value.sender || '');
    const match = rawFrom.match(/<([^>]+)>/);
    const id = String(value.id || value.messageId || '').trim();
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
      date: String(value.date || value.internal_date || 'Unknown date'),
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
    for (const item of Array.isArray(result?.history) ? result.history : []) {
      for (const part of Array.isArray(item?.parts) ? item.parts : []) {
        const data = part?.data;
        if (!data || typeof data !== 'object') continue;
        const metadata = part?.metadata || {};
        const type = String(metadata.adk_type || data.adk_type || '');
        if (type !== 'function_call' && type !== 'function_response') continue;
        output.push({ kind: type === 'function_call' ? 'call' : 'response', id: data.id ? String(data.id) : undefined, name: data.name ? String(data.name) : undefined, data, metadata });
      }
    }
    return output;
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
      const responseBody = response?.response;
      const toolName = item.name || 'adk_tool';
      let category: ToolExecution['toolName'] = 'SPECIALIST';
      if (toolName.includes('gmail') || toolName.includes('email')) category = 'GMAIL';
      else if (toolName.includes('calendar') || toolName.includes('schedule')) category = 'CALENDAR';
      else if (toolName.includes('mission') || toolName.includes('step')) category = 'MISSION';
      else if (toolName.includes('memory') || toolName.includes('dna')) category = 'MEMORY';
      const failed = Boolean(responseBody?.error) || Boolean(response?.error);
      toolExecutions.push({
        id: item.id || `tool_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        toolName: category,
        action: toolName.replace(/_/g, ' ').toUpperCase(),
        status: failed ? 'failed' : response ? 'completed' : 'running',
        result: responseBody ? JSON.stringify(responseBody).slice(0, 1200) : undefined,
        details: responseBody && typeof responseBody === 'object' ? responseBody : item.data?.args,
      });

      if (category === 'GMAIL' && responseBody && typeof responseBody === 'object') {
        workspaceResult = responseBody as Record<string, unknown>;
        const rawMessages = Array.isArray(responseBody.messages) ? responseBody.messages : Array.isArray(responseBody.emails) ? responseBody.emails : [];
        for (const raw of rawMessages) {
          const parsed = this.parseGmailMessage(raw);
          if (parsed) gmailMessages.push(parsed);
        }
      }
      if (category === 'CALENDAR' && responseBody && typeof responseBody === 'object') {
        workspaceResult = responseBody as Record<string, unknown>;
        for (const raw of Array.isArray(responseBody.events) ? responseBody.events : []) {
          const parsed = this.parseCalendarEvent(raw);
          if (parsed) calendarEvents.push(parsed);
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
      if (originalName.includes('gmail')) actionType = originalName.includes('send') ? 'GMAIL_SEND' : 'GMAIL_DRAFT';
      else if (originalName.includes('calendar') || originalName.includes('schedule')) actionType = 'CALENDAR_CREATE';
      const originalArgs = original.args || {};
      const contextId = result.contextId ? String(result.contextId) : this.currentContextId || undefined;
      const taskId = result.id ? String(result.id) : this.currentTaskId || undefined;
      approvalRequest = {
        id: `approval_${confirmationCall.id || Date.now()}`,
        actionType,
        title: confirmation.hint || `Approve ${originalName.replace(/_/g, ' ')}`,
        description: confirmation.hint || `Sylvia is requesting human approval for ${originalName.replace(/_/g, ' ')}.`,
        recipient: originalArgs.recipient || originalArgs.to,
        subject: originalArgs.subject,
        bodyPreview: originalArgs.body || originalArgs.bodyPreview || confirmation.payload?.body,
        scheduledTime: originalArgs.start_time || originalArgs.startTime,
        status: 'WAITING',
        riskLevel: actionType === 'GMAIL_SEND' ? 'HIGH' : 'MEDIUM',
        metadata: { originalFunctionCall: original, toolConfirmation: confirmation },
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
      const rawDraft = raw.draft && typeof raw.draft === 'object' ? raw.draft as Record<string, unknown> : raw;
      const draftId = rawDraft.draftId || rawDraft.draft_id || (rawDraft.id && approval.actionType === 'GMAIL_DRAFT' ? rawDraft.id : undefined);
      const messageId = rawDraft.messageId || rawDraft.message_id;
      const threadId = rawDraft.threadId || rawDraft.thread_id;
      const operationSuccess = raw.success === true || rawDraft.success === true;
      const verified = rawDraft.verified === true || rawDraft.verification === 'verified' || rawDraft.status === 'verified';
      const draft: GmailDraftResult | undefined = approval.actionType === 'GMAIL_DRAFT' ? {
        success: operationSuccess,
        verified,
        draftId: draftId ? String(draftId) : undefined,
        messageId: messageId ? String(messageId) : undefined,
        threadId: threadId ? String(threadId) : undefined,
        recipient: approval.recipient,
        subject: approval.subject,
        error: !operationSuccess ? String(raw.error || rawDraft.error || '') || undefined : undefined,
      } : undefined;
      const success = decision === 'CANCELLED'
        ? Boolean(parsed.rawAdkResult) && !parsed.toolExecutions.some(tool => tool.status === 'completed' && tool.toolName === 'GMAIL')
        : Boolean(gmailTool && draft?.success && draft.draftId && draft.verified);
      return {
        success, decision, reply: parsed.reply, toolExecutions: parsed.toolExecutions, draft, rawAdkResult: parsed.rawAdkResult,
        error: success ? undefined : decision === 'CANCELLED'
          ? 'The cancellation could not be confirmed by the live ADK response.'
          : 'The live ADK response did not provide a verified Gmail draft result. The UI will not claim that a draft was created.',
      };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      return { success: false, decision, reply: error, toolExecutions: [], error };
    }
  }
}

export const sylviaApi = new SylviaApiService();
