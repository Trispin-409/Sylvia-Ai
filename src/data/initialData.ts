import {
  DecisionDNA,
  ContextMemory,
  Mission,
  SpecialistAgent,
} from '../types';

export const INITIAL_DECISION_DNA: DecisionDNA = {
  goals: [],
  priorities: [],
  constraints: [],
  preferences: {},
  workingStyle: [],
  decisionRules: [],
};

// Personal context must come from the real user and the persistent ADK memory tools.
// Do not seed fictitious employers, contacts, achievements, or preferences.
export const INITIAL_CONTEXT_MEMORIES: ContextMemory[] = [];

// The UI starts honestly when it has not yet loaded a verified persistent mission.
// A mission returned by the live ADK backend replaces this empty state.
export const INITIAL_MISSION: Mission = {
  id: 'no-active-mission',
  title: 'No active mission loaded',
  objective: 'Create or retrieve a mission through Sylvia to display verified persistent work here.',
  status: 'NOT_STARTED',
  priority: 'UNSPECIFIED',
  progress: 0,
  nextAction: 'Open Career Bridge or Console Stream to start a real mission.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  steps: [],
};

export const INITIAL_SPECIALISTS: SpecialistAgent[] = [
  {
    id: 'sylvia_core',
    name: 'Sylvia',
    role: 'Collaborative Digital Operator',
    status: 'active',
    description: 'Central orchestrator, goal comprehension, multi-agent coordination, and high-level decisions',
    iconName: 'Sparkles',
    connected: true,
    skills: ['start_mission', 'get_decision_dna', 'coordinate_specialists', 'manage_human_approval'],
    position: { x: 50, y: 50 },
  },
  {
    id: 'context_analyst',
    name: 'Context Analyst',
    role: 'Situational & Context Memory Specialist',
    status: 'online',
    description: 'Maintains long-term memory, analyzes situational records, and retrieves past precedents',
    iconName: 'Brain',
    connected: true,
    skills: ['get_context_memory', 'save_context_memory', 'list_context_memories', 'context_health_check'],
    position: { x: 22, y: 28 },
  },
  {
    id: 'decision_partner',
    name: 'Decision Partner',
    role: 'Strategic Evaluation & Trade-off Engine',
    status: 'online',
    description: 'Weighs decision trade-offs, validates constraints against Decision DNA, and calculates risk',
    iconName: 'Scale',
    connected: true,
    skills: ['get_decision_dna', 'save_preference', 'evaluate_tradeoffs', 'calculate_risk_score'],
    position: { x: 78, y: 28 },
  },
  {
    id: 'action_planner',
    name: 'Action Planner',
    role: 'Execution & Milestone Sequencer',
    status: 'online',
    description: 'Translates high-level strategic goals into actionable 5-step executable mission roadmaps',
    iconName: 'GitBranch',
    connected: true,
    skills: ['add_mission_step', 'update_mission_step', 'get_current_mission', 'optimize_critical_path'],
    position: { x: 22, y: 72 },
  },
  {
    id: 'workspace_specialist',
    name: 'Workspace Specialist',
    role: 'Google Workspace Operator',
    status: 'online',
    description: 'Reads and executes approved operations across Gmail and Google Calendar',
    iconName: 'Mail',
    connected: false,
    skills: ['read_gmail', 'prepare_gmail_draft', 'check_calendar', 'propose_calendar_event'],
    position: { x: 78, y: 72 },
  },
  {
    id: 'coding_agent',
    name: 'Coding Agent',
    role: 'Autonomous Software Engineering',
    status: 'coming_next',
    description: 'Specialist for writing unit tests, refactoring backend microservices, and PR review',
    iconName: 'Code',
    connected: false,
    skills: ['code_generation', 'repo_inspection', 'test_execution'],
    position: { x: 50, y: 15 },
  },
  {
    id: 'career_agent',
    name: 'Career Agent',
    role: 'Executive Talent & Opportunity Scout',
    status: 'coming_next',
    description: 'Specialist for tracking industry networks, advisory roles, and executive opportunities',
    iconName: 'Briefcase',
    connected: false,
    skills: ['track_market_roles', 'resume_optimization', 'network_reach'],
    position: { x: 50, y: 85 },
  },
];
