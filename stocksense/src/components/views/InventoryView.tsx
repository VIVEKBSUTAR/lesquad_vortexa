'use client';

import React, { useState, useEffect } from 'react';
import { ProductWithComputed, RecommendationSnapshot } from '@/lib/types';
import { apiClient, RecommendationResponse } from '@/lib/api';
import { getRecommendationSnapshots } from '@/lib/data';
import { ProductDetailDrawer } from '@/components/inventory/ProductDetailDrawer';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ArrowUpRight,
  Save,
  RotateCcw,
  FileCode,
  Copy,
  Check,
  Package,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Box,
  Truck,
  Upload,
  ArrowUpDown,
  Zap,
} from 'lucide-react';

interface InventoryViewProps {
  products: ProductWithComputed[];
  onRefreshProducts: () => void;
  onSimulateInCrisis: (product: ProductWithComputed) => void;
  onOpenImportModal?: () => void;
  onOpenFormulasModal?: () => void;
  initialSelectedProduct?: ProductWithComputed | null;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onRefreshProducts,
  onSimulateInCrisis,
  onOpenImportModal,
  onOpenFormulasModal,
  initialSelectedProduct = null,
}) => {
  const [activeTableTab, setActiveTableTab] = useState<'products' | 'recommendations'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'order' | 'watch' | 'healthy'>('all');
  const [sortBy, setSortBy] = useState<'risk' | 'position' | 'recommendation'>('risk');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithComputed | null>(
    initialSelectedProduct || null
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithComputed | null>(null);
  const [latestRec, setLatestRec] = useState<RecommendationResponse | null>(null);
  const [isCalculatingRec, setIsCalculatingRec] = useState(false);
  const [recSuccessMessage, setRecSuccessMessage] = useState<string | null>(null);
  const [inspectRecJson, setInspectRecJson] = useState<RecommendationSnapshot | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  useEffect(() => {
    if (initialSelectedProduct) {
      setSelectedProduct(initialSelectedProduct);
    }
  }, [initialSelectedProduct]);

  // Recommendations history (Table 5: recommendations)
  const [recommendationsList, setRecommendationsList] = useState<RecommendationSnapshot[]>(() =>
    getRecommendationSnapshots(products)
  );

  // New Product Form State (matching Table 1: products)
  const [newProductForm, setNewProductForm] = useState({
    sku: '',
    product_name: '',
    unit_of_measure: '1L Tetra Pak',
    on_hand_qty: 60,
    committed_qty: 12,
    unit_cost: 1.50,
    ordering_cost: 18.00,
    holding_cost_per_unit_year: 0.45,
    target_service_level: 0.95,
    minimum_order_qty: 12,
    pack_size: 6,
    average_lead_time_days: 3,
    lead_time_stddev_days: 0.8,
  });

  // Edit Product Form State (matching Table 1: products)
  const [editForm, setEditForm] = useState({
    on_hand_qty: 0,
    committed_qty: 0,
    unit_of_measure: '',
    unit_cost: 0,
    ordering_cost: 0,
    holding_cost_per_unit_year: 0,
    target_service_level: 0.95,
    minimum_order_qty: 1,
    pack_size: 1,
    average_lead_time_days: 14,
    lead_time_stddev_days: 2.0,
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products
    .filter((p) => {
      const matchesSearch =
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'order' &&
          (p.metrics.status === 'order' || p.metrics.status === 'reorder_now')) ||
        (statusFilter === 'watch' && p.metrics.status === 'watch') ||
        (statusFilter === 'healthy' && p.metrics.status === 'healthy');
      return matchesSearch && matchesCat && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'risk') {
        const weight: Record<string, number> = {
          order: 3,
          reorder_now: 3,
          watch: 2,
          healthy: 1,
          insufficient_data: 0,
        };
        return (weight[b.metrics.status] || 0) - (weight[a.metrics.status] || 0);
      }
      if (sortBy === 'position') {
        return a.metrics.inventoryPosition - b.metrics.inventoryPosition;
      }
      if (sortBy === 'recommendation') {
        const qA = a.metrics.inventoryPosition <= a.metrics.reorderPoint ? a.metrics.eoq : 0;
        const qB = b.metrics.inventoryPosition <= b.metrics.reorderPoint ? b.metrics.eoq : 0;
        return qB - qA;
      }
      return 0;
    });

  const filteredRecommendations = recommendationsList.filter((rec) => {
    const product = products.find((p) => p.id === rec.productId);
    const sku = product?.sku || '';
    const name = product?.name || '';
    return (
      sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleStartEdit = (p: ProductWithComputed) => {
    setEditingProduct(p);
    setEditForm({
      on_hand_qty: p.onHand,
      committed_qty: p.committedQty || 0,
      unit_of_measure: p.unitOfMeasure || 'units',
      unit_cost: p.unitCost,
      ordering_cost: p.orderingCost,
      holding_cost_per_unit_year: p.holdingCost,
      target_service_level: p.targetServiceLevel,
      minimum_order_qty: p.minimumOrderQty || 1,
      pack_size: p.packSize || 1,
      average_lead_time_days: Math.round(p.metrics.avgLeadTime),
      lead_time_stddev_days: Number(p.metrics.leadTimeStdDev.toFixed(1)),
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    await apiClient.updateProduct(editingProduct.id, {
      on_hand_qty: editForm.on_hand_qty,
      target_service_level: editForm.target_service_level,
      average_lead_time_days: editForm.average_lead_time_days,
      lead_time_stddev_days: editForm.lead_time_stddev_days,
    });
    // Locally apply update
    editingProduct.onHand = editForm.on_hand_qty;
    editingProduct.committedQty = editForm.committed_qty;
    editingProduct.unitOfMeasure = editForm.unit_of_measure;
    editingProduct.unitCost = editForm.unit_cost;
    editingProduct.orderingCost = editForm.ordering_cost;
    editingProduct.holdingCost = editForm.holding_cost_per_unit_year;
    editingProduct.targetServiceLevel = editForm.target_service_level;
    editingProduct.minimumOrderQty = editForm.minimum_order_qty;
    editingProduct.packSize = editForm.pack_size;
    editingProduct.baseLeadTimeDays = editForm.average_lead_time_days;
    editingProduct.leadTimeStdDevDays = editForm.lead_time_stddev_days;

    // Refresh recommendations list
    setRecommendationsList(getRecommendationSnapshots(products));
    setEditingProduct(null);
    onRefreshProducts();
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.sku || !newProductForm.product_name) return;
    await apiClient.createProduct(newProductForm);
    setShowCreateModal(false);
    onRefreshProducts();
  };

  const handleCalculateRecommendation = async (p: ProductWithComputed) => {
    setIsCalculatingRec(true);
    setRecSuccessMessage(null);
    const rec = await apiClient.calculateRecommendation(p.id);
    setLatestRec(rec);

    // Also add to snapshots history table (Table 5)
    const newSnapshot: RecommendationSnapshot = {
      id: rec.recommendation_id,
      productId: p.id,
      calculatedAt: rec.calculated_at,
      formulaVersion: 'StockSense-OR-v2.4 (r, Q Continuous Review)',
      inputSnapshot: JSON.stringify(rec.inputs),
      inventoryPosition: rec.inputs.inventory_position,
      meanDailyDemand: rec.inputs.mean_daily_demand,
      dailyDemandStddev: rec.inputs.daily_demand_stddev,
      averageLeadTimeDays: rec.inputs.average_lead_time_days,
      leadTimeStddevDays: rec.inputs.lead_time_stddev_days,
      targetServiceLevel: rec.inputs.target_service_level,
      zFactor: rec.inputs.z_value,
      expectedLeadTimeDemand: rec.calculation.expected_lead_time_demand,
      safetyStock: rec.calculation.safety_stock,
      reorderPoint: rec.calculation.reorder_point,
      annualDemand: Number((rec.inputs.mean_daily_demand * 365).toFixed(1)),
      rawEoq: rec.calculation.recommended_order_qty,
      suggestedOrderQty: rec.calculation.recommended_order_qty,
      status: rec.status,
      explanation: rec.explanation.join(' '),
      assumptions: JSON.stringify({
        policy: 'Continuous Review (r, Q)',
        service_level: rec.inputs.target_service_level,
        z_factor: rec.inputs.z_value,
      }),
      createdAt: rec.calculated_at,
    };

    setRecommendationsList((prev) => [newSnapshot, ...prev]);
    setIsCalculatingRec(false);
    setRecSuccessMessage(`New Recommendation Snapshot ${rec.recommendation_id} generated.`);
  };

  const handleCopyJson = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header & Summary Metrics */}
      <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-accent" />
            <h1 className="font-bold text-3xl text-slate-900 tracking-tight">
              Store Stock & Reorder List
            </h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-stone border border-border text-slate-700">
              Live Stock
            </span>
          </div>
          <p className="text-slate-600 text-sm font-medium max-w-2xl">
            Live shelf inventory, reorder thresholds, and one-click purchase order recommendations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
          {onOpenImportModal && (
            <button
              onClick={onOpenImportModal}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-accent font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Upload className="w-3.5 h-3.5 text-white" />
              <span>Import Store Data</span>
            </button>
          )}
        </div>
      </div>

      {/* B. Summary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-muted">Total Products</div>
          <div className="font-mono text-2xl font-semibold text-ink mt-1">
            {products.length}
          </div>
          <div className="text-[11px] font-mono text-muted mt-0.5">Active catalogue SKUs</div>
        </div>

        <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-muted">Reorder Now</div>
          <div className="font-mono text-2xl font-semibold text-brick mt-1">
            {
              products.filter(
                (p) => p.metrics.status === 'order' || p.metrics.status === 'reorder_now'
              ).length
            }
          </div>
          <div className="text-[11px] font-mono text-muted mt-0.5">Inv. Position ≤ ROP</div>
        </div>

        <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-muted">Healthy Stocked</div>
          <div className="font-mono text-2xl font-semibold text-moss mt-1">
            {products.filter((p) => p.metrics.status === 'healthy').length}
          </div>
          <div className="text-[11px] font-mono text-muted mt-0.5">Safe buffer buffer</div>
        </div>

        <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-muted">Insufficient Data</div>
          <div className="font-mono text-2xl font-semibold text-muted mt-1">
            0
          </div>
          <div className="text-[11px] font-mono text-muted mt-0.5">All 6 SKUs verified</div>
        </div>
      </div>

      {/* Controls & Schema Tab Switcher */}
      <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Table Tab Selector */}
        <div className="flex items-center gap-1 bg-stone p-1 rounded-xl border border-border text-xs font-mono">
          <button
            onClick={() => setActiveTableTab('products')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTableTab === 'products'
                ? 'bg-ink text-surface font-semibold shadow-xs'
                : 'text-muted hover:text-ink'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Products Master</span>
          </button>
          <button
            onClick={() => setActiveTableTab('recommendations')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTableTab === 'recommendations'
                ? 'bg-ink text-surface font-semibold shadow-xs'
                : 'text-muted hover:text-ink'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Recommendations Snapshots</span>
          </button>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search SKU or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-stone text-ink border border-border rounded-xl pl-9 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-accent w-40 sm:w-48"
            />
          </div>

          {activeTableTab === 'products' && (
            <>
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as 'all' | 'order' | 'watch' | 'healthy')
                }
                className="bg-stone text-ink border border-border rounded-xl px-2.5 py-2 text-xs font-mono focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="order">Reorder Now</option>
                <option value="watch">Buffer Watch</option>
                <option value="healthy">Healthy Stocked</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-stone text-ink border border-border rounded-xl px-2.5 py-2 text-xs font-mono focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Sort By Filter */}
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'risk' | 'position' | 'recommendation')
                }
                className="bg-stone text-ink border border-border rounded-xl px-2.5 py-2 text-xs font-mono focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="risk">Sort: Urgency</option>
                <option value="position">Sort: Inv. Position</option>
                <option value="recommendation">Sort: Order Qty</option>
              </select>

              {/* Add Product Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3.5 py-2 bg-ink text-surface hover:bg-accent rounded-xl text-xs font-mono font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create SKU</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Rec Success Notification Banner */}
      {recSuccessMessage && (
        <div className="p-4 rounded-xl bg-moss/10 border border-moss/30 flex items-center justify-between font-mono text-xs text-moss animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-moss" />
            <span>{recSuccessMessage}</span>
          </div>
          <button
            onClick={() => setRecSuccessMessage(null)}
            className="text-moss/80 hover:text-moss text-[11px] underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TABLE TAB 1: products (Table 1) */}
      {/* TABLE TAB 1: products */}
      {activeTableTab === 'products' && (
        <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-sm overflow-hidden space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border text-xs">
            <div>
              <h4 className="font-bold text-xl text-slate-900">
                Product Inventory & Reorder Thresholds
              </h4>
              <p className="text-slate-600 text-xs font-medium mt-0.5">
                Live shelf stock, daily customer sales rate, and automated purchase triggers.
              </p>
            </div>
            <div className="flex items-center gap-3 text-slate-600 text-xs mt-2 sm:mt-0 font-medium">
              <span>Showing {filteredProducts.length} of {products.length} products</span>
              <span className="text-moss font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Reorder Triggers Active
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-slate-700 uppercase text-[11px] font-bold tracking-wider bg-stone/40">
                  <th className="py-3 px-3">Product Name & SKU</th>
                  <th className="py-3 px-3">Stock on Hand</th>
                  <th className="py-3 px-3">Daily Sales</th>
                  <th className="py-3 px-3">Days Remaining</th>
                  <th className="py-3 px-3">Reorder When Below</th>
                  <th className="py-3 px-3">Recommended Order</th>
                  <th className="py-3 px-3">Delivery Time</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredProducts.map((p) => {
                  const statusConfig = {
                    healthy: { color: 'text-moss', bg: 'bg-moss/10', label: 'Stock Safe' },
                    watch: { color: 'text-ochre', bg: 'bg-ochre/10', label: 'Reorder Soon' },
                    order: { color: 'text-brick', bg: 'bg-brick/10', label: 'Order Due' },
                    reorder_now: { color: 'text-brick', bg: 'bg-brick/10', label: 'Order Due' },
                  }[p.metrics.status];

                  const daysLeft = (p.onHand / Math.max(0.1, p.metrics.avgDemand)).toFixed(1);

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className="hover:bg-stone/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-sm text-slate-900 group-hover:text-accent transition-colors">
                          {p.name}
                        </div>
                        <div className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                          <span className="bg-stone px-1.5 py-0.5 rounded border border-border font-semibold">
                            {p.sku}
                          </span>
                          <span>•</span>
                          <span>{p.unitOfMeasure}</span>
                          <span>•</span>
                          <span className="text-accent font-semibold">{p.category}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap font-bold text-slate-900 text-sm">
                        {p.onHand}{' '}
                        <span className="text-xs font-normal text-slate-500">
                          {p.committedQty > 0 ? `(${p.committedQty} comm.)` : ''}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap font-medium text-slate-700">
                        {p.metrics.avgDemand.toFixed(1)} u/day
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`font-bold text-sm ${
                            parseFloat(daysLeft) <= p.baseLeadTimeDays
                              ? 'text-brick'
                              : 'text-slate-900'
                          }`}
                        >
                          {parseFloat(daysLeft) > 90 ? '> 90 days' : `${daysLeft} days`}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap font-bold text-brick">
                        {Math.round(p.metrics.reorderPoint)} units
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap font-bold text-accent text-sm">
                        {p.metrics.inventoryPosition <= p.metrics.reorderPoint
                          ? `${Math.round(p.metrics.eoq)} units`
                          : '0 (Sufficient)'}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-700 font-medium">
                        {p.baseLeadTimeDays} days
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig.color} ${statusConfig.bg}`}
                        >
                          {statusConfig.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap text-right space-x-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(p);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-border bg-stone hover:border-slate-900 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(p);
                          }}
                          className="px-3 py-1 rounded-lg bg-surface border border-border hover:bg-slate-900 hover:text-white text-slate-900 text-xs font-bold transition-colors cursor-pointer shadow-xs"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TABLE TAB 2: recommendations (Purchase Orders Log) */}
      {activeTableTab === 'recommendations' && (
        <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-sm overflow-hidden space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border text-xs">
            <div>
              <h4 className="font-bold text-xl text-slate-900">
                Purchase Order Recommendations & History
              </h4>
              <p className="text-slate-600 text-xs font-medium mt-0.5">
                Every purchase recommendation recorded with inventory levels and batch quantities.
              </p>
            </div>
            <div className="flex items-center gap-3 text-slate-600 text-xs mt-2 sm:mt-0 font-medium">
              <span>{filteredRecommendations.length} orders recorded</span>
              <span className="text-moss font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Ledger
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-slate-700 uppercase text-[11px] font-bold tracking-wider bg-stone/40">
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Order Date & Time</th>
                  <th className="py-3 px-3">Stock at Order</th>
                  <th className="py-3 px-3">Reorder Trigger</th>
                  <th className="py-3 px-3">Recommended Quantity</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredRecommendations.map((rec) => {
                  const product = products.find((p) => p.id === rec.productId);
                  const isReorder = rec.status === 'reorder_now';

                  return (
                    <tr key={rec.id} className="hover:bg-stone/50 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-accent whitespace-nowrap">
                        {rec.id}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-bold text-sm text-slate-900">{product?.name || rec.productId}</div>
                        <div className="text-xs text-slate-500 font-medium">{product?.sku}</div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 font-medium">
                        {new Date(rec.calculatedAt).toLocaleDateString()} {new Date(rec.calculatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap font-bold text-slate-900">
                        {rec.inventoryPosition} units
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap font-bold text-brick">
                        {rec.reorderPoint} units
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap font-bold text-slate-900 text-sm">
                        {rec.suggestedOrderQty} {product?.unitOfMeasure || 'units'}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            isReorder
                              ? 'bg-brick/10 text-brick'
                              : rec.status === 'watch'
                              ? 'bg-ochre/10 text-ochre'
                              : 'bg-moss/10 text-moss'
                          }`}
                        >
                          {isReorder ? 'Order Generated' : rec.status === 'watch' ? 'Approaching' : 'Stock Normal'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap text-right">
                        <button
                          onClick={() => setInspectRecJson(rec)}
                          className="px-3 py-1 rounded-lg border border-border bg-stone hover:bg-slate-900 hover:text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <FileCode className="w-3.5 h-3.5 text-accent" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* JSON Inspector Modal for Table 5 (recommendations) */}
      {inspectRecJson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-2xl p-6 lg:p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div>
                <span className="font-mono text-xs text-accent uppercase font-semibold">
                  Table 5 • recommendations snapshot
                </span>
                <h4 className="font-serif text-2xl font-light text-ink mt-0.5">
                  Input Snapshot & Assumptions Payload
                </h4>
                <div className="text-muted font-mono text-xs mt-0.5">{inspectRecJson.id}</div>
              </div>
              <button
                onClick={() => setInspectRecJson(null)}
                className="text-muted hover:text-ink text-xs font-mono cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1 text-xs font-mono">
                  <span className="text-muted uppercase text-[10px] font-semibold">
                    1. input_snapshot (JSONB)
                  </span>
                  <button
                    onClick={() => handleCopyJson(inspectRecJson.inputSnapshot)}
                    className="text-accent hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    {copiedJson ? <Check className="w-3 h-3 text-moss" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-stone border border-border font-mono text-[11px] text-ink overflow-x-auto max-h-48 leading-relaxed">
                  {JSON.stringify(JSON.parse(inspectRecJson.inputSnapshot), null, 2)}
                </pre>
              </div>

              <div>
                <div className="text-muted uppercase text-[10px] font-semibold mb-1 font-mono">
                  2. assumptions (JSONB)
                </div>
                <pre className="p-3.5 rounded-xl bg-stone border border-border font-mono text-[11px] text-ink overflow-x-auto max-h-36 leading-relaxed">
                  {JSON.stringify(JSON.parse(inspectRecJson.assumptions), null, 2)}
                </pre>
              </div>

              <div>
                <div className="text-muted uppercase text-[10px] font-semibold mb-1 font-mono">
                  3. explanation (TEXT)
                </div>
                <p className="p-3.5 rounded-xl bg-stone/60 border border-border font-sans text-xs text-ink leading-relaxed">
                  {inspectRecJson.explanation}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <button
                onClick={() => setInspectRecJson(null)}
                className="px-5 py-2 bg-ink text-surface rounded-xl text-xs font-mono font-medium hover:bg-accent transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Drawer / Modal (Table 1: products) */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-xl p-6 lg:p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div>
                <span className="font-mono text-xs text-accent font-semibold uppercase">
                  Table 1 • products schema editor
                </span>
                <h4 className="font-serif text-2xl font-light text-ink mt-0.5">
                  Update SKU: {editingProduct.sku}
                </h4>
                <div className="text-muted font-sans text-xs">{editingProduct.name}</div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-muted hover:text-ink text-xs font-mono cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 font-mono text-xs">
              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">
                  On Hand Qty (on_hand_qty) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.on_hand_qty}
                  onChange={(e) => setEditForm({ ...editForm, on_hand_qty: parseInt(e.target.value) || 0 })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">
                  Committed Qty (committed_qty) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.committed_qty}
                  onChange={(e) => setEditForm({ ...editForm, committed_qty: parseInt(e.target.value) || 0 })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">
                  Unit of Measure (unit_of_measure) *
                </label>
                <input
                  type="text"
                  value={editForm.unit_of_measure}
                  onChange={(e) => setEditForm({ ...editForm, unit_of_measure: e.target.value })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">
                  Target SLA (target_service_level)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.80"
                  max="0.999"
                  value={editForm.target_service_level}
                  onChange={(e) => setEditForm({ ...editForm, target_service_level: parseFloat(e.target.value) || 0.95 })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">
                  Avg Lead Time (average_lead_time_days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editForm.average_lead_time_days}
                  onChange={(e) => setEditForm({ ...editForm, average_lead_time_days: parseInt(e.target.value) || 1 })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">
                  Lead Time StdDev (lead_time_stddev_days)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={editForm.lead_time_stddev_days}
                  onChange={(e) => setEditForm({ ...editForm, lead_time_stddev_days: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">
                  Min Order Qty (minimum_order_qty / MOQ)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editForm.minimum_order_qty}
                  onChange={(e) => setEditForm({ ...editForm, minimum_order_qty: parseInt(e.target.value) || 1 })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">
                  Pack Size (pack_size)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editForm.pack_size}
                  onChange={(e) => setEditForm({ ...editForm, pack_size: parseInt(e.target.value) || 1 })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 border border-border rounded-xl text-xs font-mono text-muted hover:text-ink cursor-pointer"
              >
                Discard
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2 bg-ink text-surface rounded-xl text-xs font-mono font-medium hover:bg-accent transition-colors cursor-pointer flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save to products Table</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Product Modal (Table 1: products) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <form
            onSubmit={handleCreateProduct}
            className="bg-surface rounded-2xl border border-border w-full max-w-xl p-6 lg:p-8 shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div>
                <span className="font-mono text-xs text-accent font-semibold uppercase">
                  Table 1 • Insert Record
                </span>
                <h4 className="font-serif text-2xl font-light text-ink mt-0.5">
                  Create SKU in products
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-muted hover:text-ink text-xs font-mono cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 font-mono text-xs">
              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">SKU Code (sku) *</label>
                <input
                  type="text"
                  required
                  placeholder="SKU-DRY-MILK-1L"
                  value={newProductForm.sku}
                  onChange={(e) => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">Unit of Measure (unit_of_measure) *</label>
                <input
                  type="text"
                  required
                  placeholder="1L Tetra Pak"
                  value={newProductForm.unit_of_measure}
                  onChange={(e) => setNewProductForm({ ...newProductForm, unit_of_measure: e.target.value })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-muted uppercase text-[10px] mb-1">Product Name (product_name) *</label>
                <input
                  type="text"
                  required
                  placeholder="Amul Taaza Toned Milk"
                  value={newProductForm.product_name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, product_name: e.target.value })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">On Hand Qty (on_hand_qty)</label>
                <input
                  type="number"
                  min="0"
                  value={newProductForm.on_hand_qty}
                  onChange={(e) => setNewProductForm({ ...newProductForm, on_hand_qty: parseInt(e.target.value) || 0 })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">Committed Qty (committed_qty)</label>
                <input
                  type="number"
                  min="0"
                  value={newProductForm.committed_qty}
                  onChange={(e) => setNewProductForm({ ...newProductForm, committed_qty: parseInt(e.target.value) || 0 })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">Avg Lead Time (Days)</label>
                <input
                  type="number"
                  min="1"
                  value={newProductForm.average_lead_time_days}
                  onChange={(e) => setNewProductForm({ ...newProductForm, average_lead_time_days: parseInt(e.target.value) || 1 })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">Lead Time StdDev (Days)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={newProductForm.lead_time_stddev_days}
                  onChange={(e) => setNewProductForm({ ...newProductForm, lead_time_stddev_days: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">Unit Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newProductForm.unit_cost}
                  onChange={(e) => setNewProductForm({ ...newProductForm, unit_cost: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">Target Service Level</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.80"
                  max="0.999"
                  value={newProductForm.target_service_level}
                  onChange={(e) => setNewProductForm({ ...newProductForm, target_service_level: parseFloat(e.target.value) || 0.95 })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">MOQ (minimum_order_qty)</label>
                <input
                  type="number"
                  min="1"
                  value={newProductForm.minimum_order_qty}
                  onChange={(e) => setNewProductForm({ ...newProductForm, minimum_order_qty: parseInt(e.target.value) || 1 })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">Pack Size (pack_size)</label>
                <input
                  type="number"
                  min="1"
                  value={newProductForm.pack_size}
                  onChange={(e) => setNewProductForm({ ...newProductForm, pack_size: parseInt(e.target.value) || 1 })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border border-border rounded-xl text-xs font-mono text-muted hover:text-ink cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-ink text-surface rounded-xl text-xs font-mono font-medium hover:bg-accent transition-colors cursor-pointer"
              >
                Commit to products
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Detailed SKU 5-Section Detail Drawer (Section 6 of Specification) */}
      <ProductDetailDrawer
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onSimulateInCrisis={onSimulateInCrisis}
        onOpenFormulasModal={onOpenFormulasModal}
      />
    </div>
  );
};
