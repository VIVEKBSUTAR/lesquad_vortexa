'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ProductWithComputed } from '@/lib/types';
import {
  ShieldCheck,
  Zap,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sliders,
  Database,
  BarChart3,
  Layers,
  CheckCircle2,
  RefreshCw,
  Box,
  Clock,
  Sparkles,
  ChevronDown
} from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ProductShowcaseProps {
  products: ProductWithComputed[];
  onNavigateToTab: (tab: 'overview' | 'inventory' | 'demand' | 'scenario') => void;
  onSimulateInCrisis: (product: ProductWithComputed) => void;
}

export const ProductShowcase: React.FC<ProductShowcaseProps> = ({
  products,
  onNavigateToTab,
  onSimulateInCrisis,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Active showcase product
  const defaultProduct = products[0] || null;

  // Stage 1 Interactive State: Continuous Stock Sensing
  const [simulatedStock, setSimulatedStock] = useState(180);
  const reorderThreshold = 140;
  const safetyBuffer = 48;

  // Computed status for Stage 1
  const stage1Status =
    simulatedStock <= reorderThreshold
      ? 'order'
      : simulatedStock <= reorderThreshold + 30
      ? 'watch'
      : 'healthy';

  // Stage 2 Interactive State: Anomaly Shield
  const [shieldActive, setShieldActive] = useState(true);

  // Stage 3 Interactive State: Stress Matrix
  const [demandMultiplier, setDemandMultiplier] = useState(1.4);
  const [leadTimeDelay, setLeadTimeDelay] = useState(5);

  const baselineDemand = defaultProduct ? defaultProduct.metrics.avgDemand : 5.4;
  const baselineLT = defaultProduct ? defaultProduct.metrics.avgLeadTime : 24;

  const stressedDemand = baselineDemand * demandMultiplier;
  const stressedLT = baselineLT + leadTimeDelay;
  const stressedBuffer = Math.round(safetyBuffer * Math.sqrt(demandMultiplier) * (1 + leadTimeDelay / 25));
  const stressedReorderPoint = Math.round(stressedDemand * stressedLT + stressedBuffer);
  const stressedDaysCover = Math.max(1, Math.round(simulatedStock / stressedDemand));

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Refresh ScrollTrigger to account for any lazy elements
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    const ctx = gsap.context(() => {
      // 1. Hero Kinetic Entrance
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      heroTl
        .from('.hero-badge', { opacity: 0, y: -20, duration: 0.6 })
        .from('.hero-heading', { opacity: 0, y: 30, duration: 0.8 }, '-=0.3')
        .from('.hero-desc', { opacity: 0, y: 20, duration: 0.7 }, '-=0.4')
        .from('.hero-actions', { opacity: 0, y: 20, duration: 0.6 }, '-=0.4')
        .from('.hero-kpis', { opacity: 0, y: 30, duration: 0.8 }, '-=0.3')
        .from('.hero-preview-card', { opacity: 0, scale: 0.96, duration: 0.9 }, '-=0.6');

      // 2. Feature Cards Stagger ScrollTrigger
      gsap.utils.toArray<HTMLElement>('.feature-pinned-section').forEach((section) => {
        gsap.fromTo(
          section.querySelectorAll('.feature-anim-item'),
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: section,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });

      // 3. ROI Metric Cards Scroll Entrance
      gsap.fromTo(
        '.roi-card',
        { opacity: 0, y: 50, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          stagger: 0.18,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.roi-section',
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // 4. Final CTA Section Reveal
      gsap.fromTo(
        '.cta-card',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.cta-card',
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, containerRef);

    return () => {
      clearTimeout(timer);
      ctx.revert();
    };
  }, []);

  const scrollToFirstFeature = () => {
    const el = document.getElementById('feature-1');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div ref={containerRef} className="w-full space-y-24 pb-20 selection:bg-accent/20">
      {/* =========================================================================
          HERO SECTION: High-Trust Enterprise SaaS Product Entrance
          ========================================================================= */}
      <section className="relative min-h-[85vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 pt-12 pb-8">
        {/* Eyebrow Badge */}
        <div className="hero-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-border shadow-xs text-xs font-mono text-muted mb-6">
          <span className="w-2 h-2 rounded-full bg-moss animate-pulse" />
          <span>Operational Replenishment Engine v2.4 • Deterministic Core</span>
        </div>

        {/* Main Kinetic Headline */}
        <h1 className="hero-heading max-w-4xl font-serif text-5xl sm:text-6xl lg:text-7xl font-light text-ink tracking-tight leading-[1.08] select-none">
          Adaptive Inventory Replenishment <br />
          <span className="italic text-accent font-normal">Without the Black Box.</span>
        </h1>

        {/* Product Subtitle */}
        <p className="hero-desc max-w-2xl text-muted text-base sm:text-lg font-sans mt-6 leading-relaxed">
          Say goodbye to fragile static spreadsheets and untrusted AI hallucinations.
          StockSense continuously calculates optimal reorder points, isolates demand noise,
          and automates purchase orders with mathematical certainty.
        </p>

        {/* CTA Buttons */}
        <div className="hero-actions flex flex-wrap items-center justify-center gap-4 mt-8">
          <button
            onClick={() => onNavigateToTab('overview')}
            className="px-6 py-3.5 rounded-xl bg-ink text-surface text-sm font-mono font-medium hover:bg-accent transition-all duration-300 flex items-center gap-2.5 shadow-md cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
          >
            <span>Launch Command Center</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={scrollToFirstFeature}
            className="px-6 py-3.5 rounded-xl bg-surface border border-border text-ink text-sm font-mono font-medium hover:bg-stone transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-xs hover:-translate-y-0.5"
          >
            <span>Explore Interactive Engine</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Fleet KPI Ribbon */}
        <div className="hero-kpis grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl w-full mt-14 font-mono text-left">
          <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs">
            <div className="text-[10px] uppercase text-muted tracking-wider">Catalog Monitored</div>
            <div className="text-2xl font-light text-ink mt-1">8 Active SKUs</div>
            <div className="text-[11px] text-moss mt-0.5 font-sans">100% Fleet Coverage</div>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs">
            <div className="text-[10px] uppercase text-muted tracking-wider">Average Service Level</div>
            <div className="text-2xl font-light text-ink mt-1">95.0% Target SLA</div>
            <div className="text-[11px] text-accent mt-0.5 font-sans">Hedged Lead Variance</div>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs">
            <div className="text-[10px] uppercase text-muted tracking-wider">Available Cover</div>
            <div className="text-2xl font-light text-ink mt-1">28.4 Days</div>
            <div className="text-[11px] text-muted mt-0.5 font-sans">Fleet Weighted Mean</div>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs">
            <div className="text-[10px] uppercase text-muted tracking-wider">Noise Shield</div>
            <div className="text-2xl font-light text-moss mt-1">Active & Clamping</div>
            <div className="text-[11px] text-muted mt-0.5 font-sans">12 Anomalies Tamed</div>
          </div>
        </div>

        {/* Hero Interactive Preview Card */}
        <div className="hero-preview-card max-w-4xl w-full mt-8 p-6 rounded-3xl bg-surface/90 backdrop-blur-xl border border-border shadow-premium text-left">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/80">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-moss" />
              <span className="font-mono text-xs font-semibold text-ink">
                LIVE OPERATIONS SNAPSHOT • {defaultProduct?.sku || 'SKU-001'}
              </span>
              <span className="text-xs text-muted font-sans hidden sm:inline">
                {defaultProduct?.name || 'Industrial Bearing Set'}
              </span>
            </div>
            <div className="font-mono text-xs text-muted flex items-center gap-2">
              <span>Status:</span>
              <span className="px-2 py-0.5 rounded-full bg-moss/10 text-moss border border-moss/30 font-medium text-[11px]">
                Healthy Stocked
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 font-mono text-xs">
            <div>
              <div className="text-muted text-[10px] uppercase">Effective Position</div>
              <div className="text-lg font-medium text-ink mt-0.5">
                {defaultProduct?.metrics.inventoryPosition || 180} units
              </div>
            </div>
            <div>
              <div className="text-muted text-[10px] uppercase">Reorder Threshold</div>
              <div className="text-lg font-medium text-brick mt-0.5">
                {Math.round(defaultProduct?.metrics.reorderPoint || 140)} units
              </div>
            </div>
            <div>
              <div className="text-muted text-[10px] uppercase">Safety Stock Buffer</div>
              <div className="text-lg font-medium text-moss mt-0.5">
                {Math.round(defaultProduct?.metrics.safetyStock || 48)} units
              </div>
            </div>
            <div>
              <div className="text-muted text-[10px] uppercase">Recommended Batch</div>
              <div className="text-lg font-medium text-accent mt-0.5">
                {Math.round(defaultProduct?.metrics.eoq || 240)} units
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FEATURE 01: Continuous Stock Sensing & Dynamic Thresholds
          ========================================================================= */}
      <section
        id="feature-1"
        className="feature-pinned-section max-w-6xl mx-auto px-4 sm:px-6 scroll-mt-24"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-surface/80 rounded-3xl border border-border p-6 sm:p-10 shadow-sm">
          {/* Left Column: Product Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <div className="feature-anim-item inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone border border-border text-[11px] font-mono text-muted">
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span>Feature 01 • Continuous Monitoring</span>
            </div>

            <h2 className="feature-anim-item font-serif text-3xl sm:text-4xl font-light text-ink tracking-tight leading-tight">
              Dynamic Reorder Triggers <br />
              <span className="italic text-accent font-normal">That Adapt to Demand.</span>
            </h2>

            <p className="feature-anim-item text-muted text-sm sm:text-base font-sans leading-relaxed">
              Static Min/Max rules fall apart when supplier lead times fluctuate or consumer demand shifts.
              StockSense continuously calculates your exact reorder point, factoring in lead-time variance
              to automate purchase orders right before you risk a stockout.
            </p>

            <div className="feature-anim-item space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2.5 text-ink">
                <CheckCircle2 className="w-4 h-4 text-moss shrink-0" />
                <span>Continuous inventory position tracking (On-Hand + On-Order - Backorders)</span>
              </div>
              <div className="flex items-center gap-2.5 text-ink">
                <CheckCircle2 className="w-4 h-4 text-moss shrink-0" />
                <span>Automated PO recommendations sized to optimize working capital</span>
              </div>
              <div className="flex items-center gap-2.5 text-ink">
                <CheckCircle2 className="w-4 h-4 text-moss shrink-0" />
                <span>Zero guesswork: instant trigger notifications sent to purchasing</span>
              </div>
            </div>

            <div className="feature-anim-item pt-2">
              <button
                onClick={() => onNavigateToTab('inventory')}
                className="inline-flex items-center gap-2 text-xs font-mono font-medium text-accent hover:text-ink transition-colors cursor-pointer"
              >
                <span>View Full SKU Fleet In Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Live Reorder Simulation Widget */}
          <div className="feature-anim-item lg:col-span-7 bg-stone/70 rounded-2xl border border-border p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div>
                <div className="font-mono text-xs font-semibold text-ink">
                  INTERACTIVE THRESHOLD DEMO
                </div>
                <div className="text-[11px] text-muted font-sans mt-0.5">
                  Drag the stock level slider to see autonomous replenishment in action.
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`px-3 py-1 rounded-full text-xs font-mono font-medium border flex items-center gap-1.5 transition-all ${
                  stage1Status === 'healthy'
                    ? 'bg-moss/10 text-moss border-moss/30'
                    : stage1Status === 'watch'
                    ? 'bg-ochre/10 text-ochre border-ochre/30'
                    : 'bg-brick/10 text-brick border-brick/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    stage1Status === 'healthy'
                      ? 'bg-moss'
                      : stage1Status === 'watch'
                      ? 'bg-ochre'
                      : 'bg-brick animate-ping'
                  }`}
                />
                <span>
                  {stage1Status === 'healthy'
                    ? 'Healthy Stocked'
                    : stage1Status === 'watch'
                    ? 'Buffer Watch'
                    : 'PO Triggered!'}
                </span>
              </div>
            </div>

            {/* Visual Level Gauge */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted">Simulated Stock Level</span>
                <span className="font-semibold text-ink">{simulatedStock} units</span>
              </div>

              {/* Depletion Bar Graphic */}
              <div className="relative h-7 bg-surface rounded-xl border border-border overflow-hidden">
                {/* Reorder Threshold Marker Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-brick z-10"
                  style={{ left: `${(reorderThreshold / 300) * 100}%` }}
                >
                  <span className="absolute -top-5 -left-12 text-[9px] font-mono text-brick font-semibold bg-surface px-1 rounded border border-brick/30">
                    Threshold: {reorderThreshold}
                  </span>
                </div>

                {/* Safety Buffer Zone */}
                <div
                  className="absolute top-0 bottom-0 bg-moss/15 border-r border-moss/40"
                  style={{ width: `${(safetyBuffer / 300) * 100}%` }}
                />

                {/* Current Stock Fill */}
                <div
                  className={`h-full transition-all duration-300 ${
                    stage1Status === 'healthy'
                      ? 'bg-moss'
                      : stage1Status === 'watch'
                      ? 'bg-ochre'
                      : 'bg-brick'
                  }`}
                  style={{ width: `${Math.min(100, (simulatedStock / 300) * 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-muted pt-1">
                <span>0 (Stockout)</span>
                <span>Buffer Zone ({safetyBuffer} units)</span>
                <span>Reorder Point ({reorderThreshold} units)</span>
                <span>Max Capacity (300)</span>
              </div>
            </div>

            {/* Interactive Slider */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted">Adjust On-Hand Stock:</span>
                <span className="text-ink font-semibold">{simulatedStock} units</span>
              </div>
              <input
                type="range"
                min="20"
                max="280"
                step="5"
                value={simulatedStock}
                onChange={(e) => setSimulatedStock(Number(e.target.value))}
                className="w-full accent-accent cursor-pointer"
              />
            </div>

            {/* Dynamic System Action Box */}
            <div
              className={`p-4 rounded-xl border font-mono text-xs transition-all ${
                stage1Status === 'order'
                  ? 'bg-brick/5 border-brick/30 text-brick'
                  : stage1Status === 'watch'
                  ? 'bg-ochre/5 border-ochre/30 text-ochre'
                  : 'bg-moss/5 border-moss/30 text-moss'
              }`}
            >
              <div className="font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  {stage1Status === 'order'
                    ? 'Automated Action: PO Generation in Progress'
                    : stage1Status === 'watch'
                    ? 'Monitoring: Approaching Reorder Boundary'
                    : 'Inventory State: Within Safe Replenishment Operating Bounds'}
                </span>
              </div>
              <p className="text-[11px] font-sans text-ink leading-relaxed">
                {stage1Status === 'order'
                  ? `Effective inventory (${simulatedStock}) has crossed beneath threshold (${reorderThreshold}). StockSense has drafted a purchase order for 240 units to Vendor Alpha to avoid stockout in 18 days.`
                  : stage1Status === 'watch'
                  ? `Stock (${simulatedStock}) is within 30 units of threshold. Lead times currently average 24 days. No action required today.`
                  : `Inventory levels are healthy (${simulatedStock} units). Projected coverage is 34 days at current demand pace.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FEATURE 02: Real-Time Anomaly Shield
          ========================================================================= */}
      <section className="feature-pinned-section max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-surface/80 rounded-3xl border border-border p-6 sm:p-10 shadow-sm">
          {/* Left Column: Product Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <div className="feature-anim-item inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone border border-border text-[11px] font-mono text-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-anomaly" />
              <span>Feature 02 • AI Anomaly Shield</span>
            </div>

            <h2 className="feature-anim-item font-serif text-3xl sm:text-4xl font-light text-ink tracking-tight leading-tight">
              Isolate Flash Spikes. <br />
              <span className="italic text-anomaly font-normal">Protect Working Capital.</span>
            </h2>

            <p className="feature-anim-item text-muted text-sm sm:text-base font-sans leading-relaxed">
              A single unverified black swan spike can artificially inflate your calculated variance,
              tricking traditional systems into buying 40% more safety stock than you will ever need.
              StockSense classifies anomalies, bounds variance, and keeps your balance sheet lean.
            </p>

            <div className="feature-anim-item space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2.5 text-ink">
                <CheckCircle2 className="w-4 h-4 text-anomaly shrink-0" />
                <span>Automatic classification: one-off noise vs permanent trend shifts</span>
              </div>
              <div className="flex items-center gap-2.5 text-ink">
                <CheckCircle2 className="w-4 h-4 text-anomaly shrink-0" />
                <span>Bounded clamping prevents runaway safety buffer expansion</span>
              </div>
              <div className="flex items-center gap-2.5 text-ink">
                <CheckCircle2 className="w-4 h-4 text-anomaly shrink-0" />
                <span>Transparent human-in-the-loop review queue for team overrides</span>
              </div>
            </div>

            <div className="feature-anim-item pt-2">
              <button
                onClick={() => onNavigateToTab('demand')}
                className="inline-flex items-center gap-2 text-xs font-mono font-medium text-accent hover:text-ink transition-colors cursor-pointer"
              >
                <span>Explore Demand Analytics & Anomaly Log</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Anomaly Shield Demo Widget */}
          <div className="feature-anim-item lg:col-span-7 bg-stone/70 rounded-2xl border border-border p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-border">
              <div>
                <div className="font-mono text-xs font-semibold text-ink">
                  ANOMALY VARIANCE CLAMP
                </div>
                <div className="text-[11px] text-muted font-sans mt-0.5">
                  Compare traditional unshielded calculation against StockSense bounded buffer.
                </div>
              </div>

              {/* Mode Toggle Switch */}
              <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border text-xs font-mono">
                <button
                  onClick={() => setShieldActive(false)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    !shieldActive
                      ? 'bg-brick text-surface font-semibold shadow-xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  Unshielded Spike
                </button>
                <button
                  onClick={() => setShieldActive(true)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    shieldActive
                      ? 'bg-moss text-surface font-semibold shadow-xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  StockSense Shielded
                </button>
              </div>
            </div>

            {/* Visual Simulated Demand Series Chart */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted">30-Day Historical Demand Profile</span>
                <span className="text-anomaly font-semibold">
                  {shieldActive ? 'Anomaly Bounded (Noise Isolated)' : 'Unfiltered Raw Noise'}
                </span>
              </div>

              {/* Simplified stylized bar chart */}
              <div className="h-28 bg-surface rounded-xl border border-border p-3 flex items-end gap-1.5 sm:gap-2">
                {[6, 5, 7, 6, 8, 5, 7, 6, 24, 7, 6, 8, 5, 7, 6, 8, 7, 6, 5, 7].map((val, idx) => {
                  const isAnomaly = idx === 8;
                  const displayHeight = isAnomaly && shieldActive ? 8 : val;
                  const heightPercent = (displayHeight / 24) * 100;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      <div
                        className={`w-full rounded-t transition-all duration-300 ${
                          isAnomaly
                            ? shieldActive
                              ? 'bg-moss'
                              : 'bg-brick animate-pulse'
                            : 'bg-slate/40 hover:bg-slate/60'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                      {isAnomaly && (
                        <div className="absolute -top-7 font-mono text-[9px] px-1 rounded bg-surface border border-border whitespace-nowrap text-ink shadow-xs">
                          {shieldActive ? 'Damped (8)' : 'Spike (24)'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between text-[10px] font-mono text-muted">
                <span>Day 1</span>
                <span>Day 9: One-Day Flash Surge (Marketing Campaign)</span>
                <span>Day 30</span>
              </div>
            </div>

            {/* Comparison Metrics */}
            <div className="grid grid-cols-2 gap-4 font-mono text-xs">
              <div
                className={`p-4 rounded-xl border transition-all ${
                  !shieldActive
                    ? 'bg-brick/10 border-brick/30 text-brick'
                    : 'bg-surface border-border text-muted'
                }`}
              >
                <div className="text-[10px] uppercase">Unshielded Baseline</div>
                <div className="text-xl font-semibold mt-1">112 units buffer</div>
                <div className="text-[11px] font-sans mt-1">+$14,200 capital tied up in dead buffer</div>
              </div>

              <div
                className={`p-4 rounded-xl border transition-all ${
                  shieldActive
                    ? 'bg-moss/10 border-moss/30 text-moss'
                    : 'bg-surface border-border text-muted'
                }`}
              >
                <div className="text-[10px] uppercase">StockSense Bounded</div>
                <div className="text-xl font-semibold mt-1">48 units buffer</div>
                <div className="text-[11px] font-sans mt-1">Optimal cover, $14.2k freed capital</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FEATURE 03: Pre-Flight Crisis Simulator
          ========================================================================= */}
      <section className="feature-pinned-section max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-surface/80 rounded-3xl border border-border p-6 sm:p-10 shadow-sm">
          {/* Left Column: Product Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <div className="feature-anim-item inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone border border-border text-[11px] font-mono text-muted">
              <Sliders className="w-3.5 h-3.5 text-accent" />
              <span>Feature 03 • Pre-Flight Stress Matrix</span>
            </div>

            <h2 className="feature-anim-item font-serif text-3xl sm:text-4xl font-light text-ink tracking-tight leading-tight">
              Stress-Test Operations <br />
              <span className="italic text-accent font-normal">Before Disruptions Hit.</span>
            </h2>

            <p className="feature-anim-item text-muted text-sm sm:text-base font-sans leading-relaxed">
              Don’t wait for Suez canal delays or viral TikTok surges to reveal where your supply chain
              breaks. Pre-flight test catastrophic scenarios in the Scenario Lab and calculate exact
              emergency buffer requirements instantly.
            </p>

            <div className="feature-anim-item space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2.5 text-ink">
                <CheckCircle2 className="w-4 h-4 text-moss shrink-0" />
                <span>Real-time multi-variable shocks: Demand Surges × Lead-Time Bottlenecks</span>
              </div>
              <div className="flex items-center gap-2.5 text-ink">
                <CheckCircle2 className="w-4 h-4 text-moss shrink-0" />
                <span>Instant days-of-cover and stockout breach horizon calculation</span>
              </div>
              <div className="flex items-center gap-2.5 text-ink">
                <CheckCircle2 className="w-4 h-4 text-moss shrink-0" />
                <span>Save scenario policies and apply directly to purchase batches</span>
              </div>
            </div>

            <div className="feature-anim-item pt-2">
              <button
                onClick={() => defaultProduct && onSimulateInCrisis(defaultProduct)}
                className="inline-flex items-center gap-2 text-xs font-mono font-medium text-accent hover:text-ink transition-colors cursor-pointer"
              >
                <span>Launch Full Scenario Stress Lab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Shock Sliders */}
          <div className="feature-anim-item lg:col-span-7 bg-stone/70 rounded-2xl border border-border p-6 sm:p-8 space-y-6">
            <div className="pb-4 border-b border-border">
              <div className="font-mono text-xs font-semibold text-ink">
                LIVE STRESS SHOCK SIMULATOR
              </div>
              <div className="text-[11px] text-muted font-sans mt-0.5">
                Simulate a supply chain disruption and watch recalculations happen in real time.
              </div>
            </div>

            {/* Shock Controls */}
            <div className="space-y-4 font-mono text-xs">
              {/* Demand Surge Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted">Demand Surge Multiplier:</span>
                  <span className="font-semibold text-ink">{demandMultiplier.toFixed(1)}x Normal</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.1"
                  value={demandMultiplier}
                  onChange={(e) => setDemandMultiplier(Number(e.target.value))}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>

              {/* Lead Time Delay Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted">Supplier Delivery Delay:</span>
                  <span className="font-semibold text-ink">+{leadTimeDelay} Days Late</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="14"
                  step="1"
                  value={leadTimeDelay}
                  onChange={(e) => setLeadTimeDelay(Number(e.target.value))}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>
            </div>

            {/* Dynamic Results Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-surface border border-border">
                <div className="text-[10px] uppercase text-muted">Adjusted Reorder Point</div>
                <div className="text-xl font-semibold text-brick mt-1">{stressedReorderPoint}</div>
                <div className="text-[10px] text-muted mt-0.5">Units</div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface border border-border">
                <div className="text-[10px] uppercase text-muted">Stressed Safety Buffer</div>
                <div className="text-xl font-semibold text-moss mt-1">{stressedBuffer}</div>
                <div className="text-[10px] text-muted mt-0.5">Units</div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface border border-border">
                <div className="text-[10px] uppercase text-muted">Run-out Horizon</div>
                <div className="text-xl font-semibold text-accent mt-1">{stressedDaysCover}</div>
                <div className="text-[10px] text-muted mt-0.5">Days cover left</div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface border border-border">
                <div className="text-[10px] uppercase text-muted">Target SLA</div>
                <div className="text-xl font-semibold text-ink mt-1">95.0%</div>
                <div className="text-[10px] text-muted mt-0.5">Guaranteed</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface/90 border border-border font-mono text-xs flex justify-between items-center">
              <div>
                <span className="text-muted">Recommended Emergency PO: </span>
                <span className="font-semibold text-ink">
                  {Math.max(0, stressedReorderPoint - simulatedStock + 120)} units
                </span>
              </div>
              <button
                onClick={() => defaultProduct && onSimulateInCrisis(defaultProduct)}
                className="px-3 py-1.5 bg-ink text-surface rounded-lg hover:bg-accent transition-colors flex items-center gap-1.5 cursor-pointer text-[11px]"
              >
                <span>Full Lab</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ROI / ENTERPRISE BENCHMARK SECTION: Proven Quantified Performance
          ========================================================================= */}
      <section className="roi-section max-w-6xl mx-auto px-4 sm:px-6 text-center space-y-12">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border text-xs font-mono text-muted mb-4">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Enterprise Benchmark Results</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-light text-ink tracking-tight">
            Why Supply Chain Leaders Choose StockSense
          </h2>
          <p className="text-muted text-sm sm:text-base font-sans max-w-2xl mx-auto mt-4">
            Empirical results achieved across active distribution networks and complex retail catalogs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-left">
          {/* Card 1 */}
          <div className="roi-card p-8 rounded-3xl bg-surface border border-border shadow-sm space-y-4 hover:border-ink/40 transition-colors">
            <div className="text-3xl sm:text-4xl font-light text-accent">-24.8%</div>
            <h3 className="font-serif text-xl text-ink font-light">Inventory Holding Waste</h3>
            <p className="text-muted text-xs font-sans leading-relaxed">
              Eliminate redundant safety stock buffers inflated by unverified demand spikes and static Min/Max
              estimates. Free up working capital without compromising on-time fulfillment.
            </p>
          </div>

          {/* Card 2 */}
          <div className="roi-card p-8 rounded-3xl bg-surface border border-border shadow-sm space-y-4 hover:border-ink/40 transition-colors">
            <div className="text-3xl sm:text-4xl font-light text-moss">99.4%</div>
            <h3 className="font-serif text-xl text-ink font-light">Order Fulfillment SLA</h3>
            <p className="text-muted text-xs font-sans leading-relaxed">
              Guaranteed safety buffers hedge against severe supplier delays and unexpected port congestion,
              preventing catastrophic out-of-stock events and expensive expedited air freight.
            </p>
          </div>

          {/* Card 3 */}
          <div className="roi-card p-8 rounded-3xl bg-surface border border-border shadow-sm space-y-4 hover:border-ink/40 transition-colors">
            <div className="text-3xl sm:text-4xl font-light text-ink">100%</div>
            <h3 className="font-serif text-xl text-ink font-light">Deterministic Audit Trail</h3>
            <p className="text-muted text-xs font-sans leading-relaxed">
              Never place multi-million dollar purchase orders based on AI black-box hallucinations.
              Every reorder calculation is completely auditable and deterministic.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FINAL CALL TO ACTION: Enter Enterprise Command Center
          ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="cta-card p-8 sm:p-12 rounded-3xl bg-ink text-surface shadow-2xl text-center space-y-6">
          <h2 className="font-serif text-3xl sm:text-5xl font-light tracking-tight">
            Ready to Take Control of Your Replenishment?
          </h2>
          <p className="text-stone/70 text-sm sm:text-base font-sans max-w-xl mx-auto leading-relaxed">
            Switch from reactive firefighting to predictive, mathematical certainty.
            Explore the live command center or upload your demand series now.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onNavigateToTab('overview')}
              className="px-6 py-3.5 rounded-xl bg-surface text-ink text-sm font-mono font-medium hover:bg-stone transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-md"
            >
              <span>Open Fleet Overview</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateToTab('demand')}
              className="px-6 py-3.5 rounded-xl border border-stone/30 text-surface text-sm font-mono font-medium hover:bg-surface/10 transition-all duration-300 flex items-center gap-2 cursor-pointer"
            >
              <Database className="w-4 h-4" />
              <span>Import Demand CSV</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
