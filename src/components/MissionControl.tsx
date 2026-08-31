import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mission, MissionStepStatus } from '../types';
import {
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  ArrowLeft,
  Play,
  Layers,
  Brain,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface MissionControlProps {
  mission: Mission;
  onClose: () => void;
  onUpdateStepStatus: (stepId: string, status: MissionStepStatus) => void;
}

export const MissionControl: React.FC<MissionControlProps> = ({
  mission,
  onClose,
  onUpdateStepStatus,
}) => {
  const completedCount = mission.steps.filter(s => s.status === 'completed').length;
  const inProgressCount = mission.steps.filter(s => s.status === 'in_progress').length;
  const pendingCount = mission.steps.filter(s => s.status === 'pending').length;

  return (
    <div
      id="sylvia-fullscreen-mission-control"
      className="relative w-full h-full flex flex-col p-6 md:p-10 overflow-y-auto z-30 select-none"
    >
      {/* Top Bar with Return Button */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800/80">
        <div className="flex items-center gap-4">
          <button
            id="btn-close-mission-control"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Workspace</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono-code font-bold tracking-widest text-indigo-400 uppercase">
                MISSION CONTROL PROTOCOL
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-code bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                ACTIVE PHASE
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-100 mt-0.5">
              {mission.title}
            </h1>
          </div>
        </div>

        {/* Priority Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-300 font-mono-code text-xs">
          <Target className="w-4 h-4 text-amber-400" />
          <span>{mission.priority} PRIORITY DIRECTIVE</span>
        </div>
      </div>

      {/* Main Grid Layout: Left Overview + Circular Progress, Right Steps Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Column: Objective, Progress Ring, and Specialist Pipeline */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mission Objective Card */}
          <div className="glass-panel-elevated p-6 rounded-2xl border border-slate-800">
            <div className="text-xs font-mono-code text-slate-400 uppercase tracking-wider mb-2">
              Strategic Objective
            </div>
            <p className="text-base text-slate-100 font-sans leading-relaxed">
              "{mission.objective}"
            </p>
          </div>

          {/* Circular Progress & Metric Rings */}
          <div className="glass-panel-elevated p-6 rounded-2xl border border-slate-800 flex items-center justify-around">
            {/* SVG Progress Ring */}
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  stroke="#818cf8"
                  strokeWidth="8"
                  strokeDasharray={326.7}
                  strokeDashoffset={326.7 - (326.7 * mission.progress) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-display font-bold text-slate-100">
                  {mission.progress}%
                </span>
                <span className="text-[10px] font-mono-code text-slate-400">Complete</span>
              </div>
            </div>

            {/* Counts Breakdown */}
            <div className="space-y-3 font-mono-code text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-300">{completedCount} Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-slate-300">{inProgressCount} In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                <span className="text-slate-400">{pendingCount} Pending</span>
              </div>
            </div>
          </div>

          {/* Next Executive Action Banner */}
          {mission.nextAction && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/40 shadow-xl shadow-indigo-950/30">
              <div className="flex items-center gap-2 text-indigo-300 font-mono-code text-xs font-bold uppercase mb-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Next Executive Action
              </div>
              <p className="text-sm text-slate-100 font-medium leading-relaxed">
                {mission.nextAction}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Sequenced Steps Timeline */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono-code font-bold tracking-wider text-slate-300 uppercase">
              Mission Phase Roadmap
            </h3>
            <span className="text-xs text-slate-400">Click step checkbox to toggle status</span>
          </div>

          <div className="space-y-3">
            {mission.steps.map(step => {
              const isCompleted = step.status === 'completed';
              const isInProgress = step.status === 'in_progress';
              const isBlocked = step.status === 'blocked';

              return (
                <motion.div
                  key={step.id}
                  layout
                  className={`p-4 rounded-xl border transition-all ${
                    isInProgress
                      ? 'glass-panel-elevated border-cyan-500/50 shadow-xl shadow-cyan-950/20'
                      : isCompleted
                      ? 'bg-slate-950/50 border-slate-800/80 opacity-90'
                      : isBlocked
                      ? 'bg-rose-950/30 border-rose-500/40'
                      : 'bg-slate-950/30 border-slate-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3.5">
                      {/* Interactive Status Toggle */}
                      <button
                        onClick={() => {
                          const next: MissionStepStatus =
                            step.status === 'completed'
                              ? 'pending'
                              : step.status === 'pending'
                              ? 'in_progress'
                              : 'completed';
                          onUpdateStepStatus(step.id, next);
                        }}
                        className="mt-0.5 hover:scale-110 transition-transform"
                      >
                        {isCompleted && (
                          <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-400 flex items-center justify-center text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                        {isInProgress && (
                          <div className="w-6 h-6 rounded-full bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                          </div>
                        )}
                        {!isCompleted && !isInProgress && !isBlocked && (
                          <div className="w-6 h-6 rounded-full border border-slate-700 bg-slate-900/60" />
                        )}
                        {isBlocked && (
                          <div className="w-6 h-6 rounded-full bg-rose-950 border border-rose-500 flex items-center justify-center text-rose-400">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                        )}
                      </button>

                      {/* Step Details */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-code font-bold text-xs text-indigo-400">
                            {step.number}
                          </span>
                          <h4 className="text-sm font-display font-semibold text-slate-100">
                            {step.title}
                          </h4>
                        </div>

                        {step.description && (
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed font-sans">
                            {step.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Assigned Specialist Agent Badge */}
                    {step.specialist && (
                      <span className="text-[11px] font-mono-code px-2 py-1 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 whitespace-nowrap">
                        {step.specialist}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
