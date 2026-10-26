import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, ArrowRight, ArrowUp, Brain, BriefcaseBusiness, CalendarDays, CheckCircle2, ChevronRight,
  Clock3, Expand, LoaderCircle, Mail, MessageCircle, Mic, MicOff, Network, Plus, Sparkles, Target,
  Volume2, VolumeX, Wifi, WifiOff, XCircle, Palette,
} from 'lucide-react';
import { ApprovalRequest, BackendHealth, ChatItem, NavView, SylviaState } from '../types';
import { DotPal, cleanCustom, registerCustom, type CustomPal } from 'dotpals';
import { SylviaDotPal, type SylviaPalAgentState } from './SylviaDotPal';

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


function getDotPalState(state: SylviaState, isListening: boolean): SylviaPalAgentState {
  if (isListening || state === 'LISTENING') return 'listening';
  switch (state) {
    case 'THINKING':
    case 'ANALYZING':
      return 'thinking';
    case 'WORKING':
      return 'working';
    case 'WAITING_FOR_APPROVAL':
      return 'waiting';
    case 'COMPLETED':
      return 'done';
    case 'ERROR':
      return 'error';
    default:
      return 'idle';
  }
}

const DOTPALS_CHARACTERS = [
  { id: 'blu', label: 'Blu · blue cloud' },
  { id: 'hop', label: 'Hop · frog' },
  { id: 'sunny', label: 'Sunny · gumdrop' },
  { id: 'lovi', label: 'Lovi · heart' },
  { id: 'muse', label: 'Muse · flame' },
  { id: 'grok', label: 'Grok · visor bot' },
  { id: 'nova', label: 'Nova · light-bulb bot' },
  { id: 'byte', label: 'Byte · pixel cat' },
  { id: 'webby', label: 'Webby · spider' },
] as const;

