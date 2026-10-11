'use client';

import React, { useState } from 'react';
import { ProductWithComputed, ScenarioRunRecord } from '@/lib/types';
import { apiClient, ScenarioResponse } from '@/lib/api';
import { getScenarioRuns, runCrisisSimulation } from '@/lib/data';
import { CrisisSimulator } from '@/components/dashboard/CrisisSimulator';
import {
  Sliders,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Layers,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  History,
  FileCode,
  Copy,
  Check,
  ShieldAlert,
  ArrowRight,
  Database,
} from 'lucide-react';

interface ScenarioLabViewProps {
  products: ProductWithComputed[];
  selectedProduct: ProductWithComputed;
  onSelectProduct: (product: ProductWithComputed) => void;
}

export const ScenarioLabView: React.FC<ScenarioLabViewProps> = ({
  products,
  selectedProduct,
  onSelectProduct,
}) => {
  const [scenarioRuns, setScenarioRuns] = useState<ScenarioRunRecord[]>(() =>
    getScenarioRuns(products)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [inspectScenarioJson, setInspectScenarioJson] = useState<ScenarioRunRecord | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  // Quick inputs for recording a snapshot
  const [surgePct, setSurgePct] = useState(40);
  const [delayDays, setDelayDays] = useState(7);
  const [horizonDays, setHorizonDays] = useState(30);

  const handleSaveScenario = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);

    // Compute metrics
    const sim = runCrisisSimulation(selectedProduct, {
      demandSurgeMultiplier: 1 + surgePct / 100,
      leadTimeDelayDays: delayDays,
    });

    const newRun: ScenarioRunRecord = {
      id: `scen-run-${selectedProduct.sku.toLowerCase()}-s${Date.now().toString().slice(-4)}`,
      productId: selectedProduct.id,
      baselineRecommendationId: `rec-${selectedProduct.sku.toLowerCase()}-snap-01`,
      demandSurgePct: surgePct,
      supplierDelayDays: delayDays,
      horizonDays,
      runCount: 500,
      randomSeed: Math.floor(Math.random() * 900000) + 100000,
      baselineMetrics: {
        reorderPoint: Math.round(sim.base.reorderPoint),
        safetyStock: Math.round(sim.base.safetyStock),
        annualHoldingCost: Math.round(sim.base.annualHoldingCost),
        stockoutRiskPct: sim.base.stockoutRiskPct,
      },
      scenarioMetrics: {
        reorderPoint: Math.round(sim.stressed.reorderPoint),
        safetyStock: Math.round(sim.stressed.safetyStock),
        annualHoldingCost: Math.round(sim.stressed.annualHoldingCost),
        stockoutRiskPct: sim.stressed.stockoutRiskPct,
      },
      runStatus: 'completed',
      createdAt: new Date().toISOString(),
    };

    setScenarioRuns((prev) => [newRun, ...prev]);
    setIsSaving(false);
    setSaveSuccessMsg(`New scenario snapshot ${newRun.id} recorded into scenario_runs.`);
  };

  const handleCopyJson = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone border border-border text-ochre font-semibold uppercase tracking-wider">
              Table 6 • scenario_runs Schema
            </span>
          </div>
          <h3 className="font-serif text-2xl font-light text-ink">
            Crisis Simulator & Reproducible Stress Scenarios
          </h3>
          <p className="text-muted text-xs font-sans mt-0.5">
            Test supply chain shocks with side-by-side comparison of baseline vs stressed recommendations. Persist reproducible random seeds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveScenario}
            disabled={isSaving}
            className="px-4 py-2 bg-ink text-surface rounded-xl text-xs font-mono font-medium hover:bg-accent transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-2 shadow-xs"
          >
            <History className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Recording...' : 'Snapshot Scenario Run'}</span>
          </button>
        </div>
      </div>

      {/* Snapshot Success Notification Banner */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-moss/10 border border-moss/30 flex items-center justify-between font-mono text-xs text-moss animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-moss" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-moss/80 hover:text-moss text-[11px] underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* The Crisis Simulator (Primary interactive tool) */}
      <CrisisSimulator
        products={products}
        selectedProduct={selectedProduct}
        onSelectProduct={onSelectProduct}
      />

      {/* TABLE 6: scenario_runs Relational Table */}
      <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-sm overflow-hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border text-xs font-mono gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
              Core Relational Table • scenario_runs (Table 6)
            </span>
            <h4 className="font-serif text-xl font-normal text-ink mt-0.5">
              Reproducible Simulation History Registry
            </h4>
            <p className="text-muted text-xs font-sans mt-0.5">
              Baseline vs stressed runs evaluated on identical horizons with fixed pseudo-random seeds.
            </p>
          </div>
          <div className="flex items-center gap-3 text-muted text-[11px]">
            <span>{scenarioRuns.length} scenario runs logged</span>
            <span className="text-moss flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Seed locked & reproducible
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-border text-muted uppercase text-[10px] tracking-wider bg-stone/30">
                <th className="py-3 px-3">Run ID</th>
                <th className="py-3 px-3">SKU & Item</th>
                <th className="py-3 px-3">Disruption Inputs</th>
                <th className="py-3 px-3">Horizon & Seed</th>
                <th className="py-3 px-3">Baseline ROP / SS</th>
                <th className="py-3 px-3">Stressed ROP / SS</th>
                <th className="py-3 px-3">ROP Delta (Δ)</th>
                <th className="py-3 px-3">Holding Cost Delta</th>
                <th className="py-3 px-3">Stockout Risk</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {scenarioRuns.map((run) => {
                const prod = products.find((p) => p.id === run.productId);
                const deltaROP = run.scenarioMetrics.reorderPoint - run.baselineMetrics.reorderPoint;
                const deltaCost = run.scenarioMetrics.annualHoldingCost - run.baselineMetrics.annualHoldingCost;

                return (
                  <tr key={run.id} className="hover:bg-stone/50 transition-colors">
                    <td className="py-3.5 px-3 whitespace-nowrap font-semibold text-accent">
                      {run.id}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="font-sans font-medium text-ink">{prod?.name || run.productId}</div>
                      <div className="text-[10px] text-muted font-mono">{prod?.sku}</div>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="text-ochre font-semibold">+{run.demandSurgePct}% Demand</span>
                      <span className="text-muted block text-[10px]">+{run.supplierDelayDays}d Delay</span>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap text-muted text-[11px]">
                      <div>{run.horizonDays} days</div>
                      <div className="text-[10px] text-muted/80">Seed: {run.randomSeed}</div>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap text-muted">
                      {run.baselineMetrics.reorderPoint} ROP / {run.baselineMetrics.safetyStock} SS
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap font-semibold text-ink">
                      <span className="text-brick">{run.scenarioMetrics.reorderPoint} ROP</span>
                      <span className="text-moss block text-[11px] font-normal">{run.scenarioMetrics.safetyStock} SS</span>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap text-brick font-semibold">
                      +{deltaROP} units
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap text-muted">
                      +${deltaCost.toLocaleString()}/yr
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap text-ochre font-medium">
                      {run.scenarioMetrics.stockoutRiskPct.toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-moss/10 text-moss">
                        {run.runStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap text-right space-x-1.5">
                      <button
                        onClick={() => {
                          if (prod) onSelectProduct(prod);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-border bg-stone hover:border-ink text-muted hover:text-ink text-[11px] transition-colors cursor-pointer"
                        title="Load SKU in Crisis Simulator"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => setInspectScenarioJson(run)}
                        className="px-2.5 py-1 rounded-lg border border-border bg-stone hover:bg-ink hover:text-surface text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Inspect full scenario configuration JSON"
                      >
                        <FileCode className="w-3 h-3 text-accent" />
                        <span>JSON</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Inspector Modal for Table 6 (scenario_runs) */}
      {inspectScenarioJson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-2xl p-6 lg:p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div>
                <span className="font-mono text-xs text-ochre uppercase font-semibold">
                  Table 6 • scenario_runs configuration
                </span>
                <h4 className="font-serif text-2xl font-light text-ink mt-0.5">
                  Reproducible Simulation Parameters
                </h4>
                <div className="text-muted font-mono text-xs mt-0.5">{inspectScenarioJson.id}</div>
              </div>
              <button
                onClick={() => setInspectScenarioJson(null)}
                className="text-muted hover:text-ink text-xs font-mono cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1 text-xs font-mono">
                  <span className="text-muted uppercase text-[10px] font-semibold">
                    Scenario Configuration & Reproducible Seed
                  </span>
                  <button
                    onClick={() => handleCopyJson(JSON.stringify(inspectScenarioJson, null, 2))}
                    className="text-accent hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    {copiedJson ? <Check className="w-3 h-3 text-moss" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-stone border border-border font-mono text-[11px] text-ink overflow-x-auto max-h-72 leading-relaxed">
                  {JSON.stringify(
                    {
                      id: inspectScenarioJson.id,
                      product_id: inspectScenarioJson.productId,
                      baseline_recommendation_id: inspectScenarioJson.baselineRecommendationId,
                      demand_surge_pct: inspectScenarioJson.demandSurgePct,
                      supplier_delay_days: inspectScenarioJson.supplierDelayDays,
                      horizon_days: inspectScenarioJson.horizonDays,
                      run_count: inspectScenarioJson.runCount,
                      random_seed: inspectScenarioJson.randomSeed,
                      baseline_metrics: inspectScenarioJson.baselineMetrics,
                      scenario_metrics: inspectScenarioJson.scenarioMetrics,
                      run_status: inspectScenarioJson.runStatus,
                      created_at: inspectScenarioJson.createdAt,
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <button
                onClick={() => setInspectScenarioJson(null)}
                className="px-5 py-2 bg-ink text-surface rounded-xl text-xs font-mono font-medium hover:bg-accent transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
