import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  MessageSquare,
  Target,
  Dna,
  Brain,
  Mail,
  Calendar,
  Network,
  Activity,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { NavView } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (view: NavView, queryPrompt?: string) => void;
  onOpenDiagnostics: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectAction,
  onOpenDiagnostics,
}) => {
  const [query, setQuery] = useState('');

  const commands = [
    {
      id: 'ask-sylvia',
      title: 'Console Stream',
      subtitle: 'Talk to Sylvia & execute goals',
      icon: <MessageSquare className="w-4 h-4 text-indigo-400" />,
      action: () => onSelectAction('chat'),
    },
    {
      id: 'start-mission',
      title: 'Launch New Mission',
      subtitle: 'Deconstruct high-level goal into 5 phases',
      icon: <Target className="w-4 h-4 text-amber-400" />,
      action: () => onSelectAction('mission-control'),
    },
    {
      id: 'specialist-constellation',
      title: 'Open Specialist Constellation',
      subtitle: 'Multi-agent orchestration & delegation graph',
      icon: <Network className="w-4 h-4 text-cyan-400" />,
      action: () => onSelectAction('specialists'),
    },
    {
      id: 'decision-dna',
      title: 'View Decision DNA',
      subtitle: 'Inspect autonomy rules, goals & working style',
      icon: <Dna className="w-4 h-4 text-purple-400" />,
      action: () => onSelectAction('memory'),
    },
    {
      id: 'check-gmail',
      title: 'Check Gmail Inbox',
      subtitle: 'Recent messages & draft formulations',
      icon: <Mail className="w-4 h-4 text-rose-400" />,
      action: () => onSelectAction('workspace-gmail'),
    },
    {
      id: 'check-calendar',
      title: 'Check Calendar Schedule',
      subtitle: 'Inspect timeline & upcoming milestones',
      icon: <Calendar className="w-4 h-4 text-sky-400" />,
      action: () => onSelectAction('workspace-calendar'),
    },
    {
      id: 'live-activity',
      title: 'Live Agent Telemetry',
      subtitle: 'View active stream of specialist actions',
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      action: () => onSelectAction('activity'),
    },
    {
      id: 'system-diagnostics',
      title: 'System Diagnostics & Health',
      subtitle: 'A2A JSON-RPC telemetry and backend endpoint',
      icon: <Sliders className="w-4 h-4 text-slate-300" />,
      action: () => onOpenDiagnostics(),
    },
  ];

  const filteredCommands = commands.filter(
    cmd =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger handled in parent
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="w-full max-w-xl glass-panel-elevated p-3 rounded-2xl border border-indigo-500/40 shadow-2xl overflow-hidden select-none"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-800">
              <Search className="w-4 h-4 text-indigo-400" />
              <input
                type="text"
                autoFocus
                placeholder="Type a command or jump to feature..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none text-slate-100 placeholder:text-slate-500 text-xs md:text-sm font-sans"
              />
              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono-code text-slate-400">
                ESC
              </span>
            </div>

            {/* Results List */}
            <div className="py-2 max-h-72 overflow-y-auto space-y-1">
              {filteredCommands.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 font-mono-code">
                  No matching command
                </div>
              ) : (
                filteredCommands.map(cmd => (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-indigo-950/40 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-indigo-500/40">
                        {cmd.icon}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200 group-hover:text-indigo-200">
                          {cmd.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-sans">
                          {cmd.subtitle}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
