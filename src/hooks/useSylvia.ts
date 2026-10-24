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
  WorkspaceHealth,
  ToolExecution,
} from '../types';
import { sylviaApi } from '../services/sylviaApi';
import {
  INITIAL_DECISION_DNA,
  INITIAL_CONTEXT_MEMORIES,
  INITIAL_MISSION,
  INITIAL_SPECIALISTS,
} from '../data/initialData';

let idCounter = 0;
export const generateUniqueId = (prefix: string): string => {
  idCounter += 1;
  return `${prefix}_${Date.now()}_${idCounter}_${Math.random().toString(36).substring(2, 9)}`;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' ? value as Record<string, unknown> : null;

const stringList = (value: unknown): string[] => {
  if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
  if (!Array.isArray(value)) return [];
  return value.map(item => {
    if (typeof item === 'string') return item.trim();
    const record = asRecord(item);
    return typeof record?.value === 'string' ? record.value.trim() : '';
  }).filter(Boolean);
};

const preferencesFromValue = (value: unknown): Record<string, string> => {
  const record = asRecord(value);
  if (record) {
    return Object.fromEntries(Object.entries(record).flatMap(([key, item]) => {
      if (typeof item === 'string' && item.trim()) return [[key, item.trim()]];
      const entry = asRecord(item);
      if (typeof entry?.value === 'string' && entry.value.trim()) return [[key, entry.value.trim()]];
      return [];
    }));
  }
  return Object.fromEntries(stringList(value).map((item, index) => [`Preference ${index + 1}`, item]));
};

const decisionDnaFromToolExecutions = (tools: ToolExecution[]): DecisionDNA | null => {
  for (const tool of [...tools].reverse()) {
    if (tool.toolName !== 'MEMORY') continue;
    const details = asRecord(tool.details);
    if (!details) continue;
    const nested = asRecord(details.decision_dna) || asRecord(details.decisionDNA);
    const hasDnaFields = ['goals', 'priorities', 'constraints', 'preferences', 'working_style', 'workingStyle', 'decision_rules', 'decisionRules']
      .some(key => key in details);
    const data = nested || (hasDnaFields ? details : null);
    if (!data) continue;
    return {
      goals: stringList(data.goals),
      priorities: stringList(data.priorities),
      constraints: stringList(data.constraints),
      preferences: preferencesFromValue(data.preferences),
      workingStyle: stringList(data.working_style ?? data.workingStyle),
      decisionRules: stringList(data.decision_rules ?? data.decisionRules),
      aversions: stringList(data.aversions),
    };
  }
  return null;
};

const missionFromToolExecutions = (tools: ToolExecution[]): Mission | null => {
  for (const tool of [...tools].reverse()) {
    if (tool.toolName !== 'MISSION') continue;
    const details = asRecord(tool.details);
    const candidate = asRecord(details?.mission) || asRecord(asRecord(details?.result)?.mission);
    if (!candidate || typeof candidate.title !== 'string' || typeof candidate.objective !== 'string') continue;

    const rawSteps = Array.isArray(candidate.steps) ? candidate.steps : [];
    const steps = rawSteps.map((value, index) => {
      const step = asRecord(value) || {};
      const statusText = String(step.status || 'pending').toLowerCase();
      const status: MissionStepStatus =
        statusText === 'completed' ? 'completed' :
        statusText === 'in_progress' ? 'in_progress' :
        statusText === 'blocked' ? 'blocked' : 'pending';
      return {
        id: String(step.id || `step_${index + 1}`),
        number: String(step.number || String(index + 1).padStart(2, '0')),
        title: String(step.title || step.name || `Step ${index + 1}`),
        description: typeof step.description === 'string' ? step.description : undefined,
        status,
        specialist: typeof step.specialist === 'string' ? step.specialist : undefined,
        actionRequired: Boolean(step.requires_approval ?? step.actionRequired),
      };
    });
    const completed = steps.filter(step => step.status === 'completed').length;
    const rawStatus = String(candidate.status || 'planning').toLowerCase();
    const status: Mission['status'] =
      rawStatus === 'completed' ? 'COMPLETED' :
      rawStatus === 'in_progress' ? 'IN_PROGRESS' :
      rawStatus === 'paused' || rawStatus === 'blocked' ? 'PAUSED' : 'NOT_STARTED';
    const rawPriority = String(candidate.priority || 'unspecified').toLowerCase();
    const priority: Mission['priority'] =
      rawPriority === 'urgent' ? 'CRITICAL' :
      rawPriority === 'high' ? 'HIGH' :
      rawPriority === 'normal' ? 'MEDIUM' :
      rawPriority === 'low' ? 'LOW' : 'UNSPECIFIED';
    const nextStep = steps.find(step => step.status === 'pending' || step.status === 'in_progress');
    const nextAction = String(candidate.next_action || candidate.nextAction || nextStep?.title || 'Review the mission steps.');

    return {
      id: String(candidate.id || candidate.mission_id || `mission_${Date.now()}`),
      title: candidate.title,
      objective: candidate.objective,
      status,
      priority,
      progress: steps.length ? Math.round((completed / steps.length) * 100) : 0,
      steps,
      nextAction,
      createdAt: String(candidate.created_at || candidate.createdAt || new Date().toISOString()),
      updatedAt: String(candidate.updated_at || candidate.updatedAt || new Date().toISOString()),
    };
  }
  return null;
};

const savedCareerMemoryFromTools = (tools: ToolExecution[]): ContextMemory | null => {
  for (const tool of [...tools].reverse()) {
    if (tool.toolName !== 'MEMORY') continue;
    const details = asRecord(tool.details);
    if (!details || details.persistent !== true || !(details.saved === true || details.exists === true)) continue;
    const memory = asRecord(details.memory);
    if (!memory || String(memory.category || '').toLowerCase() !== 'career') continue;
    const key = String(memory.key || 'CAREER_PROFILE');
    const createdAt = String(memory.created_at || memory.createdAt || new Date().toISOString());
    return {
      id: String(memory.id || key),
      key,
      summary: String(memory.value || ''),
      details: typeof memory.reason === 'string' ? memory.reason : undefined,
      category: 'CAREER',
      confidence: Number(memory.confidence ?? 80) / 100,
      createdAt,
      updatedAt: String(memory.updated_at || memory.updatedAt || createdAt),
    };
  }
  return null;
};

export function useSylvia() {
  const [sylviaState, setSylviaState] = useState<SylviaState>('IDLE');
  const [activeView, setActiveView] = useState<NavView>('chat');
  const [messages, setMessages] = useState<ChatItem[]>([{
    id: 'welcome_msg_init', sender: 'sylvia',
    text: "Greetings. I am **Sylvia**, your collaborative digital operator.\n\nI am synchronized with your **Decision DNA** and **Context Memory**. Google Workspace status will be shown only after a live backend Workspace check or operation.\n\nHow can we advance your objectives today?",
    timestamp: 'Just now',
  }]);
  const [activeMission, setActiveMission] = useState<Mission>(INITIAL_MISSION);
  const [decisionDNA, setDecisionDNA] = useState<DecisionDNA>(INITIAL_DECISION_DNA);
  const [contextMemories, setContextMemories] = useState<ContextMemory[]>(INITIAL_CONTEXT_MEMORIES);
  const [specialists, setSpecialists] = useState<SpecialistAgent[]>(INITIAL_SPECIALISTS);

  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [approvalQueue, setApprovalQueue] = useState<ApprovalRequest[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [agentCard, setAgentCard] = useState<AgentCard | null>(null);
  const [health, setHealth] = useState<BackendHealth>({
    connected: false,
    status: 'offline',
    backendUrl: sylviaApi.getBaseUrl(),
    lastChecked: new Date().toISOString(),
    adkConnected: false,
    isDemoMode: false,
  });

  const [delegationPath, setDelegationPath] = useState<string[]>([]);
  const [activeSpecialistNode, setActiveSpecialistNode] = useState<string | null>(null);
  const handledApprovalsRef = useRef<Set<string>>(new Set());
  const processingApprovalsRef = useRef<Set<string>>(new Set());
  const stateResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addActivity = useCallback((agent: string, action: string, status: ActivityEvent['status'], tool?: string, details?: string) => {
    setActivities(prev => [{ id: generateUniqueId('act'), timestamp: 'Just now', agent, action, status, tool, details }, ...prev.slice(0, 49)]);
  }, []);

  const appendChatMessage = useCallback((msg: ChatItem) => {
    setMessages(prev => prev.some(existing => existing.id === msg.id) ? [...prev, { ...msg, id: generateUniqueId('msg') }] : [...prev, msg]);
  }, []);

  const checkSystemHealth = useCallback(async () => {
    try {
      const healthResult = await sylviaApi.checkHealth();
      setHealth(prev => ({ ...healthResult, workspace: prev.workspace }));
      setAgentCard(await sylviaApi.getAgentCard());
    } catch (error) {
      addActivity('System Alert', `Health check failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }, [addActivity]);

  const applyBackendWorkspaceHealth = useCallback((workspaceResult?: Record<string, unknown>) => {
    if (!workspaceResult || typeof workspaceResult !== 'object') return;
    const raw = workspaceResult as any;
    const gmail = raw.gmail && typeof raw.gmail === 'object' ? raw.gmail : null;
    const calendar = raw.calendar && typeof raw.calendar === 'object' ? raw.calendar : null;
    if (typeof raw.authenticated !== 'boolean' && !gmail && !calendar) return;

    const workspace: WorkspaceHealth = {
      source: 'backend',
      authenticated: Boolean(raw.authenticated),
      gmailConnected: Boolean(gmail?.connected),
      gmailEmail: gmail?.email ? String(gmail.email) : undefined,
      calendarConnected: Boolean(calendar?.connected),
      calendarCount: calendar?.calendar_count != null ? Number(calendar.calendar_count) : undefined,
      error: String(gmail?.error || calendar?.error || '') || undefined,
      checkedAt: new Date().toISOString(),
    };

    setHealth(prev => ({ ...prev, workspace }));
    setSpecialists(prev => prev.map(specialist => specialist.id === 'workspace_specialist'
      ? { ...specialist, connected: workspace.gmailConnected || workspace.calendarConnected, status: workspace.gmailConnected || workspace.calendarConnected ? 'online' : 'idle' }
      : specialist));
    addActivity(
      'Workspace Specialist',
      `Workspace health returned by backend: Gmail ${workspace.gmailConnected ? 'connected' : 'not connected'}, Calendar ${workspace.calendarConnected ? 'connected' : 'not connected'}`,
      workspace.authenticated && !workspace.error ? 'success' : 'error',
      'WORKSPACE_HEALTH',
      workspace.gmailEmail || workspace.error,
    );
  }, [addActivity]);

  const refreshWorkspaceHealth = useCallback(async () => {
    try {
      const workspace = await sylviaApi.checkWorkspaceHealth();
      setHealth(prev => ({ ...prev, workspace }));
      setSpecialists(prev => prev.map(specialist => specialist.id === 'workspace_specialist'
        ? { ...specialist, connected: workspace.gmailConnected || workspace.calendarConnected, status: workspace.gmailConnected || workspace.calendarConnected ? 'online' : 'idle' }
        : specialist));
      addActivity(
        'Workspace Specialist',
        `Workspace health returned by backend: Gmail ${workspace.gmailConnected ? 'connected' : 'not connected'}, Calendar ${workspace.calendarConnected ? 'connected' : 'not connected'}`,
        workspace.authenticated && !workspace.error ? 'success' : 'error',
        'WORKSPACE_HEALTH',
        workspace.gmailEmail || workspace.error,
      );
    } catch (error) {
      addActivity('Workspace Specialist', `Workspace health check failed: ${error instanceof Error ? error.message : String(error)}`, 'error', 'WORKSPACE_HEALTH');
    }
  }, [addActivity]);

  useEffect(() => {
    void checkSystemHealth();
    const interval = window.setInterval(() => { void checkSystemHealth(); }, 20000);
    return () => window.clearInterval(interval);
  }, [checkSystemHealth]);

  useEffect(() => {
    if ((activeView === 'workspace-gmail' || activeView === 'workspace-calendar') && !health.workspace) {
      void refreshWorkspaceHealth();
    }
  }, [activeView, health.workspace, refreshWorkspaceHealth]);

  const setTemporaryState = useCallback((state: SylviaState, durationMs = 4000) => {
    if (stateResetTimerRef.current) clearTimeout(stateResetTimerRef.current);
    setSylviaState(state);
    if (state !== 'IDLE' && state !== 'WAITING_FOR_APPROVAL') {
      stateResetTimerRef.current = setTimeout(() => setSylviaState('IDLE'), durationMs);
    }
  }, []);

  const sendMessage = useCallback(async (text: string, onSpeechResponse?: (reply: string) => void) => {
    if (!text.trim()) return;
    const normalized = text.trim();

    appendChatMessage({ id: generateUniqueId('user'), sender: 'user', text: normalized, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    setSylviaState('THINKING');
    addActivity('Sylvia Root Agent', `Dispatching goal to live Google ADK: "${normalized.slice(0, 60)}${normalized.length > 60 ? '…' : ''}"`, 'working');

    const lower = normalized.toLowerCase();
    const isWorkspaceRequest = /gmail|email|inbox|calendar|meeting|schedule/.test(lower);
    const isCalendarRequest = /calendar|meeting|schedule/.test(lower);

    setDelegationPath(isWorkspaceRequest ? ['sylvia_core', 'workspace_specialist'] : ['sylvia_core']);
    setActiveSpecialistNode(isWorkspaceRequest ? 'workspace_specialist' : null);
    if (isWorkspaceRequest) {
      setSylviaState('ANALYZING');
      addActivity('Workspace Specialist', 'Live Workspace operation requested', 'working', 'WORKSPACE_TOOL');
      setActiveView(isCalendarRequest ? 'workspace-calendar' : 'workspace-gmail');
    }

    try {
      const response = await sylviaApi.sendA2AMessage(normalized);

      const returnedMission = missionFromToolExecutions(response.toolExecutions);
      if (returnedMission) {
        setActiveMission(returnedMission);
        addActivity('Action Planner', `Mission loaded from live ADK result: ${returnedMission.title}`, 'success', 'MISSION_RESULT');
      }
      const returnedDecisionDNA = decisionDnaFromToolExecutions(response.toolExecutions);
      if (returnedDecisionDNA) {
        setDecisionDNA(returnedDecisionDNA);
      }
      const savedCareerMemory = savedCareerMemoryFromTools(response.toolExecutions);
      if (savedCareerMemory) {
        setContextMemories(prev => [savedCareerMemory, ...prev.filter(item => item.id !== savedCareerMemory.id && item.key !== savedCareerMemory.key)]);
      }

      setDelegationPath([]);
      setActiveSpecialistNode(null);

      if (response.gmailMessages.length > 0) {
        setGmailMessages(response.gmailMessages);
        addActivity('Workspace Specialist', `Loaded ${response.gmailMessages.length} real Gmail messages returned by ADK`, 'success', 'GMAIL_READ');
      }
      if (response.calendarEvents.length > 0) {
        setCalendarEvents(response.calendarEvents);
        addActivity('Workspace Specialist', `Loaded ${response.calendarEvents.length} real Calendar events returned by ADK`, 'success', 'CALENDAR_READ');
      }
      applyBackendWorkspaceHealth(response.workspaceResult);
      response.toolExecutions.forEach(tool => {
        addActivity(response.specialist, `${tool.status === 'failed' ? 'ADK tool failed' : 'ADK tool executed'}: ${tool.action}`, tool.status === 'failed' ? 'error' : 'success', tool.action, tool.result);
      });

      const pendingApproval = response.approvalRequest;
      if (pendingApproval) {
        setSylviaState('WAITING_FOR_APPROVAL');
        setApprovalQueue(prev => [pendingApproval, ...prev.filter(item => item.id !== pendingApproval.id)]);
        addActivity('Sylvia Gate', `Human authorization required: ${pendingApproval.title}`, 'waiting_approval', 'APPROVAL_GATE');
      } else {
        setSylviaState('COMPLETED');
        window.setTimeout(() => setSylviaState('IDLE'), 3000);
      }

      appendChatMessage({
        id: generateUniqueId('reply'),
        sender: response.specialist.toLowerCase() === 'sylvia' ? 'sylvia' : 'specialist',
        specialistName: response.specialist.toLowerCase() === 'sylvia' ? undefined : response.specialist,
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolExecution: response.toolExecutions[0],
        approvalRequest: pendingApproval,
      });
      onSpeechResponse?.(response.reply);
      return { reply: response.reply, toolExecutions: response.toolExecutions };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setSylviaState('ERROR');
      setDelegationPath([]);
      setActiveSpecialistNode(null);
      addActivity('System Alert', errorMsg, 'error');
      appendChatMessage({ id: generateUniqueId('err'), sender: 'sylvia', text: `**ADK Communication Error**\n\n${errorMsg}`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
      window.setTimeout(() => setSylviaState('IDLE'), 4000);
      return null;
    }
  }, [addActivity, appendChatMessage, applyBackendWorkspaceHealth, setActiveView]);

  const approveAction = useCallback(async (approvalId: string) => {
    if (handledApprovalsRef.current.has(approvalId) || processingApprovalsRef.current.has(approvalId)) return;
    const approval = approvalQueue.find(item => item.id === approvalId);
    if (!approval || approval.status !== 'WAITING') return;

    processingApprovalsRef.current.add(approvalId);
    setSylviaState('WORKING');
    addActivity('Human Operator', `Explicit approval selected for ${approval.title}`, 'info', 'APPROVAL_GRANTED');

    try {
      const result = await sylviaApi.submitApproval(approval, 'APPROVED');
      if (!result.success) {
        setSylviaState('ERROR');
        addActivity('Workspace Specialist', 'Gmail draft creation failed; no success state shown', 'error', 'GMAIL_DRAFT_FAILED', result.error);
        appendChatMessage({
          id: generateUniqueId('approval_err'), sender: 'specialist', specialistName: 'Workspace Specialist',
          text: `⚠ **Gmail Draft Creation Failed.**\n\nThe live ADK response did not return a successful Gmail draft result with a real draft ID. **Sylvia will not claim that a draft was created.**\n\n${result.error || result.reply}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        window.setTimeout(() => setSylviaState('IDLE'), 5000);
        return;
      }

      handledApprovalsRef.current.add(approvalId);
      setApprovalQueue(prev => prev.map(item => item.id === approvalId ? { ...item, status: 'APPROVED' } : item));
      setMessages(prev => prev.map(message => message.approvalRequest?.id === approvalId
        ? { ...message, approvalRequest: { ...message.approvalRequest, status: 'APPROVED' } }
        : message));

      const draft = result.draft;
      if (draft?.success && draft.draftId) {
        const details = [
          `Draft ID: ${draft.draftId}`,
          draft.messageId ? `Message ID: ${draft.messageId}` : '',
          draft.threadId ? `Thread ID: ${draft.threadId}` : '',
        ].filter(Boolean).join('\n');
        const verificationText = draft.verified
          ? 'The backend also supplied an explicit verification signal. The email has **NOT** been sent.'
          : 'The live Gmail tool confirmed creation with a real draft ID, but no separate verification signal was returned. The email has **NOT** been sent.';
        addActivity(
          'Workspace Specialist',
          draft.verified ? 'Gmail draft created and explicitly verified by live ADK/Gmail result' : 'Gmail draft created by live ADK/Gmail result; independent verification unavailable',
          'success',
          draft.verified ? 'GMAIL_DRAFT_VERIFIED' : 'GMAIL_DRAFT_CREATED',
          details,
        );
        appendChatMessage({
          id: generateUniqueId('conf'), sender: 'specialist', specialistName: 'Workspace Specialist',
          text: draft.verified
            ? `✓ **Gmail Draft Created & Verified**\n\n**Recipient:** ${draft.recipient || approval.recipient || 'Unknown'}\n\n**Subject:** ${draft.subject || approval.subject || '(No subject)'}\n\n**Draft ID:** \`${draft.draftId}\`\n\n${draft.messageId ? `**Message ID:** \`${draft.messageId}\`\n\n` : ''}${draft.threadId ? `**Thread ID:** \`${draft.threadId}\`\n\n` : ''}${verificationText}`
            : `✓ **Gmail Draft Created**\n\n**Recipient:** ${draft.recipient || approval.recipient || 'Unknown'}\n\n**Subject:** ${draft.subject || approval.subject || '(No subject)'}\n\n**Draft ID:** \`${draft.draftId}\`\n\n${draft.messageId ? `**Message ID:** \`${draft.messageId}\`\n\n` : ''}${draft.threadId ? `**Thread ID:** \`${draft.threadId}\`\n\n` : ''}**Verification:** Not independently available.\n\n${verificationText}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          toolExecution: result.toolExecutions.find(tool => tool.toolName === 'GMAIL'),
        });
      }

      setSylviaState('COMPLETED');
      window.setTimeout(() => setSylviaState('IDLE'), 3000);
    } finally {
      processingApprovalsRef.current.delete(approvalId);
    }
  }, [addActivity, appendChatMessage, approvalQueue]);

  const cancelApproval = useCallback(async (approvalId: string) => {
    if (handledApprovalsRef.current.has(approvalId) || processingApprovalsRef.current.has(approvalId)) return;
    const approval = approvalQueue.find(item => item.id === approvalId);
    if (!approval || approval.status !== 'WAITING') return;

    processingApprovalsRef.current.add(approvalId);
    setSylviaState('WORKING');
    try {
      const result = await sylviaApi.submitApproval(approval, 'CANCELLED');
      if (result.success) {
        handledApprovalsRef.current.add(approvalId);
        setApprovalQueue(prev => prev.map(item => item.id === approvalId ? { ...item, status: 'CANCELLED' } : item));
        setMessages(prev => prev.map(message => message.approvalRequest?.id === approvalId
          ? { ...message, approvalRequest: { ...message.approvalRequest, status: 'CANCELLED' } }
          : message));
        addActivity('Human Operator', `Approval cancelled: ${approval.title}`, 'info', 'APPROVAL_CANCELLED');
        appendChatMessage({ id: generateUniqueId('canc'), sender: 'sylvia', text: 'Write action cancelled. No Gmail or Calendar write was authorized.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
      } else {
        addActivity('System Alert', 'Cancellation could not be confirmed by the live ADK backend.', 'error', 'APPROVAL_CANCEL_FAILED', result.error);
        appendChatMessage({ id: generateUniqueId('cancel_err'), sender: 'sylvia', text: `⚠ **Cancellation not confirmed.**\n\n${result.error || result.reply}`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
      }
    } finally {
      processingApprovalsRef.current.delete(approvalId);
      setSylviaState('IDLE');
    }
  }, [addActivity, appendChatMessage, approvalQueue]);

  const updateMissionStep = useCallback((stepId: string, status: MissionStepStatus) => {
    setActiveMission(prev => {
      const updatedSteps = prev.steps.map(step => step.id === stepId ? { ...step, status } : step);
      const completedCount = updatedSteps.filter(step => step.status === 'completed').length;
      return { ...prev, steps: updatedSteps, progress: updatedSteps.length ? Math.round((completedCount / updatedSteps.length) * 100) : 0, updatedAt: new Date().toISOString() };
    });
    addActivity('Action Planner', `Step updated: ${stepId} → ${status.toUpperCase()}`, 'info', 'MISSION_STEP_UPDATE');
  }, [addActivity]);

  const addDecisionRule = useCallback((rule: string) => {
    if (!rule.trim()) return;
    setDecisionDNA(prev => ({ ...prev, decisionRules: [...prev.decisionRules, rule.trim()] }));
    addActivity('Decision Partner', `Decision rule registered: "${rule.slice(0, 60)}${rule.length > 60 ? '…' : ''}"`, 'success');
  }, [addActivity]);

  const addContextMemory = useCallback((key: string, summary: string, details: string, category: ContextMemory['category']) => {
    const item: ContextMemory = { id: generateUniqueId('mem'), key: key.toUpperCase().replace(/\s+/g, '_'), summary, details, category, confidence: 0.98, createdAt: new Date().toISOString() };
    setContextMemories(prev => [item, ...prev]);
    addActivity('Context Analyst', `Context memory stored: [${key}]`, 'success', 'MEMORY_SAVE');
  }, [addActivity]);

  const updateBackendUrl = useCallback((newUrl: string) => { sylviaApi.setBaseUrl(newUrl); void checkSystemHealth(); }, [checkSystemHealth]);

  const runDemoSequence = useCallback(() => {
    setActiveView('specialists'); setSylviaState('THINKING'); setDelegationPath(['sylvia_core']);
    addActivity('Sylvia Core', 'Starting visual-only specialist demonstration (no external writes)', 'info', 'DEMO');
    window.setTimeout(() => { setDelegationPath(['sylvia_core', 'context_analyst']); setActiveSpecialistNode('context_analyst'); setSylviaState('ANALYZING'); }, 900);
    window.setTimeout(() => { setDelegationPath(['sylvia_core', 'context_analyst', 'decision_partner']); setActiveSpecialistNode('decision_partner'); setSylviaState('WORKING'); }, 1800);
    window.setTimeout(() => { setDelegationPath(['sylvia_core', 'context_analyst', 'decision_partner', 'action_planner']); setActiveSpecialistNode('action_planner'); setSylviaState('WORKING'); }, 2700);
    window.setTimeout(() => { setDelegationPath([]); setActiveSpecialistNode(null); setSylviaState('IDLE'); addActivity('Sylvia Core', 'Visual demonstration complete — no Workspace writes executed', 'info', 'DEMO_COMPLETE'); }, 3800);
  }, [addActivity]);


  const startNewConversation = useCallback(() => {
    sylviaApi.resetConversation();
    setMessages(previous => {
      const pendingApprovalMessages = previous.filter(message => message.approvalRequest?.status === 'WAITING');
      return [{
        id: generateUniqueId('welcome'),
        sender: 'sylvia',
        text: 'A new conversation is ready. Any unresolved approval requests have been kept for your review.',
        timestamp: 'Just now',
      }, ...pendingApprovalMessages];
    });
    setActiveView('chat');
    setSylviaState('IDLE');
    setDelegationPath([]);
    setActiveSpecialistNode(null);
    addActivity('Sylvia', 'Started a new conversation context; unresolved approvals retained', 'info', 'NEW_SESSION');
  }, [addActivity]);

  return {
    state: sylviaState, sylviaState, setSylviaState, setTemporaryState,
    activeView, setActiveView, chatMessages: messages, messages,
    mission: activeMission, activeMission, decisionDNA, contextMemories,
    specialists, gmailMessages, calendarEvents, pendingApprovals: approvalQueue, approvalQueue,
    activities, health, agentCard, activeDelegationPath: delegationPath, delegationPath, activeSpecialistNode,
    sendMessage, startNewConversation, approveAction, cancelAction: cancelApproval, cancelApproval,
    updateMissionStepStatus: updateMissionStep, updateMissionStep, addDecisionRule, addContextMemory,
    runDemoSequence, refreshHealth: checkSystemHealth, refreshWorkspaceHealth, checkSystemHealth, updateBackendUrl, addActivity,
  };
}
