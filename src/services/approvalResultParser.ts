export type ApprovalFunctionEvent = {
  kind: 'call' | 'response';
  id?: string;
  name?: string;
  data: Record<string, unknown>;
};

type AnyRecord = Record<string, unknown>;

const asRecord = (value: unknown): AnyRecord | undefined =>
  value !== null && typeof value === 'object' ? value as AnyRecord : undefined;

/**
 * ADK/A2A responses can wrap tool output in response/result/data envelopes.
 * Unwrap those envelopes without assuming there is only one layer.
 */
export function unwrapResponse(data: AnyRecord | undefined): AnyRecord | undefined {
  if (!data) return undefined;

  let current = data;
  for (let depth = 0; depth < 8; depth += 1) {
    const next =
      asRecord(current.response) ??
      asRecord(current.result) ??
      asRecord(current.data);
    if (!next || next === current) break;
    current = next;
  }
  return current;
}

/**
 * Some ADK function_response parts contain only the call ID and response,
 * with no repeated function name. Correlate the ID with the function_call
 * event so a successful Gmail draft isn't mistaken for a missing result.
 */
export function findLastMatchingResponse(
  events: ApprovalFunctionEvent[],
  approval: { originalFunctionCallId?: string },
): AnyRecord | undefined {
  const callNamesById = new Map<string, string>();
  for (const event of events) {
    if (event.kind === 'call' && event.id && event.name) {
      callNamesById.set(event.id, event.name);
    }
  }

  const isDraftResponse = (event: ApprovalFunctionEvent) =>
    event.kind === 'response' &&
    (event.name || callNamesById.get(event.id || '') || '').toLowerCase() === 'gmail_create_draft_reply_with_approval';

  const targetId = approval.originalFunctionCallId;
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
    if (response && (
      'draft_id' in response ||
      'draftId' in response ||
      'draft_created' in response ||
      'draftCreated' in response
    )) {
      return response;
    }
  }

  return undefined;
}
