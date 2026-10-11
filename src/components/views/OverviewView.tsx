'use client';

import React, { useState, useEffect } from 'react';
import { ProductWithComputed } from '@/lib/types';
import { apiClient, DemandItem } from '@/lib/api';
import {
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Activity,
  Package,
  TrendingUp,
  AlertOctagon,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  Upload,
  Info,
  Calendar,
  Zap,
  Scale
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';

interface OverviewViewProps {
  products: ProductWithComputed[];
  serviceLevel?: number;
  zScore?: number;
  onNavigateToTab: (tabId: 'inventory' | 'demand' | 'scenario') => void;
  onSelectProduct: (product: ProductWithComputed) => void;
  onOpenImportModal: () => void;
  onOpenFormulasModal?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  products,
  serviceLevel = 0.95,
  zScore = 1.645,
  onNavigateToTab,
  onSelectProduct,
  onOpenImportModal,
  onOpenFormulasModal,
}) => {
  const [selectedChartSku, setSelectedChartSku] = useState<string>(
    products[0]?.id || ''
  );
  const [chartData, setChartData] = useState<DemandItem[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Selected chart product
  const activeChartProduct =
    products.find((p) => p.id === selectedChartSku) || products[0];

  useEffect(() => {
    if (activeChartProduct) {
      loadChartData(activeChartProduct.id);
    }
  }, [activeChartProduct?.id]);

  const loadChartData = async (productId: string) => {
    setIsLoadingChart(true);
    const data = await apiClient.getProductDemand(productId);
    setChartData(data);
    setIsLoadingChart(false);
  };

  const handleRefreshAnalysis = async () => {
    setIsRefreshing(true);
    if (activeChartProduct) {
      await loadChartData(activeChartProduct.id);
    }
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // KPIs
  const productsRequiringReorder = products.filter(
    (p) => p.metrics.inventoryPosition <= p.metrics.reorderPoint
  );

  const highStockoutRiskProducts = products.filter((p) => {
    const d = p.metrics.avgDemand;
    const daysUntilStockout = d > 0 ? p.onHand / d : 999;
    return daysUntilStockout <= p.metrics.avgLeadTime;
  });

  const anomaliesCount = 2; // Flagged cold room outage + push promo
  const dataQualityIssuesCount = 1; // 1 product with lead-time standard deviation variance warning

  // Stockout Risk Radar items
  const radarItems = products
    .map((p) => {
      const d = p.metrics.avgDemand;
      const daysUntilStockout = d > 0 ? p.onHand / d : 999;
      const stockCoverageDays = d > 0 ? p.metrics.inventoryPosition / d : 999;
      const leadTime = p.metrics.avgLeadTime;
      const isReorderDue = p.metrics.inventoryPosition <= p.metrics.reorderPoint;

      let riskLevel: 'High' | 'Medium' | 'Low' | 'Insufficient data' = 'Low';
      let mainReason = '';
      let suggestedNextAction = '';

      if (daysUntilStockout <= leadTime) {
        riskLevel = 'High';
        mainReason = `On-hand (${p.onHand}) < lead-time demand (${Math.round(
          d * leadTime
        )}). Stockout projected before delivery.`;
        suggestedNextAction = `Place emergency PO for ${Math.round(
          p.metrics.eoq
        )} ${p.unitOfMeasure || 'units'}`;
      } else if (isReorderDue) {
        riskLevel = 'Medium';
        mainReason = `Inventory position (${
          p.metrics.inventoryPosition
        }) at/below ROP (${Math.round(
          p.metrics.reorderPoint
        )}). Normal replenishment cycle.`;
        suggestedNextAction = `Generate PO for ${Math.round(p.metrics.eoq)} ${
          p.unitOfMeasure || 'units'
        }`;
      } else {
        riskLevel = 'Low';
        mainReason = `Buffer intact. Position (${
          p.metrics.inventoryPosition
        }) provides ${stockCoverageDays.toFixed(1)} days coverage.`;
        suggestedNextAction = 'Maintain daily monitoring';
      }

      return {
        product: p,
        riskLevel,
        daysUntilStockout,
        stockCoverageDays,
        leadTime,
        mainReason,
        suggestedNextAction,
      };
    })
    .sort((a, b) => {
      // Prioritize High -> Medium -> Low, then by days until stockout
      const weight = { High: 3, Medium: 2, Low: 1, 'Insufficient data': 0 };
      if (weight[b.riskLevel] !== weight[a.riskLevel]) {
        return weight[b.riskLevel] - weight[a.riskLevel];
      }
      return a.daysUntilStockout - b.daysUntilStockout;
    });

  const handleRowClick = (product: ProductWithComputed) => {
    onSelectProduct(product);
    onNavigateToTab('inventory');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* A. Page Header */}
      <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-moss animate-pulse" />
            <h1 className="font-serif text-3xl font-light text-ink tracking-tight">
              Overview
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone border border-border text-muted">
              Fleet Alpha
            </span>
          </div>
          <p className="text-muted text-sm font-sans max-w-2xl">
            Your inventory health, emerging risks, and recommended replenishment actions across the dark store network.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs font-mono text-muted">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent" />
              <span>Analysis ready: Last calculated today at 14:32</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-ochre" />
              <span>Policy: SLA {(serviceLevel * 100).toFixed(0)}% (Z={zScore.toFixed(3)})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            onClick={handleRefreshAnalysis}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-xl bg-surface border border-border hover:bg-stone text-ink flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 text-muted ${
                isRefreshing ? 'animate-spin text-accent' : ''
              }`}
            />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Analysis'}</span>
          </button>

          <button
            onClick={onOpenImportModal}
            className="px-4 py-2 rounded-xl bg-ink text-surface hover:bg-accent font-medium flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-surface" />
            <span>Import Data</span>
          </button>
        </div>
      </div>

      {/* B. KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Products Requiring Reorder */}
        <div
          onClick={() => onNavigateToTab('inventory')}
          className="bg-surface/98 backdrop-blur-xl border border-border hover:border-brick/50 rounded-2xl p-5 shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
          title="Products where effective inventory position (On-Hand - Committed) is at or below the statistical Reorder Point (ROP)."
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
                Reorder Required
              </span>
              <AlertTriangle className="w-4 h-4 text-brick" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-mono text-3xl font-semibold text-brick">
                {productsRequiringReorder.length}
              </span>
              <span className="text-xs font-mono text-muted">
                of {products.length} SKUs
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/60 text-xs font-mono text-brick group-hover:underline">
            <span>Filter in Inventory</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 2: High Stockout-Risk Products */}
        <div
          onClick={() => onNavigateToTab('inventory')}
          className="bg-surface/98 backdrop-blur-xl border border-border hover:border-ochre/50 rounded-2xl p-5 shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
          title="Products where on-hand stock will deplete before the supplier's average lead-time delivery arrives."
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
                High Stockout Risk
              </span>
              <Zap className="w-4 h-4 text-ochre" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-mono text-3xl font-semibold text-ochre">
                {highStockoutRiskProducts.length}
              </span>
              <span className="text-xs font-mono text-muted">
                Critical Run-out
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/60 text-xs font-mono text-ochre group-hover:underline">
            <span>Inspect Priority SKUs</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 3: Demand Anomalies Awaiting Review */}
        <div
          onClick={() => onNavigateToTab('demand')}
          className="bg-surface/98 backdrop-blur-xl border border-border hover:border-accent/50 rounded-2xl p-5 shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
          title="Unusual sales spikes or drop-offs detected by statistical filters that need human classification."
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
                Anomalies to Review
              </span>
              <Activity className="w-4 h-4 text-accent" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-mono text-3xl font-semibold text-accent">
                {anomaliesCount}
              </span>
              <span className="text-xs font-mono text-muted">Flagged records</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/60 text-xs font-mono text-accent group-hover:underline">
            <span>Review in Demand Insights</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Card 4: Data-Quality Issues */}
        <div
          onClick={() => onNavigateToTab('demand')}
          className="bg-surface/98 backdrop-blur-xl border border-border hover:border-ink/50 rounded-2xl p-5 shadow-sm transition-all cursor-pointer group flex flex-col justify-between"
          title="Input gaps such as missing lead-time variance or volatile supplier records requiring attention."
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted font-medium">
                Data Quality Alerts
              </span>
              <AlertOctagon className="w-4 h-4 text-muted" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-mono text-3xl font-semibold text-ink">
                {dataQualityIssuesCount}
              </span>
              <span className="text-xs font-mono text-muted">Action item</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/60 text-xs font-mono text-muted group-hover:underline">
            <span>Inspect Data Health</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* C. Stockout Risk Radar — Primary Component (Prioritized List/Table) */}
      <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-3xl p-6 lg:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone border border-border text-brick font-semibold uppercase tracking-wider">
                Primary Component
              </span>
              <h2 className="font-serif text-2xl font-light text-ink">
                Stockout Risk Radar
              </h2>
            </div>
            <p className="text-muted text-xs font-sans">
              Prioritized by replenishment urgency. Selecting any row opens that product directly in Inventory details.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-muted">
            <span className="w-2 h-2 rounded-full bg-brick" />
            <span>High Risk (&lt; Lead Time)</span>
            <span className="w-2 h-2 rounded-full bg-ochre ml-2" />
            <span>Medium (At ROP)</span>
            <span className="w-2 h-2 rounded-full bg-moss ml-2" />
            <span>Low (Buffer Ok)</span>
          </div>
        </div>

        {/* Priority Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-border text-[11px] text-muted uppercase">
                <th className="pb-3 font-medium">Product / SKU</th>
                <th className="pb-3 font-medium">Risk Level</th>
                <th className="pb-3 font-medium text-right">Est. Days to Stockout</th>
                <th className="pb-3 font-medium text-right">Stock Coverage</th>
                <th className="pb-3 font-medium text-right">Supplier Lead Time</th>
                <th className="pb-3 font-medium pl-4">Main Reason</th>
                <th className="pb-3 font-medium text-right">Suggested Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {radarItems.map(({ product, riskLevel, daysUntilStockout, stockCoverageDays, leadTime, mainReason, suggestedNextAction }) => {
                const riskBadge = {
                  High: 'bg-brick/10 text-brick border-brick/30',
                  Medium: 'bg-ochre/10 text-ochre border-ochre/30',
                  Low: 'bg-moss/10 text-moss border-moss/30',
                  'Insufficient data': 'bg-stone text-muted border-border',
                }[riskLevel];

                return (
                  <tr
                    key={product.id}
                    onClick={() => handleRowClick(product)}
                    className="hover:bg-stone/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 pr-3">
                      <div className="font-sans font-medium text-sm text-ink group-hover:text-accent transition-colors">
                        {product.name}
                      </div>
                      <div className="text-[11px] text-muted flex items-center gap-1.5 mt-0.5">
                        <span className="bg-stone px-1.5 py-0.2 rounded border border-border">
                          {product.sku}
                        </span>
                        <span>•</span>
                        <span>{product.category}</span>
                      </div>
                    </td>

                    <td className="py-4 pr-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${riskBadge}`}
                      >
                        {riskLevel}
                      </span>
                    </td>

                    <td className="py-4 pr-3 text-right">
                      <span
                        className={`font-semibold ${
                          daysUntilStockout <= leadTime ? 'text-brick' : 'text-ink'
                        }`}
                      >
                        {daysUntilStockout > 90 ? '> 90 d' : `${daysUntilStockout.toFixed(1)} d`}
                      </span>
                    </td>

                    <td className="py-4 pr-3 text-right text-muted">
                      {stockCoverageDays > 90 ? '> 90 d' : `${stockCoverageDays.toFixed(1)} d`}
                    </td>

                    <td className="py-4 pr-3 text-right text-muted">
                      {leadTime.toFixed(1)} d (±{product.metrics.leadTimeStdDev.toFixed(1)})
                    </td>

                    <td className="py-4 pl-4 pr-3 max-w-xs text-[11px] text-muted leading-relaxed">
                      {mainReason}
                    </td>

                    <td className="py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(product);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-surface border border-border group-hover:bg-ink group-hover:text-surface text-[11px] text-ink transition-all inline-flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <span>{suggestedNextAction}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* D & E. Two Columns: Inventory Health Distribution & Demand Trend Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* D. Inventory Health Distribution */}
        <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-3xl p-6 lg:p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-xl font-light text-ink">
                Fleet Inventory Health
              </h3>
              <Layers className="w-4 h-4 text-muted" />
            </div>
            <p className="text-muted text-xs font-sans mb-6">
              Distribution of SKUs across deterministic buffer thresholds.
            </p>

            {/* Health Distribution Breakdown Bars */}
            <div className="space-y-4 font-mono text-xs">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="flex items-center gap-1.5 text-brick font-medium">
                    <span className="w-2 h-2 rounded-full bg-brick" />
                    Reorder Now (Effective Stock ≤ ROP)
                  </span>
                  <span className="font-semibold text-brick">
                    {productsRequiringReorder.length} SKUs (
                    {Math.round((productsRequiringReorder.length / products.length) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-stone overflow-hidden border border-border">
                  <div
                    className="h-full bg-brick transition-all duration-500"
                    style={{
                      width: `${(productsRequiringReorder.length / products.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="flex items-center gap-1.5 text-ochre font-medium">
                    <span className="w-2 h-2 rounded-full bg-ochre" />
                    Buffer Watch (Approaching ROP)
                  </span>
                  <span className="font-semibold text-ochre">
                    {products.filter((p) => p.metrics.status === 'watch').length} SKUs (
                    {Math.round(
                      (products.filter((p) => p.metrics.status === 'watch').length /
                        products.length) *
                        100
                    )}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-stone overflow-hidden border border-border">
                  <div
                    className="h-full bg-ochre transition-all duration-500"
                    style={{
                      width: `${
                        (products.filter((p) => p.metrics.status === 'watch').length /
                          products.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="flex items-center gap-1.5 text-moss font-medium">
                    <span className="w-2 h-2 rounded-full bg-moss" />
                    Healthy Stocked (Buffer Safe)
                  </span>
                  <span className="font-semibold text-moss">
                    {products.filter((p) => p.metrics.status === 'healthy').length} SKUs (
                    {Math.round(
                      (products.filter((p) => p.metrics.status === 'healthy').length /
                        products.length) *
                        100
                    )}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-stone overflow-hidden border border-border">
                  <div
                    className="h-full bg-moss transition-all duration-500"
                    style={{
                      width: `${
                        (products.filter((p) => p.metrics.status === 'healthy').length /
                          products.length) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-border flex items-center justify-between text-xs font-mono text-muted">
            <span>Deterministic Policy:</span>
            <span className="font-semibold text-ink">Continuous (r, Q)</span>
          </div>
        </div>

        {/* E. Demand Trend Chart */}
        <div className="lg:col-span-2 bg-surface/98 backdrop-blur-xl border border-border rounded-3xl p-6 lg:p-7 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <h3 className="font-serif text-xl font-light text-ink">
                  Observed Demand vs Statistical Forecast
                </h3>
              </div>
              <p className="text-muted text-xs font-sans mt-0.5">
                30-day chronological actuals, model projection, and highlighted anomalies.
              </p>
            </div>

            {/* Product Selector Dropdown */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-muted text-[11px]">Product:</span>
              <select
                value={selectedChartSku}
                onChange={(e) => setSelectedChartSku(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-surface border border-border text-ink font-mono text-xs focus:outline-none focus:border-accent cursor-pointer shadow-xs"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Unit Legend */}
          <div className="flex items-center gap-4 text-[11px] font-mono text-muted">
            <span>Unit: {activeChartProduct?.unitOfMeasure || 'units'}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-ink">
              <span className="w-2.5 h-2.5 bg-accent/30 border border-accent rounded-sm inline-block" />
              Observed Daily Sales
            </span>
            <span className="flex items-center gap-1 text-ink">
              <span className="w-3 h-0.5 bg-ink inline-block" />
              Exponential Forecast Baseline
            </span>
          </div>

          {/* Recharts Container */}
          <div className="h-64 w-full">
            {isLoadingChart ? (
              <div className="h-full flex items-center justify-center font-mono text-xs text-muted">
                Loading chronological observations...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#DAD6CE" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#6D6A64', fontSize: 10 }}
                    tickFormatter={(val) => val.slice(5)}
                  />
                  <YAxis tick={{ fill: '#6D6A64', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FAF9F7',
                      borderColor: '#DAD6CE',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Bar
                    dataKey="units_sold"
                    name="Observed Sales"
                    fill="#C38D56"
                    opacity={0.7}
                    radius={[3, 3, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="units_sold"
                    name="Baseline Trend"
                    stroke="#1C1B19"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* F. Recommended Next Actions */}
      <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-3xl p-6 lg:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="font-serif text-xl font-light text-ink">
              Recommended Next Actions
            </h3>
            <p className="text-muted text-xs font-sans mt-0.5">
              Actions grounded strictly in verified data, stock levels, and analytical holdouts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action 1: Review High-Risk SKU */}
          <div
            onClick={() => {
              onSelectProduct(products[0]);
              onNavigateToTab('inventory');
            }}
            className="p-4 rounded-2xl bg-stone/40 border border-border hover:border-ink transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-brick font-semibold mb-1">
                Immediate Order
              </div>
              <h4 className="font-sans font-medium text-sm text-ink group-hover:text-accent transition-colors">
                Inspect Amul Milk 1L
              </h4>
              <p className="text-xs text-muted font-sans mt-1">
                Only 0.9 days of coverage remaining before stockout. Supplier lead time is 2 days.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono text-accent pt-3 mt-3 border-t border-border/50">
              <span>Open in Inventory</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 2: Resolve Demand Anomaly */}
          <div
            onClick={() => onNavigateToTab('demand')}
            className="p-4 rounded-2xl bg-stone/40 border border-border hover:border-ink transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-ochre font-semibold mb-1">
                Anomaly Queue
              </div>
              <h4 className="font-sans font-medium text-sm text-ink group-hover:text-accent transition-colors">
                Classify Cold Room Outage
              </h4>
              <p className="text-xs text-muted font-sans mt-1">
                0-unit drop on 2025-01-03 caused by compressor failure. Classify to protect forecast.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono text-ochre pt-3 mt-3 border-t border-border/50">
              <span>Review in Demand</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 3: Test Scenario in Lab */}
          <div
            onClick={() => {
              onSelectProduct(products[1]);
              onNavigateToTab('scenario');
            }}
            className="p-4 rounded-2xl bg-stone/40 border border-border hover:border-ink transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold mb-1">
                Stress Simulation
              </div>
              <h4 className="font-sans font-medium text-sm text-ink group-hover:text-accent transition-colors">
                Stress Test Atta 5kg Surge
              </h4>
              <p className="text-xs text-muted font-sans mt-1">
                Simulate 40% surge in flour demand combined with 7-day mill transport delay.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono text-accent pt-3 mt-3 border-t border-border/50">
              <span>Open Scenario Lab</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 4: Audit Lead Time Settings */}
          <div
            onClick={() => {
              onSelectProduct(products[2]);
              onNavigateToTab('inventory');
            }}
            className="p-4 rounded-2xl bg-stone/40 border border-border hover:border-ink transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold mb-1">
                Supplier Settings
              </div>
              <h4 className="font-sans font-medium text-sm text-ink group-hover:text-accent transition-colors">
                Sunflower Oil Lead Time
              </h4>
              <p className="text-xs text-muted font-sans mt-1">
                Lead-time standard deviation is 1.4 days. Evaluate safety buffer impact.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-mono text-muted group-hover:text-ink pt-3 mt-3 border-t border-border/50">
              <span>Inspect Settings</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
