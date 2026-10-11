'use client';

import React, { useState, useEffect } from 'react';
import { DemandRecord, ProductWithComputed } from '@/lib/types';
import {
  apiClient,
  DemandItem,
  ImportPreviewResponse,
  ImportConfirmResponse,
} from '@/lib/api';
import { getDemandRecords } from '@/lib/data';
import { AnomalyAuditLog } from '@/components/dashboard/AnomalyAuditLog';
import { HoldoutProver } from '@/components/dashboard/HoldoutProver';
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Filter,
  BarChart3,
  Activity,
  Award,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Search,
  Calendar,
  AlertOctagon,
  Sparkles,
  Database,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

interface DemandInsightsViewProps {
  products: ProductWithComputed[];
}

export const DemandInsightsView: React.FC<DemandInsightsViewProps> = ({ products }) => {
  const [activeSubTab, setActiveSubTab] = useState<'demand' | 'import' | 'anomalies' | 'forecast'>('demand');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithComputed>(products[0]);
  const [demandHistory, setDemandHistory] = useState<DemandItem[]>([]);
  const [isLoadingDemand, setIsLoadingDemand] = useState(false);

  // Table 2: demand_records state
  const [allDemandRecords, setAllDemandRecords] = useState<DemandRecord[]>(() =>
    getDemandRecords(products)
  );
  const [demandSkuFilter, setDemandSkuFilter] = useState<string>(products[0].id);
  const [demandFlagFilter, setDemandFlagFilter] = useState<'all' | 'stockout' | 'promo' | 'clean'>('all');
  const [demandSearchTerm, setDemandSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // CSV Import Wizard State (Section 4 of contract)
  const [importDatasetType, setImportDatasetType] = useState<'products' | 'daily_demand' | 'supplier_settings'>('daily_demand');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreviewResponse | null>(null);
  const [importConfirmResult, setImportConfirmResult] = useState<ImportConfirmResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Load daily demand chart data when product changes
  useEffect(() => {
    setIsDemandLoaded(selectedProduct.id);
  }, [selectedProduct]);

  const setIsDemandLoaded = async (productId: string) => {
    setIsLoadingDemand(true);
    const data = await apiClient.getProductDemand(productId);
    setDemandHistory(data);
    setIsLoadingDemand(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
      setImportPreview(null);
      setImportConfirmResult(null);
    }
  };

  const handleUploadPreview = async () => {
    if (!importFile) return;
    setIsUploading(true);
    const preview = await apiClient.previewImport(importFile, importDatasetType);
    setImportPreview(preview);
    setIsUploading(false);
  };

  const handleConfirmImport = async () => {
    if (!importPreview) return;
    setIsConfirming(true);
    const res = await apiClient.confirmImport(importPreview.import_id);
    setImportConfirmResult(res);
    setIsConfirming(false);
  };

  // Filter demand records for Table 2
  const filteredDemandRecords = allDemandRecords.filter((record) => {
    const matchesSku = demandSkuFilter === 'all' || record.productId === demandSkuFilter;
    const matchesFlag =
      demandFlagFilter === 'all' ||
      (demandFlagFilter === 'stockout' && record.stockoutFlag) ||
      (demandFlagFilter === 'promo' && record.promotionFlag) ||
      (demandFlagFilter === 'clean' && !record.stockoutFlag && !record.promotionFlag);
    const matchesSearch =
      record.date.includes(demandSearchTerm) ||
      record.id.toLowerCase().includes(demandSearchTerm.toLowerCase()) ||
      (record.notes && record.notes.toLowerCase().includes(demandSearchTerm.toLowerCase()));
    return matchesSku && matchesFlag && matchesSearch;
  });

  const totalPages = Math.ceil(filteredDemandRecords.length / pageSize) || 1;
  const paginatedDemandRecords = filteredDemandRecords.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Bar with Sub-Navigation */}
      <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone border border-border text-accent font-semibold uppercase tracking-wider">
              StockSense Database Schema Integration
            </span>
          </div>
          <h3 className="font-serif text-2xl font-light text-ink">
            Demand Insights & Statistical Verification
          </h3>
          <p className="text-muted text-xs font-sans mt-0.5">
            Audit daily observations in <span className="font-mono text-ink">demand_records</span> (Table 2), review AI classifications in <span className="font-mono text-ink">anomaly_reviews</span> (Table 3), and verify holdout accuracy in <span className="font-mono text-ink">forecast_runs</span> (Table 4).
          </p>
        </div>

        <div className="flex items-center gap-1 bg-stone p-1 rounded-xl border border-border text-xs font-mono">
          {[
            { id: 'demand', label: 'Daily History & Records' },
            { id: 'import', label: 'CSV Import Wizard' },
            { id: 'anomalies', label: 'Anomaly Audit Log' },
            { id: 'forecast', label: 'Holdout Prover' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeSubTab === t.id
                  ? 'bg-ink text-surface font-semibold shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-PANEL 1: DAILY DEMAND HISTORY & demand_records Table (Table 2) */}
      {activeSubTab === 'demand' && (
        <div className="space-y-6">
          {/* Chart Card */}
          <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-6 lg:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">
                  Historical Observation Trajectory (60-Day Lookback)
                </div>
                <h4 className="font-serif text-xl font-normal text-ink mt-0.5">
                  {selectedProduct.sku} — {selectedProduct.name}
                </h4>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-mono text-muted uppercase font-semibold">Select SKU:</label>
                <select
                  value={selectedProduct.id}
                  onChange={(e) => {
                    const p = products.find((prod) => prod.id === e.target.value);
                    if (p) {
                      setSelectedProduct(p);
                      setDemandSkuFilter(p.id);
                    }
                  }}
                  className="bg-stone text-ink border border-border rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-accent cursor-pointer"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demandHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DAD6CE" opacity={0.6} />
                  <XAxis dataKey="date" stroke="#6D6A64" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} interval={6} />
                  <YAxis stroke="#6D6A64" tick={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FAF9F7',
                      borderColor: '#DAD6CE',
                      borderRadius: '8px',
                      fontFamily: 'JetBrains Mono',
                      fontSize: '11px',
                    }}
                  />
                  <ReferenceLine y={selectedProduct.baseDailyDemand} stroke="#0F5C5C" strokeDasharray="4 4" label={{ value: 'Nominal Baseline', fill: '#0F5C5C', fontSize: 10 }} />
                  <Bar dataKey="units_sold" name="Daily Units Sold" fill="#1C1B19" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="pt-4 border-t border-border flex flex-wrap justify-between items-center text-xs font-mono text-muted">
              <span>Mean Demand (d̄): {selectedProduct.metrics.avgDemand.toFixed(1)} {selectedProduct.unitOfMeasure}/day</span>
              <span>Demand StdDev (σd): {selectedProduct.metrics.demandStdDev.toFixed(1)}</span>
              <span className="text-moss">Cleaned baseline shielded from spike contamination</span>
            </div>
          </div>

          {/* TABLE 2: demand_records Relational Table */}
          <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-sm overflow-hidden space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border text-xs font-mono gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                  Core Relational Table • demand_records (Table 2)
                </span>
                <h4 className="font-serif text-xl font-normal text-ink mt-0.5">
                  Daily Demand Observation Ledger
                </h4>
                <p className="text-muted text-xs font-sans mt-0.5">
                  Stores daily demand observations with stockout flags (censored demand) and promotional markers.
                </p>
              </div>

              {/* Filters for Table 2 */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Flag Filter Pills */}
                <div className="flex items-center gap-1 bg-stone p-1 rounded-xl border border-border text-xs font-mono">
                  {[
                    { id: 'all', label: 'All Records' },
                    { id: 'stockout', label: 'Stockouts Only' },
                    { id: 'promo', label: 'Promos Only' },
                    { id: 'clean', label: 'Clean Only' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setDemandFlagFilter(f.id as any);
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        demandFlagFilter === f.id
                          ? 'bg-ink text-surface font-semibold shadow-xs'
                          : 'text-muted hover:text-ink'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* SKU filter */}
                <select
                  value={demandSkuFilter}
                  onChange={(e) => {
                    setDemandSkuFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-stone text-ink border border-border rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-accent cursor-pointer"
                >
                  <option value="all">All SKUs</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku}
                    </option>
                  ))}
                </select>

                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search date or notes..."
                    value={demandSearchTerm}
                    onChange={(e) => {
                      setDemandSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-stone text-ink border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono focus:outline-none focus:border-accent w-40 sm:w-48"
                  />
                </div>
              </div>
            </div>

            {/* Table data */}
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-border text-muted uppercase text-[10px] tracking-wider bg-stone/30">
                    <th className="py-3 px-3">Record ID</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">SKU & Item</th>
                    <th className="py-3 px-3">Units Sold</th>
                    <th className="py-3 px-3">Stockout Flag (Censored)</th>
                    <th className="py-3 px-3">Promotion Flag</th>
                    <th className="py-3 px-3">Source Import ID</th>
                    <th className="py-3 px-3">Contextual Observation Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paginatedDemandRecords.map((r) => {
                    const product = products.find((p) => p.id === r.productId);

                    return (
                      <tr key={r.id} className="hover:bg-stone/50 transition-colors">
                        <td className="py-3 px-3 text-accent whitespace-nowrap font-medium">
                          {r.id}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-ink">
                          {r.date}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-semibold text-ink">{product?.sku}</span>
                          <span className="text-[10px] text-muted block font-sans">{product?.name}</span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-semibold text-ink">
                          {r.unitsSold.toFixed(1)} {product?.unitOfMeasure}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {r.stockoutFlag ? (
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-brick/10 text-brick border border-brick/30 inline-flex items-center gap-1">
                              <AlertOctagon className="w-3 h-3" />
                              <span>Censored Demand</span>
                            </span>
                          ) : (
                            <span className="text-muted text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {r.promotionFlag ? (
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-anomaly/10 text-anomaly border border-anomaly/30 inline-flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              <span>Promo Surge</span>
                            </span>
                          ) : (
                            <span className="text-muted text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-muted text-[11px]">
                          {r.sourceImportId}
                        </td>
                        <td className="py-3 px-3 font-sans text-xs text-muted max-w-sm">
                          {r.notes || 'Normal daily observation'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-muted">
              <div>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, filteredDemandRecords.length)} of{' '}
                {filteredDemandRecords.length} demand observations
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-border bg-stone text-ink disabled:opacity-30 cursor-pointer flex items-center gap-1 hover:border-ink transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <span className="px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-border bg-stone text-ink disabled:opacity-30 cursor-pointer flex items-center gap-1 hover:border-ink transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-PANEL 2: STAGED CSV IMPORT WIZARD (Section 4 of contract) */}
      {activeSubTab === 'import' && (
        <div className="bg-surface/98 backdrop-blur-xl border border-border rounded-2xl p-6 lg:p-8 shadow-sm space-y-6">
          <div className="pb-4 border-b border-border">
            <div className="text-[10px] font-mono uppercase tracking-wider text-accent font-semibold">
              Staged Transactional Ingestion
            </div>
            <h4 className="font-serif text-2xl font-light text-ink mt-0.5">
              CSV Import Wizard (Preview & Confirm)
            </h4>
            <p className="text-muted text-xs font-sans mt-1">
              Uploads are validated without committing to <span className="font-mono text-ink">demand_records</span>. Review warnings, errors, and preview rows before confirming.
            </p>
          </div>

          {/* Step 1: Select Type & Upload */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-mono uppercase text-muted mb-2 font-semibold">
                1. Select Dataset Contract
              </label>
              <select
                value={importDatasetType}
                onChange={(e) => setImportDatasetType(e.target.value as any)}
                className="w-full bg-stone text-ink border border-border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-accent cursor-pointer"
              >
                <option value="daily_demand">daily_demand.csv (SKU, Date, Units, Stockout)</option>
                <option value="products">products.csv (SKU, Name, On-Hand, Costs)</option>
                <option value="supplier_settings">supplier_settings.csv (Lead Times & StdDev)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono uppercase text-muted mb-2 font-semibold">
                2. Choose CSV File
              </label>
              <div className="flex gap-3">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full text-xs font-mono text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-border file:text-xs file:font-mono file:bg-stone file:text-ink hover:file:bg-border/60 cursor-pointer"
                />
                <button
                  onClick={handleUploadPreview}
                  disabled={!importFile || isUploading}
                  className="px-4 py-2 bg-ink text-surface rounded-xl text-xs font-mono font-medium hover:bg-accent transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Validating...' : 'Preview Import'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Preview Results Panel */}
          {importPreview && (
            <div className="p-6 rounded-xl bg-stone/70 border border-border space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-wrap justify-between items-center pb-3 border-b border-border">
                <div>
                  <span className="font-mono text-xs font-semibold text-ink">{importPreview.filename}</span>
                  <span className="text-muted text-xs font-mono ml-2">({importPreview.summary.rows_received} rows total)</span>
                </div>
                <div className="flex gap-3 text-xs font-mono">
                  <span className="text-moss font-semibold">{importPreview.summary.valid_rows} Valid</span>
                  <span className="text-ochre font-semibold">{importPreview.summary.warning_rows} Warnings</span>
                  <span className="text-brick font-semibold">{importPreview.summary.error_rows} Errors</span>
                </div>
              </div>

              {/* Sample Preview Rows */}
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted uppercase text-[10px]">
                      <th className="pb-2">Row</th>
                      <th className="pb-2">SKU</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Units Sold</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Feedback Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {importPreview.preview_rows.map((r) => (
                      <tr key={r.row_number}>
                        <td className="py-2 text-muted">#{r.row_number}</td>
                        <td className="py-2 text-ink font-semibold">{r.sku}</td>
                        <td className="py-2 text-muted">{r.date}</td>
                        <td className="py-2 text-ink">{r.units_sold}</td>
                        <td className="py-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${r.row_status === 'valid' ? 'bg-moss/10 text-moss' : 'bg-ochre/10 text-ochre'}`}>
                            {r.row_status}
                          </span>
                        </td>
                        <td className="py-2 text-muted font-sans text-[11px]">
                          {r.messages.join(', ') || 'Clean observation'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Confirm Action Button */}
              <div className="pt-4 border-t border-border flex justify-between items-center">
                <span className="text-xs font-mono text-muted">
                  Duplicate Policy: Reject conflicting date entries (Section 4.2 compliant)
                </span>
                <button
                  onClick={handleConfirmImport}
                  disabled={!importPreview.can_confirm || isConfirming}
                  className="px-5 py-2.5 bg-accent text-surface rounded-xl text-xs font-mono font-medium hover:bg-accent-light transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isConfirming ? 'Committing...' : 'Confirm & Commit Import'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Confirm Success Banner */}
          {importConfirmResult && (
            <div className="p-4 rounded-xl bg-moss/10 border border-moss/30 flex items-center gap-3 font-mono text-xs text-moss">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div>
                <div className="font-semibold">Import Committed Successfully ({importConfirmResult.import_id})</div>
                <div className="text-[11px] text-moss/90 mt-0.5">
                  {importConfirmResult.counts.rows_inserted} demand records created. {importConfirmResult.warnings[0]}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-PANEL 3: ANOMALY AUDIT LOG (Table 3: anomaly_reviews) */}
      {activeSubTab === 'anomalies' && (
        <AnomalyAuditLog products={products} />
      )}

      {/* SUB-PANEL 4: HOLDOUT PROVER (Table 4: forecast_runs) */}
      {activeSubTab === 'forecast' && (
        <HoldoutProver products={products} />
      )}
    </div>
  );
};
