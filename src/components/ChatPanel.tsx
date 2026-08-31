import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatItem, ToolExecution, ApprovalRequest } from '../types';
import {
  Sparkles,
  User,
  Brain,
  Scale,
  GitBranch,
  Mail,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';

interface ChatPanelProps {
  messages: ChatItem[];
  onApproveAction?: (approvalId: string) => void;
  onCancelAction?: (approvalId: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onApproveAction,
  onCancelAction,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const renderToolCard = (tool: ToolExecution) => {
    return (
      <div className="mt-2.5 p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs font-mono-code">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            {tool.toolName === 'GMAIL' && <Mail className="w-3.5 h-3.5" />}
            {tool.toolName === 'MISSION' && <GitBranch className="w-3.5 h-3.5" />}
            {tool.toolName === 'MEMORY' && <Brain className="w-3.5 h-3.5" />}
            {tool.toolName !== 'GMAIL' && tool.toolName !== 'MISSION' && tool.toolName !== 'MEMORY' && (
              <Sparkles className="w-3.5 h-3.5" />
            )}
          </div>
          <div>
            <div className="font-semibold text-slate-200">{tool.toolName}</div>
            <div className="text-[11px] text-slate-400 font-sans">{tool.action}</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px]">
          {tool.status === 'completed' && (
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed
            </span>
          )}
          {tool.status === 'waiting' && (
            <span className="flex items-center gap-1 text-amber-400 font-medium animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              Waiting
            </span>
          )}
          {tool.status === 'running' && (
            <span className="flex items-center gap-1 text-sky-400 font-medium">
              <div className="w-2.5 h-2.5 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
              Executing
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderApprovalCard = (appr: ApprovalRequest) => {
    return (
      <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-950 border border-amber-500/40 shadow-xl shadow-amber-950/20 text-xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-300 font-display font-bold tracking-wide">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>HUMAN APPROVAL REQUIRED</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            {appr.riskLevel} RISK WRITE ACTION
          </span>
        </div>

        <p className="text-slate-300 mb-2.5 leading-relaxed font-sans">{appr.description}</p>

        {appr.recipient && (
          <div className="mb-2 p-2 rounded bg-slate-950/60 border border-slate-800 font-mono-code text-[11px] space-y-1">
            <div className="text-slate-400">
              <span className="text-indigo-300">Recipient:</span> {appr.recipient}
            </div>
            {appr.subject && (
              <div className="text-slate-300">
                <span className="text-indigo-300">Subject:</span> {appr.subject}
              </div>
            )}
          </div>
        )}

        {appr.bodyPreview && (
          <div className="mb-3 p-2.5 rounded bg-slate-950/80 border border-slate-800 text-slate-300 text-[11px] font-sans whitespace-pre-line leading-relaxed">
            {appr.bodyPreview}
          </div>
        )}

        {appr.status === 'WAITING' ? (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onApproveAction && onApproveAction(appr.id)}
              className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Authorize & Create Draft</span>
            </button>
            <button
              onClick={() => onCancelAction && onCancelAction(appr.id)}
              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="p-2 rounded bg-slate-900/90 text-center font-mono-code text-[11px]">
            {appr.status === 'APPROVED' ? (
              <span className="text-emerald-400 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Action Authorized & Confirmed
              </span>
            ) : (
              <span className="text-slate-400">Action Cancelled</span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={scrollRef}
      id="sylvia-chat-stream"
      className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8 py-6 space-y-5 select-text"
    >
      <AnimatePresence initial={false}>
        {messages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          const isSpecialist = msg.sender === 'specialist';

          return (
            <motion.div
              key={msg.id ? `${msg.id}_${index}` : `chat_msg_${index}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              {/* Sender Tag */}
              <div className="flex items-center gap-2 mb-1 px-1">
                {isUser ? (
                  <span className="text-[11px] font-mono-code text-slate-400 flex items-center gap-1">
                    Operator <User className="w-3 h-3 text-slate-400" />
                  </span>
                ) : isSpecialist ? (
                  <span className="text-[11px] font-mono-code px-2 py-0.5 rounded-full bg-cyan-950/50 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                    <Brain className="w-3 h-3 text-cyan-400" />
                    {msg.specialistName || 'Specialist'}
                  </span>
                ) : (
                  <span className="text-[11px] font-mono-code text-indigo-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    Sylvia
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-mono-code">{msg.timestamp}</span>
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-xl p-3.5 rounded-2xl text-xs md:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600/30 text-slate-100 border border-indigo-500/40 rounded-tr-sm shadow-md'
                    : 'glass-panel-elevated text-slate-200 border-slate-800 rounded-tl-sm shadow-xl'
                }`}
              >
                <div className="whitespace-pre-line font-sans">
                  {msg.text.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className={idx > 0 ? 'mt-2' : ''}>
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Render Attached Tool Card */}
                {msg.toolExecution && renderToolCard(msg.toolExecution)}

                {/* Render Attached Human Approval Card */}
                {msg.approvalRequest && renderApprovalCard(msg.approvalRequest)}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
