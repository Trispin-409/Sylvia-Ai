import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles, ChevronDown } from 'lucide-react';
import { useTheme, ThemeId, ThemeConfig } from '../context/ThemeContext';

interface ThemeSwitcherProps {
  variant?: 'compact' | 'segmented' | 'dropdown' | 'sidebar';
  className?: string;
  showLabel?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = 'compact',
  className = '',
  showLabel = true,
}) => {
  const { theme, setTheme, currentTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Sidebar variant: sleek dedicated section with theme buttons
  if (variant === 'sidebar') {
    return (
      <div className={`space-y-2 select-none ${className}`} aria-label="Theme selector">
        <div className="flex items-center justify-between px-2 mb-1.5 text-[10px] font-mono-code font-semibold tracking-wider text-slate-400 uppercase">
          <div className="flex items-center gap-1.5">
            <Palette className="w-3 h-3 text-slate-400" />
            <span>COLOR SCHEME</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.2 rounded border border-white/10 text-slate-300 capitalize font-sans">
            {currentTheme.name}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 px-1">
          {themes.map((t: ThemeConfig) => {
            const isSelected = t.id === theme;
            return (
              <button
                key={t.id}
                type="button"
                id={`theme-btn-${t.id}`}
                onClick={() => setTheme(t.id)}
                className={`relative flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all text-xs ${
                  isSelected
                    ? 'bg-white/10 text-white font-medium border shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent'
                }`}
                style={{
                  borderColor: isSelected ? t.primaryColor : undefined,
                  boxShadow: isSelected ? `0 0 12px ${t.accentGlow}` : undefined,
                }}
                title={`${t.name} — ${t.tagline}`}
              >
                {/* Visual dual-color swatch dot */}
                <span
                  className="flex-shrink-0 w-3.5 h-3.5 rounded-full overflow-hidden flex border border-white/20 shadow-xs"
                  aria-hidden="true"
                >
                  <span className="w-1/2 h-full" style={{ backgroundColor: t.primaryColor }} />
                  <span className="w-1/2 h-full" style={{ backgroundColor: t.secondaryColor }} />
                </span>

                <div className="min-w-0 flex-1 truncate">
                  <div className="truncate text-[11px] leading-tight font-medium">{t.name}</div>
                </div>

                {isSelected && (
                  <Check className="w-3 h-3 flex-shrink-0" style={{ color: t.primaryColor }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Segmented control variant: horizontal segmented pill
  if (variant === 'segmented') {
    return (
      <div
        className={`inline-flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-white/10 backdrop-blur-md ${className}`}
        role="radiogroup"
        aria-label="Color scheme options"
      >
        {themes.map((t: ThemeConfig) => {
          const isSelected = t.id === theme;
          return (
            <button
              key={t.id}
              type="button"
              id={`theme-segmented-${t.id}`}
              role="radio"
              aria-checked={isSelected}
              onClick={() => setTheme(t.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'bg-white/15 text-white font-medium shadow-xs border border-white/15'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
              style={{
                borderColor: isSelected ? t.borderAccent : undefined,
              }}
              title={t.tagline}
            >
              <span
                className="w-2.5 h-2.5 rounded-full overflow-hidden flex-shrink-0 flex border border-white/20"
                aria-hidden="true"
              >
                <span className="w-1/2 h-full" style={{ backgroundColor: t.primaryColor }} />
                <span className="w-1/2 h-full" style={{ backgroundColor: t.secondaryColor }} />
              </span>
              <span>{t.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Compact Popover Dropdown (Default)
  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        id="btn-theme-switcher-toggle"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-white/10 bg-slate-900/80 hover:bg-slate-800/90 hover:border-white/20 text-slate-200 text-xs font-medium transition-all shadow-sm active:scale-95"
        style={{
          boxShadow: isOpen ? `0 0 16px ${currentTheme.accentGlow}` : undefined,
        }}
        title={`Current Theme: ${currentTheme.name} (${currentTheme.tagline}). Click to switch.`}
      >
        {/* Dual color indicator dot */}
        <span
          className="flex-shrink-0 w-3 h-3 rounded-full overflow-hidden flex border border-white/30 shadow-xs"
          aria-hidden="true"
        >
          <span className="w-1/2 h-full" style={{ backgroundColor: currentTheme.primaryColor }} />
          <span className="w-1/2 h-full" style={{ backgroundColor: currentTheme.secondaryColor }} />
        </span>

        {showLabel && (
          <span className="text-slate-200 font-sans tracking-wide text-xs">
            {currentTheme.name}
          </span>
        )}

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Choose a color scheme"
          className="absolute right-0 mt-2 w-64 p-2 rounded-2xl glass-panel-elevated bg-[#0a0f1b]/95 border border-white/15 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
          style={{
            borderColor: currentTheme.borderAccent,
          }}
        >
          <div className="flex items-center justify-between px-2.5 py-1.5 mb-1.5 border-b border-white/10">
            <div className="flex items-center gap-1.5 text-[11px] font-mono-code font-semibold tracking-wider text-slate-300 uppercase">
              <Palette className="w-3.5 h-3.5" style={{ color: currentTheme.primaryColor }} />
              <span>Theme Switcher</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono-code">Global CSS</span>
          </div>

          <div className="space-y-1">
            {themes.map((t: ThemeConfig) => {
              const isSelected = t.id === theme;
              return (
                <button
                  key={t.id}
                  type="button"
                  id={`theme-opt-${t.id}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-white/10 text-white font-medium border'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
                  }`}
                  style={{
                    borderColor: isSelected ? t.borderAccent : undefined,
                    backgroundColor: isSelected ? `${t.accentBadgeBg}` : undefined,
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Visual dual swatch circle */}
                    <div
                      className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 flex border border-white/30 shadow-xs"
                      aria-hidden="true"
                    >
                      <span className="w-1/2 h-full" style={{ backgroundColor: t.primaryColor }} />
                      <span className="w-1/2 h-full" style={{ backgroundColor: t.secondaryColor }} />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-100 flex items-center gap-1.5">
                        <span>{t.name}</span>
                        {isSelected && (
                          <span
                            className="text-[9px] px-1.5 py-0.2 rounded font-mono-code"
                            style={{
                              backgroundColor: t.accentBadgeBg,
                              color: t.accentBadgeText,
                              border: `1px solid ${t.borderAccent}`,
                            }}
                          >
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[155px]">
                        {t.tagline}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 flex-shrink-0" style={{ color: t.primaryColor }} />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-white/10 px-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>Updates CSS variables globally</span>
            <span className="font-mono-code text-[9px] text-slate-400">Persistent</span>
          </div>
        </div>
      )}
    </div>
  );
};
