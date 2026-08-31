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
    window.setTimeout(() => {
      setIsTesting(false);
      onRefreshHealth();
    }, 600);
  };

  const workspace = health.workspace;

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
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-100">System Telemetry & ADK Diagnostics</h3>
                  <p className="text-xs text-slate-400 font-mono-code">Live backend and Workspace evidence</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 font-mono-code text-xs">
                <div className="text-slate-400 text-[10px] uppercase mb-1">Backend Status</div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${health.connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                  <span className="font-bold text-slate-200">{health.connected ? 'ONLINE' : 'UNREACHABLE'}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Lightweight Cloud Run /health probe</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 font-mono-code text-xs">
                <div className="text-slate-400 text-[10px] uppercase mb-1">Health Latency</div>
                <div className="text-base font-bold text-slate-100">{health.latencyMs !== undefined ? `${health.latencyMs} ms` : '—'}</div>
                <div className="text-[10px] text-slate-400 mt-1">HTTP GET, no LLM invocation</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 font-mono-code text-xs">
                <div className="text-slate-400 text-[10px] uppercase mb-1">A2A Protocol</div>
                <div className="text-base font-bold text-indigo-300">{agentCard?.protocolVersion || 'A2A/2.0'}</div>
                <div className="text-[10px] text-slate-400 mt-1">Agent v{agentCard?.version || 'unknown'}</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 font-mono-code text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold uppercase text-[11px]">Configured API Base URL</span>
                <span className="text-[10px] text-slate-400">VITE_SYLVIA_API_URL</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://sylvia-agent-...run.app"
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
              <div className="text-[10px] text-slate-500">Workspace connectivity is not inferred from backend uptime.</div>
            </div>

            <div className="mt-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-slate-200 font-display font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Workspace Status
                </div>
                <span className="text-[10px] font-mono-code text-slate-500">SOURCE: LIVE BACKEND</span>
              </div>

              {!workspace ? (
                <div className="p-3 rounded-lg border border-dashed border-slate-800 text-xs text-slate-500">
                  Workspace status has not been queried yet. Ask Sylvia to check Workspace or perform a Workspace operation.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60">
                    <div className="text-[10px] text-slate-500 uppercase">Authentication</div>
                    <div className={`mt-1 font-bold ${workspace.authenticated ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {workspace.authenticated ? 'CONNECTED' : 'NOT CONNECTED'}
                    </div>
                    {workspace.gmailEmail && <div className="text-[10px] text-slate-400 mt-1">{workspace.gmailEmail}</div>}
                  </div>
                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60">
                    <div className="text-[10px] text-slate-500 uppercase">Gmail</div>
                    <div className={`mt-1 font-bold ${workspace.gmailConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {workspace.gmailConnected ? 'CONNECTED' : 'NOT CONNECTED'}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60">
                    <div className="text-[10px] text-slate-500 uppercase">Calendar</div>
                    <div className={`mt-1 font-bold ${workspace.calendarConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {workspace.calendarConnected ? 'CONNECTED' : 'NOT CONNECTED'}
                    </div>
                    {workspace.calendarCount !== undefined && <div className="text-[10px] text-slate-400 mt-1">{workspace.calendarCount} calendars</div>}
                  </div>
                  <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/60">
                    <div className="text-[10px] text-slate-500 uppercase">Checked</div>
                    <div className="mt-1 font-bold text-slate-200">{new Date(workspace.checkedAt).toLocaleTimeString()}</div>
                    <div className="text-[10px] text-slate-400 mt-1">Backend evidence only</div>
                  </div>
                </div>
              )}
              {workspace?.error && (
                <div className="mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-200">
                  {workspace.error}
                </div>
              )}
            </div>

            {agentCard && (
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono-code font-bold uppercase text-slate-300">Agent Capabilities</h4>
                  <span className="text-[10px] font-mono-code text-slate-400">Configured capability map</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 font-mono-code text-[11px]">
                  {Array.isArray(agentCard.skills) && agentCard.skills.map((skill, idx) => {
                    const name = typeof skill === 'string' ? skill : skill.name;
                    const desc = typeof skill === 'string' ? '' : skill.description;
                    return (
                      <div key={idx} className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                        <div className="font-bold text-indigo-300">{name}</div>
                        {desc && <div className="text-[10px] text-slate-400 font-sans mt-0.5">{desc}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors">Close Diagnostics</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
