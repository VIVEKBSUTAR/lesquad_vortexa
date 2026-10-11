'use client';

import React from 'react';
import { ProductWithComputed } from '@/lib/types';
import { X, ShieldCheck, Clock, Layers, ArrowRight, Package, TrendingUp, AlertCircle, Calculator, Scale } from 'lucide-react';

interface ProductDetailModalProps {
  product: ProductWithComputed | null;
  onClose: () => void;
  onSimulateInCrisis: (product: ProductWithComputed) => void;
  onOpenFormulasModal?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onSimulateInCrisis,
  onOpenFormulasModal,
}) => {
  if (!product) return null;

  const m = product.metrics;

  const statusConfig = {
    healthy: {
      color: 'text-moss',
      bg: 'bg-moss/10',
      border: 'border-moss/30',
      dot: 'bg-moss',
      label: 'Healthy Stocked',
    },
    watch: {
      color: 'text-ochre',
      bg: 'bg-ochre/10',
      border: 'border-ochre/30',
      dot: 'bg-ochre',
      label: 'Buffer Watch',
    },
    order: {
      color: 'text-brick',
      bg: 'bg-brick/10',
      border: 'border-brick/30',
      dot: 'bg-brick',
      label: 'Reorder Now',
    },
    reorder_now: {
      color: 'text-brick',
      bg: 'bg-brick/10',
      border: 'border-brick/30',
      dot: 'bg-brick',
      label: 'Reorder Now',
    },
  }[m.status] || {
    color: 'text-brick',
    bg: 'bg-brick/10',
    border: 'border-brick/30',
    dot: 'bg-brick',
    label: 'Reorder Now',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface rounded-3xl border border-border w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 lg:p-8 space-y-6">
        {/* Modal Header */}
        <div className="flex justify-between items-start pb-6 border-b border-border">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono text-xs font-semibold text-muted bg-stone px-2.5 py-0.5 rounded border border-border">
                {product.sku}
              </span>
              <span className="font-mono text-[11px] text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                {product.category}
              </span>
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-medium ${statusConfig.color} ${statusConfig.bg} ${statusConfig.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                <span>{statusConfig.label}</span>
              </div>
            </div>
            <h3 className="font-sans text-2xl lg:text-3xl text-slate-900 font-bold tracking-tight">
              {product.name}
            </h3>
            <p className="text-slate-600 text-xs font-sans mt-1 leading-relaxed">
              {product.description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-stone transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Stock Protection & Shelf Life */}
        <div className="p-4 rounded-2xl bg-stone/70 border border-border flex flex-wrap justify-between items-center gap-3 font-sans text-xs">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-accent" />
            <span className="text-slate-900 font-bold">
              Target Protection: {(product.targetServiceLevel * 100).toFixed(0)}% Availability
            </span>
            <span className="text-accent font-sans bg-surface px-2.5 py-0.5 rounded border border-border font-bold">
              High Reliability Buffer
            </span>
          </div>
          <div className="text-slate-500 text-[11px] font-medium">
            Shelf Life: <span className="text-slate-900 font-bold">{product.perishabilityDays} Days</span>
          </div>
        </div>

        {/* Operational Replenishment Parameters */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-sans text-xs uppercase tracking-wider text-accent font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Recommended Replenishment Policy
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-sans text-xs">
            <div className="p-4 rounded-2xl bg-surface border border-border">
              <div className="text-[10px] uppercase text-slate-500 font-bold">When to Reorder</div>
              <div className="text-xl font-bold text-brick mt-1">
                {Math.round(m.reorderPoint)}{' '}
                <span className="text-xs font-normal text-slate-500">units</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Order Trigger Level</div>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-border">
              <div className="text-[10px] uppercase text-slate-500 font-bold">How Much to Reorder</div>
              <div className="text-xl font-bold text-accent mt-1">
                {Math.round(m.eoq)}{' '}
                <span className="text-xs font-normal text-slate-500">units</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Recommended Batch</div>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-border">
              <div className="text-[10px] uppercase text-slate-500 font-bold">Safety Stock Buffer</div>
              <div className="text-xl font-bold text-moss mt-1">
                {Math.round(m.safetyStock)}{' '}
                <span className="text-xs font-normal text-slate-500">units</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Emergency Buffer</div>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-border">
              <div className="text-[10px] uppercase text-slate-500 font-bold">Available Shelf Cover</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {m.daysOfCover}{' '}
                <span className="text-xs font-normal text-slate-500">days</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Daily sales: ~{m.avgDemand.toFixed(1)} u/day</div>
            </div>
          </div>
        </div>

        {/* Live Inventory Position Audit */}
        <div className="p-4 rounded-2xl bg-stone/70 border border-border">
          <div className="text-[10px] font-sans uppercase text-slate-500 mb-3 font-bold flex justify-between">
            <span>Current Stock Status (Shelf + Incoming - Reserved)</span>
            <span className="text-accent font-bold">Effective Available: {m.inventoryPosition} units</span>
          </div>
          <div className="grid grid-cols-4 gap-4 font-sans text-xs text-center">
            <div>
              <div className="text-slate-500 text-[10px] uppercase font-bold">Stock on Shelf</div>
              <div className="font-bold text-slate-900 text-base mt-0.5">{product.onHand}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] uppercase font-bold">In Transit (PO)</div>
              <div className="font-bold text-slate-900 text-base mt-0.5">+{product.onOrder}</div>
            </div>
            <div>
              <div className="text-slate-500 text-[10px] uppercase font-bold">Reserved / Backorders</div>
              <div className="font-bold text-brick text-base mt-0.5">-{product.backorders}</div>
            </div>
            <div className="border-l border-border pl-2">
              <div className="text-slate-500 text-[10px] uppercase font-bold">Available Cover</div>
              <div className="font-bold text-moss text-base mt-0.5">{m.daysOfCover}d</div>
            </div>
          </div>
        </div>

        {/* Observed Lead Times (10 points) */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="font-sans text-xs uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Supplier Delivery Lead Time History (10 Receipts)
            </span>
            <span className="font-sans text-xs text-slate-600 font-medium">
              Average: {m.avgLeadTime.toFixed(1)} days (Variation: ±{m.leadTimeStdDev.toFixed(1)} days)
            </span>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 font-sans text-xs text-center">
            {product.leadTimes.map((lt, idx) => (
              <div key={idx} className="p-2 rounded-xl bg-stone border border-border">
                <div className="text-[9px] text-slate-500 font-bold">PO {idx + 1}</div>
                <div className="font-bold text-slate-900 mt-0.5">{lt}d</div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-border flex flex-wrap justify-between items-center gap-3">
          <div className="text-xs font-mono text-muted">
            Unit Cost: ${product.unitCost.toFixed(2)} • Carrying Cost: ${product.holdingCost.toFixed(2)}/u/yr
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-xl text-xs font-mono hover:bg-stone transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onSimulateInCrisis(product);
                onClose();
              }}
              className="px-5 py-2 bg-ink text-surface rounded-xl text-xs font-mono hover:bg-accent transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              Simulate Stress in Crisis Lab <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
