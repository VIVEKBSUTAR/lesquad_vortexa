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
        mainReason = `Only ${daysUntilStockout.toFixed(1)} days of stock left. Supplier takes ${leadTime.toFixed(0)} days to deliver. Reorder immediately.`;
        suggestedNextAction = `Order ${Math.round(p.metrics.eoq)} ${p.unitOfMeasure || 'units'} now`;
      } else if (isReorderDue) {
        riskLevel = 'Medium';
        mainReason = `Stock reached reorder trigger level (${Math.round(p.metrics.reorderPoint)} units). Regular restock due.`;
        suggestedNextAction = `Order ${Math.round(p.metrics.eoq)} ${p.unitOfMeasure || 'units'}`;
      } else {
        riskLevel = 'Low';
        mainReason = `Healthy stock with ${stockCoverageDays.toFixed(1)} days of coverage. Emergency buffer safe.`;
        suggestedNextAction = 'Stock is safe';
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
            <h1 className="font-bold text-3xl text-slate-900 tracking-tight">
              Store Inventory Overview
            </h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-stone border border-border text-slate-700">
              Fleet Alpha
            </span>
          </div>
          <p className="text-slate-600 text-sm font-medium max-w-2xl">
            Live inventory status, urgent restock alerts, and recommended purchase orders for your store.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600 font-medium">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-accent" />
              <span>Updated today at 14:32</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-ochre" />
              <span>Stock Protection: <strong className="text-slate-900">{(serviceLevel * 100).toFixed(0)}% High Reliability</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          <button
            onClick={handleRefreshAnalysis}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-xl bg-surface border border-border hover:bg-stone text-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 text-slate-500 ${
                isRefreshing ? 'animate-spin text-accent' : ''
              }`}
            />
            <span>{isRefreshing ? 'Checking...' : 'Refresh Status'}</span>
          </button>

          <button
            onClick={onOpenImportModal}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-accent font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-white" />
            <span>Upload Store Data</span>
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

      {/* C. Stockout Risk Radar — Urgent Action List */}
      <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-3xl p-6 lg:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-bold text-2xl text-slate-900 tracking-tight">
                Stockout Risk Radar
              </h2>
            </div>
            <p className="text-slate-600 text-xs font-medium">
              Products sorted by urgency. Click any product to review reorder details or generate a purchase order.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-brick">
              <span className="w-2.5 h-2.5 rounded-full bg-brick" />
              Urgent (Less than Delivery Time)
            </span>
            <span className="flex items-center gap-1.5 text-ochre ml-2">
              <span className="w-2.5 h-2.5 rounded-full bg-ochre" />
              Reorder Due
            </span>
            <span className="flex items-center gap-1.5 text-moss ml-2">
              <span className="w-2.5 h-2.5 rounded-full bg-moss" />
              Safe Buffer
            </span>
          </div>
        </div>

        {/* Priority Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[11px] text-slate-700 uppercase font-bold tracking-wider">
                <th className="pb-3">Product Name</th>
                <th className="pb-3">Stock Status</th>
                <th className="pb-3 text-right">Stock Remaining</th>
                <th className="pb-3 text-right">Delivery Wait Time</th>
                <th className="pb-3 pl-4">Stock Situation</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {radarItems.map(({ product, riskLevel, daysUntilStockout, leadTime, mainReason, suggestedNextAction }) => {
                const riskBadge = {
                  High: 'bg-brick/10 text-brick border-brick/30',
                  Medium: 'bg-ochre/10 text-ochre border-ochre/30',
                  Low: 'bg-moss/10 text-moss border-moss/30',
                  'Insufficient data': 'bg-stone text-slate-600 border-border',
                }[riskLevel];

                return (
                  <tr
                    key={product.id}
                    onClick={() => handleRowClick(product)}
                    className="hover:bg-stone/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-4 pr-3">
                      <div className="font-bold text-sm text-slate-900 group-hover:text-accent transition-colors">
                        {product.name}
                      </div>
                      <div className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                        <span className="bg-stone px-1.5 py-0.5 rounded border border-border font-semibold">
                          {product.sku}
                        </span>
                        <span>•</span>
                        <span>{product.category}</span>
                      </div>
                    </td>

                    <td className="py-4 pr-3">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-bold ${riskBadge}`}
                      >
                        {riskLevel === 'High' ? 'Urgent Reorder' : riskLevel === 'Medium' ? 'Reorder Due' : 'Stock Healthy'}
                      </span>
                    </td>

                    <td className="py-4 pr-3 text-right">
                      <span
                        className={`font-bold text-sm ${
                          daysUntilStockout <= leadTime ? 'text-brick' : 'text-slate-900'
                        }`}
                      >
                        {daysUntilStockout > 90 ? '> 90 days' : `${daysUntilStockout.toFixed(1)} days`}
                      </span>
                    </td>

                    <td className="py-4 pr-3 text-right font-medium text-slate-700">
                      {leadTime.toFixed(0)} days to deliver
                    </td>

                    <td className="py-4 pl-4 pr-3 max-w-xs text-xs text-slate-600 leading-relaxed font-medium">
                      {mainReason}
                    </td>

                    <td className="py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(product);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-surface border border-border group-hover:bg-slate-900 group-hover:text-white text-xs font-bold text-slate-800 transition-all inline-flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <span>{suggestedNextAction}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
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
              <h3 className="font-bold text-xl text-slate-900">
                Store Stock Health
              </h3>
              <Layers className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-slate-600 text-xs font-medium mb-6">
              Distribution of catalogue items across restock stages.
            </p>

            {/* Health Distribution Breakdown Bars */}
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="flex items-center gap-1.5 text-brick font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-brick" />
                    Urgent Reorder Needed
                  </span>
                  <span className="font-bold text-brick">
                    {productsRequiringReorder.length} Items (
                    {Math.round((productsRequiringReorder.length / products.length) * 100)}%)
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-stone overflow-hidden border border-border">
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
                  <span className="flex items-center gap-1.5 text-ochre font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-ochre" />
                    Order Soon (Low Stock)
                  </span>
                  <span className="font-bold text-ochre">
                    {products.filter((p) => p.metrics.status === 'watch').length} Items (
                    {Math.round(
                      (products.filter((p) => p.metrics.status === 'watch').length /
                        products.length) *
                        100
                    )}%)
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-stone overflow-hidden border border-border">
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
                  <span className="flex items-center gap-1.5 text-moss font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-moss" />
                    Healthy Stock (Sufficient)
                  </span>
                  <span className="font-bold text-moss">
                    {products.filter((p) => p.metrics.status === 'healthy').length} Items (
                    {Math.round(
                      (products.filter((p) => p.metrics.status === 'healthy').length /
                        products.length) *
                        100
                    )}%)
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-stone overflow-hidden border border-border">
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

          <div className="pt-6 mt-6 border-t border-border flex items-center justify-between text-xs text-slate-600 font-medium">
            <span>Store Status:</span>
            <span className="font-bold text-slate-900">Protected & Live Sync</span>
          </div>
        </div>

        {/* E. Demand Trend Chart */}
        <div className="lg:col-span-2 bg-surface/98 backdrop-blur-xl border border-border rounded-3xl p-6 lg:p-7 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <h3 className="font-bold text-xl text-slate-900">
                  Recent Sales & Expected Demand
                </h3>
              </div>
              <p className="text-slate-600 text-xs font-medium mt-0.5">
                Daily units sold compared with forecasted customer demand rate.
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
            <h3 className="font-bold text-xl text-slate-900">
              Recommended Store Actions
            </h3>
            <p className="text-slate-600 text-xs font-medium mt-0.5">
              Priority actions to keep best-sellers in stock and prevent supply delays.
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
            className="p-4 rounded-2xl bg-surface border border-border hover:border-slate-900 transition-all cursor-pointer group flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="text-[11px] uppercase tracking-wider text-brick font-bold mb-1">
                Urgent Order Needed
              </div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-accent transition-colors">
                Amul Milk 1L
              </h4>
              <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                Only 0.9 days of stock remaining. Supplier takes 2 days to deliver.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-accent pt-3 mt-3 border-t border-border/50">
              <span>View Reorder Details</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 2: Resolve Demand Anomaly */}
          <div
            onClick={() => onNavigateToTab('demand')}
            className="p-4 rounded-2xl bg-surface border border-border hover:border-slate-900 transition-all cursor-pointer group flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ochre font-bold mb-1">
                Sales Spike Review
              </div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-accent transition-colors">
                Cold Room Outage Check
              </h4>
              <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                Temporary drop on Jan 3 caused by cooler outage. Confirm so forecasts aren&apos;t lowered.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-ochre pt-3 mt-3 border-t border-border/50">
              <span>Review Sales Spike</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 3: Test Scenario in Lab */}
          <div
            onClick={() => {
              onSelectProduct(products[1]);
              onNavigateToTab('scenario');
            }}
            className="p-4 rounded-2xl bg-surface border border-border hover:border-slate-900 transition-all cursor-pointer group flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="text-[11px] uppercase tracking-wider text-accent font-bold mb-1">
                Festival Planner
              </div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-accent transition-colors">
                Atta 5kg Demand Surge
              </h4>
              <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                Test a 40% weekend surge combined with a 7-day transport delay from the mill.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-accent pt-3 mt-3 border-t border-border/50">
              <span>Open Scenario Planner</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 4: Audit Lead Time Settings */}
          <div
            onClick={() => {
              onSelectProduct(products[2]);
              onNavigateToTab('inventory');
            }}
            className="p-4 rounded-2xl bg-surface border border-border hover:border-slate-900 transition-all cursor-pointer group flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-bold mb-1">
                Supplier Delivery
              </div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-accent transition-colors">
                Fortune Sunflower Oil
              </h4>
              <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                Distributor takes ~4 days to arrive. Ensure safety buffer is sufficient.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-700 group-hover:text-slate-900 pt-3 mt-3 border-t border-border/50">
              <span>Inspect Supplier Times</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
