'use client';

import React, { useState } from 'react';
import { Anomaly, AnomalyType, ProductWithComputed } from '@/lib/types';
import { Activity, ShieldAlert, CheckCircle2, Filter, AlertOctagon } from 'lucide-react';

interface AnomalyAuditLogProps {
  products: ProductWithComputed[];
}

export const AnomalyAuditLog: React.FC<AnomalyAuditLogProps> = ({ products }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [skuFilter, setSkuFilter] = useState<string>('all');

  // Collect all anomalies across all products with SKU metadata
  const allAnomalies: Array<{
    anomaly: Anomaly;
    product: ProductWithComputed;
  }> = [];

  products.forEach((p) => {
    p.anomalies.forEach((a) => {
      allAnomalies.push({ anomaly: a, product: p });
    });
  });

  const filtered = allAnomalies.filter(({ anomaly, product }) => {
    if (filterType !== 'all' && anomaly.type !== filterType) return false;
    if (skuFilter !== 'all' && product.id !== skuFilter) return false;
    return true;
  });

  return (
    <div className="bg-surface rounded-xl border border-border p-6 lg:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-anomaly font-semibold mb-1">
            <Activity className="w-3.5 h-3.5" />
            Statistical Defense Mechanism
          </div>
          <h3 className="font-serif text-2xl text-ink font-normal">
            Anomaly Classification & Variance Clamp Audit Log
          </h3>
          <p className="text-muted text-xs font-sans mt-0.5">
            AI is strictly confined to anomaly classification. Pure math clamps protect the baseline from variance distortion.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Type filter pills */}
          <div className="flex items-center gap-1 bg-stone p-1 rounded-lg border border-border text-xs font-mono">
            {[
              { id: 'all', label: 'All' },
              { id: 'data_error', label: 'Errors' },
              { id: 'promo', label: 'Promos' },
              { id: 'censored', label: 'Censored' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterType === t.id
                    ? 'bg-ink text-surface font-medium'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* SKU filter */}
          <select
            value={skuFilter}
            onChange={(e) => setSkuFilter(e.target.value)}
            className="bg-stone text-ink border border-border rounded-lg px-3 py-1.5 text-xs font-mono font-medium focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="all">All SKUs</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-border text-muted uppercase text-[10px] tracking-wider">
              <th className="py-3 px-3">Date / Day</th>
              <th className="py-3 px-3">SKU & Item</th>
              <th className="py-3 px-3">Raw Observed</th>
              <th className="py-3 px-3">Clamped Baseline</th>
              <th className="py-3 px-3">Variance Shield</th>
              <th className="py-3 px-3">AI Classification</th>
              <th className="py-3 px-3">Confidence</th>
              <th className="py-3 px-3 min-w-[240px]">Audit Justification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map(({ anomaly, product }) => {
              const typeBadgeClass =
                anomaly.type === 'data_error'
                  ? 'bg-brick/10 text-brick border-brick/30'
                  : anomaly.type === 'promo'
                  ? 'bg-anomaly/10 text-anomaly border-anomaly/30'
                  : 'bg-slate/10 text-slate border-slate/30';

              return (
                <tr key={`${product.id}-${anomaly.day}`} className="hover:bg-stone/50 transition-colors">
                  <td className="py-3.5 px-3 whitespace-nowrap text-muted">
                    {anomaly.date} <span className="text-[10px] text-muted/60">(D{anomaly.day})</span>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap font-sans font-medium text-ink">
                    <span className="font-mono text-muted text-xs mr-2">{product.sku}</span>
                    {product.name}
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap font-semibold text-brick">
                    {anomaly.raw} units
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap font-semibold text-moss">
                    {anomaly.adj} units
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded bg-moss/10 text-moss font-medium">
                      {anomaly.varianceImpactPct}% infl. prevented
                    </span>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-semibold ${typeBadgeClass}`}>
                      {anomaly.typeLabel}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap text-ink">
                    {(anomaly.confidence * 100).toFixed(1)}%
                  </td>
                  <td className="py-3.5 px-3 font-sans text-xs text-muted leading-relaxed">
                    {anomaly.explanation}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-[11px] font-mono text-muted">
        <span>Displaying {filtered.length} of {allAnomalies.length} classified anomaly events</span>
        <span className="text-moss flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> All clamps bound by deterministic upper percentiles
        </span>
      </div>
    </div>
  );
};
