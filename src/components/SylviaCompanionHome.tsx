import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowRight, ArrowUp, Brain, CalendarDays, CheckCircle2, ChevronRight,
  Clock3, Expand, LoaderCircle, Mail, Mic, MicOff, Network, Sparkles, Target,
  Volume2, VolumeX, Wifi, WifiOff, XCircle,
} from 'lucide-react';
import { ApprovalRequest, BackendHealth, ChatItem, NavView, SylviaState } from '../types';

interface SylviaCompanionHomeProps {
  activeView: NavView;
  state: SylviaState;
  health: BackendHealth;
  chatMessages: ChatItem[];
  pendingApprovals: ApprovalRequest[];
  isListening: boolean;
  voiceOutputEnabled: boolean;
  transcript?: string;
  onSendMessage: (text: string) => void;
  onToggleListening: () => void;
  onToggleVoiceOutput: () => void;
  onOpenWorkspace: (view: NavView) => void;
}

type CompanionStatus = {
  label: string;
  headline: string;
  detail: string;
  tone: 'calm' | 'listening' | 'working' | 'waiting' | 'success' | 'error';
};

function getStatus(state: SylviaState, isListening: boolean): CompanionStatus {
  if (isListening || state === 'LISTENING') {
    return { label: 'Listening', headline: 'I’m listening.', detail: 'Say what you need, or tap the mic to stop.', tone: 'listening' };
  }
  switch (state) {
    case 'THINKING':
      return { label: 'Thinking', headline: 'Let me think that through.', detail: 'Your request has been sent to Sylvia.', tone: 'working' };
    case 'ANALYZING':
      return { label: 'Analyzing', headline: 'Checking the details.', detail: 'I’m working through the information available.', tone: 'working' };
    case 'WORKING':
      return { label: 'Working', headline: 'I’m on it.', detail: 'The request is being processed.', tone: 'working' };
    case 'WAITING_FOR_APPROVAL':
      return { label: 'Needs you', headline: 'I’m waiting for your approval.', detail: 'Review the action before it continues.', tone: 'waiting' };
    case 'COMPLETED':
      return { label: 'Completed', headline: 'That step is complete.', detail: 'Check the result before moving on.', tone: 'success' };
    case 'ERROR':
      return { label: 'Needs attention', headline: 'Something needs attention.', detail: 'Open the conversation for the error details.', tone: 'error' };
    default:
      return { label: 'Ready', headline: 'What should we take care of?', detail: 'Ask Sylvia to help plan, think, or take an approved action.', tone: 'calm' };
  }
}

const statusDot: Record<CompanionStatus['tone'], string> = {
  calm: 'bg-slate-400',
  listening: 'bg-sky-400 animate-pulse',
  working: 'bg-indigo-400 animate-pulse',
  waiting: 'bg-amber-400 animate-pulse',
  success: 'bg-emerald-400',
  error: 'bg-rose-400',
};

const statusText: Record<CompanionStatus['tone'], string> = {
  calm: 'text-slate-300',
  listening: 'text-sky-200',
  working: 'text-indigo-200',
  waiting: 'text-amber-200',
  success: 'text-emerald-200',
  error: 'text-rose-200',
};

const statusBorder: Record<CompanionStatus['tone'], string> = {
  calm: 'border-white/10 bg-white/[0.035]',
  listening: 'border-sky-400/25 bg-sky-400/[0.07]',
  working: 'border-indigo-400/25 bg-indigo-400/[0.07]',
  waiting: 'border-amber-400/25 bg-amber-400/[0.07]',
  success: 'border-emerald-400/25 bg-emerald-400/[0.07]',
  error: 'border-rose-400/25 bg-rose-400/[0.07]',
};

const quickActions: Array<{
  label: string;
  description: string;
  icon: React.ReactNode;
  view: NavView;
  tone: string;
}> = [
  { label: 'Missions', description: 'Plans and next steps', icon: <Target className="h-5 w-5" />, view: 'mission-control', tone: 'text-amber-200 bg-amber-400/10 border-amber-400/15' },
  { label: 'Email', description: 'Inbox and drafts', icon: <Mail className="h-5 w-5" />, view: 'workspace-gmail', tone: 'text-rose-200 bg-rose-400/10 border-rose-400/15' },
  { label: 'Calendar', description: 'Schedule and events', icon: <CalendarDays className="h-5 w-5" />, view: 'workspace-calendar', tone: 'text-sky-200 bg-sky-400/10 border-sky-400/15' },
  { label: 'Memory', description: 'Decision DNA and context', icon: <Brain className="h-5 w-5" />, view: 'memory', tone: 'text-violet-200 bg-violet-400/10 border-violet-400/15' },
  { label: 'Agents', description: 'Specialists and routing', icon: <Network className="h-5 w-5" />, view: 'specialists', tone: 'text-cyan-200 bg-cyan-400/10 border-cyan-400/15' },
  { label: 'Activity', description: 'Execution history', icon: <Activity className="h-5 w-5" />, view: 'activity', tone: 'text-emerald-200 bg-emerald-400/10 border-emerald-400/15' },
];

