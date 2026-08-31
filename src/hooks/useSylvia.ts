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

  // Live Workspace state is intentionally empty at startup. Only real ADK tool output populates it.
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [approvalQueue, setApprovalQueue] = useState<ApprovalRequest[]>([]);
  // Activity feed starts empty: no pre-seeded Workspace actions are presented as real events.
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
      // This is a lightweight HTTP health probe. It does not invoke an LLM.
      const healthResult = await sylviaApi.checkHealth();
      setHealth(prev => ({ ...healthResult, workspace: prev.workspace }));
      setAgentCard(await sylviaApi.getAgentCard());
      if (healthResult.connected) addActivity('Sylvia Core', `Connected to live ADK backend at ${healthResult.backendUrl}`, 'success');
    } catch (error) {
      addActivity('System Alert', `Health check failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }, [addActivity]);

  useEffect(() => {
    void checkSystemHealth();
    const interval = window.setInterval(() => { void checkSystemHealth(); }, 20000);
    return () => window.clearInterval(interval);
  }, [checkSystemHealth]);

  const setTemporaryState = useCallback((state: SylviaState, durationMs = 4000) => {
    if (stateResetTimerRef.current) clearTimeout(stateResetTimerRef.current);
    setSylviaState(state);
    if (state !== 'IDLE' && state !== 'WAITING_FOR_APPROVAL') {
      stateResetTimerRef.current = setTimeout(() => setSylviaState('IDLE'), durationMs);
    }
  }, []);

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

  const sendMessage = useCallback(async (text: string, onSpeechResponse?: (reply: string) => void) => {
    if (!text.trim()) return;
    const normalized = text.trim();

    appendChatMessage({ id: generateUniqueId('user'), sender: 'user', text: normalized, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    setSylviaState('THINKING');
    addActivity('Sylvia Root Agent', `Dispatching goal to live Google ADK: \"${normalized.slice(0, 60)}${normalized.length > 60 ? '…' : ''}\"`, 'working');

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
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setSylviaState('ERROR');
      setDelegationPath([]);
      setActiveSpecialistNode(null);
      addActivity('System Alert', errorMsg, 'error');
      appendChatMessage({ id: generateUniqueId('err'), sender: 'sylvia', text: `**ADK Communication Error**\n\n${errorMsg}`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
      window.setTimeout(() => setSylviaState('IDLE'), 4000);
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
        addActivity('Workspace Specialist', 'Gmail write was NOT verified; no success state shown', 'error', 'GMAIL_DRAFT_NOT_VERIFIED', result.error);
        appendChatMessage({
          id: generateUniqueId('approval_err'), sender: 'specialist', specialistName: 'Workspace Specialist',
          text: `⚠ **Gmail draft not verified.**\n\nThe live ADK response did not return a verified Gmail draft result. **Sylvia will not claim that a draft was created.**\n\n${result.error || result.reply}`,
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

      if (result.draft?.verified && result.draft.draftId) {
        const draft = result.draft;
        const details = [
          `Draft ID: ${draft.draftId}`,
          draft.messageId ? `Message ID: ${draft.messageId}` : '',
          draft.threadId ? `Thread ID: ${draft.threadId}` : '',
        ].filter(Boolean).join('\n');
        addActivity('Workspace Specialist', 'Gmail draft created and verified by live ADK/Gmail result', 'success', 'GMAIL_DRAFT_VERIFIED', details);
        appendChatMessage({
          id: generateUniqueId('conf'), sender: 'specialist', specialistName: 'Workspace Specialist',
          text: `✓ **Gmail Draft Created & Verified**\n\n**Recipient:** ${draft.recipient || approval.recipient || 'Unknown'}\n\n**Subject:** ${draft.subject || approval.subject || '(No subject)'}\n\n**Draft ID:** \`${draft.draftId}\`\n\n${draft.messageId ? `**Message ID:** \`${draft.messageId}\`\n\n` : ''}${draft.threadId ? `**Thread ID:** \`${draft.threadId}\`\n\n` : ''}The backend provided a verified Gmail result. The email has **NOT** been sent.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          toolExecution: result.toolExecutions.find(tool => tool.toolName === 'GMAIL'),
        });
      } else {
        addActivity('Workspace Specialist', 'Backend acknowledged approval but did not provide verified draft data', 'error', 'GMAIL_DRAFT_NOT_VERIFIED');
        appendChatMessage({
          id: generateUniqueId('verification_err'), sender: 'specialist', specialistName: 'Workspace Specialist',
          text: '⚠ **Draft creation is not verified.** The backend response did not provide a verified Gmail draft ID, so Sylvia will not state that the draft exists in Gmail.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
    addActivity('Decision Partner', `Decision rule registered: \"${rule.slice(0, 60)}${rule.length > 60 ? '…' : ''}\"`, 'success');
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

  return {
    state: sylviaState, sylviaState, setSylviaState, setTemporaryState,
    activeView, setActiveView, chatMessages: messages, messages,
    mission: activeMission, activeMission, decisionDNA, contextMemories,
    specialists, gmailMessages, calendarEvents, pendingApprovals: approvalQueue, approvalQueue,
    activities, health, agentCard, activeDelegationPath: delegationPath, delegationPath, activeSpecialistNode,
    sendMessage, approveAction, cancelAction: cancelApproval, cancelApproval,
    updateMissionStepStatus: updateMissionStep, updateMissionStep, addDecisionRule, addContextMemory,
    runDemoSequence, refreshHealth: checkSystemHealth, checkSystemHealth, updateBackendUrl, addActivity,
  };
}
