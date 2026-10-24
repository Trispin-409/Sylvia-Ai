import React, { useEffect, useState } from 'react';
import { useSylvia } from './hooks/useSylvia';
import { useVoice } from './hooks/useVoice';
import { StarField } from './components/StarField';
import { Sidebar } from './components/Sidebar';
import { RightPanel } from './components/RightPanel';
import { ChatPanel } from './components/ChatPanel';
import { CommandBar } from './components/CommandBar';
import { SpecialistGraph } from './components/SpecialistGraph';
import { MissionControl } from './components/MissionControl';
import { GmailPanel } from './components/GmailPanel';
import { CalendarPanel } from './components/CalendarPanel';
import { MemoryPanel } from './components/MemoryPanel';
import { ActivityFeed } from './components/ActivityFeed';
import { DiagnosticsPanel } from './components/DiagnosticsPanel';
import { CommandPalette } from './components/CommandPalette';
import { OnboardingModal } from './components/OnboardingModal';
import { SylviaCompanionHome } from './components/SylviaCompanionHome';
import { MissionPanel } from './components/MissionPanel';
import { SylviaDotPal, type SylviaPalAgentState } from './components/SylviaDotPal';
import { NavView } from './types';
import { DotPal, cleanCustom, registerCustom } from 'dotpals';
import { Menu, Dna, Minimize2, PanelRightOpen, PanelRightClose } from 'lucide-react';

