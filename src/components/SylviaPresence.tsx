import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SylviaState, BackendHealth } from '../types';
import { Sparkles, ShieldCheck, Cpu, ChevronDown, ChevronUp, Radio } from 'lucide-react';

interface SylviaPresenceProps {
  sylviaState: SylviaState;
  health?: BackendHealth;
  isListening?: boolean;
  audioLevel?: number[];
  onClick?: () => void;
}

export const SylviaPresence: React.FC<SylviaPresenceProps> = ({
  sylviaState,
  health = { connected: false, isDemoMode: true, backendUrl: 'http://127.0.0.1:8000' },
  isListening = false,
  audioLevel = [],
  onClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // State-specific palette configuration
  const getStateColors = () => {
    switch (sylviaState) {
      case 'LISTENING':
        return {
          primary: '#38bdf8', // sky blue
          secondary: '#818cf8', // indigo
          glow: 'rgba(56, 189, 248, 0.45)',
          core: '#ffffff',
          label: 'LISTENING',
          badgeColor: 'border-sky-500/50 text-sky-300 bg-sky-950/50',
        };
      case 'THINKING':
        return {
          primary: '#a855f7', // purple
          secondary: '#ec4899', // pink
          glow: 'rgba(168, 85, 247, 0.55)',
          core: '#fdf4ff',
          label: 'THINKING',
          badgeColor: 'border-purple-500/50 text-purple-300 bg-purple-950/50',
        };
      case 'ANALYZING':
        return {
          primary: '#6366f1', // indigo
          secondary: '#06b6d4', // cyan
          glow: 'rgba(99, 102, 241, 0.55)',
          core: '#e0e7ff',
          label: 'ANALYZING CONTEXT',
          badgeColor: 'border-indigo-500/50 text-indigo-300 bg-indigo-950/50',
        };
      case 'WORKING':
        return {
          primary: '#3b82f6', // blue
          secondary: '#10b981', // emerald
          glow: 'rgba(59, 130, 246, 0.55)',
          core: '#eff6ff',
          label: 'EXECUTING TASK',
          badgeColor: 'border-blue-500/50 text-blue-300 bg-blue-950/50',
        };
      case 'WAITING_FOR_APPROVAL':
        return {
          primary: '#f59e0b', // amber
          secondary: '#ef4444', // red
          glow: 'rgba(245, 158, 11, 0.6)',
          core: '#fffbeb',
          label: 'WAITING FOR APPROVAL',
          badgeColor: 'border-amber-500/60 text-amber-300 bg-amber-950/60 animate-pulse',
        };
      case 'COMPLETED':
        return {
          primary: '#10b981', // emerald
          secondary: '#06b6d4', // cyan
          glow: 'rgba(16, 185, 129, 0.5)',
          core: '#ecfdf5',
          label: 'TASK COMPLETE',
          badgeColor: 'border-emerald-500/50 text-emerald-300 bg-emerald-950/50',
        };
      case 'ERROR':
        return {
          primary: '#ef4444', // red
          secondary: '#f97316', // orange
          glow: 'rgba(239, 68, 68, 0.55)',
          core: '#fef2f2',
          label: 'SYSTEM ALERT',
          badgeColor: 'border-red-500/50 text-red-300 bg-red-950/50',
        };
      case 'IDLE':
      default:
        return {
          primary: '#818cf8', // soft indigo
          secondary: '#c084fc', // soft violet
          glow: 'rgba(129, 140, 248, 0.35)',
          core: '#f8fafc',
          label: 'OPERATIONAL',
          badgeColor: 'border-indigo-500/30 text-indigo-200 bg-indigo-950/40',
        };
    }
  };

  const stateConfig = getStateColors();

  // Render particle hologram onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = 240);
    const height = (canvas.height = 240);
    const centerX = width / 2;
    const centerY = height / 2;

    const baseNodes = [
      { x: 0, y: -45, radius: 2.2, baseRadius: 2.2, phase: 0 },
      { x: -10, y: -40, radius: 2.0, baseRadius: 2.0, phase: 0.4 },
      { x: 10, y: -40, radius: 2.0, baseRadius: 2.0, phase: 0.8 },
      { x: -18, y: -30, radius: 1.8, baseRadius: 1.8, phase: 1.2 },
      { x: 18, y: -30, radius: 1.8, baseRadius: 1.8, phase: 1.6 },
      { x: -12, y: -18, radius: 2.4, baseRadius: 2.4, phase: 2.0, isEye: true },
      { x: 12, y: -18, radius: 2.4, baseRadius: 2.4, phase: 2.4, isEye: true },
      { x: 0, y: -20, radius: 2.6, baseRadius: 2.6, phase: 2.2, isThirdEye: true },
      { x: -20, y: -10, radius: 2.1, baseRadius: 2.1, phase: 2.8 },
      { x: 20, y: -10, radius: 2.1, baseRadius: 2.1, phase: 3.2 },
      { x: 0, y: 0, radius: 1.8, baseRadius: 1.8, phase: 4.0 },
      { x: -14, y: 15, radius: 2.0, baseRadius: 2.0, phase: 4.4 },
      { x: 14, y: 15, radius: 2.0, baseRadius: 2.0, phase: 4.8 },
      { x: 0, y: 24, radius: 2.8, baseRadius: 2.8, phase: 6.0 },
      { x: -6, y: 35, radius: 2.0, baseRadius: 2.0, phase: 0.5 },
      { x: 6, y: 35, radius: 2.0, baseRadius: 2.0, phase: 1.5 },
      { x: -35, y: 55, radius: 2.4, baseRadius: 2.4, phase: 1.1 },
      { x: 35, y: 55, radius: 2.4, baseRadius: 2.4, phase: 2.1 },
      { x: -60, y: 70, radius: 2.2, baseRadius: 2.2, phase: 3.1 },
      { x: 60, y: 70, radius: 2.2, baseRadius: 2.2, phase: 4.1 },
    ];

    const connections: [number, number][] = [
      [0, 1], [0, 2], [1, 3], [2, 4],
      [1, 5], [2, 6], [5, 7], [6, 7], [7, 0],
      [5, 8], [6, 9], [8, 11], [9, 12],
      [11, 13], [12, 13], [7, 10], [10, 13],
      [13, 14], [13, 15], [14, 16], [15, 17],
      [16, 18], [17, 19],
    ];

    const particles = Array.from({ length: 24 }, (_, i) => ({
      orbitRadius: 55 + (i % 4) * 16,
      angle: (i / 24) * Math.PI * 2,
      speed: (0.005 + (i % 3) * 0.003) * (i % 2 === 0 ? 1 : -1),
      size: Math.random() * 1.5 + 0.8,
      alpha: Math.random() * 0.5 + 0.3,
    }));

    let time = 0;

    const renderPresence = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.035;

      const breathScale = 1 + Math.sin(time * 0.9) * 0.03;

      // Glow Core
      const auraGradient = ctx.createRadialGradient(
        centerX,
        centerY - 5,
        5,
        centerX,
        centerY - 5,
        90
      );
      auraGradient.addColorStop(0, stateConfig.glow);
      auraGradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.08)');
      auraGradient.addColorStop(1, 'rgba(3, 7, 18, 0)');

      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY - 5, 90, 0, Math.PI * 2);
      ctx.fill();

      // Outer aura ring
      const ringRadius = 75 + Math.sin(time) * 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `${stateConfig.primary}44`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Particles
      particles.forEach(p => {
        p.angle += p.speed * (sylviaState === 'WORKING' ? 2 : 1);
        const px = centerX + Math.cos(p.angle) * p.orbitRadius;
        const py = centerY + Math.sin(p.angle) * (p.orbitRadius * 0.45);

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = stateConfig.secondary;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 6;
        ctx.shadowColor = stateConfig.primary;
        ctx.fill();
      });

      // Nodes
      const transformedNodes = baseNodes.map(node => {
        const oscillation = Math.sin(time * 1.5 + node.phase) * 1.4;
        const nx = centerX + (node.x + oscillation * 0.3) * breathScale;
        const ny = centerY + (node.y + oscillation) * breathScale;
        return { ...node, x: nx, y: ny };
      });

      // Connection lines
      connections.forEach(([i1, i2]) => {
        const n1 = transformedNodes[i1];
        const n2 = transformedNodes[i2];
        if (!n1 || !n2) return;

        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.strokeStyle = stateConfig.primary;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.35 + Math.sin(time + i1) * 0.15;
        ctx.stroke();
      });

      // Nodes
      transformedNodes.forEach(node => {
        const pulse = Math.sin(time * 2 + node.phase) * 0.4 + 1;
        const radius = node.baseRadius * pulse;

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = node.isThirdEye || node.isEye ? stateConfig.core : stateConfig.primary;
        ctx.globalAlpha = node.isThirdEye ? 0.95 : 0.85;
        ctx.shadowBlur = node.isThirdEye ? 12 : 6;
        ctx.shadowColor = stateConfig.primary;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      animId = requestAnimationFrame(renderPresence);
    };

    renderPresence();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [sylviaState, stateConfig]);

  return (
    <div
      id="sylvia-central-presence"
      className="w-full border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md transition-all select-none z-20"
    >
      {/* Sleek Presence Banner */}
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Avatar & Identity */}
        <div className="flex items-center gap-3">
          {/* Holographic Orb Canvas */}
          <div
            onClick={() => setIsExpanded(prev => !prev)}
            className="relative w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-indigo-950/80 to-purple-950/80 border border-indigo-500/30 flex items-center justify-center cursor-pointer overflow-hidden shadow-lg shadow-indigo-950/40 group hover:border-indigo-400/60 transition-all flex-shrink-0"
            title="Click to toggle expanded hologram"
          >
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain pointer-events-none scale-125"
            />
            {isListening && (
              <div className="absolute inset-0 rounded-xl border border-sky-400 animate-ping opacity-50" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm tracking-wider text-slate-100 uppercase">
                SYLVIA
              </span>
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline-block text-[10px] font-mono-code text-slate-400">
                · Collaborative Digital Operator
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${health.connected ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'}`} />
              <span className="text-[11px] font-mono-code text-slate-300">
                {health.connected ? 'Google ADK Active' : 'Autonomous Engine Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: State Badges & Expand Button */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Active State Pill */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono-code font-medium border ${stateConfig.badgeColor}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {stateConfig.label}
          </span>

          {/* Connected System Badge */}
          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono-code border border-indigo-500/30 text-indigo-300 bg-indigo-950/20">
            {health.connected ? (
              <>
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                ADK Synchronized
              </>
            ) : (
              <>
                <Cpu className="w-3 h-3 text-indigo-400" />
                A2A Sandbox
              </>
            )}
          </span>

          {/* Toggle Expanded Constellation View */}
          <button
            onClick={() => setIsExpanded(prev => !prev)}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors text-xs flex items-center gap-1"
            title={isExpanded ? 'Collapse Hologram' : 'Expand Hologram'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Optional Expanded Hologram Drawer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-t border-slate-800/60 bg-slate-950/90 py-4 px-6 text-center"
          >
            <p className="text-xs font-mono-code text-indigo-300/80 uppercase tracking-widest mb-1">
              Neural Constellation Telemetry
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Real-time visualization of Sylvia’s cognitive decision loop, multi-agent delegation path, and human-in-the-loop alignment.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
