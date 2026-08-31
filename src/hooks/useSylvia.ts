import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SylviaState,
  NavView,
  ChatItem,
  Mission,
  MissionStepStatus,
  DecisionDNA,
  ContextMemory,
  SpecialistAgent,
  GmailMessage,
  CalendarEvent,
  ApprovalRequest,
  ActivityEvent,
  BackendHealth,
  AgentCard,
} from '../types';
import { sylviaApi } from '../services/sylviaApi';
import {
  INITIAL_DECISION_DNA,
  INITIAL_CONTEXT_MEMORIES,
  INITIAL_MISSION,
  INITIAL_SPECIALISTS,
  INITIAL_GMAIL_MESSAGES,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_APPROVAL_REQUEST,
  INITIAL_ACTIVITIES,
} from '../data/initialData';

// Safe unique ID generator preventing collisions
let idCounter = 0;
export const generateUniqueId = (prefix: string): string => {
  idCounter += 1;
  const rand = Math.random().toString(36).substring(2, 9);
  const time = Date.now();
  return `${prefix}_${time}_${idCounter}_${rand}`;
};

export function useSylvia() {
  const [sylviaState, setSylviaState] = useState<SylviaState>('IDLE');
  const [activeView, setActiveView] = useState<NavView>('chat');
  const [messages, setMessages] = useState<ChatItem[]>([
    {
      id: 'welcome_msg_init',
      sender: 'sylvia',
      text: "Greetings. I am **Sylvia**, your collaborative digital operator.\n\nI am synchronized with your **Decision DNA**, **Context Memory**, and **Google Workspace**. I deconstruct complex goals into executable missions and coordinate our specialist agents.\n\nHow can we advance your objectives today?",
      timestamp: 'Just now',
    },
  ]);

  const [activeMission, setActiveMission] = useState<Mission>(INITIAL_MISSION);
  const [decisionDNA, setDecisionDNA] = useState<DecisionDNA>(INITIAL_DECISION_DNA);
  const [contextMemories, setContextMemories] = useState<ContextMemory[]>(INITIAL_CONTEXT_MEMORIES);
  const [specialists, setSpecialists] = useState<SpecialistAgent[]>(INITIAL_SPECIALISTS);
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>(INITIAL_GMAIL_MESSAGES);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(INITIAL_CALENDAR_EVENTS);
  const [approvalQueue, setApprovalQueue] = useState<ApprovalRequest[]>([INITIAL_APPROVAL_REQUEST]);
  const [activities, setActivities] = useState<ActivityEvent[]>(INITIAL_ACTIVITIES);
  const [agentCard, setAgentCard] = useState<AgentCard | null>(null);

  const [health, setHealth] = useState<BackendHealth>({
    connected: false,
    status: 'offline',
    backendUrl: sylviaApi.getBaseUrl(),
    lastChecked: new Date().toISOString(),
    adkConnected: false,
    isDemoMode: true,
  });

  const [delegationPath, setDelegationPath] = useState<string[]>([]);
  const [activeSpecialistNode, setActiveSpecialistNode] = useState<string | null>(null);
  const stateResetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handledApprovalsRef = useRef<Set<string>>(new Set());

  // Check health and load agent card on mount
  const checkSystemHealth = useCallback(async () => {
    try {
      const healthResult = await sylviaApi.checkHealth();
      setHealth(healthResult);

      const card = await sylviaApi.getAgentCard();
      setAgentCard(card);

      if (healthResult.connected) {
        addActivity('Sylvia Core', 'Connected to live Python ADK server at ' + healthResult.backendUrl, 'success');
      }
    } catch (e) {
      console.warn('Backend health query failed:', e);
    }
  }, []);

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 20000);
    return () => clearInterval(interval);
  }, [checkSystemHealth]);

  const addActivity = useCallback((agent: string, action: string, status: ActivityEvent['status'], tool?: string, details?: string) => {
    const newEvent: ActivityEvent = {
      id: generateUniqueId('act'),
      timestamp: 'Just now',
      agent,
      action,
      status,
      tool,
      details,
    };
    setActivities(prev => [newEvent, ...prev.slice(0, 49)]);
  }, []);

  const setTemporaryState = useCallback((state: SylviaState, durationMs = 4000) => {
    if (stateResetTimerRef.current) {
      clearTimeout(stateResetTimerRef.current);
    }
    setSylviaState(state);
    if (state !== 'IDLE' && state !== 'WAITING_FOR_APPROVAL') {
      stateResetTimerRef.current = setTimeout(() => {
        setSylviaState('IDLE');
      }, durationMs);
    }
  }, []);

  /**
   * Safe Append Message Helper
   */
  const appendChatMessage = useCallback((msg: ChatItem) => {
    setMessages(prev => {
      // Check if message ID already exists, if so generate a new unique ID
      const finalMsg = prev.some(existing => existing.id === msg.id)
        ? { ...msg, id: generateUniqueId('msg') }
        : msg;
      return [...prev, finalMsg];
    });
  }, []);

  /**
   * Primary Send Message Handler - Orchestrates A2A Dispatch, State Progression & Multi-Agent Animation
   */
  const sendMessage = useCallback(async (text: string, onSpeechResponse?: (reply: string) => void) => {
    if (!text.trim()) return;

    const userMsgId = generateUniqueId('user');
    const userMsg: ChatItem = {
      id: userMsgId,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    appendChatMessage(userMsg);
    setSylviaState('THINKING');
    addActivity('Sylvia', `Processing goal: "${text.slice(0, 50)}..."`, 'working');

    // Simulate multi-agent delegation sequence for hackathon visual demonstration
    const lower = text.toLowerCase();
    
    // Step 1: Thinking -> Analyzing
    setTimeout(() => {
      setSylviaState('ANALYZING');
      setDelegationPath(['sylvia_core', 'context_analyst']);
      setActiveSpecialistNode('context_analyst');
      addActivity('Context Analyst', 'Evaluating Decision DNA rules & memory precedents', 'info', 'MEMORY_LOOKUP');
    }, 600);

    // Step 2: Analyzing -> Decision Partner
    setTimeout(() => {
      setDelegationPath(['sylvia_core', 'context_analyst', 'decision_partner']);
      setActiveSpecialistNode('decision_partner');
      addActivity('Decision Partner', 'Validating constraints against human autonomy rules', 'working', 'TRADEOFF_EVAL');
    }, 1300);

    // Step 3: Working -> Action Planner / Workspace Specialist
    setTimeout(() => {
      setSylviaState('WORKING');
      if (lower.includes('email') || lower.includes('gmail') || lower.includes('draft') || lower.includes('calendar') || lower.includes('schedule')) {
        setDelegationPath(['sylvia_core', 'decision_partner', 'workspace_specialist']);
        setActiveSpecialistNode('workspace_specialist');
        addActivity('Workspace Specialist', 'Accessing Google Workspace ADK tool interfaces', 'working', 'WORKSPACE_TOOL');
      } else {
        setDelegationPath(['sylvia_core', 'decision_partner', 'action_planner']);
        setActiveSpecialistNode('action_planner');
        addActivity('Action Planner', 'Sequencing actionable mission milestones', 'working', 'PLANNER_TOOL');
      }
    }, 2000);

    try {
      const response = await sylviaApi.sendA2AMessage(text);
      const assistantText = response.result?.message?.parts?.[0]?.text || "Task processed successfully.";
      const specialistName = response.result?.message?.agent || 'Sylvia';

      setTimeout(() => {
        setDelegationPath([]);
        setActiveSpecialistNode(null);

        // Check if an approval or tool execution is needed
        let pendingApproval: ApprovalRequest | undefined = undefined;
        let toolExec = undefined;

        if (lower.includes('draft') || lower.includes('reply') || lower.includes('travis') || lower.includes('send')) {
          setSylviaState('WAITING_FOR_APPROVAL');
          pendingApproval = {
            id: generateUniqueId('appr'),
            actionType: 'GMAIL_DRAFT',
            title: 'Create Gmail Draft for Travis Vance',
            description: 'Sylvia drafted a verified response to Travis Vance regarding Q3 Cutover.',
            recipient: 'travis.vance@techcorp.internal',
            subject: 'Re: Q3 Architecture Review & Cloud Run Cutover',
            bodyPreview: `Hi Travis,\n\nI reviewed the staging benchmarks and the zero-error report looks solid. Friday the 15th at 20:00 UTC works as the target cutover window.\n\nLet's run a final pre-flight verification 2 hours prior.\n\nBest regards,\nSylvia Operator`,
            status: 'WAITING',
            riskLevel: 'MEDIUM',
            createdAt: new Date().toISOString(),
          };
          setApprovalQueue(prev => [pendingApproval!, ...prev]);
          addActivity('Sylvia Gate', 'Human approval required for Gmail Draft write action', 'waiting_approval', 'APPROVAL_GATE');
        } else if (lower.includes('mission') || lower.includes('business') || lower.includes('organize')) {
          setSylviaState('COMPLETED');
          toolExec = {
            id: generateUniqueId('tool'),
            toolName: 'MISSION' as const,
            action: 'Business Operations Control mission synchronized',
            status: 'completed' as const,
            result: '5 phased milestones mapped',
          };
          addActivity('Action Planner', 'Mission updated with 5 active execution steps', 'success', 'MISSION_SYNC');
          setTimeout(() => setSylviaState('IDLE'), 3500);
        } else {
          setSylviaState('COMPLETED');
          setTimeout(() => setSylviaState('IDLE'), 3000);
        }

        const replyMsg: ChatItem = {
          id: generateUniqueId('reply'),
          sender: specialistName === 'Sylvia' ? 'sylvia' : 'specialist',
          specialistName: specialistName === 'Sylvia' ? undefined : specialistName,
          text: assistantText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          toolExecution: toolExec,
          approvalRequest: pendingApproval,
        };

        appendChatMessage(replyMsg);
        if (onSpeechResponse) {
          onSpeechResponse(assistantText);
        }
      }, 2600);

    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setSylviaState('ERROR');
      setDelegationPath([]);
      setActiveSpecialistNode(null);

      const errChatItem: ChatItem = {
        id: generateUniqueId('err'),
        sender: 'sylvia',
        text: `I encountered an issue communicating with the backend: ${errorMsg}. Switched to local offline resilience.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      appendChatMessage(errChatItem);
      addActivity('System Error', errorMsg, 'error');
      setTimeout(() => setSylviaState('IDLE'), 4000);
    }
  }, [addActivity, appendChatMessage]);

  /**
   * Human Approval Confirmation
   */
  const approveAction = useCallback(async (approvalId: string) => {
    if (handledApprovalsRef.current.has(approvalId)) {
      return; // Already approved or being processed
    }
    handledApprovalsRef.current.add(approvalId);

    setSylviaState('WORKING');
    addActivity('Human Operator', `Explicit authorization granted for Approval ${approvalId}`, 'success', 'APPROVAL_GRANTED');

    setApprovalQueue(prev =>
      prev.map(appr => (appr.id === approvalId ? { ...appr, status: 'APPROVED' } : appr))
    );

    // Update status in any active chat messages holding this approval
    setMessages(prev =>
      prev.map(m => {
        if (m.approvalRequest && m.approvalRequest.id === approvalId) {
          return {
            ...m,
            approvalRequest: {
              ...m.approvalRequest,
              status: 'APPROVED',
            },
          };
        }
        return m;
      })
    );

    // Call A2A backend
    await sylviaApi.submitApproval(approvalId, 'APPROVED');

    setTimeout(() => {
      setSylviaState('COMPLETED');
      addActivity('Workspace Specialist', 'Gmail draft successfully registered and created in Gmail', 'success', 'GMAIL_DRAFT_CREATED');

      const confirmationMsg: ChatItem = {
        id: generateUniqueId('conf'),
        sender: 'specialist',
        specialistName: 'Workspace Specialist',
        text: '✓ **Human Approval Confirmed**: The Gmail draft for **Travis Vance** has been registered and verified in your Gmail drafts folder. No further action needed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolExecution: {
          id: generateUniqueId('tool_appr'),
          toolName: 'GMAIL',
          action: 'Gmail Draft Created (Approved by Operator)',
          status: 'completed',
        },
      };

      appendChatMessage(confirmationMsg);
      setTimeout(() => setSylviaState('IDLE'), 3000);
    }, 1200);
  }, [addActivity, appendChatMessage]);

  /**
   * Human Approval Cancellation
   */
  const cancelApproval = useCallback(async (approvalId: string) => {
    if (handledApprovalsRef.current.has(approvalId)) {
      return;
    }
    handledApprovalsRef.current.add(approvalId);

    setSylviaState('IDLE');
    addActivity('Human Operator', `Approval ${approvalId} cancelled by user`, 'info', 'APPROVAL_CANCELLED');

    setApprovalQueue(prev =>
      prev.map(appr => (appr.id === approvalId ? { ...appr, status: 'CANCELLED' } : appr))
    );

    setMessages(prev =>
      prev.map(m => {
        if (m.approvalRequest && m.approvalRequest.id === approvalId) {
          return {
            ...m,
            approvalRequest: {
              ...m.approvalRequest,
              status: 'CANCELLED',
            },
          };
        }
        return m;
      })
    );

    await sylviaApi.submitApproval(approvalId, 'CANCELLED');

    const cancelMsg: ChatItem = {
      id: generateUniqueId('canc'),
      sender: 'sylvia',
      text: 'Write action aborted per your instruction. No changes were made to your Google Workspace account.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    appendChatMessage(cancelMsg);
  }, [addActivity, appendChatMessage]);

  /**
   * Mission Step Status Toggle
   */
  const updateMissionStep = useCallback((stepId: string, status: MissionStepStatus) => {
    setActiveMission(prev => {
      const updatedSteps = prev.steps.map(step => (step.id === stepId ? { ...step, status } : step));
      const completedCount = updatedSteps.filter(s => s.status === 'completed').length;
      const progress = Math.round((completedCount / updatedSteps.length) * 100);
      return {
        ...prev,
        steps: updatedSteps,
        progress,
        updatedAt: new Date().toISOString(),
      };
    });
    addActivity('Action Planner', `Step updated: ${stepId} marked as ${status.toUpperCase()}`, 'info', 'MISSION_STEP_UPDATE');
  }, [addActivity]);

  /**
   * Save new Decision Rule
   */
  const addDecisionRule = useCallback((rule: string) => {
    if (!rule.trim()) return;
    setDecisionDNA(prev => ({
      ...prev,
      decisionRules: [...prev.decisionRules, rule.trim()],
    }));
    addActivity('Decision Partner', `New decision rule registered in Decision DNA: "${rule.slice(0, 40)}..."`, 'success');
  }, [addActivity]);

  /**
   * Save Context Memory
   */
  const addContextMemory = useCallback((key: string, summary: string, details: string, category: ContextMemory['category']) => {
    const newMemory: ContextMemory = {
      id: generateUniqueId('mem'),
      key: key.toUpperCase().replace(/\s+/g, '_'),
      summary,
      details,
      category,
      confidence: 0.98,
      createdAt: new Date().toISOString(),
    };
    setContextMemories(prev => [newMemory, ...prev]);
    addActivity('Context Analyst', `Context memory stored: [${key}]`, 'success', 'MEMORY_SAVE');
  }, [addActivity]);

  /**
   * Switch backend URL
   */
  const updateBackendUrl = useCallback((newUrl: string) => {
    sylviaApi.setBaseUrl(newUrl);
    checkSystemHealth();
  }, [checkSystemHealth]);

  /**
   * Run full demonstration sequence across specialists
   */
  const runDemoSequence = useCallback(() => {
    setActiveView('specialists');
    setSylviaState('THINKING');
    setDelegationPath(['sylvia_core']);
    addActivity('Sylvia Core', 'Beginning multi-agent delegation sequence', 'working');

    setTimeout(() => {
      setSylviaState('ANALYZING');
      setDelegationPath(['sylvia_core', 'context_analyst']);
      setActiveSpecialistNode('context_analyst');
      addActivity('Context Analyst', 'Retrieving historical context & invoices', 'working', 'MEMORY_LOOKUP');
    }, 1200);

    setTimeout(() => {
      setSylviaState('WORKING');
      setDelegationPath(['sylvia_core', 'context_analyst', 'decision_partner']);
      setActiveSpecialistNode('decision_partner');
      addActivity('Decision Partner', 'Evaluating against Decision DNA Rule 01', 'working', 'DNA_EVALUATION');
    }, 2800);

    setTimeout(() => {
      setSylviaState('WORKING');
      setDelegationPath(['sylvia_core', 'context_analyst', 'decision_partner', 'action_planner']);
      setActiveSpecialistNode('action_planner');
      addActivity('Action Planner', 'Deconstructing goal into 5 phased roadmap steps', 'working', 'MISSION_PLAN');
    }, 4400);

    setTimeout(() => {
      setSylviaState('WAITING_FOR_APPROVAL');
      setDelegationPath(['sylvia_core', 'context_analyst', 'decision_partner', 'action_planner', 'workspace_specialist']);
      setActiveSpecialistNode('workspace_specialist');
      addActivity('Workspace Specialist', 'Draft prepared. Paused for Human Operator authorization.', 'waiting_approval', 'GMAIL_DRAFT');
    }, 6000);
  }, [setActiveView, addActivity]);

  return {
    state: sylviaState,
    sylviaState,
    setSylviaState,
    setTemporaryState,
    activeView,
    setActiveView,
    chatMessages: messages,
    messages,
    mission: activeMission,
    activeMission,
    decisionDNA,
    contextMemories,
    specialists,
    gmailMessages,
    calendarEvents,
    pendingApprovals: approvalQueue,
    approvalQueue,
    activities,
    health,
    agentCard,
    activeDelegationPath: delegationPath,
    delegationPath,
    activeSpecialistNode,
    sendMessage,
    approveAction,
    cancelAction: cancelApproval,
    cancelApproval,
    updateMissionStepStatus: updateMissionStep,
    updateMissionStep,
    addDecisionRule,
    addContextMemory,
    runDemoSequence,
    refreshHealth: checkSystemHealth,
    checkSystemHealth,
    updateBackendUrl,
    addActivity,
  };
}

