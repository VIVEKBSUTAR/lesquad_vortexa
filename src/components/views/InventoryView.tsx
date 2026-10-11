'use client';

import React, { useState } from 'react';
import { ProductWithComputed } from '@/lib/types';
import { apiClient, RecommendationResponse } from '@/lib/api';
import { ProductDetailModal } from '@/components/dashboard/ProductDetailModal';
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
} from 'lucide-react';

interface InventoryViewProps {
  products: ProductWithComputed[];
  onRefreshProducts: () => void;
  onSimulateInCrisis: (product: ProductWithComputed) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onRefreshProducts,
  onSimulateInCrisis,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithComputed | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithComputed | null>(null);
  const [latestRec, setLatestRec] = useState<RecommendationResponse | null>(null);
  const [isCalculatingRec, setIsCalculatingRec] = useState(false);
  const [recSuccessMessage, setRecSuccessMessage] = useState<string | null>(null);

  // New Product Form State
  const [newProductForm, setNewProductForm] = useState({
    sku: '',
    product_name: '',
    unit_of_measure: 'units',
    on_hand_qty: 50,
    average_lead_time_days: 14,
    unit_cost: 150,
    ordering_cost: 80,
    holding_cost_per_unit_year: 25,
    target_service_level: 0.95,
  });

