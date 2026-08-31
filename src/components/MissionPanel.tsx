import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mission, MissionStepStatus } from '../types';
import {
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlayCircle,
  ArrowRight,
  Sparkles,
  Maximize2,
} from 'lucide-react';

interface MissionPanelProps {
  mission: Mission;
  onUpdateStepStatus: (stepId: string, status: MissionStepStatus) => void;
  onOpenFullMissionControl?: () => void;
}

export const MissionPanel: React.FC<MissionPanelProps> = ({
  mission,
  onUpdateStepStatus,
  onOpenFullMissionControl,
}) => {
  const getStatusIcon = (status: MissionStepStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'in_progress':
        return <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 animate-ping inline-block" />;
      case 'blocked':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'pending':
      default:
        return <span className="w-3.5 h-3.5 rounded-full border border-slate-600 inline-block" />;
    }
  };

  return (
    <div id="sylvia-mission-widget" className="p-4 space-y-4 text-xs select-none">
      {/* Header with Title & Fullscreen toggle */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/30">
              ACTIVE MISSION
            </span>
            <span className="text-[10px] font-mono-code text-amber-400 font-semibold">
              {mission.priority} PRIORITY
            </span>
          </div>
          <h3 className="text-sm font-display font-bold text-slate-100">{mission.title}</h3>
        </div>

        {onOpenFullMissionControl && (
          <button
            onClick={onOpenFullMissionControl}
            title="Expand Full Mission Control"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Objective */}
      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 font-sans">
        <div className="text-[10px] font-mono-code text-slate-400 uppercase mb-1">Objective</div>
        <p className="text-slate-200 leading-relaxed">{mission.objective}</p>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-1 text-[11px] font-mono-code">
          <span className="text-slate-400">Mission Progress</span>
          <span className="text-indigo-300 font-bold">{mission.progress}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
            style={{ width: `${mission.progress}%` }}
          />
        </div>
      </div>

      {/* Steps Checklist */}
      <div className="space-y-2">
        <div className="text-[10px] font-mono-code text-slate-400 uppercase">Sequenced Steps</div>
        <div className="space-y-1.5">
          {mission.steps.map(step => (
            <div
              key={step.id}
              className={`p-2.5 rounded-lg border transition-all ${
                step.status === 'in_progress'
                  ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-950/20'
                  : step.status === 'completed'
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
                  : 'bg-slate-950/30 border-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const nextStatus: MissionStepStatus =
                        step.status === 'completed'
                          ? 'pending'
                          : step.status === 'pending'
                          ? 'in_progress'
                          : 'completed';
                      onUpdateStepStatus(step.id, nextStatus);
                    }}
                    className="hover:scale-110 transition-transform"
                  >
                    {getStatusIcon(step.status)}
                  </button>

                  <div>
                    <div className="font-medium text-slate-200 flex items-center gap-1.5">
                      <span className="font-mono-code text-[11px] text-slate-400">{step.number}</span>
                      <span>{step.title}</span>
                    </div>
                  </div>
                </div>

                {step.specialist && (
                  <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-800">
                    {step.specialist}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Next Action Callout */}
      {mission.nextAction && (
        <div className="p-3 rounded-xl bg-gradient-to-tr from-indigo-950/70 to-slate-900 border border-indigo-500/30 text-xs">
          <div className="flex items-center gap-1.5 text-indigo-300 font-mono-code font-semibold text-[10px] uppercase mb-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Next Executive Action
          </div>
          <div className="text-slate-100 font-medium leading-relaxed">{mission.nextAction}</div>
        </div>
      )}
    </div>
  );
};
