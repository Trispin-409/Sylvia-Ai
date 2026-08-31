import { ApprovalRequest, ApprovalResult, GmailDraftResult, ToolExecution } from '../types';
import { sylviaApi } from './sylviaApi';

type AnyRecord = Record<string, unknown>;
type FunctionEvent = {
  kind: 'call' | 'response';
  id?: string;
  name?: string;
  data: AnyRecord;
};

const LIVE_BACKEND_FALLBACK = 'https://sylvia-agent-516232832461.africa-south1.run.app';

function asRecord(value: unknown): AnyRecord | null {
  return value && typeof value === 'object' ? value as AnyRecord : null;
}

function extractFunctionEvents(result: AnyRecord): FunctionEvent[] {
  const events: FunctionEvent[] = [];
  const history = Array.isArray(result.history) ? result.history : [];

  for (const item of history) {
    const message = asRecord(item);
    const parts = message && Array.isArray(message.parts) ? message.parts : [];
    for (const partValue of parts) {
      const part = asRecord(partValue);
      const data = asRecord(part?.data);
      if (!part || !data) continue;

      const metadata = asRecord(part.metadata);
      const type = String(
        metadata?.adk_type ??
        metadata?.adkType ??
        data.adk_type ??
        data.adkType ??
        '',
      ).toLowerCase();

      if (type !== 'function_call' && type !== 'function_response') continue;

      events.push({
        kind: type === 'function_call' ? 'call' : 'response',
        id: data.id != null ? String(data.id) : undefined,
        name: data.name != null ? String(data.name) : undefined,
        data,
      });
    }
  }

  return events;
}

function unwrapResponse(data: AnyRecord | undefined): AnyRecord | undefined {
  if (!data) return undefined;
  const response = asRecord(data.response);
  if (response) return response;
  const result = asRecord(data.result);
  if (result) return result;
  const nestedData = asRecord(data.data);
  if (nestedData) return nestedData;
  return data;
}

function findLastMatchingResponse(events: FunctionEvent[], approval: ApprovalRequest): AnyRecord | undefined {
  const targetId = approval.originalFunctionCallId;
  const isDraftResponse = (event: FunctionEvent) =>
    event.kind === 'response' &&
    (event.name || '').toLowerCase() === 'gmail_create_draft_reply_with_approval';

  if (targetId) {
    for (let index = events.length - 1; index >= 0; index -= 1) {
      const event = events[index];
      if (event.id === targetId && isDraftResponse(event)) {
        return unwrapResponse(event.data);
      }
    }
  }

  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (!isDraftResponse(event)) continue;
    const response = unwrapResponse(event.data);
    if (response && ('draft_id' in response || 'draftId' in response || 'draft_created' in response || 'draftCreated' in response)) {
      return response;
    }
  }

  return undefined;
}

function collectToolExecutions(events: FunctionEvent[]): ToolExecution[] {
  const responsesById = new Map<string, FunctionEvent>();
  for (const event of events) {
    if (event.kind === 'response' && event.id) responsesById.set(event.id, event);
  }

  const tools: ToolExecution[] = [];
  for (const event of events) {
    if (event.kind !== 'call' || event.name === 'adk_request_confirmation') continue;
    const responseEvent = event.id ? responsesById.get(event.id) : undefined;
    const response = responseEvent ? unwrapResponse(responseEvent.data) : undefined;
    const name = event.name || 'adk_tool';
    const normalized = name.toLowerCase();
    const category: ToolExecution['toolName'] = normalized.includes('gmail') || normalized.includes('email')
      ? 'GMAIL'
      : normalized.includes('calendar') || normalized.includes('schedule')
        ? 'CALENDAR'
        : normalized.includes('mission') || normalized.includes('step')
          ? 'MISSION'
          : normalized.includes('memory') || normalized.includes('dna')
            ? 'MEMORY'
            : 'SPECIALIST';

    const failed = Boolean(response?.error);
    tools.push({
      id: event.id || `tool_${Date.now()}`,
      toolName: category,
      action: name.replace(/_/g, ' ').toUpperCase(),
      status: failed ? 'failed' : response ? 'completed' : 'running',
      result: response ? JSON.stringify(response).slice(0, 1200) : undefined,
      details: response || asRecord(event.data.args) || undefined,
    });
  }

  return tools;
}

async function postApproval(payload: AnyRecord): Promise<AnyRecord> {
  const attempt = async (url: string): Promise<AnyRecord> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let body: unknown = null;
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error(`ADK approval endpoint returned non-JSON HTTP ${response.status}`);
    }

    const record = asRecord(body);
    if (!response.ok) {
      const error = asRecord(record?.error);
      throw new Error(String(error?.message || `ADK approval endpoint returned HTTP ${response.status}`));
    }
    return record || {};
  };

  try {
    return await attempt('/a2a/app');
  } catch (proxyError) {
    const baseUrl = sylviaApi.getBaseUrl().replace(/\/+$/, '') || LIVE_BACKEND_FALLBACK;
    try {
      return await attempt(`${baseUrl}/a2a/app`);
    } catch (directError) {
      const directMessage = directError instanceof Error ? directError.message : String(directError);
      const proxyMessage = proxyError instanceof Error ? proxyError.message : String(proxyError);
      throw new Error(`${directMessage} (proxy: ${proxyMessage})`);
    }
  }
}

