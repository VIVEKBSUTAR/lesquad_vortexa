'use client';

import React from 'react';
import { ArrowRight, Sparkles, Sliders, Database, Layers, BarChart3, Activity, Compass } from 'lucide-react';

export type ActiveNavTab = 'story' | 'overview' | 'inventory' | 'demand' | 'scenario';

interface HeaderProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  onSkipIntro?: () => void;
  showSkipIntro?: boolean;
  isConnectedToLiveBackend?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onSkipIntro,
  showSkipIntro,
  isConnectedToLiveBackend = false,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-stone/90 backdrop-blur-md border-b border-border/80 px-4 sm:px-8 py-3 flex flex-wrap justify-between items-center gap-3 transition-all">
      {/* Brand Wordmark */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSelectTab('story')}
          className="text-left font-serif text-2xl tracking-tight text-ink font-light select-none hover:text-accent transition-colors cursor-pointer"
        >
          StockSense
        </button>
        <span className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-wider text-muted px-2.5 py-0.5 rounded-full bg-surface border border-border">
          Adaptive Replenishment
        </span>
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-surface/90 border border-border p-1 rounded-xl shadow-xs text-xs font-mono font-medium">
        <button
          onClick={() => onSelectTab('story')}
          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'story'
              ? 'bg-ink text-surface shadow-xs font-semibold'
              : 'text-muted hover:text-ink'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>3D Story</span>
        </button>

        <button
          onClick={() => onSelectTab('overview')}
          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-ink text-surface shadow-xs font-semibold'
              : 'text-muted hover:text-ink'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => onSelectTab('inventory')}
          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'inventory'
              ? 'bg-ink text-surface shadow-xs font-semibold'
              : 'text-muted hover:text-ink'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Inventory</span>
        </button>

        <button
          onClick={() => onSelectTab('demand')}
          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'demand'
              ? 'bg-ink text-surface shadow-xs font-semibold'
              : 'text-muted hover:text-ink'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Demand Insights</span>
        </button>

        <button
          onClick={() => onSelectTab('scenario')}
          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'scenario'
              ? 'bg-ink text-surface shadow-xs font-semibold'
              : 'text-muted hover:text-ink'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Scenario Lab</span>
        </button>
      </nav>

      {/* Right Actions & Live Status Indicator */}
      <div className="flex items-center gap-3">
        {showSkipIntro && onSkipIntro && (
          <button
            onClick={onSkipIntro}
            className="px-3.5 py-1.5 rounded-full border border-border bg-surface text-ink text-xs font-mono hover:bg-ink hover:text-surface transition-all cursor-pointer shadow-xs"
          >
            Skip to App
          </button>
        )}

        {/* Backend Connection Indicator */}
        <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] text-muted bg-surface/80 px-2.5 py-1 rounded-full border border-border/80">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnectedToLiveBackend ? 'bg-moss' : 'bg-accent'
            } opacity-90`}
          />
          <span>{isConnectedToLiveBackend ? 'FastAPI Live' : 'Deterministic Engine'}</span>
        </div>
      </div>
    </header>
  );
};
