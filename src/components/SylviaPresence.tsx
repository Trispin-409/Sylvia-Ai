import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SylviaState, BackendHealth } from '../types';
import { Sparkles, ShieldCheck, AlertCircle, Cpu } from 'lucide-react';

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
          badgeColor: 'border-sky-500/50 text-sky-300 bg-sky-950/40',
        };
      case 'THINKING':
        return {
          primary: '#a855f7', // purple
          secondary: '#ec4899', // pink
          glow: 'rgba(168, 85, 247, 0.55)',
          core: '#fdf4ff',
          label: 'THINKING',
          badgeColor: 'border-purple-500/50 text-purple-300 bg-purple-950/40',
        };
      case 'ANALYZING':
        return {
          primary: '#6366f1', // indigo
          secondary: '#06b6d4', // cyan
          glow: 'rgba(99, 102, 241, 0.55)',
          core: '#e0e7ff',
          label: 'ANALYZING CONTEXT',
          badgeColor: 'border-indigo-500/50 text-indigo-300 bg-indigo-950/40',
        };
      case 'WORKING':
        return {
          primary: '#3b82f6', // blue
          secondary: '#10b981', // emerald
          glow: 'rgba(59, 130, 246, 0.55)',
          core: '#eff6ff',
          label: 'EXECUTING TASK',
          badgeColor: 'border-blue-500/50 text-blue-300 bg-blue-950/40',
        };
      case 'WAITING_FOR_APPROVAL':
        return {
          primary: '#f59e0b', // amber
          secondary: '#ef4444', // red
          glow: 'rgba(245, 158, 11, 0.6)',
          core: '#fffbeb',
          label: 'WAITING FOR APPROVAL',
          badgeColor: 'border-amber-500/60 text-amber-300 bg-amber-950/50 animate-pulse',
        };
      case 'COMPLETED':
        return {
          primary: '#10b981', // emerald
          secondary: '#06b6d4', // cyan
          glow: 'rgba(16, 185, 129, 0.5)',
          core: '#ecfdf5',
          label: 'TASK COMPLETE',
          badgeColor: 'border-emerald-500/50 text-emerald-300 bg-emerald-950/40',
        };
      case 'ERROR':
        return {
          primary: '#ef4444', // red
          secondary: '#f97316', // orange
          glow: 'rgba(239, 68, 68, 0.55)',
          core: '#fef2f2',
          label: 'SYSTEM ALERT',
          badgeColor: 'border-red-500/50 text-red-300 bg-red-950/40',
        };
      case 'IDLE':
      default:
        return {
          primary: '#818cf8', // soft indigo
          secondary: '#c084fc', // soft violet
          glow: 'rgba(129, 140, 248, 0.35)',
          core: '#f8fafc',
          label: 'OPERATIONAL',
          badgeColor: 'border-indigo-500/30 text-indigo-200 bg-indigo-950/30',
        };
    }
  };

  const stateConfig = getStateColors();

  // Render high-fidelity particle silhouette & digital aura onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = 460);
    const height = (canvas.height = 480);
    const centerX = width / 2;
    const centerY = height / 2 - 10;

    // Define mathematical humanoid constellation keypoints (face silhouette, graceful neck, shoulders, and flowing particle hair)
    const baseNodes = [
      // Forehead / Crown
      { x: 0, y: -90, radius: 2.2, baseRadius: 2.2, phase: 0 },
      { x: -16, y: -80, radius: 2.0, baseRadius: 2.0, phase: 0.4 },
      { x: 16, y: -80, radius: 2.0, baseRadius: 2.0, phase: 0.8 },
      { x: -32, y: -65, radius: 1.8, baseRadius: 1.8, phase: 1.2 },
      { x: 32, y: -65, radius: 1.8, baseRadius: 1.8, phase: 1.6 },

      // Temporal / Eye brows & Intelligent Core Eyes
      { x: -20, y: -45, radius: 2.4, baseRadius: 2.4, phase: 2.0, isEye: true },
      { x: 20, y: -45, radius: 2.4, baseRadius: 2.4, phase: 2.4, isEye: true },
      { x: 0, y: -48, radius: 2.6, baseRadius: 2.6, phase: 2.2, isThirdEye: true }, // Central intuition node

      // Cheekbones & Nose line
      { x: -36, y: -25, radius: 2.1, baseRadius: 2.1, phase: 2.8 },
      { x: 36, y: -25, radius: 2.1, baseRadius: 2.1, phase: 3.2 },
      { x: 0, y: -20, radius: 1.6, baseRadius: 1.6, phase: 3.6 },
      { x: 0, y: -5, radius: 1.8, baseRadius: 1.8, phase: 4.0 },

      // Jawline & Chin
      { x: -28, y: 15, radius: 2.0, baseRadius: 2.0, phase: 4.4 },
      { x: 28, y: 15, radius: 2.0, baseRadius: 2.0, phase: 4.8 },
      { x: -14, y: 32, radius: 2.2, baseRadius: 2.2, phase: 5.2 },
      { x: 14, y: 32, radius: 2.2, baseRadius: 2.2, phase: 5.6 },
      { x: 0, y: 42, radius: 2.8, baseRadius: 2.8, phase: 6.0 }, // Chin apex

      // Neck & Collar
      { x: -10, y: 64, radius: 2.0, baseRadius: 2.0, phase: 0.5 },
      { x: 10, y: 64, radius: 2.0, baseRadius: 2.0, phase: 1.5 },
      { x: -18, y: 88, radius: 2.2, baseRadius: 2.2, phase: 2.5 },
      { x: 18, y: 88, radius: 2.2, baseRadius: 2.2, phase: 3.5 },
      { x: 0, y: 92, radius: 2.5, baseRadius: 2.5, phase: 4.5 },

      // Shoulders & Chest silhouette
      { x: -55, y: 110, radius: 2.4, baseRadius: 2.4, phase: 1.1 },
      { x: 55, y: 110, radius: 2.4, baseRadius: 2.4, phase: 2.1 },
      { x: -95, y: 130, radius: 2.2, baseRadius: 2.2, phase: 3.1 },
      { x: 95, y: 130, radius: 2.2, baseRadius: 2.2, phase: 4.1 },
      { x: -130, y: 155, radius: 1.8, baseRadius: 1.8, phase: 5.1 },
      { x: 130, y: 155, radius: 1.8, baseRadius: 1.8, phase: 6.1 },

      // Flowing hair / astral energy trails
      { x: -50, y: -85, radius: 1.6, baseRadius: 1.6, phase: 0.9 },
      { x: 50, y: -85, radius: 1.6, baseRadius: 1.6, phase: 1.9 },
      { x: -70, y: -50, radius: 1.5, baseRadius: 1.5, phase: 2.9 },
      { x: 70, y: -50, radius: 1.5, baseRadius: 1.5, phase: 3.9 },
      { x: -80, y: 0, radius: 1.4, baseRadius: 1.4, phase: 4.9 },
      { x: 80, y: 0, radius: 1.4, baseRadius: 1.4, phase: 5.9 },
      { x: -75, y: 55, radius: 1.5, baseRadius: 1.5, phase: 0.3 },
      { x: 75, y: 55, radius: 1.5, baseRadius: 1.5, phase: 1.3 },
    ];

    // Constellation connection tuples between human keypoints
    const connections: [number, number][] = [
      // Crown & Brow
      [0, 1], [0, 2], [1, 3], [2, 4],
      [1, 5], [2, 6], [5, 7], [6, 7], [7, 0],
      // Face contours
      [5, 8], [6, 9], [8, 12], [9, 13],
      [12, 14], [13, 15], [14, 16], [15, 16],
      [7, 10], [10, 11], [11, 16],
      // Neck & Torso
      [16, 17], [16, 18], [17, 19], [18, 20],
      [19, 21], [20, 21],
      [19, 22], [20, 23], [22, 24], [23, 25],
      [24, 26], [25, 27],
      // Hair / Astral lines
      [3, 28], [4, 29], [28, 30], [29, 31],
      [30, 32], [31, 33], [32, 34], [33, 35],
      [34, 22], [35, 23],
    ];

    // Ambient floating orbital particles
    const ambientParticles = Array.from({ length: 48 }, (_, i) => ({
      orbitRadius: 110 + (i % 6) * 22,
      angle: (i / 48) * Math.PI * 2,
      speed: (0.003 + (i % 4) * 0.002) * (i % 2 === 0 ? 1 : -1),
      size: Math.random() * 1.8 + 0.8,
      alpha: Math.random() * 0.6 + 0.3,
      yOffset: (Math.random() - 0.5) * 35,
    }));

    let time = 0;

    const renderPresence = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.03;

      // Breathing scale & subtle head movement
      const breathScale = 1 + Math.sin(time * 0.8) * 0.022;
      const headTilt = Math.sin(time * 0.4) * 1.5;

      // Dynamic glow background behind silhouette
      const auraGradient = ctx.createRadialGradient(
        centerX,
        centerY - 20,
        15,
        centerX,
        centerY - 20,
        180
      );
      auraGradient.addColorStop(0, stateConfig.glow);
      auraGradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.08)');
      auraGradient.addColorStop(1, 'rgba(3, 7, 18, 0)');

      ctx.fillStyle = auraGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY - 20, 180, 0, Math.PI * 2);
      ctx.fill();

      // Draw outer geometric aura energy rings
      ctx.lineWidth = 1;
      const ringCount = sylviaState === 'ANALYZING' || sylviaState === 'WORKING' ? 4 : 2;
      for (let r = 0; r < ringCount; r++) {
        const ringRadius = 140 + r * 30 + Math.sin(time + r) * 6;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `${stateConfig.primary}${Math.floor(18 - r * 4).toString(16).padStart(2, '0')}`;
        ctx.setLineDash([4 + r * 2, 8 + r * 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Orbital ambient particles
      ambientParticles.forEach(p => {
        p.angle += p.speed * (sylviaState === 'WORKING' ? 2.5 : 1);
        const px = centerX + Math.cos(p.angle) * p.orbitRadius;
        const py = centerY + Math.sin(p.angle) * (p.orbitRadius * 0.42) + p.yOffset;

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = stateConfig.secondary;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = stateConfig.primary;
        ctx.fill();
      });

      // Compute dynamic node positions
      const transformedNodes = baseNodes.map(node => {
        const oscillation = Math.sin(time * 1.5 + node.phase) * 2.2;
        const nx = centerX + (node.x + oscillation * 0.3) * breathScale + headTilt * (node.y < 0 ? 0.6 : 0.2);
        const ny = centerY + (node.y + oscillation) * breathScale;
        return { ...node, x: nx, y: ny };
      });

      // Draw Constellation Connection Lines
      connections.forEach(([i1, i2]) => {
        const n1 = transformedNodes[i1];
        const n2 = transformedNodes[i2];
        if (!n1 || !n2) return;

        const grad = ctx.createLinearGradient(n1.x, n1.y, n2.x, n2.y);
        grad.addColorStop(0, stateConfig.primary);
        grad.addColorStop(1, stateConfig.secondary);

        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.1;
        ctx.globalAlpha = 0.32 + Math.sin(time + i1) * 0.12;
        ctx.shadowBlur = 6;
        ctx.shadowColor = stateConfig.primary;
        ctx.stroke();
      });

      // Draw Humanoid Constellation Nodes
      transformedNodes.forEach((node) => {
        const pulse = Math.sin(time * 2 + node.phase) * 0.5 + 1;
        const radius = node.baseRadius * pulse * (node.isEye || node.isThirdEye ? 1.4 : 1);

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = node.isThirdEye || node.isEye ? stateConfig.core : stateConfig.primary;
        ctx.globalAlpha = node.isThirdEye ? 0.95 : 0.85;
        ctx.shadowBlur = node.isThirdEye ? 16 : 9;
        ctx.shadowColor = stateConfig.primary;
        ctx.fill();

        // Inner white nucleus for eyes
        if (node.isEye || node.isThirdEye) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius * 0.45, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = 1.0;
          ctx.shadowBlur = 4;
          ctx.fill();
        }
      });

      // Central Heart / Consciousness pulse
      const corePulse = Math.sin(time * 2.5) * 4 + 12;
      const coreGrad = ctx.createRadialGradient(
        centerX,
        centerY - 20,
        2,
        centerX,
        centerY - 20,
        corePulse
      );
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.4, stateConfig.primary);
      coreGrad.addColorStop(1, 'rgba(99, 102, 241, 0)');

      ctx.beginPath();
      ctx.arc(centerX, centerY - 20, corePulse, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.globalAlpha = 0.65;
      ctx.fill();

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
      onClick={onClick}
      className="relative flex flex-col items-center justify-center cursor-pointer select-none group"
    >
      {/* Dynamic Luminous Canvas Core */}
      <div className="relative w-[340px] h-[340px] md:w-[420px] md:h-[420px] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain pointer-events-none"
        />

        {/* Listening audio ripple effect */}
        {isListening && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 rounded-full border border-sky-400/40 animate-ping opacity-60" />
            <div className="w-64 h-64 rounded-full border border-indigo-400/20 animate-pulse-ring opacity-40" />
          </div>
        )}

        {/* Waiting For Approval Attention Ring */}
        {sylviaState === 'WAITING_FOR_APPROVAL' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-72 h-72 rounded-full border-2 border-amber-400/60 animate-ping opacity-30" />
            <div className="w-80 h-80 rounded-full border border-amber-500/30 animate-pulse opacity-50" />
          </div>
        )}
      </div>

      {/* Sylvia Identity Card & Telemetry */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center mt-[-18px] z-10"
      >
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="relative flex items-center justify-center">
            <span className={`w-2.5 h-2.5 rounded-full ${health.connected ? 'bg-emerald-400' : 'bg-indigo-400'} animate-pulse`} />
            <span className={`absolute w-4 h-4 rounded-full ${health.connected ? 'bg-emerald-400/30' : 'bg-indigo-400/30'} animate-ping`} />
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-widest text-slate-100 uppercase">
            SYLVIA
          </h1>
          <Sparkles className="w-4 h-4 text-indigo-400/80" />
        </div>

        <p className="text-xs md:text-sm font-medium tracking-wider text-slate-400 uppercase mb-3">
          COLLABORATIVE DIGITAL OPERATOR
        </p>

        {/* Status Indicators row */}
        <div className="flex items-center flex-wrap justify-center gap-2">
          {/* Active State Pill */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono-code font-medium border ${stateConfig.badgeColor}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {stateConfig.label}
          </span>

          {/* Backend Connection Pill */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono-code ${
            health.connected
              ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30'
              : 'border-indigo-500/30 text-indigo-300 bg-indigo-950/20'
          }`}>
            {health.connected ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Connected to ADK
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                {health.isDemoMode ? 'Interactive Sandbox' : 'A2A Ready'}
              </>
            )}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
