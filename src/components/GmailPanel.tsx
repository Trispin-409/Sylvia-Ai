import React, { useState } from 'react';
import { GmailMessage, ApprovalRequest } from '../types';
import {
  Mail,
  Send,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
  Inbox,
  AlertCircle,
} from 'lucide-react';

interface GmailPanelProps {
  messages: GmailMessage[];
  onDraftReply: (msg: GmailMessage) => void;
  pendingApprovals: ApprovalRequest[];
  onApproveAction: (approvalId: string) => void;
  onCancelAction: (approvalId: string) => void;
}

export const GmailPanel: React.FC<GmailPanelProps> = ({
  messages,
  onDraftReply,
  pendingApprovals,
  onApproveAction,
  onCancelAction,
}) => {
  const [selectedMessage, setSelectedMessage] = useState<GmailMessage | null>(messages[0] || null);

  const gmailApprovals = pendingApprovals.filter(a => a.actionType.startsWith('GMAIL'));

  return (
    <div id="sylvia-gmail-panel" className="w-full h-full flex flex-col p-6 overflow-hidden select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/30">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-slate-100 flex items-center gap-2">
              Google Workspace: Gmail Stream
            </h2>
            <p className="text-xs text-slate-400">
              Synchronized via Google ADK Workspace Specialist
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono-code bg-rose-950/40 text-rose-300 border border-rose-500/30">
          Operator Gate: Enabled
        </span>
      </div>

      {/* Human Approval Banner if pending Gmail actions */}
      {gmailApprovals.length > 0 && (
        <div className="my-4 p-4 rounded-xl bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-950 border border-amber-500/50 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-amber-300 font-display font-bold text-sm">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>DRAFT CREATION WAITING FOR APPROVAL</span>
            </div>
            <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              HUMAN-IN-THE-LOOP
            </span>
          </div>

          <p className="text-xs text-slate-200 mb-3 font-sans">
            {gmailApprovals[0].description}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onApproveAction(gmailApprovals[0].id)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-950/40 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approve & Create Draft in Gmail</span>
            </button>
            <button
              onClick={() => onCancelAction(gmailApprovals[0].id)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              Reject Write Action
            </button>
          </div>
        </div>
      )}

      {/* Two Column Layout: Thread List + Message View */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 mt-4 overflow-hidden">
        {/* Left Column: Email Thread List */}
        <div className="md:col-span-5 flex flex-col space-y-2 overflow-y-auto pr-1">
          <div className="text-[10px] font-mono-code text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Recent Inbox Messages ({messages.length})</span>
            <Inbox className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {messages.map(msg => (
            <div
              key={msg.id}
              onClick={() => setSelectedMessage(msg)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedMessage?.id === msg.id
                  ? 'glass-panel-elevated border-rose-500/40 shadow-lg shadow-rose-950/20'
                  : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`font-semibold text-xs truncate ${msg.unread ? 'text-slate-100' : 'text-slate-300'}`}>
                  {msg.sender}
                </span>
                <span className="text-[10px] font-mono-code text-slate-400">{msg.date}</span>
              </div>

              <div className={`text-xs truncate ${msg.unread ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
                {msg.subject}
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 font-sans">
                {msg.preview}
              </p>

              {msg.requiresReply && (
                <div className="mt-2 flex items-center gap-1 text-[10px] font-mono-code text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Action Required: Awaiting Decision</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Column: Selected Email Details & Autonomous Operator Actions */}
        <div className="md:col-span-7 flex flex-col glass-panel-elevated p-5 rounded-2xl border border-slate-800 overflow-y-auto">
          {selectedMessage ? (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-display font-bold text-slate-100">
                    {selectedMessage.subject}
                  </h3>
                  <span className="text-[11px] font-mono-code text-slate-400">
                    {selectedMessage.date}
                  </span>
                </div>

                <div className="mt-2 text-xs font-mono-code text-slate-400 flex items-center gap-2">
                  <span className="text-indigo-300">From:</span>
                  <span className="text-slate-200 font-medium">{selectedMessage.sender}</span>
                  <span className="text-slate-400">&lt;{selectedMessage.senderEmail}&gt;</span>
                </div>
              </div>

              {/* Message Body */}
              <div className="py-2 text-xs md:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                {selectedMessage.body || selectedMessage.preview}
              </div>

              {/* Operator Action Recommendation */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-indigo-300 font-mono-code text-xs font-semibold">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Sylvia Intelligence Assessment
                </div>
                <p className="text-xs text-slate-300 font-sans">
                  {selectedMessage.requiresReply
                    ? 'This thread contains a pending cutover authorization request. Sylvia can generate a structured draft aligned with your Decision DNA.'
                    : 'Informational message. No critical decision blockers detected.'}
                </p>

                {selectedMessage.requiresReply && (
                  <button
                    onClick={() => onDraftReply(selectedMessage)}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-950/40 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ask Sylvia to Formulate Reply Draft</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 font-mono-code text-xs">
              Select an email thread to inspect
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
