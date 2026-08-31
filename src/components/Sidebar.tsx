import React from 'react';
import {
  MessageSquare,
  Sparkles,
  Target,
  History,
  Dna,
  Brain,
  Network,
  Scale,
  GitBranch,
  Mail,
  Calendar as CalendarIcon,
  Activity,
  Cpu,
  Layers,
  Code,
  Briefcase,
  Sliders,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { NavView, BackendHealth } from '../types';

interface SidebarProps {
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  health: BackendHealth;
  onOpenDiagnostics: () => void;
  pendingApprovalsCount?: number;
  onNewConversation: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  health,
  onOpenDiagnostics,
  pendingApprovalsCount = 0,
  onNewConversation,
}) => {
  return (
    <aside
      id="sylvia-navigation-sidebar"
      aria-label="Sylvia Command Sidebar"
      className="w-64 h-full flex flex-col glass-panel border-r border-slate-800/80 bg-slate-950/70 backdrop-blur-xl z-20 select-none"
    >
      {/* Top Header & New Conversation */}
      <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-sm tracking-wider text-slate-100 flex items-center gap-1.5">
              SYLVIA <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">A2A</span>
            </div>
            <div className="text-[11px] text-slate-400 font-sans">Autonomous Operator</div>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="p-3">
        <button
          id="btn-new-conversation"
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 text-xs font-medium transition-all shadow-sm group"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-12 transition-transform" />
          <span>New Session</span>
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-5 text-xs">
        {/* COMMAND */}
        <div>
          <div className="px-2 mb-1.5 text-[10px] font-mono-code font-semibold tracking-wider text-slate-400 uppercase">
            COMMAND
          </div>
          <div className="space-y-0.5">
            <button
              id="nav-chat"
              onClick={() => setActiveView('chat')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-left ${
                activeView === 'chat'
                  ? 'bg-indigo-900/40 text-indigo-100 border border-indigo-500/30 font-medium'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>Console Stream</span>
              </div>
              {pendingApprovalsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-amber-500/30 text-amber-300 border border-amber-500/50 animate-pulse">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>

            <button
              id="nav-specialists-map"
              onClick={() => setActiveView('specialists')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-left ${
                activeView === 'specialists'
                  ? 'bg-indigo-900/40 text-indigo-100 border border-indigo-500/30 font-medium'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Network className="w-4 h-4 text-cyan-400" />
                <span>Specialist Constellation</span>
              </div>
              <span className="text-[10px] text-cyan-300/80 font-mono-code">4 Live</span>
            </button>
          </div>
        </div>

        {/* MISSIONS */}
        <div>
          <div className="px-2 mb-1.5 text-[10px] font-mono-code font-semibold tracking-wider text-slate-400 uppercase">
            MISSIONS
          </div>
          <div className="space-y-0.5">
            <button
              id="nav-mission-control"
              onClick={() => setActiveView('mission-control')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-left ${
                activeView === 'mission-control'
                  ? 'bg-indigo-900/40 text-indigo-100 border border-indigo-500/30 font-medium'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Target className="w-4 h-4 text-amber-400" />
                <span>Mission Control</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            <button
              id="nav-missions-list"
              onClick={() => setActiveView('missions')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-left ${
                activeView === 'missions'
                  ? 'bg-indigo-900/40 text-indigo-100 border border-indigo-500/30 font-medium'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <History className="w-4 h-4 text-slate-400" />
                <span>Mission Ledger</span>
              </div>
            </button>
          </div>
        </div>

        {/* MEMORY & DECISION DNA */}
        <div>
          <div className="px-2 mb-1.5 text-[10px] font-mono-code font-semibold tracking-wider text-slate-400 uppercase">
            MEMORY & IDENTITY
          </div>
          <div className="space-y-0.5">
            <button
              id="nav-decision-dna"
              onClick={() => setActiveView('memory')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-left ${
                activeView === 'memory'
                  ? 'bg-indigo-900/40 text-indigo-100 border border-indigo-500/30 font-medium'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Dna className="w-4 h-4 text-purple-400" />
                <span>Decision DNA</span>
              </div>
              <span className="text-[10px] font-mono-code text-purple-300/80">Active</span>
            </button>
          </div>
        </div>

        {/* SPECIALIST DIRECTORY */}
        <div>
          <div className="px-2 mb-1.5 text-[10px] font-mono-code font-semibold tracking-wider text-slate-400 uppercase">
            SPECIALIST FLEET
          </div>
          <div className="space-y-0.5">
            <div className="px-2.5 py-1.5 flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-indigo-400" />
                <span>Context Analyst</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono-code">Online</span>
            </div>

            <div className="px-2.5 py-1.5 flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <Scale className="w-3.5 h-3.5 text-purple-400" />
                <span>Decision Partner</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono-code">Online</span>
            </div>

            <div className="px-2.5 py-1.5 flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                <span>Action Planner</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono-code">Online</span>
            </div>

            <div className="px-2.5 py-1.5 flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>Workspace Specialist</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono-code">Online</span>
            </div>

            {/* Coming next agents - Not faked */}
            <div className="px-2.5 py-1.5 flex items-center justify-between text-slate-400 opacity-60">
              <div className="flex items-center gap-2">
                <Code className="w-3.5 h-3.5 text-slate-400" />
                <span>Coding Agent</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono-code">Coming next</span>
            </div>

            <div className="px-2.5 py-1.5 flex items-center justify-between text-slate-400 opacity-60">
              <div className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>Career Agent</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono-code">Coming next</span>
            </div>
          </div>
        </div>

        {/* WORKSPACE */}
        <div>
          <div className="px-2 mb-1.5 text-[10px] font-mono-code font-semibold tracking-wider text-slate-400 uppercase">
            WORKSPACE INTEGRATION
          </div>
          <div className="space-y-0.5">
            <button
              id="nav-workspace-gmail"
              onClick={() => setActiveView('workspace-gmail')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-left ${
                activeView === 'workspace-gmail'
                  ? 'bg-indigo-900/40 text-indigo-100 border border-indigo-500/30 font-medium'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-rose-400" />
                <span>Gmail Inbox</span>
              </div>
              <span className="text-[10px] font-mono-code text-rose-300/80">3 Unread</span>
            </button>

            <button
              id="nav-workspace-calendar"
              onClick={() => setActiveView('workspace-calendar')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-left ${
                activeView === 'workspace-calendar'
                  ? 'bg-indigo-900/40 text-indigo-100 border border-indigo-500/30 font-medium'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-4 h-4 text-sky-400" />
                <span>Calendar Schedule</span>
              </div>
              <span className="text-[10px] font-mono-code text-sky-300/80">2 Today</span>
            </button>
          </div>
        </div>

        {/* SYSTEM */}
        <div>
          <div className="px-2 mb-1.5 text-[10px] font-mono-code font-semibold tracking-wider text-slate-400 uppercase">
            SYSTEM & TELEMETRY
          </div>
          <div className="space-y-0.5">
            <button
              id="nav-activity-feed"
              onClick={() => setActiveView('activity')}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-colors text-left ${
                activeView === 'activity'
                  ? 'bg-indigo-900/40 text-indigo-100 border border-indigo-500/30 font-medium'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Activity Feed</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Health & Diagnostics Banner */}
      <div className="p-3 border-t border-slate-800/60 bg-slate-950/40">
        <button
          id="btn-open-diagnostics"
          onClick={onOpenDiagnostics}
          className="w-full p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 border border-slate-800/90 flex items-center justify-between text-left transition-all group"
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${health.connected ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'}`} />
            <div>
              <div className="text-[11px] font-mono-code font-semibold text-slate-200 group-hover:text-indigo-300">
                {health.connected ? 'ADK Online' : 'Diagnostics & A2A'}
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                {health.backendUrl.replace('http://', '')}
              </div>
            </div>
          </div>
          <Sliders className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-300" />
        </button>
      </div>
    </aside>
  );
};
