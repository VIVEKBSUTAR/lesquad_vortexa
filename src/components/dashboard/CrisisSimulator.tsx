'use client';

import React, { useState, useMemo } from 'react';
import { ProductWithComputed, SimulationParams } from '@/lib/types';
import { runCrisisSimulation } from '@/lib/data';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Sliders, AlertTriangle, TrendingUp, DollarSign, ShieldAlert, RotateCcw } from 'lucide-react';

interface CrisisSimulatorProps {
  products: ProductWithComputed[];
  selectedProduct: ProductWithComputed;
  onSelectProduct: (product: ProductWithComputed) => void;
}

export const CrisisSimulator: React.FC<CrisisSimulatorProps> = ({
  products,
  selectedProduct,
  onSelectProduct,
}) => {
  const [params, setParams] = useState<SimulationParams>({
    leadTimeDelayDays: 7,
    demandSurgeMultiplier: 1.4,
    serviceLevelOverride: selectedProduct.targetServiceLevel,
  });

  // Re-run simulation instantaneously on parameter change
  const simResult = useMemo(() => {
    return runCrisisSimulation(selectedProduct, params);
  }, [selectedProduct, params]);

  const handleReset = () => {
    setParams({
      leadTimeDelayDays: 0,
      demandSurgeMultiplier: 1.0,
      serviceLevelOverride: selectedProduct.targetServiceLevel,
    });
  };

  const isStressed = params.leadTimeDelayDays > 0 || params.demandSurgeMultiplier > 1.0;

  return (
    <div className="bg-surface rounded-xl border border-border p-6 lg:p-8 shadow-sm">
      {/* Header & Product Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-accent font-bold mb-1">
            <Sliders className="w-3.5 h-3.5" />
            Supply Chain Resilience Planner
          </div>
          <h3 className="font-sans text-2xl text-slate-900 font-bold tracking-tight">
            Stress & Crisis Simulator
          </h3>
          <p className="text-slate-600 text-xs font-sans mt-0.5">
            Test supply disruption scenarios. Watch the engine automatically widen your safety stock band.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-mono text-muted uppercase">Target SKU:</label>
          <select
            value={selectedProduct.id}
            onChange={(e) => {
              const found = products.find((p) => p.id === e.target.value);
              if (found) {
                onSelectProduct(found);
                setParams((prev) => ({
                  ...prev,
                  serviceLevelOverride: found.targetServiceLevel,
                }));
              }
            }}
            className="bg-stone text-ink border border-border rounded-lg px-3 py-2 text-xs font-mono font-medium focus:outline-none focus:border-accent cursor-pointer"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} - {p.name}
              </option>
            ))}
          </select>

          {isStressed && (
            <button
              onClick={handleReset}
              className="p-2 border border-border rounded-lg text-muted hover:text-ink hover:bg-stone transition-colors text-xs flex items-center gap-1 font-mono cursor-pointer"
              title="Reset to Nominal Baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-border">
        {/* Slider 1: Lead Time Delay */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-muted uppercase">Supplier Lead Time Delay</span>
            <span className={`font-semibold ${params.leadTimeDelayDays > 0 ? 'text-brick' : 'text-ink'}`}>
              +{params.leadTimeDelayDays} days
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={params.leadTimeDelayDays}
            onChange={(e) =>
              setParams((prev) => ({
                ...prev,
                leadTimeDelayDays: parseInt(e.target.value, 10),
              }))
            }
          />
          <div className="flex justify-between text-[10px] font-mono text-muted">
            <span>Nominal (+0d)</span>
            <span>Minor (+10d)</span>
            <span>Severe (+30d)</span>
          </div>
        </div>

        {/* Slider 2: Demand Surge Multiplier */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-muted uppercase">Demand Surge Multiplier</span>
            <span className={`font-semibold ${params.demandSurgeMultiplier > 1.0 ? 'text-ochre' : 'text-ink'}`}>
              {params.demandSurgeMultiplier.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="3.0"
            step="0.1"
            value={params.demandSurgeMultiplier}
            onChange={(e) =>
              setParams((prev) => ({
                ...prev,
                demandSurgeMultiplier: parseFloat(e.target.value),
              }))
            }
          />
          <div className="flex justify-between text-[10px] font-mono text-muted">
            <span>1.0x (Normal)</span>
            <span>2.0x (Double)</span>
            <span>3.0x (Triple)</span>
          </div>
        </div>

        {/* Slider 3: Target Service Level */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-muted uppercase">Target Service Level</span>
            <span className="font-semibold text-accent">
              {((params.serviceLevelOverride ?? selectedProduct.targetServiceLevel) * 100).toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="0.85"
            max="0.995"
            step="0.005"
            value={params.serviceLevelOverride ?? selectedProduct.targetServiceLevel}
            onChange={(e) =>
              setParams((prev) => ({
                ...prev,
                serviceLevelOverride: parseFloat(e.target.value),
              }))
            }
          />
          <div className="flex justify-between text-[10px] font-sans text-slate-500 font-bold">
            <span>85% Basic</span>
            <span>95% High</span>
            <span>99.5% Maximum</span>
          </div>
        </div>
      </div>

      {/* Before & After Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 py-6 border-b border-border font-sans">
        {/* 1. Reorder Trigger Level */}
        <div className="p-4 rounded-xl bg-stone/70 border border-border">
          <div className="text-[10px] uppercase text-slate-500 font-bold">Order Trigger Level</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-brick">
              {Math.round(simResult.stressed.reorderPoint)}
            </span>
            <span className="text-xs text-slate-500">
              (was {Math.round(simResult.base.reorderPoint)})
            </span>
          </div>
          <div className="text-[11px] mt-1 text-brick font-bold">
            +{Math.round(simResult.deltaROP)} units
          </div>
        </div>

        {/* 2. Safety Buffer */}
        <div className="p-4 rounded-xl bg-stone/70 border border-border">
          <div className="text-[10px] uppercase text-slate-500 font-bold">Emergency Buffer</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-moss">
              {Math.round(simResult.stressed.safetyStock)}
            </span>
            <span className="text-xs text-slate-500">
              (was {Math.round(simResult.base.safetyStock)})
            </span>
          </div>
          <div className="text-[11px] mt-1 text-moss font-bold">
            +{Math.round(simResult.deltaSS)} buffer units
          </div>
        </div>

        {/* 3. Expected Annual Storage Cost */}
        <div className="p-4 rounded-xl bg-stone/70 border border-border">
          <div className="text-[10px] uppercase text-slate-500 font-bold">Annual Storage Cost</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-slate-900">
              ${Math.round(simResult.stressed.annualHoldingCost).toLocaleString()}
            </span>
          </div>
          <div className="text-[11px] mt-1 text-slate-600 font-medium">
            +${Math.round(simResult.deltaHoldingCost).toLocaleString()}/yr
          </div>
        </div>

        {/* 4. Stockout Risk Probability */}
        <div className="p-4 rounded-xl bg-stone/70 border border-border">
          <div className="text-[10px] uppercase text-slate-500 font-bold">Risk of Stockouts</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-ochre">
              {simResult.stressed.stockoutRiskPct.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500">
              (was {simResult.base.stockoutRiskPct.toFixed(1)}%)
            </span>
          </div>
          <div className="text-[11px] mt-1 text-slate-600 font-medium">
            Target Protection: {((params.serviceLevelOverride ?? selectedProduct.targetServiceLevel) * 100).toFixed(0)}%
          </div>
        </div>

        {/* 5. Additional Capital Required */}
        <div className="p-4 rounded-xl bg-stone/70 border border-border col-span-2 lg:col-span-1">
          <div className="text-[10px] uppercase text-slate-500 font-bold">Extra Cash Required</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-xl font-bold text-accent">
              ${Math.round(simResult.additionalCapitalRequired).toLocaleString()}
            </span>
          </div>
          <div className="text-[11px] mt-1 text-slate-600 font-medium">
            Unit cost: ${selectedProduct.unitCost}
          </div>
        </div>
      </div>

      {/* Dynamic Recharts Visualization */}
      <div className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-xs font-mono uppercase tracking-wider text-muted">
            60-Day Replenishment Projection (Live Reactive Trajectory)
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 text-brick">
              <span className="w-3 h-0.5 bg-brick inline-block"></span> Stressed ROP
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted">
              <span className="w-3 h-0.5 bg-muted border-t border-dashed inline-block"></span> Base ROP
            </span>
            <span className="inline-flex items-center gap-1.5 text-moss">
              <span className="w-3 h-2 bg-moss/20 inline-block"></span> Stressed SS Band
            </span>
            <span className="inline-flex items-center gap-1.5 text-ink">
              <span className="w-3 h-0.5 bg-ink inline-block"></span> Projected Inventory
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={simResult.chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="stressedSSGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F7A4A" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4F7A4A" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F5C5C" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#0F5C5C" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#DAD6CE" opacity={0.6} />
              <XAxis
                dataKey="label"
                stroke="#6D6A64"
                tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}
                interval={9}
              />
              <YAxis
                stroke="#6D6A64"
                tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FAF9F7',
                  borderColor: '#DAD6CE',
                  borderRadius: '8px',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '11px',
                  boxShadow: '0 4px 12px rgba(28,27,25,0.08)',
                }}
              />
              {/* Safety stock band */}
              <Area
                type="monotone"
                dataKey="stressedSS"
                name="Stressed Safety Stock"
                stroke="#4F7A4A"
                fill="url(#stressedSSGrad)"
                strokeWidth={1.5}
              />
              {/* Stressed ROP line */}
              <Line
                type="stepAfter"
                dataKey="stressedROP"
                name="Stressed ROP"
                stroke="#B23A2E"
                strokeWidth={2}
                dot={false}
              />
              {/* Base ROP line */}
              <Line
                type="stepAfter"
                dataKey="baseROP"
                name="Base ROP"
                stroke="#6D6A64"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
              {/* Inventory Position curve */}
              <Area
                type="monotone"
                dataKey="inventoryLevel"
                name="Inventory Level"
                stroke="#1C1B19"
                fill="url(#invGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
