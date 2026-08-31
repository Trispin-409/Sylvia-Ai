import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Paperclip,
  Sparkles,
  Command,
  ArrowUp,
  FileText,
} from 'lucide-react';
import { SylviaState } from '../types';

interface CommandBarProps {
  onSendMessage: (text: string) => void;
  sylviaState: SylviaState;
  isListening: boolean;
  onToggleListening: () => void;
  voiceOutputEnabled: boolean;
  onToggleVoiceOutput: () => void;
  audioLevel?: number[];
  transcript?: string;
}

const QUICK_PROMPTS = [
  'Find the emails I need to reply to.',
  'Start a mission to organize my business operations.',
  'Check my calendar tomorrow.',
  'Create a draft reply to Travis.',
  'Analyze this problem and give me the next three actions.',
];

export const CommandBar: React.FC<CommandBarProps> = ({
  onSendMessage,
  sylviaState,
  isListening,
  onToggleListening,
  voiceOutputEnabled,
  onToggleVoiceOutput,
  audioLevel = [],
  transcript = '',
}) => {
  const [inputText, setInputText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync speech recognition transcript into input
  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
    if (isListening) {
      onToggleListening();
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInputText(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const isBusy =
    sylviaState === 'THINKING' ||
    sylviaState === 'ANALYZING' ||
    sylviaState === 'WORKING';

  return (
    <div
      id="sylvia-command-console"
      className="w-full max-w-4xl mx-auto px-4 pb-4 pt-1 select-none z-20"
    >
      {/* Quick Action Prompt Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-1 scrollbar-none no-scrollbar text-[11px]">
        <span className="text-slate-400 font-mono-code flex items-center gap-1 pl-1 whitespace-nowrap">
          <Sparkles className="w-3 h-3 text-indigo-400" /> Prompts:
        </span>
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handlePromptClick(prompt)}
            className="px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-200 border border-slate-800 hover:border-indigo-500/40 whitespace-nowrap transition-all text-left"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Main Console Command Box */}
      <div className="relative rounded-2xl glass-panel-elevated p-2 border border-slate-700/70 focus-within:border-indigo-500/80 transition-all shadow-2xl">
        {/* Live Audio Visualizer Banner if listening */}
        {isListening && (
          <div className="flex items-center justify-between px-3 py-1.5 mb-2 rounded-xl bg-sky-950/40 border border-sky-500/30 text-xs text-sky-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span className="font-mono-code font-medium">Sylvia Listening...</span>
            </div>

            {/* Audio Waveform Bars */}
            <div className="flex items-center gap-1 h-4">
              {audioLevel.map((level, i) => (
                <div
                  key={i}
                  className="w-1 bg-sky-400 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(4, level * 16)}px` }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-end gap-2 px-1">
          {/* File Attachment / Context Button */}
          <button
            title="Attach Workspace Artifact"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Voice Output Toggle */}
          <button
            onClick={onToggleVoiceOutput}
            title={voiceOutputEnabled ? 'Voice Synthesis Active' : 'Voice Synthesis Muted'}
            className={`p-2 rounded-xl transition-colors ${
              voiceOutputEnabled
                ? 'text-indigo-400 hover:bg-indigo-950/50'
                : 'text-slate-400 hover:bg-slate-800/60'
            }`}
          >
            {voiceOutputEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Console Text Input */}
          <textarea
            ref={textareaRef}
            id="sylvia-command-input"
            rows={1}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell Sylvia what you want to accomplish..."
            disabled={isBusy}
            className="flex-1 bg-transparent border-0 resize-none outline-none text-slate-100 placeholder:text-slate-400 text-xs md:text-sm py-2 px-1 max-h-32 min-h-[38px] font-sans"
          />

          {/* Voice Input Microphone Button */}
          <button
            id="btn-voice-input"
            onClick={onToggleListening}
            title={isListening ? 'Stop Listening' : 'Speak to Sylvia (Web Speech)'}
            className={`p-2.5 rounded-xl transition-all ${
              isListening
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/40 animate-pulse'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          {/* Send Execution Button */}
          <button
            id="btn-send-command"
            onClick={handleSend}
            disabled={!inputText.trim() || isBusy}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
              inputText.trim() && !isBusy
                ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95'
                : 'bg-slate-800/60 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isBusy ? (
              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </div>

        {/* Console shortcut hint footer */}
        <div className="flex items-center justify-between px-2 pt-1.5 mt-1 border-t border-slate-800/40 text-[10px] font-mono-code text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
              Return ↵
            </span>
            <span>to execute</span>
          </div>

          <div className="flex items-center gap-1">
            <span>Press</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-indigo-300">
              ⌘K
            </span>
            <span>for Command Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
};
