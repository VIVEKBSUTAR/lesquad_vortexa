'use client';

import React, { useState } from 'react';
import { ProductWithComputed } from '@/lib/types';
import { calculateSafetyStock, calculateZScore } from '@/lib/math';
import { ShieldCheck, AlertTriangle, ArrowRight, Activity, TrendingUp, Sliders } from 'lucide-react';

interface StoryViewProps {
  products: ProductWithComputed[];
  onEnterDashboard: () => void;
  activeChapter: number;
  onSelectChapter: (chapterIndex: number) => void;
}

export const StoryView: React.FC<StoryViewProps> = ({
  products,
  onEnterDashboard,
  activeChapter,
  onSelectChapter,
}) => {
  const p0 = products[0] || null;

  // Chapter 2 Interactive Math State
  const [serviceLevel, setServiceLevel] = useState(0.95);
  const zScore = calculateZScore(serviceLevel);

  const avgLT = p0 ? p0.metrics.avgLeadTime : 24;
  const varD = p0 ? p0.metrics.demandVariance : 12;
  const avgD = p0 ? p0.metrics.avgDemand : 5.4;
  const varLT = p0 ? p0.metrics.leadTimeVariance : 4.5;

  const liveSS = calculateSafetyStock(avgLT, varD, avgD, varLT, zScore);
  const liveROP = avgD * avgLT + liveSS;

  // Chapter 4 Interactive Stress Scenario State
  const [stressScenario, setStressScenario] = useState<'baseline' | 'surge' | 'delay'>('baseline');

  const getStressedValues = () => {
    let dMult = 1.0;
    let ltAdd = 0;
    if (stressScenario === 'surge') dMult = 1.4;
    if (stressScenario === 'delay') ltAdd = 7;

    const sD = avgD * dMult;
    const sVarD = varD * dMult * dMult;
    const sLT = avgLT + ltAdd;
    const sVarLT = varLT + (ltAdd > 0 ? 3.5 : 0);

    const sSS = calculateSafetyStock(sLT, sVarD, sD, sVarLT, 1.645);
    const sROP = sD * sLT + sSS;
    return { sSS: Math.round(sSS), sROP: Math.round(sROP) };
  };

  const { sSS, sROP } = getStressedValues();

  return (
    <div className="relative w-full z-20 flex">
      {/* Sticky Progress Navigation Sidebar */}
      <aside className="hidden lg:flex w-72 sticky top-24 h-[calc(100vh-6rem)] p-8 flex-col justify-center select-none pointer-events-auto">
        <div className="text-[11px] uppercase tracking-widest text-muted font-mono mb-8 font-semibold">
          Story Chapters
        </div>
        <nav className="space-y-6">
          {[
            { id: 0, title: '01 / The Trap', desc: 'The Static ROP Danger' },
            { id: 1, title: '02 / Verifiable Math', desc: 'Stochastic OR Formulas' },
            { id: 2, title: '03 / Anomaly Audits', desc: 'Protecting Variance' },
            { id: 3, title: '04 / Stress Testing', desc: 'Dynamic Shocks' },
            { id: 4, title: '05 / The Evidence', desc: 'Holdout Prover' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectChapter(item.id)}
              className={`text-left group flex items-start gap-4 transition-all duration-300 ${
                activeChapter === item.id
                  ? 'opacity-100 translate-x-2'
                  : 'opacity-40 hover:opacity-75'
              }`}
            >
              <div
                className={`mt-1 h-[2px] transition-all duration-300 ${
                  activeChapter === item.id
                    ? 'w-8 bg-accent'
                    : 'w-3 bg-muted group-hover:w-5'
                }`}
              />
              <div>
                <div
                  className={`text-xs font-mono uppercase tracking-wider ${
                    activeChapter === item.id
                      ? 'text-accent font-semibold'
                      : 'text-ink'
                  }`}
                >
                  {item.title}
                </div>
                <div className="text-[11px] text-muted font-sans mt-0.5">
                  {item.desc}
                </div>
              </div>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Chapter Story Flow */}
      <div className="flex-1 max-w-4xl px-6 md:px-12 py-16 space-y-40">
        {/* CHAPTER 1: THE TRAP */}
        <section id="chapter-0" className="min-h-[85vh] flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brick mb-4 bg-brick/10 px-3 py-1 rounded-full w-fit">
            <AlertTriangle className="w-3.5 h-3.5" />
            Chapter 01 : Failure Mode
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-ink mb-6 tracking-tight">
            The Static Reorder Trap
          </h2>
          <p className="text-muted text-lg font-light leading-relaxed max-w-2xl mb-10">
            Most ERPs set a fixed minimum inventory threshold once and leave it unchanged for months.
            When port congestion delays deliveries or demand shifts abruptly, the static safety buffer collapses,
            draining stock silently to zero.
          </p>

          <div className="p-8 rounded-xl bg-surface/90 backdrop-blur border border-border shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <span className="font-mono text-xs uppercase tracking-wider text-muted">
                Static ROP vs Unpredicted Supplier Delay (+8 Days)
              </span>
              <span className="font-mono text-xs text-brick font-medium">
                Stockout Event at Day 18
              </span>
            </div>
            {/* SVG Interactive Trajectory */}
            <div className="h-56 w-full relative">
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 700 200"
                preserveAspectRatio="none"
                className="overflow-visible"
              >
                {/* Static ROP line */}
                <line
                  x1="0"
                  y1="100"
                  x2="700"
                  y2="100"
                  stroke="#6D6A64"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                />
                <text x="12" y="92" fill="#6D6A64" className="font-mono text-[11px]">
                  Fixed Static ROP: 45 units (Outdated)
                </text>

                {/* Zero line */}
                <line
                  x1="0"
                  y1="180"
                  x2="700"
                  y2="180"
                  stroke="#B23A2E"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <text x="12" y="172" fill="#B23A2E" className="font-mono text-[11px]">
                  0 Stockout Level
                </text>

                {/* Stock depletion curve */}
                <path
                  d="M 0,20 Q 250,50 420,100 T 560,180 L 700,180"
                  fill="none"
                  stroke="#1C1B19"
                  strokeWidth="2.5"
                />
                {/* Danger zone highlight */}
                <rect
                  x="560"
                  y="100"
                  width="140"
                  height="80"
                  fill="#B23A2E"
                  opacity="0.08"
                />

                {/* Crash dot */}
                <circle cx="560" cy="180" r="6" fill="#B23A2E" />
                <circle cx="560" cy="180" r="12" fill="#B23A2E" opacity="0.2" />
                <text
                  x="520"
                  y="155"
                  fill="#B23A2E"
                  className="font-mono text-[11px] font-semibold"
                >
                  Unbuffered Runout!
                </text>
              </svg>
            </div>
            <div className="mt-4 pt-4 border-t border-border flex justify-between text-xs text-muted font-mono">
              <span>Observed Lead Time: 24d</span>
              <span>Lead Time Variance Unaccounted</span>
              <span className="text-brick font-semibold">Service Level: Collapsed to 68%</span>
            </div>
          </div>
        </section>

        {/* CHAPTER 2: VERIFIABLE MATH */}
        <section id="chapter-1" className="min-h-[85vh] flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-accent mb-4 bg-accent/10 px-3 py-1 rounded-full w-fit">
            <ShieldCheck className="w-3.5 h-3.5" />
            Chapter 02 : Pure Operations Research
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-ink mb-6 tracking-tight">
            Deterministic Math You Can Audit
          </h2>
          <p className="text-muted text-lg font-light leading-relaxed max-w-2xl mb-10">
            StockSense rejects black-box LLM estimations for replenishment decisions.
            The reorder point is dictated strictly by proven stochastic supply chain formulas
            accounting for both daily demand volatility and supplier lead time variance.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Interactive Slider Card */}
            <div className="p-8 rounded-xl bg-surface/90 backdrop-blur border border-border shadow-sm space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase font-mono tracking-wider text-muted">
                  Target Service Level
                </span>
                <span className="font-mono text-xl text-ink font-semibold">
                  {(serviceLevel * 100).toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="0.90"
                max="0.995"
                step="0.005"
                value={serviceLevel}
                onChange={(e) => setServiceLevel(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[11px] font-mono text-muted">
                <span>90.0% (Z = 1.28)</span>
                <span>95.0% (Z = 1.64)</span>
                <span>99.5% (Z = 2.58)</span>
              </div>

              <div className="pt-4 border-t border-border space-y-2 text-xs font-mono">
                <div className="flex justify-between text-muted">
                  <span>Inverse Normal CDF (Z-Score):</span>
                  <span className="text-ink font-semibold">{zScore.toFixed(3)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Product SKU:</span>
                  <span className="text-ink">{p0?.sku}</span>
                </div>
              </div>
            </div>

            {/* Formula Audit Card */}
            <div className="p-8 rounded-xl bg-surface/90 backdrop-blur border border-border shadow-sm">
              <div className="text-xs uppercase font-mono tracking-wider text-muted mb-4 pb-3 border-b border-border">
                Safety Stock Formula Breakdown
              </div>
              <div className="font-mono text-sm leading-loose text-ink">
                SS = <span className="px-2 py-0.5 bg-stone border border-border rounded font-semibold text-accent">{zScore.toFixed(2)}</span>
                {' '}× SQRT(
                <br />
                &nbsp;&nbsp;(<span className="px-1.5 py-0.5 bg-stone border border-border rounded">{avgLT.toFixed(1)}</span> × <span className="px-1.5 py-0.5 bg-stone border border-border rounded">{varD.toFixed(1)}</span>)
                <br />
                &nbsp;&nbsp;+ (<span className="px-1.5 py-0.5 bg-stone border border-border rounded">{Math.pow(avgD, 2).toFixed(1)}</span> × <span className="px-1.5 py-0.5 bg-stone border border-border rounded">{varLT.toFixed(1)}</span>)
                <br />
                )
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-baseline justify-between">
                <div>
                  <div className="text-[11px] font-mono uppercase text-muted">Calculated Safety Stock</div>
                  <div className="font-mono text-2xl font-semibold text-moss mt-0.5">
                    {Math.round(liveSS)} units
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-mono uppercase text-muted">Calculated Reorder Point</div>
                  <div className="font-mono text-2xl font-semibold text-brick mt-0.5">
                    {Math.round(liveROP)} units
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 3: ANOMALY AUDITS */}
        <section id="chapter-2" className="min-h-[85vh] flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-anomaly mb-4 bg-anomaly/10 px-3 py-1 rounded-full w-fit">
            <Activity className="w-3.5 h-3.5" />
            Chapter 03 : Anomaly Shield
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-ink mb-6 tracking-tight">
            Protecting Variance from Spurious Spikes
          </h2>
          <p className="text-muted text-lg font-light leading-relaxed max-w-2xl mb-10">
            A single erroneous ERP data entry (e.g. 10x typing typo) or non-recurring promotional flash
            drives up mathematical sample variance by up to 400%. If unclamped, safety stock explodes,
            locking up millions in unproductive working capital.
          </p>

          <div className="p-8 rounded-xl bg-surface/90 backdrop-blur border border-border shadow-sm space-y-6">
            <div className="flex flex-wrap gap-4 items-center justify-between border-b border-border pb-4">
              <span className="font-mono text-xs uppercase text-muted tracking-wider">
                Historical Anomaly Classification Engine
              </span>
              <div className="flex gap-4 font-mono text-xs">
                <span className="inline-flex items-center gap-1.5 text-anomaly">
                  <span className="w-2.5 h-2.5 rounded-full bg-anomaly"></span> Promo Surge
                </span>
                <span className="inline-flex items-center gap-1.5 text-brick">
                  <span className="w-2.5 h-2.5 rounded-full bg-brick"></span> Data Error
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted">
                  <span className="w-2.5 h-2.5 rounded-full border border-muted"></span> Censored
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-stone/70 border border-border">
                <div className="text-[10px] font-mono uppercase text-brick font-semibold">Data Entry Typo</div>
                <div className="text-sm font-medium text-ink mt-1">Raw: 420 units</div>
                <div className="text-xs text-moss font-mono mt-0.5">Clamped: 35 units</div>
                <p className="text-[11px] text-muted mt-2 leading-relaxed">
                  Operator added extra zero. AI flags with 99.1% confidence; clamped to 99th percentile boundary.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-stone/70 border border-border">
                <div className="text-[10px] font-mono uppercase text-anomaly font-semibold">Flash Promo Run</div>
                <div className="text-sm font-medium text-ink mt-1">Raw: 180 units</div>
                <div className="text-xs text-moss font-mono mt-0.5">Clamped: 48 units</div>
                <p className="text-[11px] text-muted mt-2 leading-relaxed">
                  Non-recurring marketing pilot. Excluded from baseline safety stock variance calculation.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-stone/70 border border-border">
                <div className="text-[10px] font-mono uppercase text-slate font-semibold">Stockout Censoring</div>
                <div className="text-sm font-medium text-ink mt-1">Observed: 0 units</div>
                <div className="text-xs text-moss font-mono mt-0.5">Imputed: 26 units</div>
                <p className="text-[11px] text-muted mt-2 leading-relaxed">
                  True demand was unobserved because shelves were empty. Imputed from unfulfilled orders.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 4: STRESS TESTING */}
        <section id="chapter-3" className="min-h-[85vh] flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-ochre mb-4 bg-ochre/10 px-3 py-1 rounded-full w-fit">
            <Sliders className="w-3.5 h-3.5" />
            Chapter 04 : Network Resilience
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-ink mb-6 tracking-tight">
            Real-Time Shock Simulation
          </h2>
          <p className="text-muted text-lg font-light leading-relaxed max-w-2xl mb-10">
            Supply chains live in permanent disruption. Toggle scenarios below to observe how the deterministic
            engine immediately widens the safety band and recalculates the order trigger.
          </p>

          <div className="p-8 rounded-xl bg-surface/90 backdrop-blur border border-border shadow-sm space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setStressScenario('baseline')}
                className={`p-4 rounded-lg border text-left transition-all ${
                  stressScenario === 'baseline'
                    ? 'border-accent bg-accent/5 ring-1 ring-accent'
                    : 'border-border bg-stone/50 hover:border-ink'
                }`}
              >
                <div className="font-mono text-xs uppercase text-muted">Scenario A</div>
                <div className="font-medium text-ink text-sm mt-1">Nominal Baseline</div>
                <div className="text-xs text-muted mt-1">Normal operating rhythm</div>
              </button>

              <button
                onClick={() => setStressScenario('surge')}
                className={`p-4 rounded-lg border text-left transition-all ${
                  stressScenario === 'surge'
                    ? 'border-accent bg-accent/5 ring-1 ring-accent'
                    : 'border-border bg-stone/50 hover:border-ink'
                }`}
              >
                <div className="font-mono text-xs uppercase text-ochre font-semibold">Scenario B</div>
                <div className="font-medium text-ink text-sm mt-1">+40% Demand Surge</div>
                <div className="text-xs text-muted mt-1">Market acceleration</div>
              </button>

              <button
                onClick={() => setStressScenario('delay')}
                className={`p-4 rounded-lg border text-left transition-all ${
                  stressScenario === 'delay'
                    ? 'border-accent bg-accent/5 ring-1 ring-accent'
                    : 'border-border bg-stone/50 hover:border-ink'
                }`}
              >
                <div className="font-mono text-xs uppercase text-brick font-semibold">Scenario C</div>
                <div className="font-medium text-ink text-sm mt-1">+7d Supplier Delay</div>
                <div className="text-xs text-muted mt-1">Port congestion shock</div>
              </button>
            </div>

            <div className="p-6 rounded-lg bg-stone/70 border border-border grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
              <div>
                <div className="text-[10px] text-muted uppercase">Base ROP</div>
                <div className="text-lg text-ink font-semibold mt-1">
                  {Math.round(p0 ? p0.metrics.reorderPoint : 158)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted uppercase">Stressed ROP</div>
                <div className="text-lg text-brick font-semibold mt-1">{sROP}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted uppercase">Base SS</div>
                <div className="text-lg text-ink font-semibold mt-1">
                  {Math.round(p0 ? p0.metrics.safetyStock : 28)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted uppercase">Stressed SS</div>
                <div className="text-lg text-moss font-semibold mt-1">{sSS}</div>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 5: THE EVIDENCE */}
        <section id="chapter-4" className="min-h-[85vh] flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-moss mb-4 bg-moss/10 px-3 py-1 rounded-full w-fit">
            <TrendingUp className="w-3.5 h-3.5" />
            Chapter 05 : Empirical Validation
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-ink mb-6 tracking-tight">
            Proven on Hidden Holdout Data
          </h2>
          <p className="text-muted text-lg font-light leading-relaxed max-w-2xl mb-10">
            Every inventory algorithm must justify itself on unseen chronological holdout periods.
            Compared to naive 14-day moving averages, StockSense delivers an average 34% reduction
            in forecast error (MAE) while preventing costly over-ordering.
          </p>

          <div className="p-8 rounded-xl bg-surface/90 backdrop-blur border border-border shadow-sm mb-10">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-border text-muted uppercase text-[11px]">
                  <th className="pb-3">SKU</th>
                  <th className="pb-3">Product</th>
                  <th className="pb-3">Baseline MAE</th>
                  <th className="pb-3">StockSense MAE</th>
                  <th className="pb-3 text-right">Error Reduction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {products.slice(0, 4).map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 text-muted">{p.sku}</td>
                    <td className="py-3 font-sans text-ink font-medium">{p.name}</td>
                    <td className="py-3 text-muted">{p.holdoutBaselineMAE}</td>
                    <td className="py-3 text-moss font-semibold">{p.holdoutStockSenseMAE}</td>
                    <td className="py-3 text-right">
                      <span className="px-2 py-0.5 rounded bg-moss/10 text-moss font-semibold">
                        -{p.holdoutGainPct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-6">
            <button
              onClick={onEnterDashboard}
              className="w-full sm:w-auto px-8 py-4 bg-ink text-surface rounded-full text-sm font-medium tracking-wide hover:bg-accent transition-all duration-300 flex items-center justify-center gap-3 shadow-lg group cursor-pointer"
            >
              <span>Enter Command Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-xs text-muted font-mono">
              Press Enter or click to inspect all 8 live SKUs
            </span>
          </div>
        </section>
      </div>
    </div>
  );
};
