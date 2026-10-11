'use client';

import React from 'react';
import { ArrowRight, Sparkles, Sliders } from 'lucide-react';

interface HeaderProps {
  mode: 'story' | 'dashboard';
  onToggleMode: (mode: 'story' | 'dashboard') => void;
  onSkipIntro?: () => void;
  showSkipIntro?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onToggleMode,
  onSkipIntro,
  showSkipIntro,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-stone/85 backdrop-blur-md border-b border-border/80 px-4 sm:px-8 py-3.5 flex justify-between items-center transition-all">
      {/* Brand Wordmark */}
      <div className="flex items-center gap-3">
        <h1 className="font-serif text-2xl tracking-tight text-ink font-light select-none">
          StockSense
        </h1>
        <span className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-wider text-muted px-2 py-0.5 rounded bg-surface border border-border">
          Adaptive Replenishment
        </span>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center gap-1.5 bg-surface/90 border border-border p-1 rounded-full shadow-sm text-xs font-mono font-medium">
        <button
          onClick={() => onToggleMode('story')}
          className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
            mode === 'story'
              ? 'bg-ink text-surface shadow-sm'
              : 'text-muted hover:text-ink'
          }`}
        >
          3D Story
        </button>
        <button
          onClick={() => onToggleMode('dashboard')}
          className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
            mode === 'dashboard'
              ? 'bg-ink text-surface shadow-sm'
              : 'text-muted hover:text-ink'
          }`}
        >
          Dashboard
        </button>
      </div>

      {/* Right Action / Status */}
      <div className="flex items-center gap-3">
        {showSkipIntro && onSkipIntro && (
          <button
            onClick={onSkipIntro}
            className="px-3.5 py-1.5 rounded-full border border-border bg-surface text-ink text-xs font-mono hover:bg-ink hover:text-surface transition-all cursor-pointer shadow-sm"
          >
            Skip to App
          </button>
        )}

        <div className="hidden md:flex items-center gap-2 font-mono text-xs text-muted">
          <span className="w-2 h-2 rounded-full bg-moss opacity-80 animate-pulse" />
          <span>Baseline Nominal</span>
        </div>
      </div>
    </header>
  );
};
