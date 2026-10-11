'use client';

import React, { useState } from 'react';
import { ProductWithComputed } from '@/lib/types';
import { apiClient, ScenarioResponse } from '@/lib/api';
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
  const [savedScenarios, setSavedScenarios] = useState<ScenarioResponse[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [scenarioName, setScenarioName] = useState('Quarterly Disruption Stress Test');

  const handleSaveScenario = async () => {
    setIsSaving(true);
    const result = await apiClient.createScenario(selectedProduct.id, {
      scenario_name: scenarioName,
      demand_surge_pct: 40,
      extra_lead_time_days: 7,
      horizon_days: 30,
    });
    setSavedScenarios((prev) => [result, ...prev]);
    setIsSaving(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-ochre font-semibold mb-1">
            <Sliders className="w-3.5 h-3.5" />
            Operations Research Scenario Lab (Section 8 Compliant)
          </div>
          <h3 className="font-serif text-2xl font-light text-ink">
            Stress-Test Supply Chain Shocks
          </h3>
          <p className="text-muted text-xs font-sans mt-0.5">
            Compare baseline deterministic replenishment against simulated lead-time delays and surge multipliers.
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

      {/* The Crisis Simulator (Primary interactive tool) */}
      <CrisisSimulator
        products={products}
        selectedProduct={selectedProduct}
        onSelectProduct={onSelectProduct}
      />

      {/* Saved Scenarios History Panel (Section 8.3 of contract) */}
      {savedScenarios.length > 0 && (
        <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-6 lg:p-8 shadow-sm space-y-4">
          <div className="pb-3 border-b border-border flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono uppercase text-muted tracking-wider font-semibold">
                Scenario History Log (Section 8.3)
              </span>
              <h4 className="font-serif text-xl font-normal text-ink mt-0.5">
                Saved Simulation Snapshots
              </h4>
            </div>
            <span className="text-xs font-mono text-muted">
              {savedScenarios.length} snapshots recorded
            </span>
          </div>

          <div className="space-y-3">
            {savedScenarios.map((sc) => (
              <div
                key={sc.scenario_id}
                className="p-4 rounded-xl bg-stone/70 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs"
              >
                <div>
                  <div className="font-semibold text-ink text-sm font-sans">{sc.scenario_name}</div>
                  <div className="text-muted text-[11px] mt-0.5">
                    {sc.scenario_id} • +{sc.inputs.demand_surge_pct}% Demand, +{sc.inputs.extra_lead_time_days}d Lead Time ({sc.inputs.horizon_days}d horizon)
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-[10px] text-muted uppercase">Stockout Days Delta</div>
                    <div className="font-semibold text-brick mt-0.5">+{sc.comparison.change_in_stockout_days}d</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted uppercase">Unmet Units</div>
                    <div className="font-semibold text-ochre mt-0.5">+{sc.comparison.change_in_unmet_demand_units}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-muted uppercase">Holding Cost Delta</div>
                    <div className="font-semibold text-ink mt-0.5">+${sc.comparison.change_in_holding_cost}/mo</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