async function submitApprovalAgainstProduction(approval: ApprovalRequest, decision: 'APPROVED' | 'CANCELLED'): Promise<ApprovalResult> {
  if (!approval.confirmationCallId || !approval.confirmationName) {
    return {
      success: false,
      decision,
      reply: 'The live ADK approval request is missing its confirmation call identifier. No external action was executed.',
      toolExecutions: [],
      error: 'Missing ADK confirmation call identifier',
    };
  }

  // Match the proven production CLI request exactly: send only {confirmed:true|false}.
  // The stored toolConfirmation payload is descriptive metadata, not an ADK function response.
  const contextId = approval.contextId || sylviaApi.getContextId() || undefined;
  const taskId = approval.taskId || undefined;
  const payload: AnyRecord = {
    jsonrpc: '2.0',
    id: `ui_approval_${Date.now()}`,
    method: 'message/send',
    params: {
      ...(contextId ? { contextId } : {}),
      ...(taskId ? { taskId } : {}),
      message: {
        messageId: `ui_approval_msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        role: 'user',
        parts: [
          {
            kind: 'data',
            data: {
              id: approval.confirmationCallId,
              name: approval.confirmationName,
              response: { confirmed: decision === 'APPROVED' },
            },
            metadata: { adk_type: 'function_response' },
          },
        ],
      },
      configuration: { blocking: true },
    },
  };

  try {
    const body = await postApproval(payload);
    const error = asRecord(body.error);
    if (error) {
      return {
        success: false,
        decision,
        reply: String(error.message || 'The live ADK backend rejected the approval response.'),
        toolExecutions: [],
        rawAdkResult: body.result,
        error: String(error.message || 'ADK approval rejected'),
      };
    }

    const result = asRecord(body.result) || {};
    const events = extractFunctionEvents(result);
    const toolExecutions = collectToolExecutions(events);

    if (decision === 'CANCELLED') {
      const cancellationConfirmed = events.some((event) => {
        if (event.kind !== 'response') return false;
        const response = unwrapResponse(event.data);
        return Boolean(response && response.confirmed === false);
      });
      return {
        success: cancellationConfirmed || String(result.status || '').toLowerCase() === 'completed',
        decision,
        reply: 'The write action was cancelled. No Gmail draft was created.',
        toolExecutions,
        rawAdkResult: result,
        error: cancellationConfirmed || String(result.status || '').toLowerCase() === 'completed' ? undefined : 'The live ADK backend did not confirm cancellation.',
      };
    }

    const draftResult = findLastMatchingResponse(events, approval);
    const rawDraft = draftResult || {};
    const draftIdValue = rawDraft.draft_id ?? rawDraft.draftId;
    const messageIdValue = rawDraft.message_id ?? rawDraft.messageId;
    const threadIdValue = rawDraft.thread_id ?? rawDraft.threadId;
    const draftId = typeof draftIdValue === 'string' && draftIdValue.trim() ? draftIdValue.trim() : undefined;
    const messageId = messageIdValue != null ? String(messageIdValue) : undefined;
    const threadId = threadIdValue != null ? String(threadIdValue) : undefined;
    const successFlag = rawDraft.success === true;
    const createdFlag = rawDraft.draft_created === true || rawDraft.draftCreated === true;
    const operationSucceeded = successFlag && createdFlag && Boolean(draftId);

    const draft: GmailDraftResult = {
      success: operationSucceeded,
      verified: rawDraft.verified === true || rawDraft.verification === 'verified' || rawDraft.status === 'verified',
      draftId,
      messageId,
      threadId,
      recipient: approval.recipient,
      subject: approval.subject,
      error: operationSucceeded ? undefined : String(rawDraft.error || 'The live ADK Gmail draft tool did not return success:true, draft_created:true, and a real draft_id.'),
    };

    return {
      success: operationSucceeded,
      decision,
      reply: operationSucceeded
        ? 'The production ADK Gmail tool confirmed that the draft was created. The email was not sent.'
        : 'The production ADK continuation completed without a verifiable Gmail draft result. No draft-creation success state is shown.',
      toolExecutions,
      draft,
      rawAdkResult: result,
      error: operationSucceeded ? undefined : draft.error,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      decision,
      reply: message,
      toolExecutions: [],
      error: message,
    };
  }
}

// Install the production-compatible approval continuation before React renders the app.
sylviaApi.submitApproval = submitApprovalAgainstProduction;
