import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { ApprovalFunctionEvent, findLastMatchingResponse, unwrapResponse } from './approvalResultParser';

test('matches a Gmail draft response to its call ID when the response omits its name', () => {
  const events: ApprovalFunctionEvent[] = [
    {
      kind: 'call',
      id: 'call_draft_123',
      name: 'gmail_create_draft_reply_with_approval',
      data: { id: 'call_draft_123', name: 'gmail_create_draft_reply_with_approval' },
    },
    {
      kind: 'response',
      id: 'call_draft_123',
      data: {
        id: 'call_draft_123',
        response: { success: true, draft_created: true, draft_id: 'r50098626517777389' },
      },
    },
  ];

  const result = findLastMatchingResponse(events, { originalFunctionCallId: 'call_draft_123' });
  assert.equal(result?.success, true);
  assert.equal(result?.draft_created, true);
  assert.equal(result?.draft_id, 'r50098626517777389');
});

test('unwraps multiple ADK response/result/data envelopes', () => {
  const result = unwrapResponse({
    id: 'call_draft_456',
    response: {
      result: {
        data: { success: true, draft_created: true, draft_id: 'real-draft-id' },
      },
    },
  });

  assert.deepEqual(result, { success: true, draft_created: true, draft_id: 'real-draft-id' });
});

test('does not treat a different tool response as the Gmail draft result', () => {
  const events: ApprovalFunctionEvent[] = [
    {
      kind: 'call',
      id: 'call_calendar_1',
      name: 'calendar_create_event_with_approval',
      data: { id: 'call_calendar_1', name: 'calendar_create_event_with_approval' },
    },
    {
      kind: 'response',
      id: 'call_calendar_1',
      data: { id: 'call_calendar_1', response: { success: true, draft_created: true, draft_id: 'not-a-gmail-draft' } },
    },
  ];

  assert.equal(findLastMatchingResponse(events, { originalFunctionCallId: 'call_calendar_1' }), undefined);
});

test('finds the latest named Gmail draft response when the original ID is unavailable', () => {
  const events: ApprovalFunctionEvent[] = [
    {
      kind: 'call',
      id: 'call_draft_old',
      name: 'gmail_create_draft_reply_with_approval',
      data: { id: 'call_draft_old', name: 'gmail_create_draft_reply_with_approval' },
    },
    {
      kind: 'response',
      id: 'call_draft_old',
      data: { id: 'call_draft_old', response: { success: true, draft_created: true, draft_id: 'old-draft' } },
    },
    {
      kind: 'call',
      id: 'call_draft_new',
      name: 'gmail_create_draft_reply_with_approval',
      data: { id: 'call_draft_new', name: 'gmail_create_draft_reply_with_approval' },
    },
    {
      kind: 'response',
      id: 'call_draft_new',
      data: { id: 'call_draft_new', response: { success: true, draft_created: true, draft_id: 'new-draft' } },
    },
  ];

  assert.equal(findLastMatchingResponse(events, {})?.draft_id, 'new-draft');
});
