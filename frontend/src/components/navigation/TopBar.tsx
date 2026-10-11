'use client';

import React from 'react';
import {
  Upload,
  Database,
  ShieldCheck,
  Scale,
  Activity,
  Layers,
  Sparkles,
  Info,
  Menu,
  ChevronDown,
  ArrowRight,
  Calculator,
  Store
} from 'lucide-react';
import { ActiveNavTab } from '@/components/navigation/Header';

interface TopBarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  serviceLevel: number;
  onSelectServiceLevel: (level: number) => void;
  onOpenImportModal: () => void;
  onOpenFormulasModal: () => void;
  workspaceName?: string;
  dataStatus?: 'not_imported' | 'imported' | 'analysis_ready' | 'needs_review';
  isLiveBackend?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  serviceLevel,
  onSelectServiceLevel,
  onOpenImportModal,
  onOpenFormulasModal,
  workspaceName = 'DarkStore Fleet Alpha',
  dataStatus = 'analysis_ready',
  isLiveBackend = false,
}) => {
  const serviceLevelOptions = [
    { value: 0.90, label: '90%' },
    { value: 0.95, label: '95% (High)' },
    { value: 0.98, label: '98%' },
    { value: 0.99, label: '99% (Max)' },
  ];

  const currentOption =
    serviceLevelOptions.find((o) => Math.abs(o.value - serviceLevel) < 0.005) ||
    serviceLevelOptions[1];

  const statusConfig = {
    not_imported: {
      label: 'Not Imported',
      color: 'bg-stone text-slate-600 border-border',
      dot: 'bg-slate-400',
    },
    imported: {
      label: 'Imported',
      color: 'bg-accent/10 text-accent border-accent/20',
      dot: 'bg-accent',
    },
    analysis_ready: {
      label: 'Live & Ready',
      color: 'bg-moss/10 text-moss border-moss/30',
      dot: 'bg-moss',
    },
    needs_review: {
      label: 'Needs Review',
      color: 'bg-ochre/10 text-ochre border-ochre/30',
      dot: 'bg-ochre',
    },
  }[dataStatus];

  const isTour = activeTab === 'product';

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-surface/95 backdrop-blur-md border-b border-border px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 transition-all select-none">
      {/* Left: Brand + Breadcrumb */}
      <div className="flex items-center gap-4">
        {/* Brand Wordmark */}
        <button
          onClick={() => {
            if (isTour) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              onSelectTab('product');
            }
          }}
          className="text-left font-bold text-2xl tracking-tight text-slate-900 select-none hover:text-accent transition-colors cursor-pointer flex items-center gap-2"
          title={isTour ? 'Scroll to top' : 'Return to Product Showcase Tour'}
        >
          <span>StockSense</span>
        </button>

        {isTour ? (
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-border text-xs font-medium text-slate-600">
            <span className="w-2 h-2 rounded-full bg-moss animate-pulse" />
            <span className="font-semibold text-slate-800">Store Replenishment Engine</span>
          </div>
        ) : (
          <>
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-border text-xs text-slate-600">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">Store:</span>
              <span className="font-bold text-slate-900 px-2.5 py-0.5 rounded bg-stone border border-border">
                {workspaceName}
              </span>
            </div>

            {/* Data Status Indicator */}
            <div
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${statusConfig.color}`}
              title="Store Inventory Status"
            >
              <span className={`w-2 h-2 rounded-full ${statusConfig.dot} animate-pulse`} />
              <span>{statusConfig.label}</span>
            </div>
          </>
        )}
      </div>

      {/* Right Controls: Stock Reliability & Action */}
      <div className="flex items-center gap-3">
        {/* Stock Reliability Selector */}
        <div className="hidden sm:flex items-center gap-1.5 bg-stone/70 border border-border px-2.5 py-1 rounded-xl text-xs">
          <span className="text-[11px] uppercase text-slate-600 font-bold hidden md:inline">
            Stock Protection:
          </span>
          <div className="flex items-center gap-1">
            {serviceLevelOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSelectServiceLevel(opt.value)}
                className={`px-2 py-0.5 rounded text-xs transition-all cursor-pointer font-medium ${
                  Math.abs(serviceLevel - opt.value) < 0.005
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title={`Target Reliability: ${(opt.value * 100).toFixed(0)}%`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Primary CTA: In Tour mode -> Launch Dashboard; In Dashboard mode -> Import Data */}
        {isTour ? (
          <button
            onClick={() => {
              onSelectTab('overview');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-4 py-2 bg-ink text-surface rounded-xl text-xs font-mono font-medium hover:bg-accent transition-colors cursor-pointer flex items-center gap-2 shadow-sm group"
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5 text-surface group-hover:translate-x-0.5 transition-transform" />
          </button>
        ) : (
          <button
            onClick={onOpenImportModal}
            className="px-4 py-2 bg-ink text-surface rounded-xl text-xs font-mono font-medium hover:bg-accent transition-colors cursor-pointer flex items-center gap-2 shadow-xs group"
          >
            <Upload className="w-3.5 h-3.5 text-surface group-hover:scale-110 transition-transform" />
            <span>Import Data</span>
          </button>
        )}

        {/* Live Backend Connection Indicator */}
        <div
          className="p-2 rounded-xl bg-stone/60 border border-border flex items-center gap-1.5 text-[11px] font-mono"
          title={
            isLiveBackend
              ? 'Connected to FastAPI Backend (/api/v1)'
              : 'Using deterministic in-browser operations research engine'
          }
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isLiveBackend ? 'bg-moss animate-pulse' : 'bg-ochre'
            }`}
          />
          <span className="hidden xl:inline text-muted text-[10px]">
            {isLiveBackend ? 'FastAPI' : 'Local Engine'}
          </span>
        </div>
      </div>
    </header>
  );
};
