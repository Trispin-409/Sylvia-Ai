import React from 'react';
import { ApprovalRequest } from '../types';
import { ShieldAlert, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface ApprovalCardProps {
  request: ApprovalRequest;
  onApprove: (id: string) => void;
  onCancel: (id: string) => void;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  request,
  onApprove,
  onCancel,
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleApprove = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    onApprove(request.id);
  };

  const handleCancel = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    onCancel(request.id);
  };

  return (
    <div
      id={`approval-card-${request.id}`}
      className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/80 via-slate-900/95 to-slate-950 border border-amber-500/50 shadow-2xl shadow-amber-950/30 text-xs select-none"
    >
      <div className="flex items-center justify-between pb-3 border-b border-amber-500/20 mb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <div>
            <h4 className="font-display font-bold text-sm text-amber-200">
              HUMAN APPROVAL REQUIRED
            </h4>
            <div className="text-[10px] font-mono-code text-slate-400">
              Action Gate ID: {request.id}
            </div>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono-code font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
          {request.riskLevel} RISK WRITE ACTION
        </span>
      </div>

      <p className="text-slate-200 font-sans text-xs mb-3 leading-relaxed">
        {request.description}
      </p>

      {request.recipient && (
        <div className="mb-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono-code text-[11px] space-y-1">
          <div className="text-slate-400">
            <span className="text-indigo-400 font-semibold">Recipient:</span> {request.recipient}
          </div>
          {request.subject && (
            <div className="text-slate-200">
              <span className="text-indigo-400 font-semibold">Subject:</span> {request.subject}
            </div>
          )}
        </div>
      )}

      {request.bodyPreview && (
        <div className="mb-4 p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-300 text-xs font-sans whitespace-pre-line leading-relaxed">
          {request.bodyPreview}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleApprove}
          disabled={isProcessing}
          className="flex-1 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs shadow-lg shadow-emerald-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{isProcessing ? 'Authorizing...' : 'Authorize & Execute Action'}</span>
        </button>

        <button
          onClick={handleCancel}
          disabled={isProcessing}
          className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 font-medium text-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          Reject Write Action
        </button>
      </div>
    </div>
  );
};