export function App() {
  const {
    state: sylviaState,
    activeView,
    setActiveView,
    chatMessages,
    specialists,
    mission,
    decisionDNA,
    contextMemories,
    gmailMessages,
    calendarEvents,
    pendingApprovals,
    activities,
    health,
    agentCard,
    activeDelegationPath,
    activeSpecialistNode,
    sendMessage,
    startNewConversation,
    approveAction,
    cancelAction,
    updateMissionStepStatus,
    addDecisionRule,
    addContextMemory,
    runDemoSequence,
    refreshHealth,
    updateBackendUrl,
  } = useSylvia();

  const {
    isListening: browserIsListening,
    startListening,
    stopListening,
    audioLevel,
    transcript: browserTranscript,
    voiceOutputEnabled,
    toggleVoiceOutput,
    speak,
  } = useVoice();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  );
  const [rightPanelOpen, setRightPanelOpen] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches
  );
  const [workspaceExpanded, setWorkspaceExpanded] = useState(false);
  const [workspaceCharacter, setWorkspaceCharacter] = useState('blu');
  const [nativeVoiceState, setNativeVoiceState] = useState<SylviaNativeVoiceState>({ isListening: false, transcript: '' });
  const isNativeAndroid = typeof window !== 'undefined' && Boolean(window.SylviaAndroid?.isNativeApp());
  const isNativeCompanionOverlay = isNativeAndroid && Boolean(window.SylviaAndroid?.isCompanionOverlay());
  const isListening = isNativeAndroid ? nativeVoiceState.isListening : browserIsListening;
  const transcript = isNativeAndroid ? (nativeVoiceState.transcript || '') : browserTranscript;

  useEffect(() => {
    if (voiceOutputEnabled && chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (lastMsg.sender === 'sylvia' && !lastMsg.approvalRequest) {
        if (isNativeAndroid) window.SylviaAndroid?.speakText(lastMsg.text);
        else speak(lastMsg.text);
      }
    }
  }, [chatMessages, voiceOutputEnabled, speak, isNativeAndroid]);

  useEffect(() => {
    const handleNativeVoiceState = (event: Event) => {
      const detail = (event as CustomEvent<SylviaNativeVoiceState>).detail;
      if (!detail) return;
      setNativeVoiceState({
        isListening: Boolean(detail.isListening),
        transcript: typeof detail.transcript === 'string' ? detail.transcript : '',
      });
      if (detail.error) {
        console.warn('Sylvia native voice:', detail.error);
      }
    };
    window.addEventListener('sylvia:native-voice-state', handleNativeVoiceState);
    return () => window.removeEventListener('sylvia:native-voice-state', handleNativeVoiceState);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleListening = () => {
    if (isNativeAndroid) {
      window.SylviaAndroid?.toggleListening();
      return;
    }
    if (isListening) stopListening();
    else startListening();
  };

  const handleSendMessage = (text: string) => {
    const lower = text.toLowerCase();
    const isWorkspaceRequest =
      lower.includes('gmail') ||
      lower.includes('email') ||
      lower.includes('inbox') ||
      lower.includes('calendar') ||
      lower.includes('meeting') ||
      lower.includes('schedule');

    if (isWorkspaceRequest) {
      if (lower.includes('calendar') || lower.includes('meeting') || lower.includes('schedule')) {
        setActiveView('workspace-calendar');
      } else {
        setActiveView('workspace-gmail');
      }
    }

    sendMessage(text);
  };

  useEffect(() => {
    const handleNativeOpenWorkspace = (event: Event) => {
      const detail = (event as CustomEvent<{ view?: string; prompt?: string }>).detail;
      if (!detail) return;
      const allowedViews: NavView[] = [
        'chat', 'specialists', 'missions', 'memory', 'workspace-gmail',
        'workspace-calendar', 'activity', 'mission-control',
      ];
      const view = allowedViews.includes(detail.view as NavView) ? detail.view as NavView : 'chat';
      setActiveView(view);
      setWorkspaceExpanded(true);
      if (detail.prompt?.trim()) sendMessage(detail.prompt.trim());
    };
    window.addEventListener('sylvia:native-expand-workspace', handleNativeOpenWorkspace);
    return () => window.removeEventListener('sylvia:native-expand-workspace', handleNativeOpenWorkspace);
  }, [sendMessage, setActiveView]);

  useEffect(() => {
    try {
      const savedSelection = window.localStorage.getItem('sylvia.dotpals.selected-pal.v1');
      if (savedSelection) setWorkspaceCharacter(savedSelection);

      const rawCustom = window.localStorage.getItem('sylvia.dotpals.custom-pal.v1');
      if (rawCustom) {
        const customPal = cleanCustom(JSON.parse(rawCustom));
        if (customPal) {
          registerCustom(customPal, 'sylvia-custom-pal');
          DotPal.refresh('sylvia-custom-pal');
        }
      }
    } catch {
      // A missing or invalid saved pal falls back to the built-in companion.
    }
  }, [workspaceExpanded]);

  useEffect(() => {
    if (activeView === 'mission-control') setRightPanelOpen(false);
  }, [activeView]);

  const workspacePalState: SylviaPalAgentState =
    isListening || sylviaState === 'LISTENING'
      ? 'listening'
      : sylviaState === 'THINKING' || sylviaState === 'ANALYZING'
      ? 'thinking'
      : sylviaState === 'WORKING'
      ? 'working'
      : sylviaState === 'WAITING_FOR_APPROVAL'
      ? 'waiting'
      : sylviaState === 'COMPLETED'
      ? 'done'
      : sylviaState === 'ERROR'
      ? 'error'
      : 'idle';

  if (!workspaceExpanded) {
    return (
      <SylviaCompanionHome
        activeView={activeView}
        state={sylviaState}
        health={health}
        chatMessages={chatMessages}
        pendingApprovals={pendingApprovals}
        isListening={isListening}
        voiceOutputEnabled={voiceOutputEnabled}
        transcript={transcript}
        onSendMessage={text => {
          const lower = text.toLowerCase();
          const isWorkspaceRequest = /gmail|email|inbox|calendar|meeting|schedule/.test(lower);
          const view: NavView = /calendar|meeting|schedule/.test(lower) ? 'workspace-calendar' : 'workspace-gmail';
          if (isNativeCompanionOverlay && isWorkspaceRequest) {
            window.SylviaAndroid?.expandCompanion(view, text);
            return;
          }
          handleSendMessage(text);
          if (isWorkspaceRequest) setWorkspaceExpanded(true);
        }}
        onToggleListening={handleToggleListening}
        onToggleVoiceOutput={toggleVoiceOutput}
        onOpenWorkspace={view => {
          if (isNativeCompanionOverlay) {
            window.SylviaAndroid?.expandCompanion(view);
            return;
          }
          setActiveView(view);
          setWorkspaceExpanded(true);
        }}
      />
    );
  }

  return (
    <div className="sylvia-workspace-shell relative flex h-[100dvh] w-screen overflow-hidden font-sans text-slate-100 select-none">
      <StarField sylviaState={sylviaState} />
      {sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm md:hidden"
          aria-label="Close sidebar overlay"
        />
      )}

      <div className={`sylvia-workspace-sidebar fixed inset-y-0 left-0 z-50 w-64 shrink-0 transform transition-all duration-300 ease-in-out md:relative md:inset-auto ${sidebarOpen ? 'translate-x-0 md:w-64' : '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden'}`}>
        <Sidebar
          activeView={activeView}
          onSelectView={view => {
            setActiveView(view);
            if (window.matchMedia('(max-width: 767px)').matches) {
              setSidebarOpen(false);
              setRightPanelOpen(false);
            }
          }}
          onClose={() => setSidebarOpen(false)}
          sylviaState={sylviaState}
          health={health}
          onOpenDiagnostics={() => {
            if (window.matchMedia('(max-width: 767px)').matches) {
              setSidebarOpen(false);
              setRightPanelOpen(false);
            }
            setShowDiagnostics(true);
          }}
          onNewConversation={() => {
            startNewConversation();
            if (window.matchMedia('(max-width: 767px)').matches) {
              setSidebarOpen(false);
              setRightPanelOpen(false);
            }
          }}
          unreadGmailCount={gmailMessages.filter(m => m.unread).length}
          pendingApprovalCount={pendingApprovals.length}
        />
      </div>

      {rightPanelOpen && activeView !== 'mission-control' && (
        <button
          type="button"
          onClick={() => setRightPanelOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          aria-label="Close intelligence panel overlay"
        />
      )}

      <div className="sylvia-workspace-main relative z-10 flex h-full min-w-0 flex-1 flex-col">
        <header className="sylvia-workspace-topbar relative z-30 flex shrink-0 items-center justify-between gap-2 px-3 py-2.5 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen(open => !open)}
              className="sylvia-workspace-control"
              aria-label={sidebarOpen ? 'Close navigation sidebar' : 'Open navigation sidebar'}
              aria-expanded={sidebarOpen}
              title={sidebarOpen ? 'Close navigation' : 'Open navigation'}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden min-w-0 sm:block">
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200/70">Sylvia</div>
              <div className="text-xs text-slate-400">AI workspace</div>
            </div>
          </div>

          <div className="sylvia-workspace-center-brand">
            {activeView !== 'chat' && (
              <SylviaDotPal
                character={workspaceCharacter}
                state={workspacePalState}
                size={58}
                text={workspacePalState === 'idle' ? undefined : sylviaState.replace(/_/g, ' ').toLowerCase()}
                className="sylvia-workspace-pal"
              />
            )}
            <div className={activeView === 'chat' ? 'text-center' : 'hidden text-left sm:block'}>
              <div className="font-display text-sm font-bold tracking-[0.18em] text-slate-100">SYLVIA</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-emerald-200/65">Your AI companion</div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {activeView !== 'mission-control' && (
              <button
                type="button"
                onClick={() => setRightPanelOpen(open => !open)}
                className="sylvia-workspace-control"
                aria-label={rightPanelOpen ? 'Close intelligence panel' : 'Open intelligence panel'}
                aria-expanded={rightPanelOpen}
                title={rightPanelOpen ? 'Close intelligence panel' : 'Open intelligence panel'}
              >
                {rightPanelOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRightOpen className="h-5 w-5" />}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (isNativeAndroid) {
                  window.SylviaAndroid?.collapseCompanion();
                  return;
                }
                setWorkspaceExpanded(false);
              }}
              className="sylvia-workspace-control sylvia-workspace-return"
              aria-label="Minimize to Sylvia companion"
              title="Return to Sylvia companion"
            >
              <Minimize2 className="h-4 w-4" />
              <span className="hidden sm:inline">Companion</span>
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative">
          {activeView === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
              <div className="sylvia-workspace-chat-stage">
                <div className="sylvia-workspace-chat-character-entry">
                  <button
                    type="button"
                    className="sylvia-workspace-chat-pal"
                    onClick={handleToggleListening}
                    aria-label={isListening ? 'Stop listening to Sylvia' : 'Speak to Sylvia'}
                    title={isListening ? 'Stop listening' : 'Tap to talk to Sylvia'}
                  >
                    <SylviaDotPal
                      character={workspaceCharacter}
                      state={workspacePalState}
                      size={96}
                      text={workspacePalState === 'idle' ? undefined : sylviaState.replace(/_/g, ' ').toLowerCase()}
                      className="sylvia-workspace-chat-dotpal"
                    />
                  </button>
                </div>
                <div className="flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-200/70">
                  <span className={'h-1.5 w-1.5 rounded-full ' + (
                    isListening || sylviaState === 'LISTENING'
                      ? 'bg-emerald-300 animate-pulse'
                      : ['THINKING', 'ANALYZING', 'WORKING'].includes(sylviaState)
                      ? 'bg-emerald-300 animate-pulse'
                      : sylviaState === 'WAITING_FOR_APPROVAL'
                      ? 'bg-amber-300 animate-pulse'
                      : sylviaState === 'ERROR'
                      ? 'bg-rose-400'
                      : 'bg-emerald-400'
                  )} />
                  {isListening || sylviaState === 'LISTENING'
                    ? 'Listening to you'
                    : sylviaState === 'THINKING' || sylviaState === 'ANALYZING'
                    ? 'Thinking through your request'
                    : sylviaState === 'WORKING'
                    ? 'Working on it'
                    : sylviaState === 'WAITING_FOR_APPROVAL'
                    ? 'Waiting for your approval'
                    : sylviaState === 'COMPLETED'
                    ? 'Task completed'
                    : sylviaState === 'ERROR'
                    ? 'Needs attention'
                    : health.connected ? 'Sylvia is online' : 'Sylvia is ready'}
                </div>
              </div>
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <ChatPanel messages={chatMessages} onApproveAction={approveAction} onCancelAction={cancelAction} />
              </div>
              <div className="flex-shrink-0">
                <CommandBar
                  onSendMessage={handleSendMessage}
                  sylviaState={sylviaState}
                  isListening={isListening}
                  onToggleListening={handleToggleListening}
                  voiceOutputEnabled={voiceOutputEnabled}
                  onToggleVoiceOutput={toggleVoiceOutput}
                  audioLevel={audioLevel}
                  transcript={transcript}
                />
              </div>
            </div>
          )}

          {activeView === 'specialists' && (
            <SpecialistGraph specialists={specialists} activeDelegationPath={activeDelegationPath} activeSpecialistNode={activeSpecialistNode} onSimulateDelegation={runDemoSequence} />
          )}

          {activeView === 'mission-control' && (
            <MissionControl mission={mission} onClose={() => setActiveView('chat')} onUpdateStepStatus={updateMissionStepStatus} />
          )}

          {activeView === 'missions' && (
            <div className="sylvia-workspace-feature-scroll h-full min-h-0 w-full overflow-y-auto p-4 sm:p-6">
              <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-emerald-900/40 bg-[#041009]/75 shadow-2xl shadow-black/20">
                <div className="border-b border-emerald-900/40 px-4 py-3 sm:px-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200/70">Missions</div>
                  <h2 className="mt-1 font-display text-lg font-semibold text-slate-100">Mission Ledger</h2>
                  <p className="mt-1 text-xs text-slate-400">Review the current mission, update steps, or open the full mission roadmap.</p>
                </div>
                <MissionPanel
                  mission={mission}
                  onUpdateStepStatus={updateMissionStepStatus}
                  onOpenFullMissionControl={() => { setRightPanelOpen(false); setActiveView('mission-control'); }}
                />
              </div>
            </div>
          )}

          {activeView === 'workspace-gmail' && (
            <GmailPanel
              messages={gmailMessages}
              onDraftReply={msg => {
                sendMessage(`Please draft a reply to ${msg.sender} for the thread: "${msg.subject}"`);
              }}
              pendingApprovals={pendingApprovals}
              onApproveAction={approveAction}
              onCancelAction={cancelAction}
              workspaceHealth={health.workspace}
            />
          )}

          {activeView === 'workspace-calendar' && (
            <CalendarPanel events={calendarEvents} workspaceHealth={health.workspace} />
          )}

          {activeView === 'memory' && (
            <div className="p-6 max-w-4xl mx-auto w-full h-full overflow-y-auto">
              <div className="mb-4 pb-2 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-display font-bold text-slate-100 flex items-center gap-2"><Dna className="w-5 h-5 text-purple-400" />Decision DNA & Context Memory</h2>
                  <p className="text-xs text-slate-400">Persistent alignment constraints, objectives, and working style rules</p>
                </div>
              </div>
              <MemoryPanel decisionDNA={decisionDNA} contextMemories={contextMemories} onAddDecisionRule={addDecisionRule} onAddContextMemory={addContextMemory} />
            </div>
          )}

          {activeView === 'activity' && (
            <div className="p-6 max-w-4xl mx-auto w-full h-full overflow-y-auto"><ActivityFeed activities={activities} /></div>
          )}
        </main>
      </div>

      {activeView !== 'mission-control' && (
        <div className={`sylvia-workspace-right-drawer fixed inset-y-0 right-0 z-50 flex w-[min(88vw,24rem)] shrink-0 transform transition-[transform,width,opacity] duration-300 ease-in-out lg:relative lg:inset-auto ${rightPanelOpen ? 'translate-x-0 opacity-100 pointer-events-auto lg:w-80 xl:w-96' : 'translate-x-full opacity-0 pointer-events-none lg:translate-x-0 lg:w-0'}`}>
          <RightPanel
            mission={mission}
            decisionDNA={decisionDNA}
            contextMemories={contextMemories}
            activities={activities}
            onUpdateStepStatus={updateMissionStepStatus}
            onAddDecisionRule={addDecisionRule}
            onAddContextMemory={addContextMemory}
            onOpenFullMissionControl={() => setActiveView('mission-control')}
            onClose={() => setRightPanelOpen(false)}
          />
        </div>
      )}

      <DiagnosticsPanel isOpen={showDiagnostics} onClose={() => setShowDiagnostics(false)} health={health} agentCard={agentCard} onRefreshHealth={refreshHealth} onUpdateBackendUrl={updateBackendUrl} />

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onSelectAction={(view, prompt) => { setActiveView(view); if (prompt) handleSendMessage(prompt); }}
        onOpenDiagnostics={() => { setShowCommandPalette(false); setShowDiagnostics(true); }}
      />

      {showOnboarding && <OnboardingModal health={health} onEnterSylvia={() => setShowOnboarding(false)} />}
    </div>
  );
}

export default App;
