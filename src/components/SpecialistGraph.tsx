import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SpecialistAgent } from '../types';
import {
  Sparkles,
  Brain,
  Scale,
  GitBranch,
  Mail,
  Code,
  Briefcase,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  X,
  Play,
} from 'lucide-react';

interface SpecialistGraphProps {
  specialists: SpecialistAgent[];
  activeDelegationPath?: string[];
  activeSpecialistNode?: string | null;
  onSimulateDelegation?: () => void;
}

export const SpecialistGraph: React.FC<SpecialistGraphProps> = ({
  specialists,
  activeDelegationPath = [],
  activeSpecialistNode = null,
  onSimulateDelegation,
}) => {
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistAgent | null>(null);

  const getIcon = (name: string) => {
    switch (name) {
      case 'Brain':
        return <Brain className="w-5 h-5" />;
      case 'Scale':
        return <Scale className="w-5 h-5" />;
      case 'GitBranch':
        return <GitBranch className="w-5 h-5" />;
      case 'Mail':
        return <Mail className="w-5 h-5" />;
      case 'Code':
        return <Code className="w-5 h-5" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5" />;
      case 'Sparkles':
      default:
        return <Sparkles className="w-6 h-6" />;
    }
  };

  const sylviaFallback: SpecialistAgent = {
    id: 'sylvia_core',
    name: 'Sylvia Core',
    role: 'Central AI Operator & Orchestrator',
    description: 'Human-centric digital operator coordinating goals, context, and decisions.',
    iconName: 'Sparkles',
    status: 'online',
    connected: true,
    skills: ['Goal orchestration', 'A2A delegation', 'Workspace actions'],
    position: { x: 50, y: 50 },
  };

  const sylviaNode = (specialists && specialists.find(s => s?.id === 'sylvia_core')) || specialists?.[0] || sylviaFallback;
  const activeNodes = (specialists || []).filter(s => s && s.id && s.id !== 'sylvia_core' && s.position);

  return (
    <div
      id="sylvia-specialist-constellation"
      className="relative w-full h-full min-h-[600px] flex flex-col items-center justify-center p-6 select-none overflow-hidden"
    >
      {/* Header bar */}
      <div className="absolute top-4 left-6 right-6 flex items-center justify-between z-10">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Specialist Constellation & Delegation Map
          </h2>
          <p className="text-xs text-slate-400">
            A2A Autonomous Multi-Agent Orchestration Protocol
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-simulate-orchestration"
            onClick={onSimulateDelegation}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-medium transition-all shadow-lg shadow-indigo-500/10"
          >
            <Play className="w-3.5 h-3.5 fill-current text-indigo-400" />
            <span>Demonstrate Delegation Sequence</span>
          </button>
        </div>
      </div>

      {/* SVG Connection Lines & Animated Particle Streams */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <defs>
          <linearGradient id="activeStreamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.9" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Constellation web connections */}
        {activeNodes.map(node => {
          const isConnectedInPath =
            activeDelegationPath.includes(node.id) ||
            (activeDelegationPath.length > 0 && activeDelegationPath.includes('sylvia_core'));

          return (
            <g key={`line-sylvia-${node.id}`}>
              <line
                x1={`${sylviaNode.position.x}%`}
                y1={`${sylviaNode.position.y}%`}
                x2={`${node.position.x}%`}
                y2={`${node.position.y}%`}
                stroke={isConnectedInPath ? 'url(#activeStreamGrad)' : node.connected ? 'rgba(99, 102, 241, 0.22)' : 'rgba(148, 163, 184, 0.08)'}
                strokeWidth={isConnectedInPath ? '2.5' : '1.2'}
                strokeDasharray={node.connected ? (isConnectedInPath ? 'none' : '4, 4') : '2, 6'}
                filter={isConnectedInPath ? 'url(#glow)' : undefined}
              />

              {/* Animated energy pulse along connection */}
              {isConnectedInPath && (
                <circle r="4" fill="#38bdf8" filter="url(#glow)">
                  <animateMotion
                    path={`M ${sylviaNode.position.x * 8} ${sylviaNode.position.y * 5} L ${node.position.x * 8} ${node.position.y * 5}`}
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          );
        })}

        {/* Inter-specialist workflow line (Context Analyst -> Decision Partner -> Action Planner -> Workspace Specialist) */}
        <path
          d="M 22% 28% L 78% 28% L 22% 72% L 78% 72%"
          fill="none"
          stroke="rgba(129, 140, 248, 0.12)"
          strokeWidth="1"
          strokeDasharray="6, 6"
        />
      </svg>

      {/* Interactive Constellation Nodes Container */}
      <div className="relative w-full max-w-4xl h-[480px] z-10">
        {/* Central Node: SYLVIA */}
        <motion.div
          id="node-sylvia-core"
          onClick={() => setSelectedSpecialist(sylviaNode)}
          whileHover={{ scale: 1.06 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group"
          style={{ zIndex: 30 }}
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-900/90 via-purple-900/80 to-slate-900/90 border-2 border-indigo-400/80 flex items-center justify-center shadow-2xl shadow-indigo-500/40 backdrop-blur-md group-hover:border-indigo-300 transition-all">
              <Sparkles className="w-8 h-8 text-indigo-200 group-hover:scale-110 transition-transform" />
            </div>
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-[10px] text-emerald-300 font-mono-code font-bold">
              ✓
            </span>
          </div>

          <div className="mt-2 text-center">
            <div className="font-display font-bold text-sm tracking-wider text-slate-100 flex items-center gap-1.5 justify-center">
              SYLVIA CORE
            </div>
            <div className="text-[11px] text-indigo-300 font-mono-code">Master Orchestrator</div>
          </div>
        </motion.div>

        {/* Connected Specialist Satellite Nodes */}
        {activeNodes.map(agent => {
          const isActive = activeSpecialistNode === agent.id;
          const isDelegated = activeDelegationPath.includes(agent.id);

          return (
            <motion.div
              key={agent.id}
              id={`node-${agent.id}`}
              onClick={() => setSelectedSpecialist(agent)}
              whileHover={{ scale: 1.08 }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-all ${
                agent.connected ? 'opacity-100' : 'opacity-50 hover:opacity-75'
              }`}
              style={{
                left: `${agent.position.x}%`,
                top: `${agent.position.y}%`,
                zIndex: isActive ? 40 : 20,
              }}
            >
              <div className="relative">
                {/* Active glow ring */}
                {isActive && (
                  <div className="absolute inset-0 -m-2 rounded-full border-2 border-cyan-400 animate-ping opacity-75" />
                )}

                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
                    isActive
                      ? 'bg-cyan-950/90 border-2 border-cyan-400 text-cyan-200 shadow-xl shadow-cyan-500/50'
                      : isDelegated
                      ? 'bg-indigo-950/90 border-2 border-indigo-400 text-indigo-200 shadow-lg shadow-indigo-500/30'
                      : agent.connected
                      ? 'bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:border-indigo-400/60'
                      : 'bg-slate-950/60 border border-slate-800 text-slate-400'
                  }`}
                >
                  {getIcon(agent.iconName)}
                </div>

                {/* Status Dot */}
                <span
                  className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
                    agent.connected ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                />
              </div>

              {/* Label */}
              <div className="mt-1.5 text-center max-w-[130px]">
                <div className="font-display font-medium text-xs text-slate-200">
                  {agent.name}
                </div>
                <div className="text-[10px] font-mono-code text-slate-400 truncate">
                  {agent.connected ? (isActive ? 'Active Task' : 'Standby') : 'Coming next'}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Specialist Inspection Drawer Modal */}
      <AnimatePresence>
        {selectedSpecialist && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg glass-panel-elevated p-5 rounded-xl border border-indigo-500/30 z-50 text-xs text-slate-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                  {getIcon(selectedSpecialist.iconName)}
                </div>
                <div>
                  <h3 className="text-sm font-display font-bold text-slate-100 flex items-center gap-2">
                    {selectedSpecialist.name}
                    <span
                      className={`text-[10px] font-mono-code px-2 py-0.5 rounded-full border ${
                        selectedSpecialist.connected
                          ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30'
                          : 'border-slate-700 text-slate-400 bg-slate-900/50'
                      }`}
                    >
                      {selectedSpecialist.connected ? 'Online Specialist' : 'Coming Next'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">{selectedSpecialist.role}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedSpecialist(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="py-3 text-slate-300 leading-relaxed">
              {selectedSpecialist.description}
            </p>

            <div className="pt-2 border-t border-slate-800/60">
              <div className="text-[10px] font-mono-code text-slate-400 uppercase mb-1.5">
                Exposed A2A Agent Skills
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedSpecialist.skills.map(skill => (
                  <span
                    key={skill}
                    className="px-2 py-1 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-500/20 font-mono-code text-[10px]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