export const SylviaCompanionHome: React.FC<SylviaCompanionHomeProps> = ({
  activeView, state, health, chatMessages, pendingApprovals, isListening, voiceOutputEnabled,
  transcript = '', onSendMessage, onToggleListening,
  onToggleVoiceOutput, onOpenWorkspace,
}) => {
  const [command, setCommand] = useState('');
  const status = useMemo(() => getStatus(state, isListening), [state, isListening]);
  const waitingApprovals = pendingApprovals.filter(item => item.status === 'WAITING');
  const recentMessages = chatMessages.slice(-2);
  const busy = ['THINKING', 'ANALYZING', 'WORKING'].includes(state) && !isListening;

  useEffect(() => {
    if (transcript) setCommand(transcript);
  }, [transcript]);

  const submitCommand = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = command.trim();
    if (!value || busy) return;
    onSendMessage(value);
    setCommand('');
    if (isListening) onToggleListening();
  };

  return (
    <div className="sylvia-companion-root relative min-h-screen overflow-x-hidden overflow-y-auto text-slate-100">
      <div className="sylvia-companion-glow sylvia-companion-glow-one" aria-hidden="true" />
      <div className="sylvia-companion-glow sylvia-companion-glow-two" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-7 pt-4 sm:px-6 sm:pt-6">
        <header className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border border-indigo-300/20 bg-gradient-to-br from-indigo-400/25 via-violet-500/20 to-sky-400/15 shadow-lg shadow-indigo-950/40">
              <Sparkles className="h-5 w-5 text-indigo-100" />
            </div>
            <div className="min-w-0">
              <div className="font-display text-sm font-bold tracking-[0.16em] text-white">SYLVIA</div>
              <div className="mt-0.5 text-[11px] text-slate-400">Your AI companion</div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className={'hidden items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] sm:flex ' + (health.connected ? 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200' : 'border-slate-700 bg-slate-900/80 text-slate-400')}>
              {health.connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {health.connected ? 'Backend connected' : 'Backend not confirmed'}
            </div>
            <button type="button" onClick={() => onOpenWorkspace(activeView)} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.055] px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-indigo-300/30 hover:bg-indigo-400/10" aria-label="Expand Sylvia workspace">
              <Expand className="h-3.5 w-3.5" /><span>Expand</span>
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col">
          <section className="flex flex-col items-center pb-5 pt-8 text-center sm:pt-10">
            <div className="sylvia-island-pill mb-5 flex items-center gap-2 rounded-full border border-white/10 bg-[#080d17]/90 px-3.5 py-2 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <span className={'h-2 w-2 rounded-full ' + statusDot[status.tone]} />
              <span className={'text-[11px] font-medium tracking-wide ' + statusText[status.tone]}>SYLVIA ISLAND</span>
              <span className="h-3 w-px bg-white/10" />
              <span className="text-[11px] text-slate-400">{status.label}</span>
            </div>
            <button
              type="button"
              className={'sylvia-companion-avatar sylvia-companion-avatar-' + status.tone + ' relative flex h-[190px] w-[190px] items-center justify-center border-0 bg-transparent p-0 transition-transform focus:outline-none focus:ring-2 focus:ring-indigo-300/70 sm:h-[224px] sm:w-[224px]'}
              onClick={onToggleListening}
              aria-label={isListening ? 'Stop listening to Sylvia' : 'Start listening to Sylvia'}
              title={isListening ? 'Stop listening' : 'Tap to speak to Sylvia'}
            >
              <span className="sylvia-character-aura" aria-hidden="true" />
              <span className="sylvia-character-orbit sylvia-character-orbit-one" aria-hidden="true" />
              <span className="sylvia-character-orbit sylvia-character-orbit-two" aria-hidden="true" />
              <svg className="sylvia-character-art relative z-10 h-full w-full" viewBox="0 0 240 260" role="img" aria-label="Sylvia, your AI companion">
                <defs>
                  <linearGradient id="sylviaHair" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#aaa6ff" />
                    <stop offset="46%" stopColor="#7775e9" />
                    <stop offset="100%" stopColor="#373d91" />
                  </linearGradient>
                  <linearGradient id="sylviaHairLight" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#e1dcff" />
                    <stop offset="100%" stopColor="#7c8bff" />
                  </linearGradient>
                  <linearGradient id="sylviaSkin" x1="0" y1="0" x2="0.9" y2="1">
                    <stop offset="0%" stopColor="#fff0e9" />
                    <stop offset="100%" stopColor="#d7b5d7" />
                  </linearGradient>
                  <linearGradient id="sylviaSuit" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#8d92ff" />
                    <stop offset="55%" stopColor="#5656bd" />
                    <stop offset="100%" stopColor="#252e6d" />
                  </linearGradient>
                  <linearGradient id="sylviaCore" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#a5f3fc" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                  <filter id="sylviaSoftGlow" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="5" />
                  </filter>
                </defs>
                <ellipse cx="120" cy="238" rx="65" ry="9" fill="#6e73ed" opacity=".25" filter="url(#sylviaSoftGlow)" />
                <path d="M43 235 C48 204 71 187 99 184 L141 184 C169 187 192 204 197 235 L197 250 L43 250 Z" fill="url(#sylviaSuit)" stroke="#b6bbff" strokeOpacity=".55" strokeWidth="1.5" />
                <path d="M91 186 L120 213 L149 186 L143 250 L97 250 Z" fill="#1b275d" opacity=".72" />
                <path d="M107 177 L107 201 L120 213 L133 201 L133 177 Z" fill="url(#sylviaSkin)" />
                <path d="M78 81 C67 44 91 22 119 22 C154 22 176 47 166 92 L164 144 C161 176 141 193 120 193 C94 193 76 172 74 142 Z" fill="url(#sylviaHair)" />
                <path d="M75 89 C57 100 55 130 65 153 C71 168 81 178 92 182 L91 142 Z" fill="url(#sylviaHair)" />
                <path d="M164 85 C185 103 185 136 171 159 C164 172 156 180 147 184 L150 139 Z" fill="url(#sylviaHair)" />
                <path d="M78 85 C77 58 93 38 121 38 C148 38 164 61 160 93 L155 136 C151 158 136 172 120 172 C102 172 87 156 84 135 Z" fill="url(#sylviaSkin)" />
                <path d="M73 94 C67 58 88 29 118 26 C148 23 170 51 164 90 L158 105 C149 95 146 78 144 63 C130 83 104 91 82 96 L80 116 Z" fill="url(#sylviaHair)" />
                <path d="M86 54 C100 35 132 30 151 54" fill="none" stroke="url(#sylviaHairLight)" strokeWidth="5" strokeLinecap="round" opacity=".85" />
                <path d="M84 104 C96 92 109 92 117 100" fill="none" stroke="#665b9e" strokeWidth="3" strokeLinecap="round" />
                <path d="M124 100 C134 91 147 93 155 103" fill="none" stroke="#665b9e" strokeWidth="3" strokeLinecap="round" />
                <ellipse cx="101" cy="113" rx="9" ry="10" fill="#fff" />
                <ellipse cx="140" cy="113" rx="9" ry="10" fill="#fff" />
                <ellipse cx="103" cy="115" rx="4.4" ry="6.1" fill="#5552b5" />
                <ellipse cx="138" cy="115" rx="4.4" ry="6.1" fill="#5552b5" />
                <circle cx="104.5" cy="112.5" r="1.7" fill="#fff" />
                <circle cx="139.5" cy="112.5" r="1.7" fill="#fff" />
                <path d="M120 119 L116 132 Q120 136 124 132" fill="none" stroke="#bb879f" strokeWidth="2" strokeLinecap="round" />
                <path d="M108 146 Q120 155 132 146" fill="none" stroke="#a94d82" strokeWidth="3" strokeLinecap="round" />
                <ellipse cx="90" cy="135" rx="9" ry="5" fill="#f2a9c3" opacity=".35" />
                <ellipse cx="150" cy="135" rx="9" ry="5" fill="#f2a9c3" opacity=".35" />
                <path d="M76 88 C66 107 68 140 80 158 C84 165 90 169 96 173 C82 151 83 123 84 104 Z" fill="url(#sylviaHair)" />
                <path d="M162 86 C173 111 169 143 157 159 C152 166 146 170 141 173 C155 149 154 122 153 101 Z" fill="url(#sylviaHair)" />
                <path d="M96 194 L120 216 L144 194 L154 203 L142 250 L98 250 L86 203 Z" fill="url(#sylviaSuit)" stroke="#b7c6ff" strokeOpacity=".3" strokeWidth="1.2" />
                <path d="M101 197 L120 214 L139 197 L135 207 L120 222 L105 207 Z" fill="#d8ddff" opacity=".9" />
                <circle cx="120" cy="232" r="9" fill="url(#sylviaCore)" opacity=".2" />
                <circle cx="120" cy="232" r="4.5" fill="url(#sylviaCore)" />
                <path d="M59 96 C51 79 56 60 69 53" fill="none" stroke="#8ee9ff" strokeWidth="2.5" strokeLinecap="round" opacity=".8" />
                <path d="M181 96 C189 79 184 60 171 53" fill="none" stroke="#8ee9ff" strokeWidth="2.5" strokeLinecap="round" opacity=".8" />
                <circle cx="61" cy="100" r="5" fill="#a5f3fc" stroke="#e0fbff" strokeWidth="1.5" />
                <circle cx="179" cy="100" r="5" fill="#a5f3fc" stroke="#e0fbff" strokeWidth="1.5" />
                <path d="M108 30 L120 12 L132 30" fill="none" stroke="#a5f3fc" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="120" cy="10" r="5" fill="#a5f3fc" />
                <circle cx="120" cy="10" r="10" fill="#a5f3fc" opacity=".2" filter="url(#sylviaSoftGlow)" />
                <path d="M87 74 C99 86 131 85 151 63" fill="none" stroke="#d5d2ff" strokeWidth="2" strokeLinecap="round" opacity=".65" />
              </svg>
              {status.tone === 'working' && <span className="sylvia-avatar-spark sylvia-avatar-spark-one" aria-hidden="true">✦</span>}
              {status.tone === 'success' && <span className="sylvia-avatar-spark sylvia-avatar-spark-two" aria-hidden="true">✦</span>}
            </button>

            <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">{status.headline}</h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{status.detail}</p>
            <div className={'mt-4 flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] ' + statusBorder[status.tone]}>
              <span className={'h-1.5 w-1.5 rounded-full ' + statusDot[status.tone]} />
              <span className={statusText[status.tone]}>{status.label}</span>

            </div>
          </section>

          {waitingApprovals.length > 0 && (
            <button type="button" onClick={() => onOpenWorkspace('chat')} className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] p-3.5 text-left transition hover:bg-amber-400/[0.11]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-300/10 text-amber-200"><Clock3 className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-amber-100">{waitingApprovals.length === 1 ? 'One action needs your approval' : waitingApprovals.length + ' actions need your approval'}</div>
                <div className="mt-0.5 truncate text-xs text-amber-100/65">{waitingApprovals[0].title}</div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-amber-200" />
            </button>
          )}

          <section className="sylvia-companion-panel rounded-[24px] border border-white/[0.09] bg-[#0a0f1b]/85 p-3.5 shadow-2xl shadow-black/25 backdrop-blur-2xl sm:p-4">
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="text-xs font-semibold text-slate-200">Talk to Sylvia</div>
              <button type="button" onClick={onToggleVoiceOutput} className={'rounded-lg p-2 transition ' + (voiceOutputEnabled ? 'text-indigo-200 hover:bg-indigo-400/10' : 'text-slate-500 hover:bg-white/5 hover:text-slate-200')} title={voiceOutputEnabled ? 'Mute spoken replies' : 'Enable spoken replies'} aria-label={voiceOutputEnabled ? 'Mute spoken replies' : 'Enable spoken replies'}>
                {voiceOutputEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
            </div>
            <form onSubmit={submitCommand} className="rounded-[18px] border border-white/10 bg-[#050912] p-2 transition focus-within:border-indigo-300/35">
              <textarea value={command} onChange={event => setCommand(event.target.value)} rows={2} maxLength={6000} placeholder={isListening ? 'Listening… speak now or type here' : 'Ask Sylvia to do something…'} className="max-h-32 min-h-[54px] w-full resize-y bg-transparent px-2 py-1.5 text-sm leading-6 text-white outline-none placeholder:text-slate-500" aria-label="Command for Sylvia" />
              <div className="flex items-center justify-between gap-2 border-t border-white/[0.06] pt-2">
                <button type="button" onClick={onToggleListening} className={'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition ' + (isListening ? 'bg-sky-400/15 text-sky-200' : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-100')} aria-pressed={isListening}>
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}{isListening ? 'Stop listening' : 'Speak'}
                </button>
                <button type="submit" disabled={!command.trim() || busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40">
                  {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}{busy ? 'Working' : 'Send'}
                </button>
              </div>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              {['Find emails I need to reply to', 'What should I do next?', 'Check my calendar'].map(prompt => (
                <button type="button" key={prompt} onClick={() => setCommand(prompt)} className="rounded-full border border-white/[0.09] bg-white/[0.025] px-3 py-1.5 text-[11px] text-slate-400 transition hover:border-indigo-300/25 hover:bg-indigo-400/[0.07] hover:text-indigo-100">{prompt}</button>
              ))}
            </div>
          </section>

          <section className="mt-5">
            <div className="mb-3 flex items-center justify-between px-1">
              <div><h2 className="text-sm font-semibold text-white">Quick access</h2><p className="mt-1 text-xs text-slate-500">Open a workspace without losing Sylvia.</p></div>
              <button type="button" onClick={() => onOpenWorkspace(activeView)} className="inline-flex items-center gap-1 text-xs text-indigo-200 transition hover:text-white">Full workspace <ArrowRight className="h-3.5 w-3.5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {quickActions.map(action => (
                <button type="button" key={action.view} onClick={() => onOpenWorkspace(action.view)} className="group flex min-h-[82px] items-center gap-3 rounded-2xl border border-white/[0.075] bg-white/[0.025] p-3 text-left transition hover:border-white/15 hover:bg-white/[0.055] active:scale-[0.99]">
                  <span className={'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ' + action.tone}>{action.icon}</span>
                  <span className="min-w-0 flex-1"><span className="block text-sm font-medium text-slate-100">{action.label}</span><span className="mt-1 block text-[10px] leading-4 text-slate-500">{action.description}</span></span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-slate-300" />
                </button>
              ))}
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-white/[0.075] bg-white/[0.025] p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2"><div className="flex items-center gap-2 text-xs font-semibold text-slate-200"><Activity className="h-3.5 w-3.5 text-indigo-300" />Recent conversation</div><button type="button" onClick={() => onOpenWorkspace('chat')} className="text-[11px] text-slate-500 hover:text-slate-200">Open chat</button></div>
            {recentMessages.length > 0 ? (
              <div className="space-y-2">
                {recentMessages.map(message => (
                  <div key={message.id} className="rounded-xl border border-white/[0.05] bg-black/15 px-3 py-2.5">
                    <div className="mb-1 flex items-center justify-between gap-3"><span className={'text-[10px] font-semibold ' + (message.sender === 'user' ? 'text-slate-400' : 'text-indigo-200')}>{message.sender === 'user' ? 'YOU' : message.specialistName || 'SYLVIA'}</span><span className="text-[10px] text-slate-600">{message.timestamp}</span></div>
                    <p className="line-clamp-3 whitespace-pre-line break-words text-xs leading-5 text-slate-300">{message.text.replace(/\*\*/g, '').replace(/\x60/g, '').slice(0, 350)}</p>
                    {message.approvalRequest && message.approvalRequest.status === 'WAITING' && <button type="button" onClick={() => onOpenWorkspace('chat')} className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-amber-200">Review approval <ChevronRight className="h-3 w-3" /></button>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl bg-black/15 px-3 py-3 text-xs text-slate-500"><Sparkles className="h-4 w-4 shrink-0 text-indigo-300" />Your conversation will appear here.</div>
            )}
          </section>
        </main>

        <footer className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4 text-[10px] text-slate-600">
          <span className="flex min-w-0 items-center gap-1.5 truncate">{health.connected ? <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" /> : <XCircle className="h-3 w-3 shrink-0 text-slate-500" />}{health.connected ? 'Sylvia backend connected' : 'Backend connection not confirmed yet'}</span>
          <button type="button" onClick={() => onOpenWorkspace('activity')} className="shrink-0 transition hover:text-slate-300">Activity details</button>
        </footer>
      </div>
    </div>
  );
};

export default SylviaCompanionHome;
