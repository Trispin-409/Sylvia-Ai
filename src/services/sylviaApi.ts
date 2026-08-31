import {
  BackendHealth,
  AgentCard,
  ApprovalRequest,
  ToolExecution,
} from '../types';

export interface ParsedADKResponse {
  reply: string;
  specialist: string;
  contextId?: string;
  toolExecutions: ToolExecution[];
  approvalRequest?: ApprovalRequest;
  rawAdkResult?: unknown;
}

export interface ApprovalResult {
  success: boolean;
  reply: string;
  toolExecutions: ToolExecution[];
  rawAdkResult?: unknown;
  error?: string;
}

const DEFAULT_LIVE_BACKEND = 'https://sylvia-agent-516232832461.africa-south1.run.app';

class SylviaApiService {
  private backendUrl: string;
  private currentContextId: string | null = null;
  private isDemoModeActive = false;

  constructor() {
    this.backendUrl = import.meta.env.VITE_SYLVIA_API_URL || DEFAULT_LIVE_BACKEND;
  }

  public getBaseUrl(): string {
    return this.backendUrl;
  }

  public setBaseUrl(url: string): void {
    this.backendUrl = url.trim().replace(/\/+$/, '') || DEFAULT_LIVE_BACKEND;
  }

  public getContextId(): string | null {
    return this.currentContextId;
  }

  public setContextId(id: string | null): void {
    this.currentContextId = id;
  }

  public isDemoMode(): boolean {
    return this.isDemoModeActive;
  }

  public setDemoMode(active: boolean): void {
    this.isDemoModeActive = active;
  }

  private buildAgentRequest(userMessage: string): string {
    const lower = userMessage.toLowerCase();
    const workspaceIntent =
      lower.includes('gmail') || lower.includes('email') || lower.includes('inbox') ||
      lower.includes('calendar') || lower.includes('meeting') || lower.includes('schedule');

    if (!workspaceIntent) return userMessage;

    return [
      'WORKSPACE OPERATION REQUEST.',
      'Route this request to the Workspace Specialist and use the connected Google Workspace tools when available.',
      'Do not claim that Gmail or Calendar access is unavailable if the Workspace tools are connected.',
      'For read requests, actually inspect the connected data and return the relevant records.',
      'For write requests, prepare the action and stop at the human approval gate; never send or mutate without explicit approval.',
      `USER REQUEST: ${userMessage}`,
    ].join('\n');
  }

