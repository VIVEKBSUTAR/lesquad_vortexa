'use client';

import React from 'react';
import { X, BookOpen, CheckCircle2, ShieldCheck, Scale, Calculator, AlertCircle } from 'lucide-react';

interface FormulasAssumptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentServiceLevel: number;
  currentZScore: number;
}

export const FormulasAssumptionsModal: React.FC<FormulasAssumptionsModalProps> = ({
  isOpen,
  onClose,
  currentServiceLevel,
  currentZScore,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface rounded-3xl border border-border w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-border">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-stone border border-border text-[11px] font-mono text-muted mb-1.5">
              <BookOpen className="w-3.5 h-3.5 text-accent" />
              <span>Operations Research Specification</span>
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-light text-ink">
              Inventory Formulas & Operational Assumptions
            </h3>
            <p className="text-muted text-xs font-sans mt-1">
              Deterministic stochastic replenishment model for dark stores and quick-commerce warehouses.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-ink hover:bg-stone transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Target Service Level & Z-Factor Indicator */}
        <div className="p-4 rounded-2xl bg-stone/70 border border-border flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div>
            <div className="text-[10px] uppercase text-muted">Currently Active Global Policy</div>
            <div className="text-base font-semibold text-ink mt-0.5">
              Cycle Service Level: {(currentServiceLevel * 100).toFixed(1)}%
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-surface border border-border">
            <span className="text-muted text-[10px] uppercase block">Statistical Factor (Z-Score)</span>
            <span className="text-sm font-semibold text-accent font-mono">
              Z = {currentZScore.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Formulas Grid */}
        <div className="space-y-4">
          <h4 className="font-mono text-xs uppercase tracking-wider text-ink font-semibold flex items-center gap-2">
            <Calculator className="w-4 h-4 text-accent" />
            Core Inventory Formulations
          </h4>

          {/* Formula 1: Safety Stock */}
          <div className="p-4 rounded-2xl bg-surface border border-border space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="font-mono text-xs font-semibold text-ink">1. Dual-Stochastic Safety Stock (SS)</span>
              <span className="text-[10px] font-mono text-moss bg-moss/10 px-2 py-0.5 rounded">Hedges Demand + Lead-Time</span>
            </div>
            <div className="p-3 rounded-xl bg-stone/80 font-mono text-sm text-ink text-center tracking-wide overflow-x-auto">
              SS = Z × √ ( L̄ · σ_d² + d̄² · σ_L² )
            </div>
            <p className="text-xs text-muted font-sans leading-relaxed">
              Protects against simultaneous variations in customer demand (σ_d) and supplier delivery transit time (σ_L).
              Where <strong>L̄</strong> is mean lead time, <strong>d̄</strong> is mean daily demand, and <strong>Z</strong> is the normal statistical safety factor.
            </p>
          </div>

          {/* Formula 2: Reorder Point */}
          <div className="p-4 rounded-2xl bg-surface border border-border space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="font-mono text-xs font-semibold text-ink">2. Reorder Point (When to Reorder)</span>
              <span className="text-[10px] font-mono text-brick bg-brick/10 px-2 py-0.5 rounded">Trigger Level</span>
            </div>
            <div className="p-3 rounded-xl bg-stone/80 font-mono text-sm text-ink text-center tracking-wide overflow-x-auto">
              ROP = ( d̄ × L̄ ) + SS
            </div>
            <p className="text-xs text-muted font-sans leading-relaxed">
              When effective inventory position (On-Hand + On-Order - Backorders) falls to or below ROP, a purchase order must be placed immediately to prevent stockouts before the replenishment shipment docks.
            </p>
          </div>

          {/* Formula 3: Economic Order Quantity */}
          <div className="p-4 rounded-2xl bg-surface border border-border space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="font-mono text-xs font-semibold text-ink">3. Recommended Order Batch (How Much to Reorder)</span>
              <span className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded">EOQ Formulation</span>
            </div>
            <div className="p-3 rounded-xl bg-stone/80 font-mono text-sm text-ink text-center tracking-wide overflow-x-auto">
              EOQ = √ ( (2 × D × S) / H )
            </div>
            <p className="text-xs text-muted font-sans leading-relaxed">
              Balances order processing and delivery freight costs (<strong>S</strong>) against annual holding and shelf storage carrying costs (<strong>H</strong>) for annual demand (<strong>D = 365 × d̄</strong>).
            </p>
          </div>
        </div>

        {/* Statistical Factor Reference Table */}
        <div className="space-y-3">
          <h4 className="font-mono text-xs uppercase tracking-wider text-ink font-semibold flex items-center gap-2">
            <Scale className="w-4 h-4 text-accent" />
            Normal Distribution Safety Factor Table
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs text-center">
            <div className="p-3 rounded-xl bg-stone/60 border border-border">
              <div className="text-[10px] text-muted">90.0% SLA</div>
              <div className="font-semibold text-ink mt-0.5">Z = 1.282</div>
              <div className="text-[10px] text-muted mt-0.5">Leanest Buffer</div>
            </div>
            <div className="p-3 rounded-xl bg-stone/60 border border-border">
              <div className="text-[10px] text-muted">95.0% SLA</div>
              <div className="font-semibold text-accent mt-0.5">Z = 1.645</div>
              <div className="text-[10px] text-muted mt-0.5">Standard FMCG</div>
            </div>
            <div className="p-3 rounded-xl bg-stone/60 border border-border">
              <div className="text-[10px] text-muted">98.0% SLA</div>
              <div className="font-semibold text-ink mt-0.5">Z = 2.054</div>
              <div className="text-[10px] text-muted mt-0.5">High-Velocity</div>
            </div>
            <div className="p-3 rounded-xl bg-stone/60 border border-border">
              <div className="text-[10px] text-muted">99.0% SLA</div>
              <div className="font-semibold text-moss mt-0.5">Z = 2.326</div>
              <div className="text-[10px] text-muted mt-0.5">Zero-Stockout Critical</div>
            </div>
          </div>
        </div>

        {/* Operational Assumptions */}
        <div className="space-y-3 pt-2 border-t border-border">
          <h4 className="font-mono text-xs uppercase tracking-wider text-ink font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-moss" />
            Core Operational Assumptions (Dark Store & Kirana Operations)
          </h4>
          <ul className="space-y-2 text-xs font-sans text-muted">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-moss mt-0.5 shrink-0" />
              <span><strong>Continuous Inventory Review (r, Q):</strong> Stock is deducted continuously upon checkout barcode scan, triggering replenishment recommendations in real time rather than waiting for periodic batch audits.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-moss mt-0.5 shrink-0" />
              <span><strong>Statistical Independence:</strong> Daily sales velocity and supplier freight transit times are treated as mutually independent random variables.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-moss mt-0.5 shrink-0" />
              <span><strong>Perishable Cold-Chain Segregation:</strong> Dairy and fresh goods have finite shelf life (e.g., 45 days) and refrigerated shelf footprint limits that prevent over-batching even if EOQ suggests larger orders.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-moss mt-0.5 shrink-0" />
              <span><strong>Deterministic Priority:</strong> Machine learning algorithms are restricted solely to classifying historical demand anomalies (promotions vs scan errors) within bounded clamps; AI never overrides the mathematical formula bounds.</span>
            </li>
          </ul>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-ink text-surface rounded-xl text-xs font-mono hover:bg-accent transition-colors cursor-pointer"
          >
            Close Specification
          </button>
        </div>
      </div>
    </div>
  );
};
