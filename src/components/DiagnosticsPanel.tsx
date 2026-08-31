import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BackendHealth, AgentCard } from '../types';
import {
  Sliders,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Server,
  Code2,
  CheckCircle2,
  X,
  ExternalLink,
  Cpu,
} from 'lucide-react';

interface DiagnosticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  health: BackendHealth;
  agentCard: AgentCard | null;
  onRefreshHealth: () => void;
  onUpdateBackendUrl: (url: string) => void;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
  isOpen,
  onClose,
  health,
  agentCard,
  onRefreshHealth,
  onUpdateBackendUrl,
}) => {
  const [urlInput, setUrlInput] = useState(health.backendUrl);
  const [isTesting, setIsTesting] = useState(false);

  const handleApplyUrl = () => {
    setIsTesting(true);
    onUpdateBackendUrl(urlInput);
    setTimeout(() => {
      setIsTesting(false);
      onRefreshHealth();
    }, 600);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-2xl glass-panel-elevated p-6 rounded-2xl border border-indigo-500/30 max-h-[85vh] overflow-y-auto select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-100">
                    System Telemetry & ADK Diagnostics
                  </h3>
                  <p className="text-xs text-slate-400 font-mono-code">
                    A2A JSON-RPC 2.0 Communication Bus
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Health Status Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 font-mono-code text-xs">
                <div className="text-slate-400 text-[10px] uppercase mb-1">Backend Status</div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      health.connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                    }`}
                  />
                  <span className="font-bold text-slate-200">
                    {health.connected ? 'ONLINE' : 'UNREACHABLE'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {health.connected ? 'Google ADK Active' : 'Fallback Sandbox'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 font-mono-code text-xs">
                <div className="text-slate-400 text-[10px] uppercase mb-1">A2A Latency</div>
                <div className="text-base font-bold text-slate-100">
                  {health.latencyMs !== undefined ? `${health.latencyMs} ms` : 'Local Fallback'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">JSON-RPC / POST</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 font-mono-code text-xs">
                <div className="text-slate-400 text-[10px] uppercase mb-1">A2A Protocol</div>
                <div className="text-base font-bold text-indigo-300">
                  {agentCard?.protocolVersion || 'A2A/2.0'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Agent v{agentCard?.version || '1.4.0'}
                </div>
              </div>
            </div>

            {/* Backend URL Switcher */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 font-mono-code text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold uppercase text-[11px]">
                  Configured API Base URL
                </span>
                <span className="text-[10px] text-slate-400">VITE_SYLVIA_API_URL</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="http://127.0.0.1:8000"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 text-xs outline-none focus:border-indigo-500 font-mono-code"
                />
                <button
                  onClick={handleApplyUrl}
                  disabled={isTesting}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>Update & Test</span>
                </button>
              </div>

              {!health.connected && (
                <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-200 font-sans leading-relaxed">
                  <strong>Notice:</strong> If the Python/Google ADK backend is not currently running locally on port 8000, Sylvia's frontend automatically operates in high-fidelity interactive sandbox mode so all features (Decision DNA, missions, specialists, approvals, voice) can be demonstrated.
                </div>
              )}
            </div>

            {/* Agent Card Dynamic Skills */}
            {agentCard && (
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono-code font-bold uppercase text-slate-300">
                    Discovered Agent Card Capabilities ({agentCard.skills?.length || 0})
                  </h4>
                  <span className="text-[10px] font-mono-code text-slate-400">
                    GET /a2a/app/.well-known/agent-card.json
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 font-mono-code text-[11px]">
                  {Array.isArray(agentCard.skills) &&
                    agentCard.skills.map((skill, idx) => {
                      const name = typeof skill === 'string' ? skill : skill.name;
                      const desc = typeof skill === 'string' ? '' : skill.description;
                      return (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80"
                        >
                          <div className="font-bold text-indigo-300">{name}</div>
                          {desc && <div className="text-[10px] text-slate-400 font-sans mt-0.5">{desc}</div>}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Close Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                Close Diagnostics
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
