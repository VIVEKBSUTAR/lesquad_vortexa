'use client';

import React, { useEffect, useState } from 'react';
import { ProductWithComputed } from '@/lib/types';
import { apiClient, HealthResponse } from '@/lib/api';
import { NetworkTicker } from '@/components/dashboard/NetworkTicker';
import { ProductGrid } from '@/components/dashboard/ProductGrid';
import { ProductDetailModal } from '@/components/dashboard/ProductDetailModal';
import { ShieldCheck, AlertTriangle, ArrowRight, Activity, Database, CheckCircle2, Clock } from 'lucide-react';

interface OverviewViewProps {
  products: ProductWithComputed[];
  onNavigateToTab: (tabId: 'inventory' | 'demand' | 'scenario') => void;
  onSimulateInCrisis: (product: ProductWithComputed) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  products,
  onNavigateToTab,
  onSimulateInCrisis,
}) => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithComputed | null>(null);

  useEffect(() => {
    apiClient.getHealth().then(setHealth);
  }, []);

  const totalSafetyStock = products.reduce((acc, p) => acc + p.metrics.safetyStock, 0);
  const totalUnits = products.reduce((acc, p) => acc + p.metrics.inventoryPosition, 0);
  const criticalOrders = products.filter((p) => p.metrics.status === 'order').length;
  const watchCount = products.filter((p) => p.metrics.status === 'watch').length;
  const avgSLA = products.reduce((acc, p) => acc + p.targetServiceLevel, 0) / products.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* System Health Status Bar */}
      <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-moss animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-wider text-ink font-semibold">
              System Health & Architecture Status
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone border border-border text-muted">
              {health?.service || 'stocksense-api'} (v{health?.api_version || '1.0'})
            </span>
          </div>
          <p className="text-muted text-xs font-sans">
            Deterministic operations research engine active. Backend calculations serve as single source of truth.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-stone border border-border flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-accent" />
            <span className="text-muted">Database:</span>
            <span className="font-medium text-ink capitalize">{health?.database || 'Connected'}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-stone border border-border flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-muted" />
            <span className="text-muted">Status:</span>
            <span className="font-medium text-moss">Operational</span>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Ribbons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-muted">Active SKUs Monitored</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-2xl font-semibold text-ink">8</span>
            <span className="text-xs font-mono text-muted">Industrial SKUs</span>
          </div>
          <div className="text-[11px] font-mono text-muted mt-1">
            Across 5 categories
          </div>
        </div>

        <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-muted">Active Reorder Triggers</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-2xl font-semibold text-brick">
              {criticalOrders}
            </span>
            <span className="text-xs font-mono text-ochre">({watchCount} Watch)</span>
          </div>
          <div className="text-[11px] font-mono text-muted mt-1">
            Deterministic ROP breach
          </div>
        </div>

        <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-muted">Mean Target Service Level</div>
          <div className="font-mono text-2xl font-semibold text-accent mt-1">
            {(avgSLA * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] font-mono text-muted mt-1">
            Cycle service level target
          </div>
        </div>

        <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-muted">Total Available Stock</div>
          <div className="font-mono text-2xl font-semibold text-ink mt-1">
            {totalUnits.toLocaleString()}
          </div>
          <div className="text-[11px] font-mono text-muted mt-1">
            Units in distribution network
          </div>
        </div>
      </div>

      {/* Rolling Digit Buffer Ticker */}
      <NetworkTicker initialValue={totalSafetyStock} />

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div
          onClick={() => onNavigateToTab('inventory')}
          className="bg-surface/98 backdrop-blur-xl border border-border hover:border-ink rounded-2xl p-6 shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="font-mono text-xs text-accent uppercase tracking-wider mb-2 font-semibold">
              Module 01
            </div>
            <h4 className="font-serif text-xl font-normal text-ink group-hover:text-accent transition-colors">
              Inventory & Reorder Rules
            </h4>
            <p className="text-muted text-xs font-sans mt-2 leading-relaxed">
              Maintain SKU stock levels, update lead-time distributions, and trigger deterministic replenishment snapshots.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs font-mono text-ink">
            <span>Manage Inventory</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab('demand')}
          className="bg-surface/98 backdrop-blur-xl border border-border hover:border-ink rounded-2xl p-6 shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="font-mono text-xs text-anomaly uppercase tracking-wider mb-2 font-semibold">
              Module 02
            </div>
            <h4 className="font-serif text-xl font-normal text-ink group-hover:text-anomaly transition-colors">
              Demand Insights & Anomaly Lab
            </h4>
            <p className="text-muted text-xs font-sans mt-2 leading-relaxed">
              Upload CSV daily demand batches, review AI anomaly candidate spikes, and evaluate holdout forecast accuracy.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs font-mono text-ink">
            <span>Inspect Demand</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab('scenario')}
          className="bg-surface/98 backdrop-blur-xl border border-border hover:border-ink rounded-2xl p-6 shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="font-mono text-xs text-ochre uppercase tracking-wider mb-2 font-semibold">
              Module 03
            </div>
            <h4 className="font-serif text-xl font-normal text-ink group-hover:text-ochre transition-colors">
              Scenario Lab & Crisis Sim
            </h4>
            <p className="text-muted text-xs font-sans mt-2 leading-relaxed">
              Stress-test supplier lead time delays and demand surge multipliers with instant reactive projection charts.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs font-mono text-ink">
            <span>Run Stress Scenarios</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Product Grid Roster */}
      <ProductGrid
        products={products}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      {/* SKU Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onSimulateInCrisis={onSimulateInCrisis}
      />
    </div>
  );
};