  public async checkHealth(): Promise<BackendHealth> {
    const startTime = performance.now();

    try {
      const response = await fetch('/api/health', { method: 'GET', headers: { Accept: 'application/json' } });
      const latencyMs = Math.round(performance.now() - startTime);
      const data = await response.json().catch(() => null);

      if (response.ok && data?.adkStatus === 'connected') {
        return {
          connected: true, status: 'ok', backendUrl: data.liveAdkBackend || this.backendUrl,
          latencyMs, lastChecked: new Date().toISOString(), adkConnected: true,
          a2aVersion: 'A2A/2.0-JSONRPC (Google ADK Live Backend)', isDemoMode: false,
        };
      }
    } catch {
      // Fall through to direct backend probe.
    }

    try {
      const directResponse = await fetch(`${this.backendUrl}/a2a/app`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 'health_check', method: 'message/send',
          params: { message: { messageId: `health_${Date.now()}`, role: 'user', parts: [{ text: 'Respond with exactly: SYLVIA_HEALTH_OK' }] } },
        }),
      });
      const latencyMs = Math.round(performance.now() - startTime);
      const responseBody = await directResponse.json().catch(() => null);
      const rpcConnected = directResponse.ok && !responseBody?.error && Boolean(responseBody?.result);
      return {
        connected: rpcConnected, status: rpcConnected ? 'ok' : 'degraded', backendUrl: this.backendUrl,
        latencyMs, lastChecked: new Date().toISOString(), adkConnected: rpcConnected,
        a2aVersion: 'A2A/2.0-JSONRPC (Google ADK Live)', isDemoMode: false,
        error: rpcConnected ? undefined : (responseBody?.error?.message || `ADK HTTP ${directResponse.status}`),
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reach ADK backend';
      return { connected: false, status: 'offline', backendUrl: this.backendUrl, lastChecked: new Date().toISOString(), adkConnected: false, isDemoMode: false, error: errorMsg };
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
        { name: 'create_gmail_draft', description: 'Draft verified Gmail response with human-in-the-loop authorization' },
        { name: 'schedule_calendar_event', description: 'Schedule or adjust Google Calendar event' },
        { name: 'start_or_update_mission', description: 'Deconstruct complex goals into actionable multi-step missions' },
      ],
    };
  }

  public async sendA2AMessage(userMessage: string): Promise<ParsedADKResponse> {
    const agentRequest = this.buildAgentRequest(userMessage);
    const payload = {
      jsonrpc: '2.0', id: Date.now(), method: 'message/send',
      params: {
        ...(this.currentContextId ? { contextId: this.currentContextId } : {}),
        message: { messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`, role: 'user', parts: [{ text: agentRequest }] },
      },
    };

    let rawJson: any = null;
    try {
      const proxyRes = await fetch('/a2a/app', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload),
      });
      const responseText = await proxyRes.text();
      try { rawJson = JSON.parse(responseText); } catch { rawJson = null; }
      if (!proxyRes.ok && rawJson?.error) throw new Error(rawJson.error.message || `A2A proxy returned HTTP ${proxyRes.status}`);
    } catch (proxyError) {
      console.warn('[Sylvia] Same-origin A2A proxy failed; trying direct backend.', proxyError);
    }

    if (!rawJson || rawJson.error) {
      const directRes = await fetch(`${this.backendUrl}/a2a/app`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload),
      });
      if (!directRes.ok) {
        const errorText = await directRes.text().catch(() => '');
        throw new Error(`Google ADK Sylvia Backend returned HTTP ${directRes.status}: ${errorText}`);
      }
      rawJson = await directRes.json();
    }
    if (rawJson.error) throw new Error(rawJson.error.message || `A2A Error (${rawJson.error.code})`);
    return this.parseADKResponse(rawJson);
  }

  private parseADKResponse(adkJson: any): ParsedADKResponse {
    const result = adkJson.result || {};
    if (result.contextId) this.currentContextId = result.contextId;

    let replyText = '';
    if (result.artifacts?.length) {
      const textPart = result.artifacts[0]?.parts?.find((p: any) => p.kind === 'text' || p.text);
      if (textPart) replyText = textPart.text || textPart.content || '';
    }
    if (!replyText && Array.isArray(result.history)) {
      for (let i = result.history.length - 1; i >= 0; i--) {
        const item = result.history[i];
        if (item.role === 'agent' || item.role === 'assistant' || item.role === 'model') {
          const textPart = item.parts?.find((p: any) => (p.kind === 'text' || p.text) && !p.data);
          if (textPart?.text || textPart?.content) { replyText = textPart.text || textPart.content; break; }
        }
      }
    }
    if (!replyText && result.message?.parts?.[0]?.text) replyText = result.message.parts[0].text;
    if (!replyText) replyText = 'Task evaluated and synchronized with Google ADK Sylvia backend.';

    const toolExecutions: ToolExecution[] = [];
    let specialistName = 'Sylvia';
    if (result.metadata?.adk_author) {
      const author = String(result.metadata.adk_author);
      specialistName = author.charAt(0).toUpperCase() + author.slice(1);
    }

    if (Array.isArray(result.history)) {
      for (const item of result.history) {
        if (!Array.isArray(item.parts)) continue;
        for (const part of item.parts) {
          if (part.metadata?.adk_type !== 'function_call' || !part.data) continue;
          const toolName = String(part.data.name || 'adk_tool');
          const args = part.data.args || {};
          let toolCategory: ToolExecution['toolName'] = 'SPECIALIST';
          if (toolName.includes('gmail') || toolName.includes('email')) toolCategory = 'GMAIL';
          else if (toolName.includes('calendar') || toolName.includes('schedule')) toolCategory = 'CALENDAR';
          else if (toolName.includes('mission') || toolName.includes('step')) toolCategory = 'MISSION';
          else if (toolName.includes('memory') || toolName.includes('dna')) toolCategory = 'MEMORY';
          toolExecutions.push({
            id: `tool_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            toolName: toolCategory, action: toolName.replace(/_/g, ' ').toUpperCase(), status: 'completed',
            result: JSON.stringify(args).slice(0, 100), details: args,
          });
        }
      }
    }

    let approvalRequest: ApprovalRequest | undefined;
    const toolConfirmations = result.metadata?.adk_actions?.requestedToolConfirmations;
    if (toolConfirmations && Object.keys(toolConfirmations).length > 0) {
      const firstKey = Object.keys(toolConfirmations)[0];
      const confirmation = toolConfirmations[firstKey];
      approvalRequest = {
        id: `appr_${Date.now()}`,
        actionType: confirmation.actionType || 'WORKSPACE_WRITE',
        title: confirmation.title || `Authorize ADK Action: ${firstKey}`,
        description: confirmation.description || 'Google ADK Sylvia requested human operator sign-off before executing this action.',
        recipient: confirmation.recipient, subject: confirmation.subject,
        bodyPreview: confirmation.bodyPreview || confirmation.preview, status: 'WAITING', riskLevel: 'MEDIUM', createdAt: new Date().toISOString(),
      };
    }

    return { reply: replyText, specialist: specialistName, contextId: result.contextId, toolExecutions, approvalRequest, rawAdkResult: result };
  }

  public async submitApproval(approvalId: string, decision: 'APPROVED' | 'CANCELLED'): Promise<ApprovalResult> {
    const payload = {
      jsonrpc: '2.0', id: Date.now(), method: 'message/send',
      params: {
        ...(this.currentContextId ? { contextId: this.currentContextId } : {}),
        message: { messageId: `approval_${Date.now()}`, role: 'user', parts: [{ text: `[HUMAN_APPROVAL_DECISION: ${decision} for action ${approvalId}]` }] },
      },
    };

    try {
      const response = await fetch('/a2a/app', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || body?.error) {
        const error = body?.error?.message || `Approval request failed with HTTP ${response.status}`;
        return { success: false, reply: error, toolExecutions: [], rawAdkResult: body?.result, error };
      }

      const parsed = this.parseADKResponse(body);
      const hasGmailExecution = parsed.toolExecutions.some(tool => tool.toolName === 'GMAIL');
      const success = decision === 'CANCELLED' || hasGmailExecution;
      return {
        success,
        reply: parsed.reply,
        toolExecutions: parsed.toolExecutions,
        rawAdkResult: parsed.rawAdkResult,
        error: success ? undefined : 'ADK acknowledged the approval message, but did not report a Gmail tool execution. The UI will not claim that a draft was created.',
      };
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      return { success: false, reply: error, toolExecutions: [], error };
    }
  }
}

export const sylviaApi = new SylviaApiService();
