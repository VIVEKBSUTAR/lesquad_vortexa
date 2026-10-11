'use client';

import React, { useState } from 'react';
import { ProductWithComputed } from '@/lib/types';
import { CrisisSimulator } from './CrisisSimulator';
import { ProductGrid } from './ProductGrid';
import { AnomalyAuditLog } from './AnomalyAuditLog';
import { HoldoutProver } from './HoldoutProver';
import { ProductDetailModal } from './ProductDetailModal';
import { NetworkTicker } from './NetworkTicker';
import { ShieldCheck, AlertCircle, ArrowLeft, Layers, BarChart3, Database } from 'lucide-react';

interface DashboardViewProps {
  products: ProductWithComputed[];
  onBackToStory: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  onBackToStory,
}) => {
  const [selectedProduct, setSelectedProduct] = useState<ProductWithComputed>(products[0]);
  const [modalProduct, setModalProduct] = useState<ProductWithComputed | null>(null);
  const [activeTab, setActiveTab] = useState<'simulator' | 'roster' | 'anomalies' | 'holdout'>('simulator');

  // Compute aggregate network totals
  const totalSafetyStock = products.reduce((acc, p) => acc + p.metrics.safetyStock, 0);
  const totalInventoryPosition = products.reduce((acc, p) => acc + p.metrics.inventoryPosition, 0);
  const criticalOrdersCount = products.filter((p) => p.metrics.status === 'order').length;
  const watchCount = products.filter((p) => p.metrics.status === 'watch').length;
  const avgServiceLevel =
    products.reduce((acc, p) => acc + p.targetServiceLevel, 0) / products.length;

  return (
    <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToStory}
            className="p-2 border border-border rounded-lg bg-surface hover:bg-stone text-muted hover:text-ink text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Story Mode</span>
          </button>
          <div>
            <h2 className="font-serif text-2xl font-light text-ink">
              StockSense Command Center
            </h2>
            <div className="text-[11px] font-mono text-muted flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-moss"></span>
              Deterministic Replenishment Engine Online (v2.4)
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-stone p-1 rounded-xl border border-border text-xs font-mono">
          {[
            { id: 'simulator', label: 'Crisis Sim' },
            { id: 'roster', label: 'Product Roster' },
            { id: 'anomalies', label: 'Anomaly Log' },
            { id: 'holdout', label: 'Holdout Prover' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-ink text-surface font-semibold shadow-sm'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Aggregate KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-muted">Network Health</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-moss animate-pulse"></span>
            <span className="font-mono text-lg font-semibold text-ink">98.2% In-Stock</span>
          </div>
          <div className="text-[11px] font-mono text-muted mt-1">
            Zero unhedged stockouts
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-muted">Active Reorder Triggers</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-lg font-semibold text-brick">
              {criticalOrdersCount} SKU
            </span>
            <span className="font-mono text-xs text-ochre">({watchCount} Watch)</span>
          </div>
          <div className="text-[11px] font-mono text-muted mt-1">
            HW-02 crossed ROP line
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-muted">Mean Service Level</div>
          <div className="font-mono text-lg font-semibold text-accent mt-1">
            {(avgServiceLevel * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] font-mono text-muted mt-1">
            Target SLA bounded
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-muted">Total Units On Hand</div>
          <div className="font-mono text-lg font-semibold text-ink mt-1">
            {totalInventoryPosition.toLocaleString()} units
          </div>
          <div className="text-[11px] font-mono text-muted mt-1">
            Across 8 production SKUs
          </div>
        </div>
      </div>

      {/* Network Safety Stock Ticker */}
      <NetworkTicker initialValue={totalSafetyStock} />

      {/* Tab Panels */}
      {activeTab === 'simulator' && (
        <section className="space-y-8">
          <CrisisSimulator
            products={products}
            selectedProduct={selectedProduct}
            onSelectProduct={setSelectedProduct}
          />
          <ProductGrid
            products={products}
            onSelectProduct={(p) => setModalProduct(p)}
          />
        </section>
      )}

      {activeTab === 'roster' && (
        <section className="space-y-8">
          <ProductGrid
            products={products}
            onSelectProduct={(p) => setModalProduct(p)}
          />
        </section>
      )}

      {activeTab === 'anomalies' && (
        <section className="space-y-8">
          <AnomalyAuditLog products={products} />
        </section>
      )}

      {activeTab === 'holdout' && (
        <section className="space-y-8">
          <HoldoutProver products={products} />
        </section>
      )}

      {/* SKU Detail Modal */}
      <ProductDetailModal
        product={modalProduct}
        onClose={() => setModalProduct(null)}
        onSimulateInCrisis={(p) => {
          setSelectedProduct(p);
          setActiveTab('simulator');
        }}
      />
    </div>
  );
};
