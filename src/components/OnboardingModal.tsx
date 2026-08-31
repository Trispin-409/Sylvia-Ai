import React from 'react';
import { motion } from 'motion/react';
import { BackendHealth } from '../types';
import {
  Sparkles,
  ShieldCheck,
  Mail,
  Calendar,
  Brain,
  Target,
  ArrowRight,
  Cpu,
} from 'lucide-react';

interface OnboardingModalProps {
  health: BackendHealth;
  onEnterSylvia: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  health,
  onEnterSylvia,
}) => {
  const connectedSystems = [
    {
      name: 'Google ADK',
      status: health.connected ? 'Connected' : 'Sandbox Ready',
      icon: <Cpu className="w-4 h-4 text-indigo-400" />,
      live: health.connected,
    },
    {
      name: 'Gmail Operator',
      status: 'Synchronized',
      icon: <Mail className="w-4 h-4 text-rose-400" />,
      live: true,
    },
    {
      name: 'Calendar Schedule',
      status: 'Synchronized',
      icon: <Calendar className="w-4 h-4 text-sky-400" />,
      live: true,
    },
    {
      name: 'Decision DNA',
      status: 'Indexed',
      icon: <Brain className="w-4 h-4 text-purple-400" />,
      live: true,
    },
    {
      name: 'Mission Control',
      status: 'Operational',
      icon: <Target className="w-4 h-4 text-amber-400" />,
      live: true,
    },
  ];

  return (
    <div
      id="sylvia-onboarding-experience"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030712]/95 backdrop-blur-2xl select-none"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-xl glass-panel-elevated p-8 rounded-3xl border border-indigo-500/30 text-center shadow-2xl relative overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        {/* Central Logo */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-[1.5px] shadow-xl shadow-indigo-500/30 mb-5">
          <div className="w-full h-full rounded-2xl bg-[#030712] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-indigo-300 animate-pulse" />
          </div>
        </div>

        {/* Title & Tagline */}
        <h1 className="text-3xl md:text-4xl font-display font-extrabold tracking-widest text-slate-100 uppercase">
          SYLVIA
        </h1>
        <p className="text-xs md:text-sm font-mono-code text-indigo-300/90 tracking-wider uppercase mt-1 mb-4">
          Human-Centric AI Operator Interface
        </p>

        <p className="text-base text-slate-300 font-sans italic max-w-md mx-auto mb-8 leading-relaxed">
          "Your goals. Your context. Your next move."
        </p>

        {/* Connected Systems Grid */}
        <div className="mb-8 text-left">
          <div className="text-[11px] font-mono-code font-bold tracking-wider text-slate-400 uppercase mb-3 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Connected Systems & Autonomy Stack
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {connectedSystems.map((sys, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    {sys.icon}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{sys.name}</div>
                    <div className="text-[10px] font-mono-code text-slate-400">{sys.status}</div>
                  </div>
                </div>

                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Enter Button */}
        <button
          id="btn-enter-sylvia"
          onClick={onEnterSylvia}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-display font-bold text-sm tracking-wider uppercase transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 group cursor-pointer"
        >
          <span>Enter Sylvia Universe</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    </div>
  );
};
