'use client';

import React, { useState } from 'react';
import { AnomalyReviewRecord, ProductWithComputed } from '@/lib/types';
import { getAnomalyReviews } from '@/lib/data';
import { Activity, ShieldAlert, CheckCircle2, Filter, AlertOctagon, UserCheck, Edit3, X, Check } from 'lucide-react';

interface AnomalyAuditLogProps {
  products: ProductWithComputed[];
}

export const AnomalyAuditLog: React.FC<AnomalyAuditLogProps> = ({ products }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [skuFilter, setSkuFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reviews, setReviews] = useState<AnomalyReviewRecord[]>(() => getAnomalyReviews(products));

  // Active Review Modal State
  const [activeReviewItem, setActiveReviewItem] = useState<AnomalyReviewRecord | null>(null);
  const [modalForm, setModalForm] = useState({
    user_classification: 'promotional_surge',
    user_treatment: 'clamp_to_upper_bound',
    reviewer_notes: '',
  });

  const openReviewModal = (item: AnomalyReviewRecord) => {
    setActiveReviewItem(item);
    setModalForm({
      user_classification: item.userClassification || 'promotional_surge',
      user_treatment: item.userTreatment || 'clamp_to_upper_bound',
      reviewer_notes: item.reviewerNotes || 'Reviewed and confirmed by dark store inventory lead.',
    });
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReviewItem) return;

    setReviews((prev) =>
      prev.map((r) =>
        r.id === activeReviewItem.id
          ? {
              ...r,
              reviewStatus: 'reviewed',
              userClassification: modalForm.user_classification,
              userTreatment: modalForm.user_treatment,
              reviewerNotes: modalForm.reviewer_notes,
              reviewedAt: new Date().toISOString(),
            }
          : r
      )
    );
    setActiveReviewItem(null);
  };

  const filtered = reviews.filter((r) => {
    if (filterType !== 'all' && r.anomalyType !== filterType) return false;
    if (skuFilter !== 'all' && r.productId !== skuFilter) return false;
    if (statusFilter !== 'all' && r.reviewStatus !== statusFilter) return false;
    return true;
  });

  return (
    <div className="bg-surface rounded-2xl border border-border p-6 lg:p-8 shadow-sm space-y-6">
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-anomaly font-semibold mb-1">
            <Activity className="w-3.5 h-3.5" />
            Table 3 • anomaly_reviews Schema
          </div>
          <h3 className="font-serif text-2xl text-ink font-normal">
            Automated Anomaly Detection & Human Review Ledger
          </h3>
          <p className="text-muted text-xs font-sans mt-0.5">
            Machine detection and AI suggestions are decoupled from user classification. Raw demand records remain immutable.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter */}
          <div className="flex items-center gap-1 bg-stone p-1 rounded-xl border border-border text-xs font-mono">
            {[
              { id: 'all', label: 'All Reviews' },
              { id: 'pending', label: 'Pending' },
              { id: 'reviewed', label: 'Reviewed' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  statusFilter === s.id
                    ? 'bg-ink text-surface font-semibold shadow-xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-stone text-ink border border-border rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="all">All Anomaly Types</option>
            <option value="spike">Spike</option>
            <option value="data_error">Data Error</option>
            <option value="censored_stockout">Censored Stockout</option>
          </select>

          {/* SKU filter */}
          <select
            value={skuFilter}
            onChange={(e) => setSkuFilter(e.target.value)}
            className="bg-stone text-ink border border-border rounded-xl px-3 py-1.5 text-xs font-mono font-medium focus:outline-none focus:border-accent cursor-pointer"
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

      {/* anomaly_reviews Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-border text-muted uppercase text-[10px] tracking-wider bg-stone/30">
              <th className="py-3 px-3">Review ID & Detector</th>
              <th className="py-3 px-3">SKU & Item</th>
              <th className="py-3 px-3">Affected Dates</th>
              <th className="py-3 px-3">Type & Score</th>
              <th className="py-3 px-3">Detector Explanation</th>
              <th className="py-3 px-3">AI Suggestion</th>
              <th className="py-3 px-3">Review Status</th>
              <th className="py-3 px-3">Human Treatment</th>
              <th className="py-3 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filtered.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              const typeBadgeClass =
                item.anomalyType === 'data_error'
                  ? 'bg-brick/10 text-brick border-brick/30'
                  : item.anomalyType === 'spike'
                  ? 'bg-anomaly/10 text-anomaly border-anomaly/30'
                  : 'bg-ochre/10 text-ochre border-ochre/30';

              return (
                <tr key={item.id} className="hover:bg-stone/50 transition-colors">
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="font-semibold text-accent">{item.id}</div>
                    <div className="text-[10px] text-muted">{item.detectorVersion}</div>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="font-sans font-medium text-ink">{product?.name || item.productId}</div>
                    <div className="text-[10px] text-muted font-mono">{product?.sku}</div>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap text-muted text-[11px]">
                    {item.affectedStartDate}
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-semibold ${typeBadgeClass}`}>
                        {item.anomalyType.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted font-mono block mt-0.5">
                      Score: {item.anomalyScore > 0 ? `+${item.anomalyScore}` : item.anomalyScore} σ
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-sans text-xs text-muted max-w-xs leading-relaxed">
                    {item.detectorExplanation}
                  </td>
                  <td className="py-3.5 px-3 font-sans text-xs text-accent max-w-xs leading-relaxed">
                    {item.aiSuggestion}
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                        item.reviewStatus === 'reviewed'
                          ? 'bg-moss/10 text-moss'
                          : 'bg-ochre/10 text-ochre'
                      }`}
                    >
                      {item.reviewStatus}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap text-[11px]">
                    {item.userClassification ? (
                      <div>
                        <span className="text-ink font-semibold">{item.userClassification.replace('_', ' ')}</span>
                        <div className="text-[10px] text-muted">{item.userTreatment?.replace(/_/g, ' ')}</div>
                      </div>
                    ) : (
                      <span className="text-muted italic">Pending Human Decision</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap text-right">
                    <button
                      onClick={() => openReviewModal(item)}
                      className="px-2.5 py-1 rounded-lg border border-border bg-stone hover:bg-ink hover:text-surface text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3 text-accent" />
                      <span>{item.reviewStatus === 'reviewed' ? 'Edit' : 'Review'}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pt-4 border-t border-border flex justify-between items-center text-[11px] font-mono text-muted">
        <span>Displaying {filtered.length} of {reviews.length} anomaly review records</span>
        <span className="text-moss flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Statistical clamps active — no unauthorized overrides
        </span>
      </div>

      {/* Human Review Modal (Table 3: anomaly_reviews update) */}
      {activeReviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <form
            onSubmit={handleSaveReview}
            className="bg-surface rounded-2xl border border-border w-full max-w-lg p-6 lg:p-8 shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div>
                <span className="font-mono text-xs text-anomaly uppercase font-semibold">
                  Human-in-the-Loop Decision Gate
                </span>
                <h4 className="font-serif text-2xl font-light text-ink mt-0.5">
                  Review Anomaly: {activeReviewItem.id}
                </h4>
                <div className="text-muted font-sans text-xs">
                  Detector: {activeReviewItem.detectorVersion} ({activeReviewItem.affectedStartDate})
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveReviewItem(null)}
                className="text-muted hover:text-ink text-xs font-mono cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-stone border border-border text-xs font-sans text-muted space-y-1">
                <div className="font-mono text-[10px] uppercase font-semibold text-ink">
                  Detector Finding:
                </div>
                <p>{activeReviewItem.detectorExplanation}</p>
                <div className="font-mono text-[10px] uppercase font-semibold text-accent pt-1">
                  AI Suggestion:
                </div>
                <p className="text-accent">{activeReviewItem.aiSuggestion}</p>
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1 font-semibold">
                  1. User Classification (user_classification) *
                </label>
                <select
                  value={modalForm.user_classification}
                  onChange={(e) => setModalForm({ ...modalForm, user_classification: e.target.value })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent cursor-pointer"
                >
                  <option value="promotional_surge">Promotional Surge (App Push Campaign)</option>
                  <option value="scanner_error">Scanner Error (Crate vs Single Pack Typo)</option>
                  <option value="stockout_censored">Censored Demand (Lost sales from stockout)</option>
                  <option value="genuine_structural_shift">Genuine Structural Shift (Keep in forecast)</option>
                </select>
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1 font-semibold">
                  2. User Treatment (user_treatment) *
                </label>
                <select
                  value={modalForm.user_treatment}
                  onChange={(e) => setModalForm({ ...modalForm, user_treatment: e.target.value })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent cursor-pointer"
                >
                  <option value="clamp_to_upper_bound">Clamp to 95th Percentile Bound (Variance Protection)</option>
                  <option value="exclude_from_model">Exclude Observation from Model Training</option>
                  <option value="reconstruct_demand">Reconstruct Censored Demand via Search Telemetry</option>
                  <option value="keep_raw">Keep Raw Observed Demand (No dampening)</option>
                </select>
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1 font-semibold">
                  3. Reviewer Notes (reviewer_notes)
                </label>
                <textarea
                  rows={3}
                  value={modalForm.reviewer_notes}
                  onChange={(e) => setModalForm({ ...modalForm, reviewer_notes: e.target.value })}
                  placeholder="Explain rationale for human classification..."
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink font-sans focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveReviewItem(null)}
                className="px-4 py-2 border border-border rounded-xl text-xs font-mono text-muted hover:text-ink cursor-pointer"
              >
                Discard
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-ink text-surface rounded-xl text-xs font-mono font-medium hover:bg-accent transition-colors cursor-pointer flex items-center gap-2"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Commit Decision to anomaly_reviews</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
