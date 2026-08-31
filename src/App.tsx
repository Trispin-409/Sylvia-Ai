import React, { useState, useEffect } from 'react';
import { useSylvia } from './hooks/useSylvia';
import { useVoice } from './hooks/useVoice';
import { StarField } from './components/StarField';
import { SylviaPresence } from './components/SylviaPresence';
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
import { NavView } from './types';
import { Menu, Sparkles, Target, Dna } from 'lucide-react';

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
    isListening,
    startListening,
    stopListening,
    audioLevel,
    transcript,
    voiceOutputEnabled,
    toggleVoiceOutput,
    speak,
  } = useVoice();

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  useEffect(() => {
    if (voiceOutputEnabled && chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (lastMsg.sender === 'sylvia' && !lastMsg.approvalRequest) speak(lastMsg.text);
    }
  }, [chatMessages, voiceOutputEnabled, speak]);

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

    // Workspace commands open the relevant live workspace panel while the request
    // continues through the same A2A session. This keeps the UI aligned with the
    // real ADK Workspace Specialist instead of leaving the user in a generic chat.
    if (isWorkspaceRequest) {
      if (lower.includes('calendar') || lower.includes('meeting') || lower.includes('schedule')) {
        setActiveView('workspace-calendar');
      } else {
        setActiveView('workspace-gmail');
      }
    }

    sendMessage(text);
  };

  return (
    <div className="relative w-screen h-screen bg-[#030712] text-slate-100 flex overflow-hidden font-sans select-none">
      <StarField sylviaState={sylviaState} />

      <div className={`fixed inset-y-0 left-0 z-40 md:static transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <Sidebar
          activeView={activeView}
          onSelectView={view => { setActiveView(view); setMobileMenuOpen(false); }}
          sylviaState={sylviaState}
          health={health}
          onOpenDiagnostics={() => setShowDiagnostics(true)}
          unreadGmailCount={gmailMessages.filter(m => m.unread).length}
          pendingApprovalCount={pendingApprovals.length}
        />
      </div>

      <div className="flex-1 flex flex-col h-full min-w-0 relative z-10">
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md z-30">
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 font-display font-bold tracking-widest text-slate-100">
            <Sparkles className="w-4 h-4 text-indigo-400" /><span>SYLVIA</span>
          </div>
          <button onClick={() => setRightPanelOpen(prev => !prev)} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <Target className="w-5 h-5 text-indigo-400" />
          </button>
        </div>

        <main className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative">
          {activeView === 'chat' && (
            <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden relative">
              <div className="flex-shrink-0">
                <SylviaPresence sylviaState={sylviaState} health={health} isListening={isListening} audioLevel={audioLevel} />
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

          {activeView === 'workspace-gmail' && (
            <GmailPanel
              messages={gmailMessages}
              onDraftReply={msg => {
                sendMessage(`Please draft a reply to ${msg.sender} for the thread: "${msg.subject}"`);
              }}
              pendingApprovals={pendingApprovals}
              onApproveAction={approveAction}
              onCancelAction={cancelAction}
            />
          )}

          {activeView === 'workspace-calendar' && <CalendarPanel events={calendarEvents} />}

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
        <div className={`fixed inset-y-0 right-0 z-30 md:static transform transition-transform duration-300 ease-in-out ${rightPanelOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0 hidden md:flex'}`}>
          <RightPanel
            mission={mission}
            decisionDNA={decisionDNA}
            contextMemories={contextMemories}
            activities={activities}
            onUpdateStepStatus={updateMissionStepStatus}
            onAddDecisionRule={addDecisionRule}
            onAddContextMemory={addContextMemory}
            onOpenFullMissionControl={() => setActiveView('mission-control')}
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
