'use client';

import React from 'react';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  FlaskConical,
  Sparkles,
  Calculator,
  ShieldCheck,
  ChevronRight,
  Database,
  Layers,
  ArrowUpRight,
  Store
} from 'lucide-react';
import { ActiveNavTab } from '@/components/navigation/Header';

interface SidebarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  onOpenFormulasModal: () => void;
  workspaceName?: string;
  dataStatus?: 'not_imported' | 'imported' | 'analysis_ready' | 'needs_review';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenFormulasModal,
  workspaceName = 'DarkStore Fleet Alpha',
  dataStatus = 'analysis_ready',
}) => {
  const navItems = [
    {
      id: 'overview' as ActiveNavTab,
      label: 'Overview',
      subtitle: 'What needs attention first?',
      icon: LayoutDashboard,
      badge: 'Radar',
    },
    {
      id: 'inventory' as ActiveNavTab,
      label: 'Inventory',
      subtitle: 'What should I order & why?',
      icon: Package,
      badge: '6 SKUs',
    },
    {
      id: 'demand' as ActiveNavTab,
      label: 'Demand Insights',
      subtitle: 'Can I trust data & forecast?',
      icon: TrendingUp,
      badge: '2 Flags',
    },
    {
      id: 'scenario' as ActiveNavTab,
      label: 'Scenario Lab',
      subtitle: 'What if conditions worsen?',
      icon: FlaskConical,
      badge: 'What-If',
    },
  ];

  const statusDisplay = {
    not_imported: { label: 'Not Imported', color: 'bg-stone text-muted border-border' },
    imported: { label: 'Imported', color: 'bg-accent/10 text-accent border-accent/20' },
    analysis_ready: { label: 'Analysis Ready', color: 'bg-moss/10 text-moss border-moss/30' },
    needs_review: { label: 'Needs Review', color: 'bg-ochre/10 text-ochre border-ochre/30' },
  }[dataStatus];

  return (
    <aside className="w-64 flex-shrink-0 bg-surface/98 backdrop-blur-xl border-r border-border flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 z-30 select-none">
      {/* Top Section: Workspace Info & Primary Navigation */}
      <div className="p-4 space-y-6 overflow-y-auto">
        {/* Workspace Card */}
        <div className="p-3.5 rounded-2xl bg-stone/50 border border-border/80">
          <div className="flex items-center gap-2 mb-1.5">
            <Store className="w-4 h-4 text-accent" />
            <span className="font-mono text-xs font-semibold text-ink truncate">
              {workspaceName}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-muted">
            <span>Blinkit Hub #4</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] border font-medium ${statusDisplay.color}`}
            >
              {statusDisplay.label}
            </span>
          </div>
        </div>

        {/* Four Primary Navigation Items */}
        <div className="space-y-1">
          <div className="px-2 pb-2 text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
            Decision Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer group flex items-start gap-3 border ${
                  isActive
                    ? 'bg-ink text-surface border-ink shadow-sm'
                    : 'text-ink hover:bg-stone/60 border-transparent hover:border-border/60'
                }`}
              >
                <div
                  className={`p-2 rounded-xl transition-colors ${
                    isActive ? 'bg-surface/10 text-surface' : 'bg-surface border border-border text-accent group-hover:text-ink'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-sm font-medium truncate">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md ${
                          isActive
                            ? 'bg-surface/20 text-surface'
                            : 'bg-stone text-muted group-hover:text-ink'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[11px] font-mono truncate mt-0.5 ${
                      isActive ? 'text-surface/70' : 'text-muted'
                    }`}
                  >
                    {item.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Formulas, Product Showcase & Integrity */}
      <div className="p-4 border-t border-border space-y-2 bg-stone/20">
        {/* Showcase Tour Link */}
        <button
          onClick={() => onSelectTab('product')}
          className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs font-mono ${
            activeTab === 'product'
              ? 'bg-accent text-surface font-semibold shadow-xs'
              : 'text-muted hover:text-ink hover:bg-surface border border-transparent hover:border-border'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Product Showcase Tour</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        </button>

        {/* Operational Formulas Modal Button */}
        <button
          onClick={onOpenFormulasModal}
          className="w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between text-xs font-mono text-muted hover:text-ink hover:bg-surface border border-transparent hover:border-border"
        >
          <div className="flex items-center gap-2">
            <Calculator className="w-3.5 h-3.5 text-ochre" />
            <span>OR Formulas & Math</span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
        </button>

        {/* System Integrity Badge */}
        <div className="pt-2 px-1 flex items-center justify-between text-[10px] font-mono text-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-moss animate-pulse" />
            <span>OR Engine v2.4</span>
          </div>
          <span>Continuous (r, Q)</span>
        </div>
      </div>
    </aside>
  );
};
