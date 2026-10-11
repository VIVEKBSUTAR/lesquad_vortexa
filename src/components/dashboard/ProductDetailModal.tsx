'use client';

import React from 'react';
import { ProductWithComputed } from '@/lib/types';
import { X, ShieldCheck, Clock, Layers, ArrowRight, Package, TrendingUp, AlertCircle } from 'lucide-react';

interface ProductDetailModalProps {
  product: ProductWithComputed | null;
  onClose: () => void;
  onSimulateInCrisis: (product: ProductWithComputed) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onSimulateInCrisis,
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
  }[m.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl border border-border w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 lg:p-8 space-y-6">
        {/* Modal Header */}
        <div className="flex justify-between items-start pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="font-mono text-xs font-semibold text-muted bg-stone px-2.5 py-0.5 rounded border border-border">
                {product.sku}
              </span>
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-medium ${statusConfig.color} ${statusConfig.bg} ${statusConfig.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                <span>{statusConfig.label}</span>
              </div>
            </div>
            <h3 className="font-serif text-2xl lg:text-3xl text-ink font-light">
              {product.name}
            </h3>
            <p className="text-muted text-xs font-sans mt-1">
              {product.description}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted hover:text-ink hover:bg-stone transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operational Replenishment Parameters (Zero formulas, pure business decision metrics) */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="font-mono text-xs uppercase tracking-wider text-accent font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Replenishment Thresholds & Target SLA
            </span>
            <span className="font-mono text-xs text-muted">
              Target SLA: {(product.targetServiceLevel * 100).toFixed(1)}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-stone/70 border border-border">
              <div className="text-[10px] uppercase text-muted">Reorder Threshold</div>
              <div className="text-xl font-semibold text-brick mt-1">
                {Math.round(m.reorderPoint)}{' '}
                <span className="text-xs font-normal text-muted">units</span>
              </div>
              <div className="text-[10px] text-muted mt-1">Trigger level</div>
            </div>

            <div className="p-4 rounded-xl bg-stone/70 border border-border">
              <div className="text-[10px] uppercase text-muted">Safety Buffer</div>
              <div className="text-xl font-semibold text-moss mt-1">
                {Math.round(m.safetyStock)}{' '}
                <span className="text-xs font-normal text-muted">units</span>
              </div>
              <div className="text-[10px] text-muted mt-1">Lead-time hedge</div>
            </div>

            <div className="p-4 rounded-xl bg-stone/70 border border-border">
              <div className="text-[10px] uppercase text-muted">Recommended Batch</div>
              <div className="text-xl font-semibold text-ink mt-1">
                {Math.round(m.eoq)}{' '}
                <span className="text-xs font-normal text-muted">units</span>
              </div>
              <div className="text-[10px] text-muted mt-1">Cost-balanced batch</div>
            </div>

            <div className="p-4 rounded-xl bg-stone/70 border border-border">
              <div className="text-[10px] uppercase text-muted">Available Cover</div>
              <div className="text-xl font-semibold text-accent mt-1">
                {m.daysOfCover}{' '}
                <span className="text-xs font-normal text-muted">days</span>
              </div>
              <div className="text-[10px] text-muted mt-1">At daily demand pace</div>
            </div>
          </div>
        </div>

        {/* Inventory Position Audit */}
        <div className="p-4 rounded-xl bg-stone/70 border border-border">
          <div className="text-[10px] font-mono uppercase text-muted mb-3 font-semibold">
            Live Inventory Position State
          </div>
          <div className="grid grid-cols-4 gap-4 font-mono text-xs text-center">
            <div>
              <div className="text-muted text-[10px] uppercase">On Hand</div>
              <div className="font-semibold text-ink text-base mt-0.5">{product.onHand}</div>
            </div>
            <div>
              <div className="text-muted text-[10px] uppercase">On Order</div>
              <div className="font-semibold text-slate text-base mt-0.5">+{product.onOrder}</div>
            </div>
            <div>
              <div className="text-muted text-[10px] uppercase">Backorders</div>
              <div className="font-semibold text-brick text-base mt-0.5">-{product.backorders}</div>
            </div>
            <div className="border-l border-border pl-2">
              <div className="text-muted text-[10px] uppercase">Effective Position</div>
              <div className="font-semibold text-accent text-base mt-0.5">{m.inventoryPosition}</div>
            </div>
          </div>
        </div>

        {/* Observed Lead Times (10 points) */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="font-mono text-xs uppercase tracking-wider text-muted font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Supplier Lead Time History (10 Deliveries)
            </span>
            <span className="font-mono text-xs text-muted">
              Average: {m.avgLeadTime.toFixed(1)}d
            </span>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 font-mono text-xs text-center">
            {product.leadTimes.map((lt, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-stone border border-border">
                <div className="text-[9px] text-muted">PO {idx + 1}</div>
                <div className="font-semibold text-ink mt-0.5">{lt}d</div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-border flex justify-between items-center">
          <div className="text-xs font-mono text-muted">
            Unit Cost: ${product.unitCost} • Annual Carrying Cost: ${Math.round(m.annualHoldingCost).toLocaleString()}
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
              Simulate in Crisis Lab <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
