'use client';

import React from 'react';
import {
  Sparkles,
  Sliders,
  Database,
  Layers,
  Activity,
  Calculator,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

export type ActiveNavTab = 'product' | 'overview' | 'inventory' | 'demand' | 'scenario';

interface HeaderProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  serviceLevel: number;
  onSelectServiceLevel: (level: number) => void;
  onOpenFormulasModal: () => void;
  isConnectedToLiveBackend?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  serviceLevel,
  onSelectServiceLevel,
  onOpenFormulasModal,
  isConnectedToLiveBackend = false,
}) => {
  const serviceLevelOptions = [
    { value: 0.90, label: '90%', z: 'Z=1.282' },
    { value: 0.95, label: '95%', z: 'Z=1.645' },
    { value: 0.98, label: '98%', z: 'Z=2.054' },
    { value: 0.99, label: '99%', z: 'Z=2.326' },
  ];

  const currentOption = serviceLevelOptions.find((o) => Math.abs(o.value - serviceLevel) < 0.005) || serviceLevelOptions[1];

  return (
    <header className="sticky top-0 z-40 w-full bg-stone/90 backdrop-blur-md border-b border-border/80 px-4 sm:px-6 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-3">
        {/* Brand Wordmark & Subtitle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('product')}
            className="text-left font-serif text-2xl tracking-tight text-ink font-light select-none hover:text-accent transition-colors cursor-pointer"
          >
            StockSense
          </button>
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted px-2.5 py-0.5 rounded-full bg-surface border border-border">
            <span className="w-1.5 h-1.5 rounded-full bg-moss" />
            <span>Dark Store & Kirana Ops</span>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-surface/90 border border-border p-1 rounded-xl shadow-xs text-xs font-mono font-medium">
          <button
            onClick={() => onSelectTab('product')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'product'
                ? 'bg-ink text-surface shadow-xs font-semibold'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Showcase</span>
          </button>

          <button
            onClick={() => onSelectTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
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
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
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
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'demand'
                ? 'bg-ink text-surface shadow-xs font-semibold'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Demand & Anomalies</span>
          </button>

          <button
            onClick={() => onSelectTab('scenario')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'scenario'
                ? 'bg-ink text-surface shadow-xs font-semibold'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Crisis Simulator</span>
          </button>
        </nav>

        {/* Global Policy Bar: Target Service Level Selector + Formulas Modal */}
        <div className="flex items-center gap-2">
          {/* Target Service Level Pill Selector */}
          <div className="flex items-center gap-1 bg-surface border border-border px-2 py-1 rounded-xl shadow-xs font-mono text-xs">
            <span className="text-[10px] uppercase text-muted hidden md:inline">Target SLA:</span>
            <div className="flex items-center gap-0.5">
              {serviceLevelOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onSelectServiceLevel(opt.value)}
                  className={`px-2 py-0.5 rounded text-[11px] transition-all cursor-pointer ${
                    Math.abs(serviceLevel - opt.value) < 0.005
                      ? 'bg-accent text-surface font-semibold shadow-xs'
                      : 'text-muted hover:text-ink'
                  }`}
                  title={`Target Service Level: ${(opt.value * 100).toFixed(0)}%, Statistical factor: ${opt.z}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-accent font-semibold px-1 hidden lg:inline">
              ({currentOption.z})
            </span>
          </div>

          {/* Formulas & Assumptions Button */}
          <button
            onClick={onOpenFormulasModal}
            className="px-2.5 py-1.5 rounded-xl border border-border bg-surface hover:bg-stone text-ink text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Inspect Mathematical Formulas & Assumptions"
          >
            <Calculator className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">Formulas</span>
          </button>

          {/* Backend Connection Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 font-mono text-[10px] text-muted bg-surface px-2 py-1 rounded-xl border border-border">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnectedToLiveBackend ? 'bg-moss' : 'bg-accent'
              }`}
            />
            <span>{isConnectedToLiveBackend ? 'FastAPI' : 'Deterministic'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
