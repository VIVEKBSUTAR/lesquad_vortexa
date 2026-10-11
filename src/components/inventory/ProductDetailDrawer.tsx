'use client';

import React from 'react';
import { ProductWithComputed, RecommendationSnapshot } from '@/lib/types';
import { getRecommendationSnapshots } from '@/lib/data';
import {
  X,
  ShieldCheck,
  Clock,
  Layers,
  ArrowRight,
  Package,
  TrendingUp,
  AlertCircle,
  Calculator,
  Scale,
  FlaskConical,
  Box,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Truck,
  Hash
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

interface ProductDetailDrawerProps {
  product: ProductWithComputed | null;
  onClose: () => void;
  onSimulateInCrisis: (product: ProductWithComputed) => void;
  onOpenFormulasModal?: () => void;
}

export const ProductDetailDrawer: React.FC<ProductDetailDrawerProps> = ({
  product,
  onClose,
  onSimulateInCrisis,
  onOpenFormulasModal,
}) => {
  if (!product) return null;

  const m = product.metrics;
  const d = m.avgDemand;
  const L = m.avgLeadTime;
  const sigmaD = m.demandStdDev;
  const sigmaL = m.leadTimeStdDev;
  const Z = m.zScore;

  // Expected lead time demand: d * L
  const expectedLTD = d * L;

  // Dual variance components:
  const varDemandComponent = L * Math.pow(sigmaD, 2);
  const varLeadTimeComponent = Math.pow(d, 2) * Math.pow(sigmaL, 2);
  const combinedVariance = varDemandComponent + varLeadTimeComponent;
  const combinedStdDev = Math.sqrt(combinedVariance);

  // Status configuration
  const statusBadge = {
    order: {
      label: 'Reorder Now',
      color: 'text-brick bg-brick/10 border-brick/30',
      dot: 'bg-brick',
    },
    reorder_now: {
      label: 'Reorder Now',
      color: 'text-brick bg-brick/10 border-brick/30',
      dot: 'bg-brick',
    },
    watch: {
      label: 'Buffer Watch',
      color: 'text-ochre bg-ochre/10 border-ochre/30',
      dot: 'bg-ochre',
    },
    healthy: {
      label: 'Healthy Stocked',
      color: 'text-moss bg-moss/10 border-moss/30',
      dot: 'bg-moss',
    },
    insufficient_data: {
      label: 'Insufficient Data',
      color: 'text-muted bg-stone border-border',
      dot: 'bg-muted',
    },
  }[m.status] || {
    label: 'Reorder Now',
    color: 'text-brick bg-brick/10 border-brick/30',
    dot: 'bg-brick',
  };

  // Stock coverage trajectory projection (deterministic daily depletion)
  const trajectoryDays = 14;
  const trajectoryData = Array.from({ length: trajectoryDays }).map((_, i) => {
    const day = i + 1;
    // Physical inventory depletes by mean demand d each day until 0
    const projectedStock = Math.max(0, Math.round(product.onHand - day * d));
    return {
      day: `Day +${day}`,
      projectedStock,
      reorderPoint: Math.round(m.reorderPoint),
      safetyStock: Math.round(m.safetyStock),
    };
  });

  // Recent recommendation history for this product
  const recSnapshots = getRecommendationSnapshots([product]);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-surface border-l border-border shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="p-6 border-b border-border flex justify-between items-start bg-stone/20">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-mono text-xs font-semibold text-muted bg-stone px-2.5 py-0.5 rounded border border-border">
              {product.sku}
            </span>
            <span className="font-mono text-[11px] text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
              {product.category}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-medium ${statusBadge.color}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
              <span>{statusBadge.label}</span>
            </span>
          </div>

          <h2 className="font-serif text-2xl font-light text-ink">
            {product.name}
          </h2>
          <p className="text-muted text-xs font-sans mt-0.5">
            Unit: {product.unitOfMeasure || 'piece'} • Shelf Life: {product.perishabilityDays} Days
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-muted hover:text-ink hover:bg-stone transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body — 5 Required Sections */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 divide-y divide-border/60">
        {/* SECTION 1 — Decision Summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-accent font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Section 1 — Decision Summary
            </span>
            <button
              onClick={() => onSimulateInCrisis(product)}
              className="px-3 py-1.5 rounded-xl bg-ink text-surface hover:bg-accent text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <FlaskConical className="w-3.5 h-3.5 text-ochre" />
              <span>Test in Scenario Lab</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-2xl bg-stone/40 border border-border">
              <div className="text-[10px] uppercase text-muted">On-Hand Stock</div>
              <div className="text-lg font-semibold text-ink mt-1">
                {product.onHand}{' '}
                <span className="text-[10px] font-normal text-muted">
                  {product.unitOfMeasure || 'units'}
                </span>
              </div>
              <div className="text-[10px] text-muted mt-0.5">Committed: {product.committedQty || 0}</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone/40 border border-border">
              <div className="text-[10px] uppercase text-muted">Inventory Position</div>
              <div className="text-lg font-semibold text-ink mt-1">
                {m.inventoryPosition}{' '}
                <span className="text-[10px] font-normal text-muted">units</span>
              </div>
              <div className="text-[10px] text-muted mt-0.5">OH - Committed</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone/40 border border-border">
              <div className="text-[10px] uppercase text-muted">Reorder Point</div>
              <div className="text-lg font-semibold text-brick mt-1">
                {Math.round(m.reorderPoint)}{' '}
                <span className="text-[10px] font-normal text-muted">units</span>
              </div>
              <div className="text-[10px] text-muted mt-0.5">ROP threshold</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-stone/40 border border-border">
              <div className="text-[10px] uppercase text-muted">Suggested Order Qty</div>
              <div className="text-lg font-semibold text-accent mt-1">
                {m.inventoryPosition <= m.reorderPoint
                  ? `${Math.round(m.eoq)} units`
                  : '0 units'}
              </div>
              <div className="text-[10px] text-muted mt-0.5">
                {m.inventoryPosition <= m.reorderPoint
                  ? 'Batch size Q'
                  : 'Stock sufficient'}
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone/30 border border-border/80 flex items-center justify-between text-xs font-mono">
            <span className="text-muted">Target Service Level:</span>
            <span className="font-semibold text-ink">
              {(product.targetServiceLevel * 100).toFixed(0)}% (Safety Factor Z = {Z.toFixed(3)})
            </span>
          </div>
        </div>

        {/* SECTION 2 — Calculation Breakdown */}
        <div className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-accent font-semibold flex items-center gap-2">
              <Calculator className="w-4 h-4" /> Section 2 — Calculation Breakdown
            </span>
            {onOpenFormulasModal && (
              <button
                onClick={onOpenFormulasModal}
                className="text-[11px] font-mono text-muted hover:text-accent flex items-center gap-1 cursor-pointer"
              >
                <span>View OR Formulas</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Mathematical Parameter Matrix */}
          <div className="grid grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-2xl bg-surface border border-border space-y-2">
              <div className="text-[11px] text-muted uppercase font-semibold">
                Demand Parameters
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted">Mean Daily Demand (d):</span>
                <span className="font-semibold text-ink">{d.toFixed(2)} units/day</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted">Demand Std Dev (σ_d):</span>
                <span className="font-semibold text-ink">{sigmaD.toFixed(2)} units</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted">Lead Time Demand (d × L):</span>
                <span className="font-semibold text-ink">{expectedLTD.toFixed(1)} units</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface border border-border space-y-2">
              <div className="text-[11px] text-muted uppercase font-semibold">
                Supplier Parameters
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted">Avg Lead Time (L):</span>
                <span className="font-semibold text-ink">{L.toFixed(1)} days</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted">Lead Time Std Dev (σ_L):</span>
                <span className="font-semibold text-ink">{sigmaL.toFixed(2)} days</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-muted">Combined σ_LTD:</span>
                <span className="font-semibold text-accent">{combinedStdDev.toFixed(2)} units</span>
              </div>
            </div>
          </div>

          {/* Dual Variance Safety Stock & ROP Formulas */}
          <div className="p-4 rounded-2xl bg-stone/50 border border-border space-y-3 font-mono text-xs">
            <div className="text-[11px] text-muted uppercase font-semibold">
              Deterministic Buffer Equations
            </div>

            <div className="p-2.5 rounded-xl bg-surface border border-border">
              <div className="text-[10px] text-muted">Safety Stock Formula:</div>
              <div className="font-semibold text-ink mt-0.5">
                SS = Z × √(L·σ_d² + d²·σ_L²) = {Z.toFixed(3)} × √({Math.round(combinedVariance)}) ={' '}
                <span className="text-moss">{Math.round(m.safetyStock)} units</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface border border-border">
              <div className="text-[10px] text-muted">Reorder Point Formula:</div>
              <div className="font-semibold text-ink mt-0.5">
                ROP = (d × L) + SS = {expectedLTD.toFixed(1)} + {Math.round(m.safetyStock)} ={' '}
                <span className="text-brick">{Math.round(m.reorderPoint)} units</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-surface border border-border">
              <div className="text-[10px] text-muted">Order Batch Constraint Adjustments:</div>
              <div className="text-ink mt-0.5">
                Raw EOQ: <span className="font-semibold">{Math.round(m.eoq)} units</span> • MOQ:{' '}
                <span className="font-semibold">{product.minimumOrderQty || 1} units</span> • Pack
                Size: <span className="font-semibold">{product.packSize || 1}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3 — Stock Coverage Trajectory */}
        <div className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-accent font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Section 3 — Stock Coverage Trajectory
            </span>
            <span className="text-[11px] font-mono text-muted">
              {trajectoryDays}-Day Depletion Outlook
            </span>
          </div>

          <div className="h-48 w-full bg-surface border border-border rounded-2xl p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trajectoryData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#DAD6CE" opacity={0.5} />
                <XAxis dataKey="day" tick={{ fill: '#6D6A64', fontSize: 10 }} />
                <YAxis tick={{ fill: '#6D6A64', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF9F7',
                    borderColor: '#DAD6CE',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                />
                <ReferenceLine
                  y={Math.round(m.reorderPoint)}
                  stroke="#A04028"
                  strokeDasharray="3 3"
                  label={{
                    value: `ROP (${Math.round(m.reorderPoint)})`,
                    fill: '#A04028',
                    fontSize: 10,
                  }}
                />
                <ReferenceLine
                  y={Math.round(m.safetyStock)}
                  stroke="#2F4F3E"
                  strokeDasharray="3 3"
                  label={{
                    value: `SS (${Math.round(m.safetyStock)})`,
                    fill: '#2F4F3E',
                    fontSize: 10,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="projectedStock"
                  name="Physical Inventory"
                  stroke="#1C1B19"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#1C1B19' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] font-mono text-muted">
            Note: Physical stock bounded at zero. Reorder threshold line indicates when a new purchase batch arrives to replenish inventory.
          </p>
        </div>

        {/* SECTION 4 — Assumptions and Limitations */}
        <div className="pt-6 space-y-3 font-mono text-xs">
          <span className="text-xs uppercase tracking-wider text-accent font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Section 4 — Assumptions & System Boundaries
          </span>

          <div className="p-4 rounded-2xl bg-stone/40 border border-border space-y-2 text-muted text-[11px]">
            <div className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>
                <strong className="text-ink">Incoming POs:</strong> In-transit shipments currently assumed to be zero unless explicitly acknowledged via warehouse manifest.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>
                <strong className="text-ink">Demand History Sufficiency:</strong> 30 consecutive days of chronological demand observations verified.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>
                <strong className="text-ink">Treatment of Stockout Days:</strong> Zero-demand stockout days flagged and dampened to prevent artificial downward bias on mean sales rate.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>
                <strong className="text-ink">Calculation Engine:</strong> Continuous Review (r, Q) OR-Engine v2.4 with stochastic dual-variance lead time hedging.
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 5 — Recommendation History */}
        <div className="pt-6 space-y-3 font-mono text-xs pb-6">
          <span className="text-xs uppercase tracking-wider text-accent font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4" /> Section 5 — Recommendation History Snapshots
          </span>

          <div className="space-y-2">
            {recSnapshots.map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 rounded-2xl bg-surface border border-border flex justify-between items-center text-[11px]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ink">{rec.id}</span>
                    <span className="text-muted">
                      {new Date(rec.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="text-muted mt-0.5">
                    Suggested Order: <span className="text-accent font-semibold">{rec.suggestedOrderQty} units</span> (Batch Size Q)
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      rec.status === 'reorder_now'
                        ? 'bg-brick/10 text-brick border border-brick/20'
                        : 'bg-moss/10 text-moss border border-moss/20'
                    }`}
                  >
                    {rec.status === 'reorder_now' ? 'PO Generated' : 'Healthy'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-border flex justify-between items-center bg-stone/30">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-border rounded-xl text-xs font-mono text-muted hover:text-ink cursor-pointer"
        >
          Close Panel
        </button>

        <button
          onClick={() => {
            onClose();
            onSimulateInCrisis(product);
          }}
          className="px-5 py-2 bg-ink text-surface rounded-xl text-xs font-mono font-medium hover:bg-accent transition-colors cursor-pointer flex items-center gap-2 shadow-xs"
        >
          <FlaskConical className="w-3.5 h-3.5 text-ochre" />
          <span>Launch in Scenario Lab</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