const CUSTOM_PAL_ID = 'sylvia-custom-pal';
const CUSTOM_PAL_STORAGE_KEY = 'sylvia.dotpals.custom-pal.v1';
const SELECTED_PAL_STORAGE_KEY = 'sylvia.dotpals.selected-pal.v1';

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
  { label: 'Career Bridge', description: 'Skills, pathways and work-readiness plan', icon: <BriefcaseBusiness className="h-5 w-5" />, view: 'career', tone: 'text-emerald-200 bg-emerald-400/10 border-emerald-400/15' },
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
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try { return window.localStorage.getItem('sylvia-theme') === 'dark' ? 'dark' : 'light'; }
    catch { return 'light'; }
  });
  const [selectedCharacter, setSelectedCharacter] = useState<string>('blu');
  const [hasCustomPal, setHasCustomPal] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [customShape, setCustomShape] = useState<NonNullable<CustomPal['shape']>>('round');
  const [customEyes, setCustomEyes] = useState<NonNullable<CustomPal['eyes']>>('round');
  const [customTop, setCustomTop] = useState<NonNullable<CustomPal['top']>>('sprout');
  const [customColor, setCustomColor] = useState('#8b7cff');
  const status = useMemo(() => getStatus(state, isListening), [state, isListening]);
  const dotPalState = useMemo(() => getDotPalState(state, isListening), [state, isListening]);
  const waitingApprovals = pendingApprovals.filter(item => item.status === 'WAITING');
  const recentMessages = chatMessages.slice(-2);
  const busy = ['THINKING', 'ANALYZING', 'WORKING'].includes(state) && !isListening;

  useEffect(() => {
    try {
      const rawCustom = window.localStorage.getItem(CUSTOM_PAL_STORAGE_KEY);
      let restoredCustom = false;
      if (rawCustom) {
        const saved = cleanCustom(JSON.parse(rawCustom));
        if (saved) {
          registerCustom(saved, CUSTOM_PAL_ID);
          DotPal.refresh(CUSTOM_PAL_ID);
          setHasCustomPal(true);
          setCustomShape(saved.shape);
          setCustomEyes(saved.eyes);
          setCustomTop(saved.top);
          setCustomColor(saved.color);
          restoredCustom = true;
        }
      }

      const savedSelection = window.localStorage.getItem(SELECTED_PAL_STORAGE_KEY);
      const isBuiltIn = DOTPALS_CHARACTERS.some(character => character.id === savedSelection);
      if (isBuiltIn || (savedSelection === CUSTOM_PAL_ID && restoredCustom)) {
        setSelectedCharacter(savedSelection!);
      }
    } catch {
      // A broken or unavailable saved pal never prevents Sylvia from loading.
    }
  }, []);

  const saveCustomPal = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const spec: CustomPal = {
      name: 'Sylvia',
      shape: customShape,
      eyes: customEyes,
      top: customTop,
      color: customColor,
      fur: true,
    };

    const saved = cleanCustom(spec);
    if (!saved) return;
    registerCustom(saved, CUSTOM_PAL_ID);
    DotPal.refresh(CUSTOM_PAL_ID);
    setHasCustomPal(true);
    setSelectedCharacter(CUSTOM_PAL_ID);
    try {
      window.localStorage.setItem(CUSTOM_PAL_STORAGE_KEY, JSON.stringify(saved));
      window.localStorage.setItem(SELECTED_PAL_STORAGE_KEY, CUSTOM_PAL_ID);
    } catch {
      // Character creation still works for the current session if storage is blocked.
    }
    setCustomizeOpen(false);
  };

  const chooseCharacter = (character: string) => {
    setSelectedCharacter(character);
    try {
      window.localStorage.setItem(SELECTED_PAL_STORAGE_KEY, character);
    } catch {
      // Character selection still works for the current session if storage is blocked.
    }
  };

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
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 pb-64 pt-4 sm:px-6 sm:pt-6">
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
        
          <button type="button" onClick={() => {
            const nextTheme = theme === 'light' ? 'dark' : 'light';
            setTheme(nextTheme);
            document.documentElement.dataset.sylviaTheme = nextTheme;
            try { window.localStorage.setItem('sylvia-theme', nextTheme); } catch { /* Theme still applies for this session. */ }
          }} className="sylvia-workspace-control inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm" aria-label="Change appearance" title="Change appearance">
            <Palette className="h-4 w-4" /><span>{theme === 'light' ? 'Light theme' : 'Dark theme'}</span>
          </button>
        </header>

        <main className="sylvia-main flex flex-1 flex-col">
          <section className="sylvia-hero-center" aria-label="Sylvia assistant">
            <div className="sylvia-character-stage">
              <div className="sylvia-character-entry">
                <button
                  type="button"
                  className={'sylvia-floating-pal sylvia-mochi-' + status.tone}
                  onClick={onToggleListening}
                  aria-label={isListening ? 'Stop listening to Sylvia' : 'Speak to Sylvia'}
                  title={isListening ? 'Stop listening' : 'Tap to talk to Sylvia'}
                >
                  <SylviaDotPal
                    character={selectedCharacter}
                    state={dotPalState}
                    size={132}
                    text={dotPalState === 'idle' ? undefined : status.headline}
                    className="sylvia-dotpal-character"
                  />
                </button>
              </div>
            </div>

            <div className="sylvia-hero-copy">
              <div className="flex items-center justify-center gap-2 text-[11px] font-medium tracking-wide text-slate-400">
                <span className={'h-1.5 w-1.5 rounded-full ' + statusDot[status.tone]} />
                <span>{status.label.toUpperCase()}</span>
                <span className="h-3 w-px bg-white/10" />
                <span>{health.connected ? 'SYLVIA ONLINE' : 'WAITING FOR CONNECTION'}</span>
              </div>
              <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">{status.headline}</h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{status.detail}</p>
            </div>
          </section>

          <div className="sylvia-pal-tools">
            <label className="sylvia-pal-picker">
              <span>Companion</span>
              <select
                value={selectedCharacter}
                onChange={event => chooseCharacter(event.target.value)}
                aria-label="Choose Sylvia's character"
              >
                {DOTPALS_CHARACTERS.map(character => (
                  <option key={character.id} value={character.id}>{character.label}</option>
                ))}
                {hasCustomPal && <option value={CUSTOM_PAL_ID}>My Sylvia · custom</option>}
              </select>
            </label>
            <button
              type="button"
              className="sylvia-pal-create-toggle"
              onClick={() => setCustomizeOpen(open => !open)}
              aria-expanded={customizeOpen}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {customizeOpen ? 'Close creator' : 'Create a pal'}
            </button>
          </div>

          {customizeOpen && (
            <form onSubmit={saveCustomPal} className="sylvia-pal-creator">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-white">Make your own companion</h2>
                  <p className="mt-1 text-xs text-slate-500">Built with Dotpals’ character creator.</p>
                </div>
                <span className="sylvia-pal-color-swatch" style={{ backgroundColor: customColor }} />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <label className="sylvia-pal-field">
                  <span>Body</span>
                  <select value={customShape} onChange={event => setCustomShape(event.target.value as NonNullable<CustomPal['shape']>)}>
                    <option value="round">Round</option>
                    <option value="square">Square</option>
                    <option value="blob">Fluffy</option>
                    <option value="tall">Tall</option>
                    <option value="heart">Heart</option>
                    <option value="bean">Frog</option>
                  </select>
                </label>
                <label className="sylvia-pal-field">
                  <span>Eyes</span>
                  <select value={customEyes} onChange={event => setCustomEyes(event.target.value as NonNullable<CustomPal['eyes']>)}>
                    <option value="dots">Dots</option>
                    <option value="round">Button</option>
                    <option value="googly">Googly</option>
                    <option value="pixel">Pixel</option>
                    <option value="visor">Visor</option>
                    <option value="shades">Shades</option>
                  </select>
                </label>
                <label className="sylvia-pal-field">
                  <span>Top</span>
                  <select value={customTop} onChange={event => setCustomTop(event.target.value as NonNullable<CustomPal['top']>)}>
                    <option value="none">Nothing</option>
                    <option value="ears">Cat ears</option>
                    <option value="horns">Horns</option>
                    <option value="antenna">Antenna</option>
                    <option value="sprout">Sprout</option>
                    <option value="sparkle">Sparkle</option>
                    <option value="bow">Bow</option>
                    <option value="crown">Crown</option>
                    <option value="beret">Beret</option>
                  </select>
                </label>
                <label className="sylvia-pal-field">
                  <span>Colour</span>
                  <input type="color" value={customColor} onChange={event => setCustomColor(event.target.value)} aria-label="Custom character colour" />
                </label>
              </div>
              <div className="mt-3 flex justify-end">
                <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-400">
                  <Sparkles className="h-3.5 w-3.5" /> Save my character
                </button>
              </div>
            </form>
          )}

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

          <section className="sylvia-chat-dock" aria-label="Talk to Sylvia">
            <form onSubmit={submitCommand} className="sylvia-chat-island">
              <button type="button" onClick={() => onOpenWorkspace('chat')} className="sylvia-chat-action" aria-label="Open chat history" title="Chat history">
                <MessageCircle className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setCommand('')} className="sylvia-chat-action sylvia-chat-new" aria-label="Clear and start a new request" title="New request">
                <Plus className="h-4 w-4" />
              </button>
              <textarea
                value={command}
                onChange={event => setCommand(event.target.value)}
                rows={1}
                maxLength={6000}
                placeholder={isListening ? 'Listening… speak now or type here' : 'Message Sylvia…'}
                className="sylvia-chat-textarea"
                aria-label="Command for Sylvia"
              />
              <button type="button" onClick={onToggleListening} className={'sylvia-chat-action ' + (isListening ? 'sylvia-chat-mic-active' : '')} aria-pressed={isListening} aria-label={isListening ? 'Stop listening' : 'Speak to Sylvia'} title={isListening ? 'Stop listening' : 'Speak'}>
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <button type="button" onClick={onToggleVoiceOutput} className="sylvia-chat-action hidden sm:inline-flex" aria-label={voiceOutputEnabled ? 'Mute spoken replies' : 'Enable spoken replies'} title={voiceOutputEnabled ? 'Mute spoken replies' : 'Enable spoken replies'}>
                {voiceOutputEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button type="button" onClick={() => onOpenWorkspace(activeView)} className="sylvia-chat-action hidden sm:inline-flex" aria-label="Open full Sylvia workspace" title="Open full workspace">
                <Expand className="h-4 w-4" />
              </button>
              <button type="submit" disabled={!command.trim() || busy} className="sylvia-chat-send" aria-label={busy ? 'Sylvia is working' : 'Send message'} title={busy ? 'Working' : 'Send message'}>
                {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              </button>
            </form>
            <div className="sylvia-chat-suggestions">
              {['Find emails I need to reply to', 'What should I do next?', 'Check my calendar'].map(prompt => (
                <button type="button" key={prompt} onClick={() => setCommand(prompt)} className="sylvia-chat-suggestion">{prompt}</button>
              ))}
              <button type="button" onClick={onToggleVoiceOutput} className="sylvia-chat-action sm:hidden" aria-label={voiceOutputEnabled ? 'Mute spoken replies' : 'Enable spoken replies'} title={voiceOutputEnabled ? 'Mute spoken replies' : 'Enable spoken replies'}>
                {voiceOutputEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button type="button" onClick={() => onOpenWorkspace(activeView)} className="sylvia-chat-action sm:hidden" aria-label="Open full Sylvia workspace" title="Open full workspace">
                <Expand className="h-4 w-4" />
              </button>
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
