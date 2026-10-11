'use client';

import React, { useEffect, useState } from 'react';
import { ProductWithComputed } from '@/lib/types';
import { apiClient, HealthResponse } from '@/lib/api';
import { NetworkTicker } from '@/components/dashboard/NetworkTicker';
import { ProductGrid } from '@/components/dashboard/ProductGrid';
import { ProductDetailModal } from '@/components/dashboard/ProductDetailModal';
import {
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Activity,
  Database,
  CheckCircle2,
  Clock,
  Calculator,
  Scale,
  Sparkles
} from 'lucide-react';

interface OverviewViewProps {
  products: ProductWithComputed[];
  serviceLevel?: number;
  zScore?: number;
  onNavigateToTab: (tabId: 'inventory' | 'demand' | 'scenario') => void;
  onSimulateInCrisis: (product: ProductWithComputed) => void;
  onOpenFormulasModal?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  products,
  serviceLevel = 0.95,
  zScore = 1.645,
  onNavigateToTab,
  onSimulateInCrisis,
  onOpenFormulasModal,
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

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* System Health Status Bar */}
      <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-moss animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-wider text-ink font-semibold">
              Dark Store Inventory Health & Replenishment Fleet
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone border border-border text-muted">
              v2.4 Live
            </span>
          </div>
          <p className="text-muted text-xs font-sans">
            Deterministic operations research engine active. Continuous review (r, Q) policy with AI anomaly noise dampening.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          {onOpenFormulasModal && (
            <button
              onClick={onOpenFormulasModal}
              className="px-3 py-1.5 rounded-xl bg-surface border border-border hover:bg-stone text-ink flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-accent" />
              <span>Formulas & Assumptions</span>
            </button>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-stone border border-border flex items-center gap-2">
            <Scale className="w-3.5 h-3.5 text-accent" />
            <span className="text-muted">Factor:</span>
            <span className="font-semibold text-accent">Z = {zScore.toFixed(3)}</span>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Ribbons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-muted">Dark Store SKUs</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-2xl font-semibold text-ink">{products.length}</span>
            <span className="text-xs font-mono text-muted">Active SKUs</span>
          </div>
          <div className="text-[11px] font-mono text-muted mt-1">
            Dairy, Staples, Snacks, Care
          </div>
        </div>

        <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-muted">Reorder Action Queue</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-2xl font-semibold text-brick">
              {criticalOrders} POs Due
            </span>
            <span className="text-xs font-mono text-ochre">({watchCount} Watch)</span>
          </div>
          <div className="text-[11px] font-mono text-muted mt-1">
            Effective stock ≤ ROP
          </div>
        </div>

        <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-muted">Target Service Level</div>
          <div className="font-mono text-2xl font-semibold text-accent mt-1">
            {(serviceLevel * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] font-mono text-muted mt-1">
            Normal safety factor Z = {zScore.toFixed(3)}
          </div>
        </div>

        <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-5 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-muted">Total Stock in Store</div>
          <div className="font-mono text-2xl font-semibold text-ink mt-1">
            {totalUnits.toLocaleString()}
          </div>
          <div className="text-[11px] font-mono text-muted mt-1">
            Shelf + in-transit units
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
              Maintain SKU shelf levels, edit supplier lead-time distributions, inspect perishability days, and trigger replenishment purchase orders.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs font-mono text-ink">
            <span>Manage Store SKUs</span>
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
              Demand Insights & Anomaly Triage
            </h4>
            <p className="text-muted text-xs font-sans mt-2 leading-relaxed">
              Upload daily sales CSV files, inspect visible anomalies with AI bounded clamp adjustments, and review 90-day holdout forecast accuracy.
            </p>
          </div>
          <div className="pt-4 mt-4 border-t border-border flex items-center justify-between text-xs font-mono text-ink">
            <span>Inspect Demand & Spikes</span>
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
              Crisis Lab & Stress Testing
            </h4>
            <p className="text-muted text-xs font-sans mt-2 leading-relaxed">
              Simulate festival demand surges and vendor transit delays side-by-side with previous recommendations, revised carrying costs, and stockout risk.
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
        onOpenFormulasModal={onOpenFormulasModal}
      />
    </div>
  );
};
