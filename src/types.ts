export type SylviaState =
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'ANALYZING'
  | 'WORKING'
  | 'WAITING_FOR_APPROVAL'
  | 'COMPLETED'
  | 'ERROR';

export type NavView =
  | 'chat'
  | 'specialists'
  | 'missions'
  | 'memory'
  | 'workspace-gmail'
  | 'workspace-calendar'
  | 'activity'
  | 'mission-control';

export interface A2APart {
  kind?: 'text' | 'data' | string;
  text?: string;
  type?: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface A2AMessage {
  messageId: string;
  role: 'user' | 'assistant' | 'system' | 'specialist';
  parts: A2APart[];
  timestamp?: string;
  agent?: string;
}

export interface A2ARequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params: {
    message: {
      messageId: string;
      role: 'user' | 'assistant' | 'system';
      parts: A2APart[];
    };
    contextId?: string;
    taskId?: string;
  };
}

export interface A2AArtifact {
  id: string;
  type: string;
  name?: string;
  content: unknown;
  mimeType?: string;
}

export interface A2AResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: {
    status?: string | Record<string, unknown>;
    contextId?: string;
    taskId?: string;
    id?: string;
    message?: A2AMessage;
    artifacts?: A2AArtifact[];
    history?: A2AMessage[];
    metadata?: Record<string, unknown>;
  };
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface AgentSkill {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
  examples?: string[];
}

export interface AgentCard {
  name: string;
  description: string;
  version: string;
  protocolVersion?: string;
  skills: AgentSkill[] | string[];
  capabilities?: string[];
  author?: string;
  url?: string;
}

export interface SpecialistAgent {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'active' | 'idle' | 'coming_next';
  description: string;
  iconName: string;
  connected: boolean;
  skills: string[];
  position: { x: number; y: number };
}

export type MissionStepStatus = 'completed' | 'in_progress' | 'pending' | 'blocked';

export interface MissionStep {
  id: string;
  number: string;
  title: string;
  description?: string;
  status: MissionStepStatus;
  specialist?: string;
  actionRequired?: boolean;
}

export interface Mission {
  id: string;
  title: string;
  objective: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  progress: number;
  steps: MissionStep[];
  nextAction: string;
  createdAt: string;
  updatedAt: string;
}

export interface DecisionDNA {
  goals: string[];
  priorities: string[];
  constraints: string[];
  preferences: Record<string, string>;
  workingStyle: string[];
  decisionRules: string[];
}

export interface ContextMemory {
  id: string;
  key: string;
  summary: string;
  details?: string;
  category: 'BUSINESS' | 'PREFERENCE' | 'DECISION' | 'TECHNICAL' | 'CONTACT';
  confidence?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ApprovalRequest {
  id: string;
  actionType: 'GMAIL_DRAFT' | 'GMAIL_SEND' | 'CALENDAR_CREATE' | 'WORKSPACE_WRITE';
  title: string;
  description: string;
  recipient?: string;
  subject?: string;
  bodyPreview?: string;
  scheduledTime?: string;
  status: 'WAITING' | 'APPROVED' | 'CANCELLED';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  metadata?: Record<string, unknown>;
  confirmationCallId?: string;
  confirmationName?: string;
  originalFunctionCallId?: string;
  confirmationPayload?: Record<string, unknown>;
  taskId?: string;
  createdAt: string;
}

export interface GmailMessage {
  id: string;
  threadId?: string;
  messageId?: string;
  sender: string;
  senderEmail: string;
  subject: string;
  preview: string;
  body?: string;
  date: string;
  unread: boolean;
  requiresReply?: boolean;
  labels?: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  calendarName: string;
  durationMinutes: number;
  attendees?: string[];
  period: 'today' | 'tomorrow' | 'upcoming';
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  status: 'success' | 'working' | 'waiting_approval' | 'info' | 'error';
  details?: string;
  tool?: string;
}

export interface ToolExecution {
  id: string;
  toolName: 'GMAIL' | 'CALENDAR' | 'MISSION' | 'MEMORY' | 'APPROVAL' | 'SPECIALIST';
  action: string;
  status: 'running' | 'completed' | 'waiting' | 'failed';
  result?: string;
  details?: Record<string, unknown>;
}

export interface GmailDraftResult {
  success: boolean;
  verified: boolean;
  draftId?: string;
  messageId?: string;
  threadId?: string;
  recipient?: string;
  subject?: string;
  error?: string;
}

export interface ApprovalResult {
  success: boolean;
  decision: 'APPROVED' | 'CANCELLED';
  reply: string;
  toolExecutions: ToolExecution[];
  draft?: GmailDraftResult;
  rawAdkResult?: unknown;
  error?: string;
}

export interface ChatItem {
  id: string;
  sender: 'user' | 'sylvia' | 'specialist';
  specialistName?: string;
  text: string;
  timestamp: string;
  toolExecution?: ToolExecution;
  approvalRequest?: ApprovalRequest;
}

export interface BackendHealth {
  connected: boolean;
  status: 'ok' | 'degraded' | 'offline';
  backendUrl: string;
  latencyMs?: number;
  lastChecked: string;
  adkConnected: boolean;
  a2aVersion?: string;
  error?: string;
  isDemoMode?: boolean;
}
