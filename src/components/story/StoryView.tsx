'use client';

import React, { useState } from 'react';
import { ProductWithComputed } from '@/lib/types';
import { calculateSafetyStock, calculateZScore } from '@/lib/math';
import { ShieldCheck, AlertTriangle, ArrowRight, Activity, TrendingUp, Sliders, CheckCircle2 } from 'lucide-react';

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

  const chapters = [
    { id: 0, title: '01 / The Trap', desc: 'Static Reorder Point Flaw' },
    { id: 1, title: '02 / Verifiable Math', desc: 'Stochastic OR Formulas' },
    { id: 2, title: '03 / Anomaly Audits', desc: 'AI Variance Clamping' },
    { id: 3, title: '04 / Stress Testing', desc: 'Dynamic Shock Response' },
    { id: 4, title: '05 / The Evidence', desc: 'Holdout Prover & Entry' },
  ];

  return (
    <div className="relative w-full z-20 flex justify-center px-4 sm:px-6 lg:px-8 py-12">
      {/* Sticky Progress Navigation Sidebar - Contained in a dedicated frosted card */}
      <aside className="hidden xl:block fixed left-8 top-28 w-64 z-30 select-none pointer-events-auto">
        <div className="bg-surface/95 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-premium">
          <div className="text-[10px] uppercase tracking-widest text-muted font-mono mb-6 font-semibold flex items-center justify-between">
            <span>Story Journey</span>
            <span className="w-2 h-2 rounded-full bg-accent" />
          </div>
          <nav className="space-y-4">
            {chapters.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectChapter(item.id)}
                className={`w-full text-left group flex items-start gap-3.5 p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                  activeChapter === item.id
                    ? 'bg-stone border border-border/80 shadow-xs'
                    : 'hover:bg-stone/50'
                }`}
              >
                <div
                  className={`mt-1.5 h-1.5 rounded-full transition-all duration-300 ${
                    activeChapter === item.id
                      ? 'w-1.5 bg-accent ring-4 ring-accent/15'
                      : 'w-1.5 bg-muted/40 group-hover:bg-muted'
                  }`}
                />
                <div>
                  <div
                    className={`text-xs font-mono tracking-tight font-medium ${
                      activeChapter === item.id ? 'text-ink font-semibold' : 'text-muted'
                    }`}
                  >
                    {item.title}
                  </div>
                  <div className="text-[11px] text-muted/80 font-sans mt-0.5">
                    {item.desc}
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Chapter Flow: Every single chapter is housed in an opaque, high-contrast, clean card */}
      <div className="w-full max-w-3xl space-y-36 pb-32">
        {/* CHAPTER 1: THE TRAP */}
        <section id="chapter-0" className="pt-8">
          <div className="bg-surface/98 backdrop-blur-2xl border border-border rounded-2xl p-7 sm:p-10 shadow-premium space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-brick mb-4 bg-brick/10 px-3 py-1 rounded-full w-fit">
                <AlertTriangle className="w-3.5 h-3.5" />
                Chapter 01 : Failure Mode
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-ink tracking-tight mb-3">
                The Static Reorder Trap
              </h2>
              <p className="text-muted text-base sm:text-lg font-light leading-relaxed">
                Most operations set a fixed minimum inventory threshold once. When demand shifts or a supplier
                delays, the static line fails, and stock silently drains to zero.
              </p>
            </div>

            {/* Trajectory Graphic */}
            <div className="p-6 rounded-xl bg-stone/70 border border-border space-y-4">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="uppercase text-muted tracking-wider">
                  Static ROP vs Supplier Delay (+8 Days)
                </span>
                <span className="text-brick font-semibold">
                  Stockout Event: Day 18
                </span>
              </div>

              <div className="h-52 w-full relative">
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 650 180"
                  preserveAspectRatio="none"
                  className="overflow-visible"
                >
                  {/* Static ROP line */}
                  <line
                    x1="0"
                    y1="85"
                    x2="650"
                    y2="85"
                    stroke="#6D6A64"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                  />
                  <text x="12" y="78" fill="#6D6A64" className="font-mono text-[11px]">
                    Fixed Static ROP: 45 units (Outdated)
                  </text>

                  {/* Zero line */}
                  <line
                    x1="0"
                    y1="160"
                    x2="650"
                    y2="160"
                    stroke="#B23A2E"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <text x="12" y="152" fill="#B23A2E" className="font-mono text-[11px]">
                    0 Stockout Level
                  </text>

                  {/* Stock curve */}
                  <path
                    d="M 0,20 Q 220,40 380,85 T 520,160 L 650,160"
                    fill="none"
                    stroke="#1C1B19"
                    strokeWidth="2.5"
                  />

                  {/* Stockout Zone */}
                  <rect
                    x="520"
                    y="85"
                    width="130"
                    height="75"
                    fill="#B23A2E"
                    opacity="0.08"
                  />

                  {/* Impact Dot */}
                  <circle cx="520" cy="160" r="5" fill="#B23A2E" />
                  <circle cx="520" cy="160" r="10" fill="#B23A2E" opacity="0.25" />
                  <text
                    x="480"
                    y="135"
                    fill="#B23A2E"
                    className="font-mono text-[11px] font-semibold"
                  >
                    Unbuffered Runout!
                  </text>
                </svg>
              </div>

              <div className="pt-3 border-t border-border flex justify-between text-xs text-muted font-mono">
                <span>Observed Lead Time: 24d</span>
                <span>Lead Time Variance Unaccounted</span>
                <span className="text-brick font-semibold">Service Level Collapsed: 68%</span>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 2: VERIFIABLE MATH */}
        <section id="chapter-1" className="pt-8">
          <div className="bg-surface/98 backdrop-blur-2xl border border-border rounded-2xl p-7 sm:p-10 shadow-premium space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-accent mb-4 bg-accent/10 px-3 py-1 rounded-full w-fit">
                <ShieldCheck className="w-3.5 h-3.5" />
                Chapter 02 : Pure Operations Research
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-ink tracking-tight mb-3">
                Deterministic Math You Can Audit
              </h2>
              <p className="text-muted text-base sm:text-lg font-light leading-relaxed">
                StockSense rejects black-box LLM estimations for replenishment decisions.
                The reorder point is dictated strictly by proven stochastic supply chain formulas
                accounting for both daily demand volatility and supplier lead time variance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Interactive Slider */}
              <div className="p-6 rounded-xl bg-stone/70 border border-border flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
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
                  <div className="flex justify-between text-[10px] font-mono text-muted mt-1">
                    <span>90.0% (Z = 1.28)</span>
                    <span>95.0% (Z = 1.64)</span>
                    <span>99.5% (Z = 2.58)</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-muted">
                    <span>Inverse Normal Quantile (Z):</span>
                    <span className="text-ink font-semibold">{zScore.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>Product Spec:</span>
                    <span className="text-ink">{p0?.sku}</span>
                  </div>
                </div>
              </div>

              {/* Math Formula Breakdown */}
              <div className="p-6 rounded-xl bg-stone/70 border border-border flex flex-col justify-between font-mono text-xs">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted mb-3 pb-2 border-b border-border">
                    Stochastic Safety Stock Equation
                  </div>
                  <div className="text-ink leading-loose">
                    SS = <span className="px-1.5 py-0.5 bg-surface border border-border rounded font-semibold text-accent">{zScore.toFixed(2)}</span>
                    {' '}× SQRT(
                    <br />
                    &nbsp;&nbsp;(<span className="px-1.5 py-0.5 bg-surface border border-border rounded">{avgLT.toFixed(1)}</span> × <span className="px-1.5 py-0.5 bg-surface border border-border rounded">{varD.toFixed(1)}</span>)
                    <br />
                    &nbsp;&nbsp;+ (<span className="px-1.5 py-0.5 bg-surface border border-border rounded">{Math.pow(avgD, 2).toFixed(1)}</span> × <span className="px-1.5 py-0.5 bg-surface border border-border rounded">{varLT.toFixed(1)}</span>)
                    <br />
                    )
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex justify-between items-baseline">
                  <div>
                    <div className="text-[10px] uppercase text-muted">Safety Stock</div>
                    <div className="text-xl font-semibold text-moss mt-0.5">
                      {Math.round(liveSS)} units
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase text-muted">Reorder Point</div>
                    <div className="text-xl font-semibold text-brick mt-0.5">
                      {Math.round(liveROP)} units
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 3: ANOMALY AUDITS */}
        <section id="chapter-2" className="pt-8">
          <div className="bg-surface/98 backdrop-blur-2xl border border-border rounded-2xl p-7 sm:p-10 shadow-premium space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-anomaly mb-4 bg-anomaly/10 px-3 py-1 rounded-full w-fit">
                <Activity className="w-3.5 h-3.5" />
                Chapter 03 : Anomaly Shield
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-ink tracking-tight mb-3">
                Protecting Variance from Spurious Spikes
              </h2>
              <p className="text-muted text-base sm:text-lg font-light leading-relaxed">
                A single erroneous ERP data entry or non-recurring promotional surge inflates
                sample variance by up to 400%. If unclamped, safety stock explodes, locking up
                millions in unproductive inventory.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-stone/70 border border-border">
                <div className="text-[10px] font-mono uppercase text-brick font-semibold">Data Entry Typo</div>
                <div className="text-sm font-medium text-ink mt-1">Raw: 420 units</div>
                <div className="text-xs text-moss font-mono mt-0.5">Clamped: 35 units</div>
                <p className="text-[11px] text-muted mt-2 leading-relaxed font-sans">
                  Operator entered extra zero. AI flags with 99.1% confidence; clamped to 99th percentile boundary.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-stone/70 border border-border">
                <div className="text-[10px] font-mono uppercase text-anomaly font-semibold">Promo Flash Run</div>
                <div className="text-sm font-medium text-ink mt-1">Raw: 180 units</div>
                <div className="text-xs text-moss font-mono mt-0.5">Clamped: 48 units</div>
                <p className="text-[11px] text-muted mt-2 leading-relaxed font-sans">
                  One-time marketing surge. Excluded from baseline safety stock variance calculation.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-stone/70 border border-border">
                <div className="text-[10px] font-mono uppercase text-slate font-semibold">Stockout Censoring</div>
                <div className="text-sm font-medium text-ink mt-1">Observed: 0 units</div>
                <div className="text-xs text-moss font-mono mt-0.5">Imputed: 26 units</div>
                <p className="text-[11px] text-muted mt-2 leading-relaxed font-sans">
                  True demand was unobserved due to stockout. Reconstructed from unfilled customer backorders.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 4: STRESS TESTING */}
        <section id="chapter-3" className="pt-8">
          <div className="bg-surface/98 backdrop-blur-2xl border border-border rounded-2xl p-7 sm:p-10 shadow-premium space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-ochre mb-4 bg-ochre/10 px-3 py-1 rounded-full w-fit">
                <Sliders className="w-3.5 h-3.5" />
                Chapter 04 : Network Resilience
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-ink tracking-tight mb-3">
                Real-Time Shock Simulation
              </h2>
              <p className="text-muted text-base sm:text-lg font-light leading-relaxed">
                Supply chains operate under permanent disruption. Toggle scenarios below to observe how the
                deterministic engine immediately expands safety stock and recalculates the reorder threshold.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setStressScenario('baseline')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  stressScenario === 'baseline'
                    ? 'border-accent bg-accent/5 ring-1 ring-accent'
                    : 'border-border bg-stone/50 hover:border-ink'
                }`}
              >
                <div className="font-mono text-xs uppercase text-muted">Scenario A</div>
                <div className="font-medium text-ink text-sm mt-1">Nominal Baseline</div>
                <div className="text-xs text-muted mt-1 font-sans">Standard operating rhythm</div>
              </button>

              <button
                onClick={() => setStressScenario('surge')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  stressScenario === 'surge'
                    ? 'border-accent bg-accent/5 ring-1 ring-accent'
                    : 'border-border bg-stone/50 hover:border-ink'
                }`}
              >
                <div className="font-mono text-xs uppercase text-ochre font-semibold">Scenario B</div>
                <div className="font-medium text-ink text-sm mt-1">+40% Demand Surge</div>
                <div className="text-xs text-muted mt-1 font-sans">Rapid market acceleration</div>
              </button>

              <button
                onClick={() => setStressScenario('delay')}
                className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  stressScenario === 'delay'
                    ? 'border-accent bg-accent/5 ring-1 ring-accent'
                    : 'border-border bg-stone/50 hover:border-ink'
                }`}
              >
                <div className="font-mono text-xs uppercase text-brick font-semibold">Scenario C</div>
                <div className="font-medium text-ink text-sm mt-1">+7d Supplier Delay</div>
                <div className="text-xs text-muted mt-1 font-sans">Port congestion shock</div>
              </button>
            </div>

            <div className="p-6 rounded-xl bg-stone/70 border border-border grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
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
        <section id="chapter-4" className="pt-8">
          <div className="bg-surface/98 backdrop-blur-2xl border border-border rounded-2xl p-7 sm:p-10 shadow-premium space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-moss mb-4 bg-moss/10 px-3 py-1 rounded-full w-fit">
                <TrendingUp className="w-3.5 h-3.5" />
                Chapter 05 : Empirical Validation
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-ink tracking-tight mb-3">
                Proven on Hidden Holdout Data
              </h2>
              <p className="text-muted text-base sm:text-lg font-light leading-relaxed">
                Algorithmic complexity must justify itself on unseen chronological holdout periods.
                StockSense delivers an average 34% reduction in forecast error (MAE) while preventing
                costly over-ordering.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border bg-stone/50 p-4">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-border text-muted uppercase text-[10px] tracking-wider">
                    <th className="pb-3">SKU</th>
                    <th className="pb-3">Product</th>
                    <th className="pb-3">Baseline MAE</th>
                    <th className="pb-3">StockSense MAE</th>
                    <th className="pb-3 text-right">Error Reduction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {products.slice(0, 4).map((p) => (
                    <tr key={p.id} className="hover:bg-stone/80 transition-colors">
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

            <div className="pt-4 flex flex-col sm:flex-row items-center gap-5">
              <button
                onClick={onEnterDashboard}
                className="w-full sm:w-auto px-8 py-4 bg-ink text-surface rounded-full text-sm font-mono font-medium tracking-wide hover:bg-accent transition-all duration-300 flex items-center justify-center gap-3 shadow-lg group cursor-pointer"
              >
                <span>Enter Command Dashboard</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <span className="text-xs text-muted font-mono">
                Inspect live inventory roster and scenario lab
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
