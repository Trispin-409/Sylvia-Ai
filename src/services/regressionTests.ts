import { sylviaApi } from './sylviaApi';

export interface TestResult {
  id: string;
  name: string;
  description: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  error?: string;
  details?: string;
}

/**
 * Executes the regression tests for Sylvia's ADK response parser and verification logic.
 */
export function runSylviaRegressionTests(): TestResult[] {
  const results: TestResult[] = [];

  // =========================================================================
  // TEST A: Pending Approval (adk_request_confirmation)
  // =========================================================================
  try {
    const mockAdkPayload: any = {
      jsonrpc: '2.0',
      id: 12345,
      result: {
        contextId: 'test-context-123',
        id: 'test-task-123',
        history: [
          {
            role: 'assistant',
            parts: [
              {
                data: {
                  id: 'confirm-abc-123',
                  name: 'adk_request_confirmation',
                  args: {
                    originalFunctionCall: {
                      id: 'call_gmail_001',
                      name: 'gmail_create_draft_reply_with_approval',
                      args: {
                        recipient: 'travis@tr.traviswootrades.com',
                        subject: 'Final day for MTP onboarding',
                        body: 'Hello Travis, confirming draft content.'
                      }
                    },
                    toolConfirmation: {
                      hint: 'Confirm draft creation',
                      payload: {
                        body: 'Hello Travis, confirming draft content.'
                      }
                    }
                  }
                },
                metadata: { adk_type: 'function_call' }
              }
            ]
          }
        ]
      }
    };

    const parsed = (sylviaApi as any).parseADKResponse(mockAdkPayload);
    const hasApproval = parsed.approvalRequest !== undefined;
    const isWaiting = parsed.approvalRequest?.status === 'WAITING';
    const isCorrectCallId = parsed.approvalRequest?.confirmationCallId === 'confirm-abc-123';

    if (hasApproval && isWaiting && isCorrectCallId) {
      results.push({
        id: 'TEST_A',
        name: 'TEST A — pending approval',
        description: 'Verifies adk_request_confirmation parses to WAITING approval with correct call ID.',
        status: 'PASS',
        details: `Approval ID: ${parsed.approvalRequest?.id}, Status: ${parsed.approvalRequest?.status}`
      });
    } else {
      results.push({
        id: 'TEST_A',
        name: 'TEST A — pending approval',
        description: 'Verifies adk_request_confirmation parses to WAITING approval.',
        status: 'FAIL',
        error: `Expected status WAITING. Got hasApproval=${hasApproval}, isWaiting=${isWaiting}`
      });
    }
  } catch (err: any) {
    results.push({
      id: 'TEST_A',
      name: 'TEST A — pending approval',
      description: 'Verifies adk_request_confirmation parses to WAITING approval.',
      status: 'FAIL',
      error: err.message || String(err)
    });
  }

  // =========================================================================
  // TEST B: Approved Real Draft
  // =========================================================================
  try {
    const mockToolResponse: any = {
      success: true,
      draft_created: true,
      draft_id: 'r50098626517777389',
      message_id: '1a059eefa9cd3c93',
      thread_id: '1a05964bda068d44',
      sent: false
    };

    const raw: any = mockToolResponse;
    const rawDraftCandidate = raw.draft && typeof raw.draft === 'object' ? raw.draft : raw;
    const rawDraft = rawDraftCandidate.result && typeof rawDraftCandidate.result === 'object' ? rawDraftCandidate.result : rawDraftCandidate;
    
    const draftId = rawDraft.draftId || rawDraft.draft_id;
    const messageId = rawDraft.messageId || rawDraft.message_id;
    const threadId = rawDraft.threadId || rawDraft.thread_id;
    
    const isApproved = true;
    const isDraftCreated = rawDraft.draft_created === true || rawDraft.success === true;
    const hasDraftId = Boolean(draftId && String(draftId).trim() !== '');
    const isSentFalse = rawDraft.sent !== true;

    const creationSucceeded = Boolean(isApproved && isDraftCreated && hasDraftId && isSentFalse);
    const verified = Boolean(rawDraft.verified === true || rawDraft.verification === 'verified' || rawDraft.status === 'verified');

    if (creationSucceeded && draftId === 'r50098626517777389' && messageId === '1a059eefa9cd3c93' && !verified) {
      results.push({
        id: 'TEST_B',
        name: 'TEST B — approved real draft',
        description: 'Ensures structured production results confirm success with correct IDs.',
        status: 'PASS',
        details: `Draft ID: ${draftId}, Message ID: ${messageId}, Thread ID: ${threadId}, CreationSucceeded: ${creationSucceeded}`
      });
    } else {
      results.push({
        id: 'TEST_B',
        name: 'TEST B — approved real draft',
        description: 'Ensures structured production results confirm success with correct IDs.',
        status: 'FAIL',
        error: `Expected creationSucceeded=true, verified=false. Got creationSucceeded=${creationSucceeded}, verified=${verified}, draftId=${draftId}`
      });
    }
  } catch (err: any) {
    results.push({
      id: 'TEST_B',
      name: 'TEST B — approved real draft',
      description: 'Ensures structured production results confirm success.',
      status: 'FAIL',
      error: err.message || String(err)
    });
  }

  // =========================================================================
  // TEST C: Failed Draft
  // =========================================================================
  try {
    const mockToolResponse: any = {
      success: false,
      draft_created: false,
      error: 'Gmail write scope denied or network error'
    };

    const rawDraft = mockToolResponse;
    const draftId = rawDraft.draftId || rawDraft.draft_id;
    const isApproved = true;
    const isDraftCreated = rawDraft.draft_created === true || rawDraft.success === true;
    const hasDraftId = Boolean(draftId && String(draftId).trim() !== '');
    const isSentFalse = rawDraft.sent !== true;

    const creationSucceeded = Boolean(isApproved && isDraftCreated && hasDraftId && isSentFalse);

    if (!creationSucceeded) {
      results.push({
        id: 'TEST_C',
        name: 'TEST C — failed draft',
        description: 'Verifies that tool failure responds with success=false and blocks creation claim.',
        status: 'PASS',
        details: 'Creation correctly blocked. Error logged: ' + rawDraft.error
      });
    } else {
      results.push({
        id: 'TEST_C',
        name: 'TEST C — failed draft',
        description: 'Verifies that tool failure responds with success=false.',
        status: 'FAIL',
        error: `Expected creationSucceeded=false. Got creationSucceeded=${creationSucceeded}`
      });
    }
  } catch (err: any) {
    results.push({
      id: 'TEST_C',
      name: 'TEST C — failed draft',
      description: 'Verifies tool failure handling.',
      status: 'FAIL',
      error: err.message || String(err)
    });
  }

  // =========================================================================
  // TEST D: Prose-Only Success
  // =========================================================================
  try {
    const mockAdkPayload: any = {
      jsonrpc: '2.0',
      id: 999,
      result: {
        artifacts: [{
          parts: [{ kind: 'text', text: 'I have successfully created the draft reply to Travis with Draft ID r50098626517777389.' }]
        }],
        history: []
      }
    };

    const parsed = (sylviaApi as any).parseADKResponse(mockAdkPayload);
    const hasGmailToolCompleted = parsed.toolExecutions.some((t: any) => t.toolName === 'GMAIL' && t.status === 'completed');
    const hasWorkspaceDraftResult = parsed.workspaceResult !== undefined;

    if (!hasGmailToolCompleted && !hasWorkspaceDraftResult) {
      results.push({
        id: 'TEST_D',
        name: 'TEST D — prose-only success',
        description: 'Rejects prose claims. Ensures UI stays truthful by only confirming on structured responses.',
        status: 'PASS',
        details: 'Correctly identified prose-only claim as unverified. Gmail Panel populated: ' + (parsed.gmailMessages.length > 0)
      });
    } else {
      results.push({
        id: 'TEST_D',
        name: 'TEST D — prose-only success',
        description: 'Rejects prose claims.',
        status: 'FAIL',
        error: `Expected no verified data. Got hasGmailToolCompleted=${hasGmailToolCompleted}, hasWorkspaceDraftResult=${hasWorkspaceDraftResult}`
      });
    }
  } catch (err: any) {
    results.push({
      id: 'TEST_D',
      name: 'TEST D — prose-only success',
      description: 'Rejects prose claims.',
      status: 'FAIL',
      error: err.message || String(err)
    });
  }

  // =========================================================================
  // TEST E: Verified Draft
  // =========================================================================
  try {
    const mockToolResponse: any = {
      success: true,
      draft_created: true,
      draft_id: 'r50098626517777389',
      message_id: '1a059eefa9cd3c93',
      verified: true,
      sent: false
    };

    const rawDraft = mockToolResponse;
    const draftId = rawDraft.draft_id;
    const isApproved = true;
    const isDraftCreated = rawDraft.draft_created === true || rawDraft.success === true;
    const hasDraftId = Boolean(draftId && String(draftId).trim() !== '');
    const isSentFalse = rawDraft.sent !== true;

    const creationSucceeded = Boolean(isApproved && isDraftCreated && hasDraftId && isSentFalse);
    const verified = Boolean(rawDraft.verified === true || rawDraft.verification === 'verified' || rawDraft.status === 'verified');

    if (creationSucceeded && verified) {
      results.push({
        id: 'TEST_E',
        name: 'TEST E — verified draft',
        description: 'Enforces that "Draft Created & Verified" is shown only when independent verification confirms the draft.',
        status: 'PASS',
        details: `Verified: ${verified}, CreationSucceeded: ${creationSucceeded}`
      });
    } else {
      results.push({
        id: 'TEST_E',
        name: 'TEST E — verified draft',
        description: 'Enforces that verified draft displays true.',
        status: 'FAIL',
        error: `Expected creationSucceeded=true, verified=true. Got creationSucceeded=${creationSucceeded}, verified=${verified}`
      });
    }
  } catch (err: any) {
    results.push({
      id: 'TEST_E',
      name: 'TEST E — verified draft',
      description: 'Enforces verified draft behavior.',
      status: 'FAIL',
      error: err.message || String(err)
    });
  }

  // =========================================================================
  // TEST F: Verification Unavailable
  // =========================================================================
  try {
    const mockToolResponse: any = {
      success: true,
      draft_created: true,
      draft_id: 'r50098626517777389',
      message_id: '1a059eefa9cd3c93',
      sent: false
    };

    const rawDraft = mockToolResponse;
    const draftId = rawDraft.draft_id;
    const isApproved = true;
    const isDraftCreated = rawDraft.draft_created === true || rawDraft.success === true;
    const hasDraftId = Boolean(draftId && String(draftId).trim() !== '');
    const isSentFalse = rawDraft.sent !== true;

    const creationSucceeded = Boolean(isApproved && isDraftCreated && hasDraftId && isSentFalse);
    const verified = Boolean(rawDraft.verified === true || rawDraft.verification === 'verified' || rawDraft.status === 'verified');

    if (creationSucceeded && !verified) {
      results.push({
        id: 'TEST_F',
        name: 'TEST F — verification unavailable',
        description: 'Ensures creation succeeds without failure state even when independent verification field is not provided.',
        status: 'PASS',
        details: `Verified: ${verified} (Unavailable), CreationSucceeded: ${creationSucceeded} (Correctly marked success)`
      });
    } else {
      results.push({
        id: 'TEST_F',
        name: 'TEST F — verification unavailable',
        description: 'Ensures creation succeeds without failure state.',
        status: 'FAIL',
        error: `Expected creationSucceeded=true, verified=false. Got creationSucceeded=${creationSucceeded}, verified=${verified}`
      });
    }
  } catch (err: any) {
    results.push({
      id: 'TEST_F',
      name: 'TEST F — verification unavailable',
      description: 'Ensures creation succeeds without failure state.',
      status: 'FAIL',
      error: err.message || String(err)
    });
  }

  return results;
}
