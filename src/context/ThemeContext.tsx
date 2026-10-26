import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export type ThemeId = 'midnight' | 'cyber' | 'neon' | 'solar';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  tagline: string;
  category: string;
  primaryColor: string;
  primaryColorHover: string;
  primaryRgb: string;
  secondaryColor: string;
  secondaryRgb: string;
  bgBase: string;
  bgSurface: string;
  bgSurfaceElevated: string;
  bgGlass: string;
  borderColor: string;
  borderAccent: string;
  accentGlow: string;
  accentBadgeBg: string;
  accentBadgeText: string;
  textPrimary: string;
  textSecondary: string;
  textAccent: string;
  nebula1: string;
  nebula2: string;
  scrollbarThumb: string;
  scrollbarThumbHover: string;
  starColors: string[];
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    tagline: 'Deep Cosmic Obsidian & Indigo Starlight',
    category: 'Cosmic Core',
    primaryColor: '#6366f1',
    primaryColorHover: '#4f46e5',
    primaryRgb: '99, 102, 241',
    secondaryColor: '#38bdf8',
    secondaryRgb: '56, 189, 248',
    bgBase: '#030712',
    bgSurface: '#0a101f',
    bgSurfaceElevated: '#0f172a',
    bgGlass: 'rgba(10, 16, 31, 0.72)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderAccent: 'rgba(99, 102, 241, 0.38)',
    accentGlow: 'rgba(99, 102, 241, 0.35)',
    accentBadgeBg: 'rgba(99, 102, 241, 0.16)',
    accentBadgeText: '#c7d2fe',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textAccent: '#a5b4fc',
    nebula1: 'rgba(65, 76, 160, 0.16)',
    nebula2: 'rgba(18, 121, 139, 0.12)',
    scrollbarThumb: 'rgba(99, 102, 241, 0.28)',
    scrollbarThumbHover: 'rgba(129, 140, 248, 0.55)',
    starColors: ['#ffffff', '#e0e7ff', '#c7d2fe', '#a5b4fc', '#bae6fd', '#fbcfe8'],
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber',
    tagline: 'Tactical Carbon, Amber Telemetry & Emerald HUD',
    category: 'High-Tech Operator',
    primaryColor: '#f59e0b',
    primaryColorHover: '#d97706',
    primaryRgb: '245, 158, 11',
    secondaryColor: '#10b981',
    secondaryRgb: '16, 185, 129',
    bgBase: '#07090e',
    bgSurface: '#0e131c',
    bgSurfaceElevated: '#151d2a',
    bgGlass: 'rgba(14, 19, 28, 0.75)',
    borderColor: 'rgba(245, 158, 11, 0.15)',
    borderAccent: 'rgba(245, 158, 11, 0.45)',
    accentGlow: 'rgba(245, 158, 11, 0.38)',
    accentBadgeBg: 'rgba(245, 158, 11, 0.16)',
    accentBadgeText: '#fde68a',
    textPrimary: '#fef3c7',
    textSecondary: '#94a3b8',
    textAccent: '#fbbf24',
    nebula1: 'rgba(245, 158, 11, 0.14)',
    nebula2: 'rgba(16, 185, 129, 0.12)',
    scrollbarThumb: 'rgba(245, 158, 11, 0.32)',
    scrollbarThumbHover: 'rgba(251, 191, 36, 0.6)',
    starColors: ['#ffffff', '#fef3c7', '#fde68a', '#d1fae5', '#a7f3d0', '#fed7aa'],
  },
  neon: {
    id: 'neon',
    name: 'Neon',
    tagline: 'Electric Synthwave, Laser Cyan & Magenta Glow',
    category: 'Synthwave Matrix',
    primaryColor: '#06b6d4',
    primaryColorHover: '#0891b2',
    primaryRgb: '6, 182, 212',
    secondaryColor: '#ec4899',
    secondaryRgb: '236, 72, 153',
    bgBase: '#05040d',
    bgSurface: '#0d0922',
    bgSurfaceElevated: '#17113a',
    bgGlass: 'rgba(13, 9, 34, 0.75)',
    borderColor: 'rgba(34, 211, 238, 0.16)',
    borderAccent: 'rgba(34, 211, 238, 0.45)',
    accentGlow: 'rgba(34, 211, 238, 0.42)',
    accentBadgeBg: 'rgba(6, 182, 212, 0.16)',
    accentBadgeText: '#a5f3fc',
    textPrimary: '#f0fdf4',
    textSecondary: '#a1a1aa',
    textAccent: '#22d3ee',
    nebula1: 'rgba(6, 182, 212, 0.16)',
    nebula2: 'rgba(236, 72, 153, 0.14)',
    scrollbarThumb: 'rgba(6, 182, 212, 0.32)',
    scrollbarThumbHover: 'rgba(34, 211, 238, 0.6)',
    starColors: ['#ffffff', '#cffafe', '#a5f3fc', '#fbcfe8', '#f472b6', '#e0e7ff'],
  },
  solar: {
    id: 'solar',
    name: 'Solar',
    tagline: 'Solar Corona Gold & Crimson Plasma Core',
    category: 'Solar Flare',
    primaryColor: '#e11d48',
    primaryColorHover: '#be123c',
    primaryRgb: '225, 29, 72',
    secondaryColor: '#f59e0b',
    secondaryRgb: '245, 158, 11',
    bgBase: '#080508',
    bgSurface: '#140a11',
    bgSurfaceElevated: '#1f0f1b',
    bgGlass: 'rgba(20, 10, 17, 0.75)',
    borderColor: 'rgba(225, 29, 72, 0.18)',
    borderAccent: 'rgba(225, 29, 72, 0.45)',
    accentGlow: 'rgba(225, 29, 72, 0.38)',
    accentBadgeBg: 'rgba(225, 29, 72, 0.16)',
    accentBadgeText: '#fecdd3',
    textPrimary: '#fff1f2',
    textSecondary: '#a1a1aa',
    textAccent: '#fb7185',
    nebula1: 'rgba(225, 29, 72, 0.15)',
    nebula2: 'rgba(245, 158, 11, 0.12)',
    scrollbarThumb: 'rgba(225, 29, 72, 0.32)',
    scrollbarThumbHover: 'rgba(251, 113, 133, 0.6)',
    starColors: ['#ffffff', '#ffe4e6', '#fecdd3', '#fef3c7', '#fed7aa', '#fca5a5'],
  },
};

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  currentTheme: ThemeConfig;
  themes: ThemeConfig[];
  cycleNextTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'sylvia_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (typeof window === 'undefined') return 'midnight';
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeId;
      if (stored && THEMES[stored]) return stored;
    } catch {
      // ignore storage access errors
    }
    return 'midnight';
  });

  const applyThemeVariables = (themeId: ThemeId) => {
    const config = THEMES[themeId] || THEMES.midnight;
    const root = document.documentElement;

    // Set data-theme attribute on root and body
    root.setAttribute('data-theme', themeId);
    if (document.body) {
      document.body.setAttribute('data-theme', themeId);
      document.body.style.backgroundColor = config.bgBase;
      document.body.style.color = config.textPrimary;
    }

    // Set global CSS variables
    root.style.setProperty('--theme-bg-base', config.bgBase);
    root.style.setProperty('--theme-bg-surface', config.bgSurface);
    root.style.setProperty('--theme-bg-surface-elevated', config.bgSurfaceElevated);
    root.style.setProperty('--theme-bg-glass', config.bgGlass);
    root.style.setProperty('--theme-border', config.borderColor);
    root.style.setProperty('--theme-border-accent', config.borderAccent);
    root.style.setProperty('--theme-accent-primary', config.primaryColor);
    root.style.setProperty('--theme-accent-primary-hover', config.primaryColorHover);
    root.style.setProperty('--theme-accent-primary-rgb', config.primaryRgb);
    root.style.setProperty('--theme-accent-secondary', config.secondaryColor);
    root.style.setProperty('--theme-accent-secondary-rgb', config.secondaryRgb);
    root.style.setProperty('--theme-accent-glow', config.accentGlow);
    root.style.setProperty('--theme-accent-badge-bg', config.accentBadgeBg);
    root.style.setProperty('--theme-accent-badge-text', config.accentBadgeText);
    root.style.setProperty('--theme-text-primary', config.textPrimary);
    root.style.setProperty('--theme-text-secondary', config.textSecondary);
    root.style.setProperty('--theme-text-accent', config.textAccent);
    root.style.setProperty('--theme-nebula-1', config.nebula1);
    root.style.setProperty('--theme-nebula-2', config.nebula2);
    root.style.setProperty('--theme-scrollbar-thumb', config.scrollbarThumb);
    root.style.setProperty('--theme-scrollbar-thumb-hover', config.scrollbarThumbHover);
  };

  const setTheme = (newTheme: ThemeId) => {
    if (!THEMES[newTheme]) return;
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // storage unavailable
    }
    applyThemeVariables(newTheme);
  };

  const cycleNextTheme = () => {
    const themeOrder: ThemeId[] = ['midnight', 'cyber', 'neon', 'solar'];
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  useEffect(() => {
    applyThemeVariables(theme);
  }, [theme]);

  const currentTheme = useMemo(() => THEMES[theme] || THEMES.midnight, [theme]);
  const themes = useMemo(() => Object.values(THEMES), []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentTheme, themes, cycleNextTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
