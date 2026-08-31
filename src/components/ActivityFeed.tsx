import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActivityEvent } from '../types';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info,
  Sparkles,
  Mail,
  Calendar as CalendarIcon,
  Brain,
  ShieldCheck,
} from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityEvent[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const getStatusBadge = (status: ActivityEvent['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'working':
        return <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping inline-block" />;
      case 'waiting_approval':
        return <Clock className="w-3.5 h-3.5 text-amber-400" />;
      case 'error':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case 'info':
      default:
        return <Info className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  return (
    <div id="sylvia-activity-feed-widget" className="p-4 space-y-3 text-xs select-none">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="font-display font-bold text-slate-100">Live Agent Telemetry</h3>
        </div>
        <span className="text-[10px] font-mono-code px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
          Stream Active
        </span>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {activities.map(evt => (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/90 transition-all flex items-start gap-2.5"
            >
              <div className="mt-0.5">{getStatusBadge(evt.status)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="font-mono-code font-semibold text-[11px] text-indigo-300 truncate">
                    {evt.agent}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono-code whitespace-nowrap">
                    {evt.timestamp}
                  </span>
                </div>

                <p className="text-slate-200 font-sans text-xs leading-relaxed">{evt.action}</p>

                {evt.tool && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[9px] font-mono-code px-1.5 py-0.2 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                      TOOL: {evt.tool}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
