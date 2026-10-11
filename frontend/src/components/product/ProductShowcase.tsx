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
  ChevronDown,
  Calculator,
  Scale,
  PackageCheck
} from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ProductShowcaseProps {
  products: ProductWithComputed[];
  serviceLevel: number;
  zScore: number;
  onNavigateToTab: (tab: 'overview' | 'inventory' | 'demand' | 'scenario') => void;
  onSimulateInCrisis: (product: ProductWithComputed) => void;
  onOpenFormulasModal?: () => void;
}

export const ProductShowcase: React.FC<ProductShowcaseProps> = ({
  products,
  serviceLevel,
  zScore,
  onNavigateToTab,
  onSimulateInCrisis,
  onOpenFormulasModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Active showcase product (Amul Milk or first SKU)
  const defaultProduct = products[0] || null;

  // Stage 1 Interactive State: Continuous Stock Sensing for Dark Store
  const [simulatedStock, setSimulatedStock] = useState(160);
  const reorderThreshold = Math.round(defaultProduct?.metrics.reorderPoint || 185);
  const safetyBuffer = Math.round(defaultProduct?.metrics.safetyStock || 28);
  const recommendedBatch = Math.round(defaultProduct?.metrics.eoq || 120);

  // Computed status for Stage 1
  const stage1Status =
    simulatedStock <= reorderThreshold
      ? 'order'
      : simulatedStock <= reorderThreshold + 30
      ? 'watch'
      : 'healthy';

  // Stage 2 Interactive State: Anomaly Shield
  const [shieldActive, setShieldActive] = useState(true);

  // Stage 3 Interactive State: Stress Matrix (Surge & Delay)
  const [demandMultiplier, setDemandMultiplier] = useState(1.4);
  const [leadTimeDelay, setLeadTimeDelay] = useState(3);

  const baselineDemand = defaultProduct ? defaultProduct.metrics.avgDemand : 78.0;
  const baselineLT = defaultProduct ? defaultProduct.metrics.avgLeadTime : 2.0;

  const stressedDemand = baselineDemand * demandMultiplier;
  const stressedLT = baselineLT + leadTimeDelay;
  const stressedBuffer = Math.round(safetyBuffer * Math.sqrt(demandMultiplier) * (1 + leadTimeDelay / 4));
  const stressedReorderPoint = Math.round(stressedDemand * stressedLT + stressedBuffer);
  const stressedDaysCover = Math.max(1, Math.round(simulatedStock / stressedDemand));
  const stressedRiskPct = Math.min(65, Math.round(5.0 * Math.pow(demandMultiplier, 1.8) * (1 + leadTimeDelay / 2.5)));

  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const autoNavigatedRef = useRef(false);

  // Auto-transition to dashboard when user scrolls to bottom of landing tour
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sentinel = bottomSentinelRef.current;
    if (!sentinel) return;

    autoNavigatedRef.current = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !autoNavigatedRef.current) {
          autoNavigatedRef.current = true;
          onNavigateToTab('overview');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onNavigateToTab]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Suppress GSAP null target warnings during fast React component mounts/re-renders
    gsap.config({ nullTargetWarn: false });

    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 150);

    const ctx = gsap.context(() => {
      // 1. Hero Entrance Timeline (guarded by element presence)
      if (containerRef.current?.querySelector('.hero-badge')) {
        const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        heroTl
          .from('.hero-badge', { opacity: 0, y: -25, duration: 0.6 })
          .from('.hero-heading', { opacity: 0, y: 35, duration: 0.8 }, '-=0.3')
          .from('.hero-desc', { opacity: 0, y: 20, duration: 0.7 }, '-=0.4')
          .from('.hero-actions', { opacity: 0, y: 20, duration: 0.6 }, '-=0.4')
          .from('.hero-kpis', { opacity: 0, y: 30, duration: 0.8, stagger: 0.1 }, '-=0.3')
          .from('.hero-preview-card', { opacity: 0, scale: 0.96, duration: 0.9 }, '-=0.6');
      }

      // 2. Feature Pinned Sections Entrance (only animate sections that contain anim items)
      gsap.utils.toArray<HTMLElement>('.feature-pinned-section').forEach((section) => {
        const animItems = section.querySelectorAll('.feature-anim-item');
        if (animItems && animItems.length > 0) {
          gsap.fromTo(
            animItems,
            { opacity: 0, y: 35 },
            {
              opacity: 1,
              y: 0,
              duration: 0.75,
              stagger: 0.12,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }
      });
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
          HERO SECTION: Dark Store & Kirana Operations Entrance
          ========================================================================= */}
      <section className="relative min-h-[85vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 pt-10 pb-8">
        {/* Eyebrow Badge */}
        <div className="hero-badge inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-border shadow-xs text-xs font-mono text-muted mb-6">
          <span className="w-2 h-2 rounded-full bg-moss animate-pulse" />
          <span>Dark Store & Kirana Replenishment Engine • Deterministic OR Core</span>
        </div>

        {/* Main Kinetic Headline */}
        <h1 className="hero-heading max-w-4xl font-sans text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight leading-[1.08] select-none">
          Know Exactly When to Reorder <br />
          <span className="text-accent">and Exactly How Much.</span>
        </h1>

        {/* Product Subtitle */}
        <p className="hero-desc max-w-2xl text-slate-600 text-base sm:text-lg font-sans mt-6 leading-relaxed">
          Ordering late causes stockouts and lost revenue; ordering early ties up cash and causes perishable spoilage.
          StockSense automatically computes exact restock alerts and purchase orders—protecting your store from vendor delays and sudden demand surges.
        </p>

        {/* CTA Buttons */}
        <div className="hero-actions flex flex-wrap items-center justify-center gap-4 mt-8">
          <button
            onClick={() => {
              onNavigateToTab('overview');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="px-6 py-3.5 rounded-xl bg-slate-900 text-white text-sm font-sans font-bold hover:bg-accent transition-all duration-300 flex items-center gap-2.5 shadow-md cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
          >
            <span>Launch Store Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={scrollToFirstFeature}
            className="px-5 py-3.5 rounded-xl bg-surface border border-border text-slate-900 text-sm font-sans font-bold hover:bg-stone transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-xs hover:-translate-y-0.5"
          >
            <span>Explore Tour</span>
            <ChevronDown className="w-4 h-4 text-accent" />
          </button>
        </div>

        {/* Fleet KPI Ribbon with Stock Protection Tag */}
        <div className="hero-kpis grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl w-full mt-14 font-sans text-left">
          <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs">
            <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Monitored Catalog</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">8 Dark Store SKUs</div>
            <div className="text-[11px] text-moss mt-0.5 font-sans font-medium">Dairy, Staples, Snacks, FMCG</div>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs">
            <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Stock Protection Level</div>
            <div className="text-2xl font-bold text-accent mt-1">{(serviceLevel * 100).toFixed(0)}% Availability</div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-sans font-medium">High Stock Security</div>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs">
            <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Average Shelf Cover</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">26.8 Days</div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-sans font-medium">Safe buffer runway</div>
          </div>

          <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs">
            <div className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Automated Alerts</div>
            <div className="text-2xl font-bold text-moss mt-1">Active Protection</div>
            <div className="text-[11px] text-moss mt-0.5 font-sans font-medium">Real-time alerts</div>
          </div>
        </div>

        {/* Hero Interactive SKU Snapshot Card */}
        <div className="hero-preview-card max-w-4xl w-full mt-8 p-6 rounded-3xl bg-surface/90 backdrop-blur-xl border border-border shadow-premium text-left">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/80">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-moss" />
              <div>
                <span className="font-sans text-xs font-bold text-slate-900">
                  {defaultProduct?.sku} • {defaultProduct?.name}
                </span>
                <div className="text-[11px] text-slate-500 font-sans">
                  Category: {defaultProduct?.category} • Shelf Life: {defaultProduct?.perishabilityDays} Days
                </div>
              </div>
            </div>
            <div className="font-sans text-xs text-slate-500 flex items-center gap-2">
              <span>Protection:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-bold text-[11px]">
                {(serviceLevel * 100).toFixed(0)}% High Availability
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 font-mono text-xs">
            <div>
              <div className="text-muted text-[10px] uppercase">Effective On-Hand</div>
              <div className="text-lg font-medium text-ink mt-0.5">
                {defaultProduct?.metrics.inventoryPosition} units
              </div>
            </div>
            <div>
              <div className="text-muted text-[10px] uppercase">Reorder Point (When)</div>
              <div className="text-lg font-medium text-brick mt-0.5">
                {Math.round(defaultProduct?.metrics.reorderPoint || 185)} units
              </div>
            </div>
            <div>
              <div className="text-muted text-[10px] uppercase">Recommended Batch (How Much)</div>
              <div className="text-lg font-medium text-accent mt-0.5">
                {Math.round(defaultProduct?.metrics.eoq || 120)} units
              </div>
            </div>
            <div>
              <div className="text-muted text-[10px] uppercase">Lead-Time Hedge Buffer</div>
              <div className="text-lg font-medium text-moss mt-0.5">
                {Math.round(defaultProduct?.metrics.safetyStock || 28)} units
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FEATURE 01: When & How Much to Reorder (Dynamic Threshold Engine)
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
              <span>Challenge Pillar 01 • Reorder Timing & Quantity</span>
            </div>

            <h2 className="feature-anim-item font-sans text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              Automatic Restock Precision. <br />
              <span className="text-accent">Built for Store Demand & Supplier Delays.</span>
            </h2>

            <p className="feature-anim-item text-slate-600 text-sm sm:text-base font-sans leading-relaxed">
              Traditional store spreadsheets set a static reorder level once and never revisit it. When festival promotions hit or dairy suppliers are delayed by 2 days, shelves go empty. StockSense dynamically protects against both daily sales swings and supplier delivery lags.
            </p>

            <div className="feature-anim-item space-y-3 font-sans text-xs">
              <div className="flex items-center gap-2.5 text-slate-900 font-medium">
                <CheckCircle2 className="w-4 h-4 text-moss shrink-0" />
                <span>Automatic safety buffer protects against sudden customer demand surges</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-900 font-medium">
                <CheckCircle2 className="w-4 h-4 text-moss shrink-0" />
                <span>Optimal reorder quantities prevent overstocking and reduce perishable waste</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-900 font-medium">
                <CheckCircle2 className="w-4 h-4 text-moss shrink-0" />
                <span>Guarantees high product availability while avoiding dead capital on shelves</span>
              </div>
            </div>

            <div className="feature-anim-item pt-2 flex items-center gap-4">
              <button
                onClick={() => onNavigateToTab('inventory')}
                className="inline-flex items-center gap-2 text-xs font-mono font-medium text-accent hover:text-ink transition-colors cursor-pointer"
              >
                <span>Open Full Inventory Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Live Reorder Simulation Widget */}
          <div className="feature-anim-item lg:col-span-7 bg-stone/70 rounded-2xl border border-border p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div>
                <div className="font-mono text-xs font-semibold text-ink">
                  LIVE SHELF STOCK SIMULATOR
                </div>
                <div className="text-[11px] text-muted font-sans mt-0.5">
                  SKU-DRY-MILK-1L • Amul Taaza Milk 1L (Daily Demand ~78 units)
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
                    : 'Reorder Triggered!'}
                </span>
              </div>
            </div>

            {/* Visual Level Gauge */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted">Current Shelf + Cold Storage Stock</span>
                <span className="font-semibold text-ink">{simulatedStock} units</span>
              </div>

              {/* Depletion Bar Graphic */}
              <div className="relative h-7 bg-surface rounded-xl border border-border overflow-hidden">
                {/* Reorder Threshold Marker Line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-brick z-10"
                  style={{ left: `${(reorderThreshold / 300) * 100}%` }}
                >
                  <span className="absolute -top-5 -left-12 text-[9px] font-mono text-brick font-semibold bg-surface px-1 rounded border border-brick/30 whitespace-nowrap">
                    ROP: {reorderThreshold} u
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
                <span>Buffer ({safetyBuffer} u)</span>
                <span>Reorder Point ({reorderThreshold} u)</span>
                <span>Max Rack (300 u)</span>
              </div>
            </div>

            {/* Interactive Slider */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted">Simulate Remaining Stock:</span>
                <span className="text-ink font-semibold">{simulatedStock} units</span>
              </div>
              <input
                type="range"
                min="10"
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
              <div className="font-semibold uppercase tracking-wider text-[10px] flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {stage1Status === 'order'
                    ? 'Autonomous Replenishment PO Triggered'
                    : stage1Status === 'watch'
                    ? 'Shelf Depletion Warning: Approaching Threshold'
                    : 'Inventory Position Optimal'}
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  Protection: {(serviceLevel * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-[11px] font-sans text-ink leading-relaxed">
                {stage1Status === 'order'
                  ? `Effective stock (${simulatedStock}) has breached reorder threshold (${reorderThreshold}). Recommended PO of ${recommendedBatch} units drafted to Amul Dairy Cooperative (Lead time: 2 days) to avoid stockout in 48 hours.`
                  : stage1Status === 'watch'
                  ? `Stock (${simulatedStock}) is within 30 units of trigger level. At current sales rate (~78 units/day), reorder will trigger by tomorrow morning.`
                  : `Shelf inventory is healthy (${simulatedStock} units). Estimated available coverage is ${(simulatedStock / baselineDemand).toFixed(1)} days.`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FEATURE 02: Visible & Classified Unusual Demand Values (AI Bounded Clamp)
          ========================================================================= */}
      <section className="feature-pinned-section max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-surface/80 rounded-3xl border border-border p-6 sm:p-10 shadow-sm">
          {/* Left Column: Product Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <div className="feature-anim-item inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone border border-border text-[11px] font-mono text-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-anomaly" />
              <span>Challenge Pillar 02 • Unusual Demand Classification</span>
            </div>

            <h2 className="feature-anim-item font-sans text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              Keep Spikes Visible. <br />
              <span className="text-anomaly">Smart Sales Filter & Protection.</span>
            </h2>

            <p className="feature-anim-item text-slate-600 text-sm sm:text-base font-sans leading-relaxed">
              Sales history often contains unusual values: one-off flash promotions, festival bulk buys, or barcode double-scans. If left unmonitored, these distort future purchasing and cause costly over-ordering.
            </p>

            <div className="feature-anim-item space-y-3 font-sans text-xs">
              <div className="flex items-center gap-2.5 text-slate-900 font-medium">
                <CheckCircle2 className="w-4 h-4 text-anomaly shrink-0" />
                <span>Unusual sales spikes kept visible with clear, automatic tags</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-900 font-medium">
                <CheckCircle2 className="w-4 h-4 text-anomaly shrink-0" />
                <span>Identifies root cause (Promotion, Data Error, Stockout, Festival Surge)</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-900 font-medium">
                <CheckCircle2 className="w-4 h-4 text-anomaly shrink-0" />
                <span>Smart limits prevent one-off sales spikes from inflating routine orders</span>
              </div>
            </div>

            <div className="feature-anim-item pt-2">
              <button
                onClick={() => onNavigateToTab('demand')}
                className="inline-flex items-center gap-2 text-xs font-mono font-medium text-accent hover:text-ink transition-colors cursor-pointer"
              >
                <span>Inspect All Anomalies in Demand Lab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Anomaly Shield Demo Widget */}
          <div className="feature-anim-item lg:col-span-7 bg-stone/70 rounded-2xl border border-border p-6 sm:p-8 space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3 pb-4 border-b border-border">
              <div>
                <div className="font-mono text-xs font-semibold text-ink">
                  AI CLASSIFICATION & BOUNDED CLAMP
                </div>
                <div className="text-[11px] text-muted font-sans mt-0.5">
                  SKU-SNK-MAGG-12P • Midnight Flash Surge Anomaly
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
                  Unfiltered Noise
                </button>
                <button
                  onClick={() => setShieldActive(true)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    shieldActive
                      ? 'bg-moss text-surface font-semibold shadow-xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  AI Bounded Clamp
                </button>
              </div>
            </div>

            {/* Stylized Demand Bar Chart with Visible Anomaly Point */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted">Daily Sales Timeline (Units)</span>
                <span className="text-anomaly font-semibold">
                  {shieldActive ? 'Bounded: [85, 140] units' : 'Raw Distortion: 456 units'}
                </span>
              </div>

              <div className="h-28 bg-surface rounded-xl border border-border p-3 flex items-end gap-1.5 sm:gap-2">
                {[88, 92, 95, 84, 102, 91, 97, 89, 456, 94, 98, 92, 86, 99, 93, 105, 96, 90, 94, 98].map((val, idx) => {
                  const isAnomaly = idx === 8;
                  const displayHeight = isAnomaly && shieldActive ? 125 : val;
                  const heightPercent = (displayHeight / 456) * 100;

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
                        style={{ height: `${Math.max(10, heightPercent)}%` }}
                      />
                      {isAnomaly && (
                        <div className="absolute -top-7 font-mono text-[9px] px-1 rounded bg-surface border border-border whitespace-nowrap text-ink shadow-xs">
                          {shieldActive ? 'Clamped (125)' : 'Raw (456)'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between text-[10px] font-mono text-muted">
                <span>Day 55</span>
                <span className="text-anomaly font-semibold">Day 65: Midnight Promo Spike (Visible & Classified)</span>
                <span>Day 75</span>
              </div>
            </div>

            {/* Anomaly Treatment & Bounded Range Details */}
            <div className="p-3.5 rounded-xl bg-surface border border-border font-mono text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-muted text-[10px] uppercase">AI Classification:</span>
                <span className="font-semibold text-accent">Flash App Promotion (98.4% Confidence)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted text-[10px] uppercase">Original Spike vs Bounded Adjustment:</span>
                <span className="font-semibold text-ink">456 u ➔ 125 u (Bounded Range: [85, 140] u)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted text-[10px] uppercase">Capital Protection Impact:</span>
                <span className="font-semibold text-moss">Saves $1,840 in redundant safety buffer</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FEATURE 03: Pre-Flight Crisis Simulator (Side-by-Side Comparison)
          ========================================================================= */}
      <section className="feature-pinned-section max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-surface/80 rounded-3xl border border-border p-6 sm:p-10 shadow-sm">
          {/* Left Column: Product Narrative */}
          <div className="lg:col-span-5 space-y-6">
            <div className="feature-anim-item inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone border border-border text-[11px] font-mono text-muted">
              <Sliders className="w-3.5 h-3.5 text-accent" />
              <span>Challenge Pillar 03 • Pre-Flight Crisis Simulator</span>
            </div>

            <h2 className="feature-anim-item font-sans text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              Pre-Flight Crisis Simulator. <br />
              <span className="text-accent">Test Surges & Supplier Delays in Advance.</span>
            </h2>

            <p className="feature-anim-item text-slate-600 text-sm sm:text-base font-sans leading-relaxed">
              Before monsoon logistics disruptions hit or milk suppliers go on strike, simulate the crisis in seconds.
              Instantly see your buffer recommendations and extra stock requirements before stockouts happen.
            </p>

            <div className="feature-anim-item space-y-3 font-sans text-xs">
              <div className="flex items-center gap-2.5 text-slate-900 font-medium">
                <CheckCircle2 className="w-4 h-4 text-moss shrink-0" />
                <span>Side-by-side comparison: Normal Operations vs Stressed Crisis Mode</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-900 font-medium">
                <CheckCircle2 className="w-4 h-4 text-moss shrink-0" />
                <span>Simulate sudden sales surge (1.0x to 2.5x) and vendor delays (up to 14 days)</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-900 font-medium">
                <CheckCircle2 className="w-4 h-4 text-moss shrink-0" />
                <span>View required capital adjustments and stockout risk mitigation instantly</span>
              </div>
            </div>

            <div className="feature-anim-item pt-2">
              <button
                onClick={() => defaultProduct && onSimulateInCrisis(defaultProduct)}
                className="inline-flex items-center gap-2 text-xs font-sans font-bold text-accent hover:text-slate-900 transition-colors cursor-pointer"
              >
                <span>Launch Full Crisis Simulation Lab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Side-by-Side Comparison Matrix */}
          <div className="feature-anim-item lg:col-span-7 bg-stone/70 rounded-2xl border border-border p-6 sm:p-8 space-y-6">
            <div className="pb-4 border-b border-border flex justify-between items-center">
              <div>
                <div className="font-sans text-xs font-bold text-slate-900">
                  SIDE-BY-SIDE REPLENISHMENT SHOCK MATRIX
                </div>
                <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                  Simulate supplier delivery bottleneck & viral order surge
                </div>
              </div>
              <span className="text-[10px] font-sans text-accent bg-accent/10 px-2.5 py-1 rounded-full font-bold">
                Protection: {(serviceLevel * 100).toFixed(0)}%
              </span>
            </div>

            {/* Interactive Shock Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div className="space-y-1.5 p-3 rounded-xl bg-surface border border-border">
                <div className="flex justify-between">
                  <span className="text-muted">Demand Surge:</span>
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

              <div className="space-y-1.5 p-3 rounded-xl bg-surface border border-border">
                <div className="flex justify-between">
                  <span className="text-muted">Supplier Delay:</span>
                  <span className="font-semibold text-ink">+{leadTimeDelay} Days Late</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={leadTimeDelay}
                  onChange={(e) => setLeadTimeDelay(Number(e.target.value))}
                  className="w-full accent-accent cursor-pointer"
                />
              </div>
            </div>

            {/* Side-by-Side Comparison Cards */}
            <div className="grid grid-cols-2 gap-4 font-mono text-xs">
              {/* Baseline Policy */}
              <div className="p-4 rounded-2xl bg-surface border border-border space-y-3">
                <div className="text-[10px] font-semibold uppercase text-muted tracking-wider pb-1 border-b border-border">
                  Previous Baseline Policy
                </div>
                <div>
                  <div className="text-[10px] text-muted">Reorder Point (ROP)</div>
                  <div className="text-xl font-semibold text-ink mt-0.5">{reorderThreshold} u</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted">Safety Buffer (SS)</div>
                  <div className="text-lg font-semibold text-moss mt-0.5">{safetyBuffer} u</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted">Expected Holding Cost</div>
                  <div className="text-sm font-semibold text-ink mt-0.5">${Math.round(defaultProduct?.metrics.annualHoldingCost || 450)}/yr</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted">Stockout Risk</div>
                  <div className="text-sm font-semibold text-moss mt-0.5">{(100 - serviceLevel * 100).toFixed(1)}%</div>
                </div>
              </div>

              {/* Revised Stressed Policy */}
              <div className="p-4 rounded-2xl bg-accent/5 border border-accent/30 space-y-3">
                <div className="text-[10px] font-semibold uppercase text-accent tracking-wider pb-1 border-b border-accent/20 flex justify-between">
                  <span>Revised Shock Policy</span>
                  <span className="text-[9px] bg-accent/20 px-1.5 rounded">Active</span>
                </div>
                <div>
                  <div className="text-[10px] text-muted">Revised ROP</div>
                  <div className="text-xl font-semibold text-brick mt-0.5">{stressedReorderPoint} u</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted">Revised Buffer</div>
                  <div className="text-lg font-semibold text-moss mt-0.5">{stressedBuffer} u</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted">Revised Carrying Cost</div>
                  <div className="text-sm font-semibold text-ink mt-0.5">${Math.round((defaultProduct?.metrics.annualHoldingCost || 450) * demandMultiplier * 1.35)}/yr</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted">Unmitigated Risk (If not reordered)</div>
                  <div className="text-sm font-semibold text-brick mt-0.5">{stressedRiskPct}% Risk</div>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-border font-mono text-xs flex justify-between items-center">
              <div>
                <span className="text-muted">Recommended Emergency Order: </span>
                <span className="font-semibold text-ink">
                  {Math.max(0, stressedReorderPoint - simulatedStock + recommendedBatch)} units
                </span>
              </div>
              <button
                onClick={() => defaultProduct && onSimulateInCrisis(defaultProduct)}
                className="px-3.5 py-1.5 bg-ink text-surface rounded-xl hover:bg-accent transition-colors flex items-center gap-1.5 cursor-pointer text-[11px]"
              >
                <span>Run Full Lab</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FEATURE 04: Holdout Verification Matrix (Empirical Proof of Added Value)
          ========================================================================= */}
      <section className="feature-pinned-section max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-surface/80 rounded-3xl border border-border p-6 sm:p-10 shadow-sm space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone border border-border text-[11px] font-mono text-muted mb-2">
                <Scale className="w-3.5 h-3.5 text-accent" />
                <span>Challenge Pillar 04 • Holdout Empirical Verification</span>
              </div>
              <h2 className="font-sans text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Holdout Validation: Measure Rather Than Assume.
              </h2>
              <p className="text-slate-600 text-sm sm:text-base font-sans mt-1 max-w-2xl">
                Compare StockSense’s clean sales forecast against a standard store average on an unseen 90-day verification test.
              </p>
            </div>

            <button
              onClick={() => onNavigateToTab('demand')}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-sans font-bold hover:bg-accent transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <span>View Verification Charts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans text-left">
            <div className="p-6 rounded-2xl bg-stone/70 border border-border space-y-2">
              <div className="text-[10px] uppercase text-slate-500 font-bold">Forecast Accuracy Improvement</div>
              <div className="text-3xl font-bold text-moss mt-1">+75.2% Gain</div>
              <p className="text-slate-600 text-xs font-sans mt-2 leading-relaxed">
                Sales forecasting error dropped by more than 75% when filtering out one-off promotions and duplicate scans.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone/70 border border-border space-y-2">
              <div className="text-[10px] uppercase text-slate-500 font-bold">Stockout Incidents Averted</div>
              <div className="text-3xl font-bold text-accent mt-1">0 vs 6 Stockouts</div>
              <p className="text-slate-600 text-xs font-sans mt-2 leading-relaxed">
                During 90 test days, standard spreadsheets ran out of stock 6 times, while StockSense sustained 100% customer fulfillment.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-stone/70 border border-border space-y-2">
              <div className="text-[10px] uppercase text-slate-500 font-bold">Wasted Working Capital Prevented</div>
              <div className="text-3xl font-bold text-slate-900 mt-1">$2,720 Saved</div>
              <p className="text-slate-600 text-xs font-sans mt-2 leading-relaxed">
                Prevents panic over-ordering caused by false demand spikes, preserving dark store shelf space for fast-turning goods.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FINAL CALL TO ACTION: Enter Enterprise Dark Store Operations
          ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white shadow-2xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-sans font-bold text-white mb-2">
            <PackageCheck className="w-3.5 h-3.5 text-moss" />
            <span>Ready for Dark Store & Kirana Operations</span>
          </div>

          <h2 className="font-sans text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Stop Guessing. Replenish With Absolute Certainty.
          </h2>

          <p className="text-white/80 text-sm sm:text-base font-sans max-w-xl mx-auto leading-relaxed">
            Protect your store against supplier delays, avoid dead capital in perishable inventory, and automate purchase orders right on time.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => {
                onNavigateToTab('overview');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 py-3.5 rounded-xl bg-white text-slate-900 text-sm font-sans font-bold hover:bg-accent hover:text-white transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
            >
              <span>Enter StockSense Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Scroll-Driven Auto-Transition Zone into Dashboard */}
      <section
        ref={bottomSentinelRef}
        onClick={() => {
          onNavigateToTab('overview');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className="max-w-4xl mx-auto pt-14 pb-8 text-center space-y-3 cursor-pointer group"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone border border-border text-xs font-mono text-muted group-hover:border-accent group-hover:text-accent transition-all shadow-xs">
          <span className="w-2 h-2 rounded-full bg-moss animate-pulse" />
          <span>Tour Complete • Scroll or click to launch Fleet Dashboard</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs font-mono text-muted group-hover:text-ink transition-colors">
          <span>Entering Dark Store Operations Workspace</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </section>
    </div>
  );
};
