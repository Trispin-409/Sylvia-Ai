import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowRight, ArrowUp, Brain, CalendarDays, CheckCircle2, ChevronRight,
  Clock3, Expand, LoaderCircle, Mail, MessageCircle, Mic, MicOff, Network, Plus, Sparkles, Target,
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
          </div>
        </header>

        <main className="flex flex-1 flex-col">
          <section className="flex flex-col items-center pb-5 pt-7 text-center sm:pt-9">
            <div className={'sylvia-reference-island sylvia-reference-island-' + status.tone} aria-label="Sylvia companion island">
              <div className="sylvia-island-controls sylvia-island-controls-left">
                <button type="button" onClick={() => onOpenWorkspace('chat')} className="sylvia-island-icon" aria-label="Open Sylvia chat" title="Chat">
                  <MessageCircle className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setCommand('What should we work on?')} className="sylvia-island-icon" aria-label="Start a new request" title="New request">
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                className={'sylvia-mochi-button sylvia-mochi-' + status.tone}
                onClick={onToggleListening}
                aria-label={isListening ? 'Stop listening to Sylvia' : 'Speak to Sylvia'}
                title={isListening ? 'Stop listening' : 'Tap to talk to Sylvia'}
              >
                <svg className="sylvia-mochi-art" viewBox="0 0 100 82" role="img" aria-label="Sylvia's little companion character">
                  <defs>
                    <linearGradient id="sylviaMochiBody" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#dfe6ff" />
                    </linearGradient>
                    <filter id="sylviaMochiGlow" x="-80%" y="-80%" width="260%" height="260%">
                      <feGaussianBlur stdDeviation="4" />
                    </filter>
                  </defs>
                  <ellipse cx="50" cy="70" rx="22" ry="5" fill="#8b9cff" opacity=".35" filter="url(#sylviaMochiGlow)" />
                  <g className="sylvia-mochi-arms">
                    <path d="M25 42 C16 39 12 45 15 51 C18 57 24 54 28 50" fill="url(#sylviaMochiBody)" />
                    <path d="M75 42 C84 39 88 45 85 51 C82 57 76 54 72 50" fill="url(#sylviaMochiBody)" />
                  </g>
                  <path className="sylvia-mochi-body" d="M24 20 C28 11 39 9 50 9 C63 9 74 13 77 23 C81 34 78 51 73 58 C68 65 59 67 50 67 C39 67 30 64 25 57 C19 49 19 31 24 20 Z" fill="url(#sylviaMochiBody)" />
                  <ellipse cx="41" cy="35" rx="3.1" ry="4.7" fill="#171827" />
                  <ellipse cx="59" cy="35" rx="3.1" ry="4.7" fill="#171827" />
                  <circle cx="40" cy="33.5" r="1" fill="#fff" opacity=".9" />
                  <circle cx="58" cy="33.5" r="1" fill="#fff" opacity=".9" />
                  <path d="M45 48 Q50 51 55 48" stroke="#999ebd" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity=".9" />
                </svg>
                {isListening && <span className="sylvia-mochi-listening-ring" aria-hidden="true" />}
              </button>

              <div className="sylvia-island-controls sylvia-island-controls-right">
                <span className={'sylvia-island-status-dot ' + statusDot[status.tone]} title={status.label} aria-label={status.label} />
                <button type="button" onClick={onToggleVoiceOutput} className="sylvia-island-icon" title={voiceOutputEnabled ? 'Mute spoken replies' : 'Enable spoken replies'} aria-label={voiceOutputEnabled ? 'Mute spoken replies' : 'Enable spoken replies'}>
                  {voiceOutputEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
                <button type="button" onClick={() => onOpenWorkspace(activeView)} className="sylvia-island-icon sylvia-island-expand" aria-label="Open full Sylvia workspace" title="Open full workspace">
                  <Expand className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-[11px] font-medium tracking-wide text-slate-400">
              <span className={'h-1.5 w-1.5 rounded-full ' + statusDot[status.tone]} />
              <span>{status.label.toUpperCase()}</span>
              <span className="h-3 w-px bg-white/10" />
              <span>{health.connected ? 'SYLVIA ONLINE' : 'WAITING FOR CONNECTION'}</span>
            </div>
            <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">{status.headline}</h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{status.detail}</p>
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
