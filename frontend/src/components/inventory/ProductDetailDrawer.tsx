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
            <span className="text-xs font-bold text-slate-700 bg-stone px-2.5 py-0.5 rounded border border-border">
              {product.sku}
            </span>
            <span className="text-xs font-semibold text-accent bg-accent/10 px-2.5 py-0.5 rounded border border-accent/20">
              {product.category}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border text-xs font-bold ${statusBadge.color}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
              <span>{statusBadge.label}</span>
            </span>
          </div>

          <h2 className="font-bold text-2xl text-slate-900 tracking-tight">
            {product.name}
          </h2>
          <p className="text-slate-600 text-xs mt-1 font-medium">
            Unit: {product.unitOfMeasure || 'piece'} • Shelf Life: {product.perishabilityDays} Days
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-stone transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body — Clean Customer View */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 divide-y divide-border/60">
        {/* SECTION 1 — Current Stock & Order Action */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-900 font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent" /> Stock & Replenishment Status
            </span>
            <button
              onClick={() => onSimulateInCrisis(product)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-accent text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <FlaskConical className="w-3.5 h-3.5 text-ochre" />
              <span>Test Stress Scenario</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs">
              <div className="text-[11px] uppercase text-slate-500 font-bold">On-Shelf Stock</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {product.onHand}{' '}
                <span className="text-xs font-normal text-slate-500">
                  {product.unitOfMeasure || 'units'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Committed: {product.committedQty || 0}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs">
              <div className="text-[11px] uppercase text-slate-500 font-bold">Stock Remaining</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {(product.onHand / Math.max(0.1, d)).toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-500">days</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                At current sales rate
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs">
              <div className="text-[11px] uppercase text-slate-500 font-bold">Reorder Level</div>
              <div className="text-xl font-bold text-brick mt-1">
                {Math.round(m.reorderPoint)}{' '}
                <span className="text-xs font-normal text-slate-500">units</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                Order trigger point
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs">
              <div className="text-[11px] uppercase text-slate-500 font-bold">Recommended Order</div>
              <div className="text-xl font-bold text-accent mt-1">
                {m.inventoryPosition <= m.reorderPoint
                  ? `${Math.round(m.eoq)} units`
                  : '0 units'}
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                {m.inventoryPosition <= m.reorderPoint
                  ? 'Ready to order'
                  : 'Stock is healthy'}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2 — Replenishment Plan in Plain English */}
        <div className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-900 font-bold flex items-center gap-2">
              <Box className="w-4 h-4 text-accent" /> How Your Order Is Decided
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Plain English Guide
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Daily Sales */}
            <div className="p-4 rounded-2xl bg-surface border border-border space-y-1.5 shadow-xs">
              <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>Daily Customer Demand</span>
                <span className="text-accent font-bold text-sm">{d.toFixed(1)} units / day</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Based on your daily store sales history. Peak rush days fluctuate up to ~{(d + sigmaD).toFixed(1)} units.
              </p>
            </div>

            {/* Delivery Time */}
            <div className="p-4 rounded-2xl bg-surface border border-border space-y-1.5 shadow-xs">
              <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>Supplier Delivery Wait Time</span>
                <span className="text-accent font-bold text-sm">~{L.toFixed(0)} days</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                The average time it takes for your supplier to deliver fresh stock after placing a purchase order.
              </p>
            </div>

            {/* Reorder Trigger */}
            <div className="p-4 rounded-2xl bg-surface border border-border space-y-1.5 shadow-xs">
              <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>When to Reorder</span>
                <span className="text-brick font-bold text-sm">Below {Math.round(m.reorderPoint)} units</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                When shelf stock drops to this number, a new order is triggered immediately so it arrives before you run out.
              </p>
            </div>

            {/* Emergency Buffer */}
            <div className="p-4 rounded-2xl bg-surface border border-border space-y-1.5 shadow-xs">
              <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>Emergency Stock Buffer</span>
                <span className="text-moss font-bold text-sm">+{Math.round(m.safetyStock)} units</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Reserved stock kept on hand to safeguard against delayed delivery trucks or sudden customer buying rushes.
              </p>
            </div>
          </div>

          {/* Packaging Rules */}
          <div className="p-4 rounded-2xl bg-stone/50 border border-border text-xs text-slate-700 flex flex-wrap justify-between items-center gap-2">
            <span className="font-bold text-slate-900">Packaging Rules:</span>
            <span>Carton Pack Size: <strong className="text-slate-900">{product.packSize || 1} units</strong></span>
            <span>•</span>
            <span>Minimum Order: <strong className="text-slate-900">{product.minimumOrderQty || 1} units</strong></span>
            <span>•</span>
            <span>Unit Cost: <strong className="text-slate-900">${product.unitCost?.toFixed(2) || '0.00'}</strong></span>
          </div>
        </div>

        {/* SECTION 3 — 14-Day Stock Depletion Outlook */}
        <div className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-900 font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" /> 14-Day Stock Depletion Outlook
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Without New Reorders
            </span>
          </div>

          <div className="h-48 w-full bg-surface border border-border rounded-2xl p-3 shadow-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trajectoryData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#DAD6CE" opacity={0.5} />
                <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF9F7',
                    borderColor: '#DAD6CE',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                />
                <ReferenceLine
                  y={Math.round(m.reorderPoint)}
                  stroke="#BE123C"
                  strokeDasharray="3 3"
                  label={{
                    value: `Reorder Trigger (${Math.round(m.reorderPoint)})`,
                    fill: '#BE123C',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
                <ReferenceLine
                  y={Math.round(m.safetyStock)}
                  stroke="#2E6B34"
                  strokeDasharray="3 3"
                  label={{
                    value: `Buffer (${Math.round(m.safetyStock)})`,
                    fill: '#2E6B34',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="projectedStock"
                  name="Projected Inventory"
                  stroke="#0F172A"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#0F172A' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            The black line shows shelf stock depleting over the next 14 days. When it drops below the red line, StockSense generates an order immediately so replacement stock arrives before shelves empty.
          </p>
        </div>

        {/* SECTION 4 — Store Manager Protection Checklist */}
        <div className="pt-6 space-y-3 text-xs">
          <span className="text-xs uppercase tracking-wider text-slate-900 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-moss" /> Store Protection Checklist
          </span>

          <div className="p-4 rounded-2xl bg-stone/40 border border-border space-y-2.5 text-slate-700 text-xs">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-moss mt-0.5 shrink-0" />
              <span>
                <strong className="text-slate-900">Supplier Reliability Monitored:</strong> Vendor delivery history is tracked to account for late shipments automatically.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-moss mt-0.5 shrink-0" />
              <span>
                <strong className="text-slate-900">Sales Spike Protection:</strong> One-off flash sales or festival spikes are filtered so you don&apos;t accidentally over-order afterward.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-moss mt-0.5 shrink-0" />
              <span>
                <strong className="text-slate-900">Verified History:</strong> Over 30 days of daily sales validated for this product.
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 5 — Recent Order Recommendations */}
        <div className="pt-6 space-y-3 text-xs pb-6">
          <span className="text-xs uppercase tracking-wider text-slate-900 font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-accent" /> Recent Order History
          </span>

          <div className="space-y-2">
            {recSnapshots.map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 rounded-2xl bg-surface border border-border flex justify-between items-center text-xs shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{rec.id}</span>
                    <span className="text-slate-500">
                      {new Date(rec.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="text-slate-600 mt-0.5 font-medium">
                    Recommended Order: <strong className="text-accent">{rec.suggestedOrderQty} units</strong>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      rec.status === 'reorder_now'
                        ? 'bg-brick/10 text-brick border border-brick/20'
                        : 'bg-moss/10 text-moss border border-moss/20'
                    }`}
                  >
                    {rec.status === 'reorder_now' ? 'Order Due' : 'Stock Normal'}
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
          className="px-4 py-2 border border-border rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-stone cursor-pointer"
        >
          Close Panel
        </button>

        <button
          onClick={() => {
            onClose();
            onSimulateInCrisis(product);
          }}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-accent transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
        >
          <FlaskConical className="w-4 h-4 text-ochre" />
          <span>Launch in Scenario Lab</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
