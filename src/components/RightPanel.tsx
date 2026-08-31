import React, { useState } from 'react';
import { Mission, DecisionDNA, ContextMemory, ActivityEvent, MissionStepStatus } from '../types';
import { MissionPanel } from './MissionPanel';
import { MemoryPanel } from './MemoryPanel';
import { ActivityFeed } from './ActivityFeed';
import { Target, Brain, Activity, X } from 'lucide-react';

interface RightPanelProps {
  mission: Mission;
  decisionDNA: DecisionDNA;
  contextMemories: ContextMemory[];
  activities: ActivityEvent[];
  onUpdateStepStatus: (stepId: string, status: MissionStepStatus) => void;
  onAddDecisionRule: (rule: string) => void;
  onAddContextMemory: (key: string, summary: string, details: string, category: ContextMemory['category']) => void;
  onOpenFullMissionControl: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  mission,
  decisionDNA,
  contextMemories,
  activities,
  onUpdateStepStatus,
  onAddDecisionRule,
  onAddContextMemory,
  onOpenFullMissionControl,
}) => {
  const [activeTab, setActiveTab] = useState<'mission' | 'memory' | 'activity'>('mission');

  return (
    <div
      id="sylvia-right-intelligence-panel"
      className="w-80 lg:w-96 h-full glass-panel border-l border-slate-800/80 bg-slate-950/70 backdrop-blur-xl flex flex-col z-20 select-none"
    >
      {/* Tab Switcher Header */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1 w-full bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            id="tab-mission"
            onClick={() => setActiveTab('mission')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono-code font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'mission'
                ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Mission</span>
          </button>

          <button
            id="tab-memory"
            onClick={() => setActiveTab('memory')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono-code font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'memory'
                ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Memory</span>
          </button>

          <button
            id="tab-activity"
            onClick={() => setActiveTab('activity')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono-code font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'activity'
                ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Activity</span>
          </button>
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'mission' && (
          <MissionPanel
            mission={mission}
            onUpdateStepStatus={onUpdateStepStatus}
            onOpenFullMissionControl={onOpenFullMissionControl}
          />
        )}

        {activeTab === 'memory' && (
          <MemoryPanel
            decisionDNA={decisionDNA}
            contextMemories={contextMemories}
            onAddDecisionRule={onAddDecisionRule}
            onAddContextMemory={onAddContextMemory}
          />
        )}

        {activeTab === 'activity' && <ActivityFeed activities={activities} />}
      </div>
    </div>
  );
};
