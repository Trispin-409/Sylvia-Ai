import { useState, useEffect, useCallback, useRef } from 'react';
import {
  SylviaState, NavView, ChatItem, Mission, MissionStepStatus, DecisionDNA, ContextMemory,
  SpecialistAgent, GmailMessage, CalendarEvent, ApprovalRequest, ActivityEvent, BackendHealth,
  AgentCard,
} from '../types';
import { sylviaApi } from '../services/sylviaApi';
import {
  INITIAL_DECISION_DNA, INITIAL_CONTEXT_MEMORIES, INITIAL_MISSION, INITIAL_SPECIALISTS,
  INITIAL_GMAIL_MESSAGES, INITIAL_CALENDAR_EVENTS, INITIAL_APPROVAL_REQUEST, INITIAL_ACTIVITIES,
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
    text: "Greetings. I am **Sylvia**, your collaborative digital operator.\n\nI am synchronized with your **Decision DNA**, **Context Memory**, and **Google Workspace**. I deconstruct complex goals into executable missions and coordinate our specialist agents.\n\nHow can we advance your objectives today?",
    timestamp: 'Just now',
  }]);
  const [activeMission, setActiveMission] = useState<Mission>(INITIAL_MISSION);
  const [decisionDNA, setDecisionDNA] = useState<DecisionDNA>(INITIAL_DECISION_DNA);
  const [contextMemories, setContextMemories] = useState<ContextMemory[]>(INITIAL_CONTEXT_MEMORIES);
  const [specialists, setSpecialists] = useState<SpecialistAgent[]>(INITIAL_SPECIALISTS);
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>(INITIAL_GMAIL_MESSAGES);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(INITIAL_CALENDAR_EVENTS);
  const [approvalQueue, setApprovalQueue] = useState<ApprovalRequest[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>(INITIAL_ACTIVITIES);
  const [agentCard, setAgentCard] = useState<AgentCard | null>(null);
  const [health, setHealth] = useState<BackendHealth>({ connected: false, status: 'offline', backendUrl: sylviaApi.getBaseUrl(), lastChecked: new Date().toISOString(), adkConnected: false, isDemoMode: true });
  const [delegationPath, setDelegationPath] = useState<string[]>([]);
  const [activeSpecialistNode, setActiveSpecialistNode] = useState<string | null>(null);
  const stateResetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handledApprovalsRef = useRef<Set<string>>(new Set());

  const addActivity = useCallback((agent: string, action: string, status: ActivityEvent['status'], tool?: string, details?: string) => {
    setActivities(prev => [{ id: generateUniqueId('act'), timestamp: 'Just now', agent, action, status, tool, details }, ...prev.slice(0, 49)]);
  }, []);

  const checkSystemHealth = useCallback(async () => {
    try {
      const healthResult = await sylviaApi.checkHealth();
      setHealth(healthResult);
      setAgentCard(await sylviaApi.getAgentCard());
      if (healthResult.connected) addActivity('Sylvia Core', 'Connected to live Python ADK server at ' + healthResult.backendUrl, 'success');
    } catch (e) { console.warn('Backend health query failed:', e); }
  }, [addActivity]);

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 20000);
    return () => clearInterval(interval);
  }, [checkSystemHealth]);

  const setTemporaryState = useCallback((state: SylviaState, durationMs = 4000) => {
    if (stateResetTimerRef.current) clearTimeout(stateResetTimerRef.current);
    setSylviaState(state);
    if (state !== 'IDLE' && state !== 'WAITING_FOR_APPROVAL') stateResetTimerRef.current = setTimeout(() => setSylviaState('IDLE'), durationMs);
  }, []);

  const appendChatMessage = useCallback((msg: ChatItem) => {
    setMessages(prev => prev.some(existing => existing.id === msg.id) ? [...prev, { ...msg, id: generateUniqueId('msg') }] : [...prev, msg]);
  }, []);

  const sendMessage = useCallback(async (text: string, onSpeechResponse?: (reply: string) => void) => {
    if (!text.trim()) return;
    appendChatMessage({ id: generateUniqueId('user'), sender: 'user', text: text.trim(), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    setSylviaState('THINKING');
    addActivity('Sylvia Root Agent', `Dispatching goal to Google ADK: "${text.slice(0, 50)}..."`, 'working');
    const lower = text.toLowerCase();
    setTimeout(() => {
      setSylviaState('ANALYZING');
      if (lower.includes('email') || lower.includes('gmail') || lower.includes('calendar')) {
        setDelegationPath(['sylvia_core', 'workspace_specialist']); setActiveSpecialistNode('workspace_specialist');
        addActivity('Workspace Specialist', 'Accessing Google Workspace ADK tool interfaces', 'working', 'WORKSPACE_TOOL');
      } else if (lower.includes('mission') || lower.includes('goal') || lower.includes('task')) {
        setDelegationPath(['sylvia_core', 'action_planner']); setActiveSpecialistNode('action_planner');
        addActivity('Action Planner', 'Synthesizing mission milestones in ADK', 'working', 'PLANNER_TOOL');
      } else {
        setDelegationPath(['sylvia_core', 'context_analyst']); setActiveSpecialistNode('context_analyst');
        addActivity('Context Analyst', 'Evaluating Decision DNA & Firestore memory in ADK', 'info', 'MEMORY_LOOKUP');
      }
    }, 400);

    try {
      const response = await sylviaApi.sendA2AMessage(text);
      const assistantText = response.reply || 'Task evaluated and synchronized with Google ADK Sylvia backend.';
      const specialistName = response.specialist || 'Sylvia';
      setDelegationPath([]); setActiveSpecialistNode(null);
      const toolExec = response.toolExecutions?.[0];
      if (toolExec) addActivity(specialistName, `Executed ADK tool: ${toolExec.action}`, 'success', toolExec.action);
      const pendingApproval = response.approvalRequest;
      if (pendingApproval) {
        setSylviaState('WAITING_FOR_APPROVAL'); setApprovalQueue(prev => [pendingApproval, ...prev]);
        addActivity('Sylvia Gate', `Human authorization required for ${pendingApproval.title}`, 'waiting_approval', 'APPROVAL_GATE');
      } else { setSylviaState('COMPLETED'); setTimeout(() => setSylviaState('IDLE'), 3000); }
      appendChatMessage({ id: generateUniqueId('reply'), sender: specialistName.toLowerCase() === 'sylvia' ? 'sylvia' : 'specialist', specialistName: specialistName.toLowerCase() === 'sylvia' ? undefined : specialistName, text: assistantText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), toolExecution: toolExec, approvalRequest: pendingApproval });
      if (onSpeechResponse) onSpeechResponse(assistantText);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setSylviaState('ERROR'); setDelegationPath([]); setActiveSpecialistNode(null);
      appendChatMessage({ id: generateUniqueId('err'), sender: 'sylvia', text: `ADK Communication Notice: ${errorMsg}`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
      addActivity('System Alert', errorMsg, 'error'); setTimeout(() => setSylviaState('IDLE'), 4000);
    }
  }, [addActivity, appendChatMessage]);

  const approveAction = useCallback(async (approvalId: string) => {
    if (handledApprovalsRef.current.has(approvalId)) return;
    handledApprovalsRef.current.add(approvalId);
    setSylviaState('WORKING');
    addActivity('Human Operator', `Explicit authorization granted for Approval ${approvalId}`, 'success', 'APPROVAL_GRANTED');
    const result = await sylviaApi.submitApproval(approvalId, 'APPROVED');

    if (!result.success) {
      setSylviaState('ERROR');
      setApprovalQueue(prev => prev.map(appr => appr.id === approvalId ? { ...appr, status: 'WAITING' } : appr));
      setMessages(prev => prev.map(m => m.approvalRequest?.id === approvalId ? { ...m, approvalRequest: { ...m.approvalRequest, status: 'WAITING' } } : m));
      addActivity('Workspace Specialist', 'Approval reached ADK, but no real Gmail tool execution was reported. Draft NOT verified.', 'error', 'GMAIL_DRAFT_NOT_VERIFIED', result.error);
      appendChatMessage({ id: generateUniqueId('approval_err'), sender: 'specialist', specialistName: 'Workspace Specialist', text: `⚠ **Draft not verified.** The live ADK response did not report a Gmail tool execution, so Sylvia will not claim that a Gmail draft was created.\n\nADK response: ${result.reply || result.error || 'No confirmation returned.'}`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
      setTimeout(() => setSylviaState('IDLE'), 5000);
      return;
    }

    setApprovalQueue(prev => prev.map(appr => appr.id === approvalId ? { ...appr, status: 'APPROVED' } : appr));
    setMessages(prev => prev.map(m => m.approvalRequest?.id === approvalId ? { ...m, approvalRequest: { ...m.approvalRequest, status: 'APPROVED' } } : m));
    const toolExec = result.toolExecutions.find(tool => tool.toolName === 'GMAIL');
    addActivity('Workspace Specialist', 'Gmail draft creation reported by live ADK', 'success', 'GMAIL_DRAFT_CREATED', toolExec?.action);
    appendChatMessage({ id: generateUniqueId('conf'), sender: 'specialist', specialistName: 'Workspace Specialist', text: `✓ **Human Approval Confirmed**\n\nThe live ADK backend reported a Gmail tool execution for this approval.\n\n${result.reply || 'Gmail draft action completed.'}\n\n**Verified at the A2A response level.**`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), toolExecution: toolExec });
    setSylviaState('COMPLETED'); setTimeout(() => setSylviaState('IDLE'), 3000);
  }, [addActivity, appendChatMessage]);

  const cancelApproval = useCallback(async (approvalId: string) => {
    if (handledApprovalsRef.current.has(approvalId)) return;
    handledApprovalsRef.current.add(approvalId);
    setSylviaState('IDLE');
    setApprovalQueue(prev => prev.map(appr => appr.id === approvalId ? { ...appr, status: 'CANCELLED' } : appr));
    setMessages(prev => prev.map(m => m.approvalRequest?.id === approvalId ? { ...m, approvalRequest: { ...m.approvalRequest, status: 'CANCELLED' } } : m));
    const result = await sylviaApi.submitApproval(approvalId, 'CANCELLED');
    addActivity('Human Operator', `Approval ${approvalId} cancelled by user`, 'info', 'APPROVAL_CANCELLED');
    if (!result.success) addActivity('System Alert', 'Cancellation could not be confirmed by the live ADK backend.', 'error', 'APPROVAL_CANCEL_FAILED', result.error);
    appendChatMessage({ id: generateUniqueId('canc'), sender: 'sylvia', text: result.success ? 'Write action aborted per your instruction. No changes were made to your Google Workspace account.' : `⚠ Cancellation could not be confirmed by the live ADK backend: ${result.error || result.reply}`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
  }, [addActivity, appendChatMessage]);

  const updateMissionStep = useCallback((stepId: string, status: MissionStepStatus) => {
    setActiveMission(prev => {
      const updatedSteps = prev.steps.map(step => step.id === stepId ? { ...step, status } : step);
      const completedCount = updatedSteps.filter(s => s.status === 'completed').length;
      return { ...prev, steps: updatedSteps, progress: Math.round((completedCount / updatedSteps.length) * 100), updatedAt: new Date().toISOString() };
    });
    addActivity('Action Planner', `Step updated: ${stepId} marked as ${status.toUpperCase()}`, 'info', 'MISSION_STEP_UPDATE');
  }, [addActivity]);

  const addDecisionRule = useCallback((rule: string) => {
    if (!rule.trim()) return;
    setDecisionDNA(prev => ({ ...prev, decisionRules: [...prev.decisionRules, rule.trim()] }));
    addActivity('Decision Partner', `New decision rule registered in Decision DNA: "${rule.slice(0, 40)}..."`, 'success');
  }, [addActivity]);

  const addContextMemory = useCallback((key: string, summary: string, details: string, category: ContextMemory['category']) => {
    const newMemory: ContextMemory = { id: generateUniqueId('mem'), key: key.toUpperCase().replace(/\s+/g, '_'), summary, details, category, confidence: 0.98, createdAt: new Date().toISOString() };
    setContextMemories(prev => [newMemory, ...prev]); addActivity('Context Analyst', `Context memory stored: [${key}]`, 'success', 'MEMORY_SAVE');
  }, [addActivity]);

  const updateBackendUrl = useCallback((newUrl: string) => { sylviaApi.setBaseUrl(newUrl); checkSystemHealth(); }, [checkSystemHealth]);

  const runDemoSequence = useCallback(() => {
    setActiveView('specialists'); setSylviaState('THINKING'); setDelegationPath(['sylvia_core']); addActivity('Sylvia Core', 'Beginning multi-agent delegation sequence', 'working');
    setTimeout(() => { setSylviaState('ANALYZING'); setDelegationPath(['sylvia_core', 'context_analyst']); setActiveSpecialistNode('context_analyst'); addActivity('Context Analyst', 'Retrieving historical context & invoices', 'working', 'MEMORY_LOOKUP'); }, 1200);
    setTimeout(() => { setSylviaState('WORKING'); setDelegationPath(['sylvia_core', 'context_analyst', 'decision_partner']); setActiveSpecialistNode('decision_partner'); addActivity('Decision Partner', 'Evaluating against Decision DNA Rule 01', 'working', 'DNA_EVALUATION'); }, 2800);
    setTimeout(() => { setSylviaState('WORKING'); setDelegationPath(['sylvia_core', 'context_analyst', 'decision_partner', 'action_planner']); setActiveSpecialistNode('action_planner'); addActivity('Action Planner', 'Deconstructing goal into 5 phased roadmap steps', 'working', 'MISSION_PLAN'); }, 4400);
    setTimeout(() => { setSylviaState('WAITING_FOR_APPROVAL'); setDelegationPath(['sylvia_core', 'context_analyst', 'decision_partner', 'action_planner', 'workspace_specialist']); setActiveSpecialistNode('workspace_specialist'); addActivity('Workspace Specialist', 'Draft prepared. Paused for Human Operator authorization.', 'waiting_approval', 'GMAIL_DRAFT'); }, 6000);
  }, [setActiveView, addActivity]);

  return {
    state: sylviaState, sylviaState, setSylviaState, setTemporaryState, activeView, setActiveView,
    chatMessages: messages, messages, mission: activeMission, activeMission, decisionDNA, contextMemories,
    specialists, gmailMessages, calendarEvents, pendingApprovals: approvalQueue, approvalQueue, activities,
    health, agentCard, activeDelegationPath: delegationPath, delegationPath, activeSpecialistNode,
    sendMessage, approveAction, cancelAction: cancelApproval, cancelApproval,
    updateMissionStepStatus: updateMissionStep, updateMissionStep, addDecisionRule, addContextMemory,
    runDemoSequence, refreshHealth: checkSystemHealth, checkSystemHealth, updateBackendUrl, addActivity,
  };
}