  // Edit Product Form State
  const [editForm, setEditForm] = useState({
    on_hand_qty: 0,
    target_service_level: 0.95,
    average_lead_time_days: 14,
    lead_time_stddev_days: 2.0,
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleStartEdit = (p: ProductWithComputed) => {
    setEditingProduct(p);
    setEditForm({
      on_hand_qty: p.onHand,
      target_service_level: p.targetServiceLevel,
      average_lead_time_days: Math.round(p.metrics.avgLeadTime),
      lead_time_stddev_days: Number(p.metrics.leadTimeStdDev.toFixed(1)),
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    await apiClient.updateProduct(editingProduct.id, editForm);
    // Locally apply update
    editingProduct.onHand = editForm.on_hand_qty;
    editingProduct.targetServiceLevel = editForm.target_service_level;
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
    setIsCalculatingRec(false);
    setRecSuccessMessage(`Recommendation snapshot ${rec.recommendation_id} calculated.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Action Bar */}
      <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl font-light text-ink">
            Master Inventory & Replenishment Rules
          </h3>
          <p className="text-muted text-xs font-sans mt-0.5">
            Maintain SKU profiles, adjust on-hand inventory, and audit deterministic order thresholds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search SKU or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-stone text-ink border border-border rounded-xl pl-9 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-accent w-48 sm:w-64"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-stone text-ink border border-border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Add Product Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-ink text-surface hover:bg-accent rounded-xl text-xs font-mono font-medium transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Product</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-border text-muted uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Product Name & Category</th>
                <th className="py-3 px-3">On Hand</th>
                <th className="py-3 px-3">On Order</th>
                <th className="py-3 px-3">Position</th>
                <th className="py-3 px-3">Reorder Point</th>
                <th className="py-3 px-3">Safety Stock</th>
                <th className="py-3 px-3">SLA</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredProducts.map((p) => {
                const statusConfig = {
                  healthy: { color: 'text-moss', bg: 'bg-moss/10', label: 'Healthy' },
                  watch: { color: 'text-ochre', bg: 'bg-ochre/10', label: 'Watch' },
                  order: { color: 'text-brick', bg: 'bg-brick/10', label: 'Order Now' },
                }[p.metrics.status];

                return (
                  <tr key={p.id} className="hover:bg-stone/50 transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-ink whitespace-nowrap">
                      {p.sku}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="font-sans font-medium text-ink">{p.name}</div>
                      <div className="text-[10px] text-muted font-sans">{p.category}</div>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap font-medium text-ink">
                      {p.onHand} units
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap text-slate">
                      +{p.onOrder}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap font-semibold text-accent">
                      {p.metrics.inventoryPosition}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap font-semibold text-brick">
                      {Math.round(p.metrics.reorderPoint)}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap text-moss font-semibold">
                      {Math.round(p.metrics.safetyStock)}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap text-muted">
                      {(p.targetServiceLevel * 100).toFixed(0)}%
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${statusConfig.color} ${statusConfig.bg}`}>
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => handleStartEdit(p)}
                        className="px-2.5 py-1 rounded-lg border border-border bg-stone hover:border-ink text-muted hover:text-ink text-[11px] transition-colors cursor-pointer"
                        title="Update Stock & SLA"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleCalculateRecommendation(p)}
                        className="px-2.5 py-1 rounded-lg border border-border bg-stone hover:bg-ink hover:text-surface text-[11px] transition-colors cursor-pointer"
                        title="Calculate Replenishment Snapshot"
                      >
                        Calculate
                      </button>
                      <button
                        onClick={() => setSelectedProduct(p)}
                        className="px-2.5 py-1 rounded-lg bg-surface border border-border hover:border-accent text-accent text-[11px] transition-colors cursor-pointer"
                      >
                        Audit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Latest Recommendation Snapshot Panel (Section 7 of contract) */}
      {latestRec && (
        <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-border">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold">
                Recommendation Snapshot • {latestRec.recommendation_id}
              </div>
              <h4 className="font-serif text-xl font-normal text-ink mt-0.5">
                Deterministic Order Recommendation
              </h4>
            </div>
            <span className="text-xs font-mono text-muted">
              Calculated at: {new Date(latestRec.calculated_at).toLocaleTimeString()}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-stone/70 border border-border">
              <div className="text-[10px] uppercase text-muted">Recommendation</div>
              <div className={`text-base font-semibold mt-1 ${latestRec.status === 'reorder_now' ? 'text-brick' : 'text-moss'}`}>
                {latestRec.status.replace('_', ' ').toUpperCase()}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-stone/70 border border-border">
              <div className="text-[10px] uppercase text-muted">Recommended Order Qty</div>
              <div className="text-base font-semibold text-ink mt-1">
                {latestRec.calculation.recommended_order_qty} units
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-stone/70 border border-border">
              <div className="text-[10px] uppercase text-muted">Reorder Point</div>
              <div className="text-base font-semibold text-brick mt-1">
                {latestRec.calculation.reorder_point} ROP
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-stone/70 border border-border">
              <div className="text-[10px] uppercase text-muted">Safety Stock</div>
              <div className="text-base font-semibold text-moss mt-1">
                {latestRec.calculation.safety_stock} SS
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-stone/50 border border-border space-y-1 text-xs font-sans text-muted">
            <div className="font-mono text-[10px] uppercase text-ink font-semibold mb-1">
              Deterministic OR Justification:
            </div>
            {latestRec.explanation.map((exp, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span>{exp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Product Drawer / Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-lg p-6 lg:p-8 shadow-2xl space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <div>
                <span className="font-mono text-xs text-muted">{editingProduct.sku}</span>
                <h4 className="font-serif text-2xl font-light text-ink">
                  Edit Stock & Lead Time
                </h4>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-muted hover:text-ink text-xs font-mono cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">On Hand Quantity</label>
                <input
                  type="number"
                  value={editForm.on_hand_qty}
                  onChange={(e) => setEditForm({ ...editForm, on_hand_qty: parseInt(e.target.value) || 0 })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">Target Service Level (0.80 - 0.999)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.target_service_level}
                  onChange={(e) => setEditForm({ ...editForm, target_service_level: parseFloat(e.target.value) || 0.95 })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">Average Lead Time (Days)</label>
                <input
                  type="number"
                  value={editForm.average_lead_time_days}
                  onChange={(e) => setEditForm({ ...editForm, average_lead_time_days: parseInt(e.target.value) || 1 })}
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
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
          <form
            onSubmit={handleCreateProduct}
            className="bg-surface rounded-2xl border border-border w-full max-w-xl p-6 lg:p-8 shadow-2xl space-y-6"
          >
            <div className="flex justify-between items-center pb-4 border-b border-border">
              <h4 className="font-serif text-2xl font-light text-ink">
                Create New SKU
              </h4>
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
                <label className="block text-muted uppercase text-[10px] mb-1">SKU Code *</label>
                <input
                  type="text"
                  required
                  placeholder="SKU-9901-EXM"
                  value={newProductForm.sku}
                  onChange={(e) => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">Unit of Measure</label>
                <input
                  type="text"
                  value={newProductForm.unit_of_measure}
                  onChange={(e) => setNewProductForm({ ...newProductForm, unit_of_measure: e.target.value })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-muted uppercase text-[10px] mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="High-Torque Servo Motor 400W"
                  value={newProductForm.product_name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, product_name: e.target.value })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">Initial On Hand Qty</label>
                <input
                  type="number"
                  value={newProductForm.on_hand_qty}
                  onChange={(e) => setNewProductForm({ ...newProductForm, on_hand_qty: parseInt(e.target.value) || 0 })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">Avg Lead Time (Days)</label>
                <input
                  type="number"
                  value={newProductForm.average_lead_time_days}
                  onChange={(e) => setNewProductForm({ ...newProductForm, average_lead_time_days: parseInt(e.target.value) || 1 })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">Unit Cost ($)</label>
                <input
                  type="number"
                  value={newProductForm.unit_cost}
                  onChange={(e) => setNewProductForm({ ...newProductForm, unit_cost: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-stone border border-border rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-muted uppercase text-[10px] mb-1">Target SLA (e.g. 0.95)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newProductForm.target_service_level}
                  onChange={(e) => setNewProductForm({ ...newProductForm, target_service_level: parseFloat(e.target.value) || 0.95 })}
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
                Commit Product
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Detailed SKU Audit Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onSimulateInCrisis={onSimulateInCrisis}
      />
    </div>
  );
};
