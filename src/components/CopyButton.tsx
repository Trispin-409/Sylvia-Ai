import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Navigator clipboard failed, trying fallback:', err);
  }

  // Fallback using textarea execCommand
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback clipboard copy failed:', err);
    return false;
  }
}

interface CopyButtonProps {
  text: string;
  label?: string;
  showLabel?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  title?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label = 'Copy',
  showLabel = false,
  size = 'sm',
  className = '',
  title = 'Copy to clipboard',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const sizeClasses = {
    xs: 'p-1 text-[10px] gap-1',
    sm: 'p-1.5 text-xs gap-1.5',
    md: 'px-2.5 py-1.5 text-xs gap-1.5',
  }[size];

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  }[size];

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied to clipboard' : title}
      title={copied ? 'Copied!' : title}
      className={`inline-flex items-center justify-center rounded-md border transition-all duration-150 select-none ${
        copied
          ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-xs'
          : 'bg-slate-900/80 hover:bg-slate-800/90 border-slate-700/60 hover:border-slate-600 text-slate-400 hover:text-slate-200'
      } ${sizeClasses} ${className}`}
    >
      {copied ? (
        <>
          <Check className={`${iconSizes} text-emerald-400 flex-shrink-0 animate-in zoom-in-75 duration-150`} />
          {showLabel && <span className="font-medium text-emerald-300">Copied!</span>}
        </>
      ) : (
        <>
          <Copy className={`${iconSizes} flex-shrink-0`} />
          {showLabel && <span className="font-medium">{label}</span>}
        </>
      )}
    </button>
  );
};
