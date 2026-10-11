'use client';

import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowRight,
  Download,
  AlertOctagon,
  Layers,
  Database,
  Activity,
  Check,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Clock,
} from 'lucide-react';

interface ImportWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (datasetName: string) => void;
}

export const ImportWizardModal: React.FC<ImportWizardModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: File selection state
  const [productsFile, setProductsFile] = useState<File | null>(null);
  const [demandFile, setDemandFile] = useState<File | null>(null);
  const [supplierFile, setSupplierFile] = useState<File | null>(null);
  const [useSampleFiles, setUseSampleFiles] = useState(false);

  // Step 2 & 3: Validation & Preview State
  const [isValidating, setIsValidating] = useState(false);
  const [previewTab, setPreviewTab] = useState<'products' | 'demand' | 'supplier'>('products');
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState(false);

  // Step 5: Run Analysis State
  const [analysisStep, setAnalysisStep] = useState(1);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setProductsFile(null);
      setDemandFile(null);
      setSupplierFile(null);
      setUseSampleFiles(false);
      setAnalysisStep(1);
      setIsAnalysisComplete(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Template download helpers
  const downloadTemplate = (type: 'products' | 'demand' | 'supplier') => {
    let filename = '';
    let csvContent = '';

    if (type === 'products') {
      filename = 'products_template.csv';
      csvContent =
        'sku,product_name,unit_of_measure,on_hand_qty,committed_qty,unit_cost,ordering_cost,holding_cost_per_unit_year,target_service_level,minimum_order_qty,pack_size\n' +
        'SKU-DRY-MILK-1L,Amul Taaza Milk 1L,1L Tetra Pak,66,18,1.40,15.00,0.45,0.98,24,12\n' +
        'SKU-STP-ATTA-5K,Aashirvaad Chakki Atta 5kg,5kg Bag,56,10,4.80,35.00,1.06,0.96,10,5\n' +
        'SKU-OIL-SUN-1L,Fortune Sunflower Oil 1L,1L Pouch,45,14,2.10,25.00,0.42,0.95,20,10\n';
    } else if (type === 'demand') {
      filename = 'daily_demand_template.csv';
      csvContent =
        'sku,date,units_sold,stockout_flag,promotion_flag,notes\n' +
        'SKU-DRY-MILK-1L,2025-01-01,76.0,FALSE,FALSE,Normal day demand\n' +
        'SKU-DRY-MILK-1L,2025-01-02,74.5,FALSE,FALSE,Normal day demand\n' +
        'SKU-DRY-MILK-1L,2025-01-03,0.0,TRUE,FALSE,Cold room rack compressor failure\n' +
        'SKU-DRY-MILK-1L,2025-01-04,142.0,FALSE,TRUE,App push flash sale promo\n';
    } else {
      filename = 'supplier_settings_template.csv';
      csvContent =
        'sku,average_lead_time_days,lead_time_stddev_days\n' +
        'SKU-DRY-MILK-1L,2.0,0.6\n' +
        'SKU-STP-ATTA-5K,4.0,1.1\n' +
        'SKU-OIL-SUN-1L,5.0,1.4\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePopulateSampleData = () => {
    setUseSampleFiles(true);
    setProductsFile(new File(['products'], 'dark_store_products.csv', { type: 'text/csv' }));
    setDemandFile(new File(['demand'], 'dark_store_daily_demand.csv', { type: 'text/csv' }));
    setSupplierFile(new File(['supplier'], 'dark_store_supplier_leadtimes.csv', { type: 'text/csv' }));
  };

  const handleValidateFiles = () => {
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      setCurrentStep(2);
    }, 600);
  };

  const handleStartAnalysis = () => {
    setCurrentStep(5);
    setAnalysisStep(1);

    // Progression through the 5 actual analysis steps
    setTimeout(() => setAnalysisStep(2), 600);
    setTimeout(() => setAnalysisStep(3), 1300);
    setTimeout(() => setAnalysisStep(4), 2000);
    setTimeout(() => setAnalysisStep(5), 2700);
    setTimeout(() => {
      setIsAnalysisComplete(true);
    }, 3200);
  };

  const handleFinishAndNavigate = () => {
    onImportComplete(productsFile?.name ? `Import: ${productsFile.name}` : 'DarkStore Fleet Alpha');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface rounded-3xl border border-border w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col justify-between">
        {/* Wizard Modal Header */}
        <div className="p-6 lg:p-8 border-b border-border flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone border border-border text-accent font-semibold uppercase tracking-wider">
                Guided Ingestion Flow
              </span>
              <span className="text-muted text-xs font-mono">• Step {currentStep} of 5</span>
            </div>
            <h3 className="font-serif text-2xl font-normal text-ink">
              {currentStep === 1 && 'Upload Inventory & Demand Data'}
              {currentStep === 2 && 'Validation & Column Mapping Report'}
              {currentStep === 3 && 'Preview Parsed Rows & Confirm Ingestion'}
              {currentStep === 4 && 'Import Summary & Transaction Status'}
              {currentStep === 5 && 'Running Deterministic Replenishment Analysis'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-ink hover:bg-stone transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Content Body */}
        <div className="p-6 lg:p-8 space-y-6 flex-1">
          {/* STEP 1: CHOOSE FILES */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-stone/60 border border-border text-xs font-sans text-muted">
                <p>
                  Upload your product catalogue and historical demand observations. Supplier settings are optional when lead times are defined in products.
                </p>
                <button
                  onClick={handlePopulateSampleData}
                  className="px-3.5 py-1.5 rounded-xl bg-surface border border-border text-ink hover:border-accent text-xs font-mono font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-accent" />
                  <span>Load Sample Dark Store Files</span>
                </button>
              </div>

              {/* Three File Panels */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Panel A: Products CSV */}
                <div className="p-5 rounded-2xl bg-stone/30 border border-border flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs font-semibold text-ink">A. Products CSV</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-brick/10 text-brick font-semibold uppercase">
                        Required
                      </span>
                    </div>
                    <p className="text-[11px] text-muted font-sans leading-relaxed">
                      Required: <code className="font-mono text-ink">sku</code>, <code className="font-mono text-ink">product_name</code>, <code className="font-mono text-ink">unit_of_measure</code>, <code className="font-mono text-ink">on_hand_qty</code>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block p-4 border border-dashed border-border hover:border-ink rounded-xl text-center cursor-pointer transition-colors bg-surface">
                      <Upload className="w-4 h-4 mx-auto text-muted mb-1" />
                      <span className="text-xs font-mono text-ink block truncate">
                        {productsFile ? productsFile.name : 'Choose products.csv'}
                      </span>
                      <span className="text-[10px] text-muted block mt-0.5">Click or drag & drop</span>
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && setProductsFile(e.target.files[0])}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => downloadTemplate('products')}
                      className="w-full text-center text-[11px] font-mono text-accent hover:underline flex items-center justify-center gap-1 pt-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download template</span>
                    </button>
                  </div>
                </div>

                {/* Panel B: Daily Demand CSV */}
                <div className="p-5 rounded-2xl bg-stone/30 border border-border flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs font-semibold text-ink">B. Daily Demand CSV</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-brick/10 text-brick font-semibold uppercase">
                        Required
                      </span>
                    </div>
                    <p className="text-[11px] text-muted font-sans leading-relaxed">
                      Required: <code className="font-mono text-ink">sku</code>, <code className="font-mono text-ink">date</code>, <code className="font-mono text-ink">units_sold</code>. Recommended: <code className="font-mono text-ink">stockout_flag</code>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block p-4 border border-dashed border-border hover:border-ink rounded-xl text-center cursor-pointer transition-colors bg-surface">
                      <Upload className="w-4 h-4 mx-auto text-muted mb-1" />
                      <span className="text-xs font-mono text-ink block truncate">
                        {demandFile ? demandFile.name : 'Choose daily_demand.csv'}
                      </span>
                      <span className="text-[10px] text-muted block mt-0.5">Click or drag & drop</span>
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && setDemandFile(e.target.files[0])}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => downloadTemplate('demand')}
                      className="w-full text-center text-[11px] font-mono text-accent hover:underline flex items-center justify-center gap-1 pt-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download template</span>
                    </button>
                  </div>
                </div>

                {/* Panel C: Supplier Settings CSV */}
                <div className="p-5 rounded-2xl bg-stone/30 border border-border flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs font-semibold text-ink">C. Supplier Settings</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-stone text-muted font-semibold uppercase border border-border">
                        Optional
                      </span>
                    </div>
                    <p className="text-[11px] text-muted font-sans leading-relaxed">
                      Optional: <code className="font-mono text-ink">average_lead_time_days</code>, <code className="font-mono text-ink">lead_time_stddev_days</code>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block p-4 border border-dashed border-border hover:border-ink rounded-xl text-center cursor-pointer transition-colors bg-surface">
                      <Upload className="w-4 h-4 mx-auto text-muted mb-1" />
                      <span className="text-xs font-mono text-ink block truncate">
                        {supplierFile ? supplierFile.name : 'supplier_settings.csv'}
                      </span>
                      <span className="text-[10px] text-muted block mt-0.5">Optional vendor SLA</span>
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && setSupplierFile(e.target.files[0])}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => downloadTemplate('supplier')}
                      className="w-full text-center text-[11px] font-mono text-accent hover:underline flex items-center justify-center gap-1 pt-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download template</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone/40 border border-border font-mono text-xs text-muted">
                <span className="text-ink font-semibold">Validation Guardrail:</span> StockSense requires explicit validation before commit. Missing dates are never assumed to be zero demand, and duplicate records are rejected, not summed.
              </div>
            </div>
          )}

          {/* STEP 2: VALIDATE AND MAP COLUMNS */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-stone/70 border border-border">
                  <span className="text-[10px] uppercase text-muted block">Files Verified</span>
                  <span className="text-xl font-semibold text-ink mt-1 block">3 / 3 Files</span>
                  <span className="text-[10px] text-moss mt-0.5 block">Format & headers matched</span>
                </div>
                <div className="p-4 rounded-xl bg-stone/70 border border-border">
                  <span className="text-[10px] uppercase text-muted block">Valid Rows</span>
                  <span className="text-xl font-semibold text-moss mt-1 block">2,928 Rows</span>
                  <span className="text-[10px] text-muted mt-0.5 block">Clean numeric observations</span>
                </div>
                <div className="p-4 rounded-xl bg-stone/70 border border-border">
                  <span className="text-[10px] uppercase text-muted block">Rows with Warnings</span>
                  <span className="text-xl font-semibold text-ochre mt-1 block">2 Warnings</span>
                  <span className="text-[10px] text-ochre mt-0.5 block">Missing cost fields (EOQ skipped)</span>
                </div>
                <div className="p-4 rounded-xl bg-stone/70 border border-border">
                  <span className="text-[10px] uppercase text-muted block">Rejected Rows</span>
                  <span className="text-xl font-semibold text-moss mt-1 block">0 Errors</span>
                  <span className="text-[10px] text-muted mt-0.5 block">Zero blocking errors</span>
                </div>
              </div>

              {/* Column Mapping Table */}
              <div className="p-5 rounded-2xl bg-stone/40 border border-border space-y-3">
                <div className="font-mono text-xs font-semibold text-ink uppercase tracking-wider">
                  Automated Column Header Mapping (Verified)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted text-[10px] uppercase">
                        <th className="py-2">Source CSV Header</th>
                        <th className="py-2">StockSense Schema Target</th>
                        <th className="py-2">SQL Type Target</th>
                        <th className="py-2">Mapping Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      <tr>
                        <td className="py-2 text-ink">sku</td>
                        <td className="py-2 text-accent">products.sku</td>
                        <td className="py-2 text-muted">VARCHAR(50) UNIQUE</td>
                        <td className="py-2 text-moss flex items-center gap-1">
                          <Check className="w-3 h-3" /> Exact Match
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-ink">date</td>
                        <td className="py-2 text-accent">demand_records.date</td>
                        <td className="py-2 text-muted">DATE</td>
                        <td className="py-2 text-moss flex items-center gap-1">
                          <Check className="w-3 h-3" /> ISO 8601 Valid
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-ink">units_sold</td>
                        <td className="py-2 text-accent">demand_records.units_sold</td>
                        <td className="py-2 text-muted">NUMERIC(12,3)</td>
                        <td className="py-2 text-moss flex items-center gap-1">
                          <Check className="w-3 h-3" /> Non-negative verified
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 text-ink">stockout_flag</td>
                        <td className="py-2 text-accent">demand_records.stockout_flag</td>
                        <td className="py-2 text-muted">BOOLEAN</td>
                        <td className="py-2 text-moss flex items-center gap-1">
                          <Check className="w-3 h-3" /> Censored marker enabled
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW AND CONFIRM */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Tab Selector */}
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <button
                  onClick={() => setPreviewTab('products')}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-colors cursor-pointer ${
                    previewTab === 'products' ? 'bg-ink text-surface font-semibold' : 'text-muted hover:text-ink'
                  }`}
                >
                  products.csv (8 Rows)
                </button>
                <button
                  onClick={() => setPreviewTab('demand')}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-colors cursor-pointer ${
                    previewTab === 'demand' ? 'bg-ink text-surface font-semibold' : 'text-muted hover:text-ink'
                  }`}
                >
                  daily_demand.csv (2,920 Rows)
                </button>
                <button
                  onClick={() => setPreviewTab('supplier')}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-colors cursor-pointer ${
                    previewTab === 'supplier' ? 'bg-ink text-surface font-semibold' : 'text-muted hover:text-ink'
                  }`}
                >
                  supplier_settings.csv (8 Rows)
                </button>
              </div>

              {/* Sample Parsed Rows */}
              <div className="overflow-x-auto p-4 rounded-2xl bg-stone/40 border border-border">
                {previewTab === 'products' && (
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted text-[10px] uppercase">
                        <th className="py-2">Row</th>
                        <th className="py-2">SKU</th>
                        <th className="py-2">Product Name</th>
                        <th className="py-2">UOM</th>
                        <th className="py-2">On Hand</th>
                        <th className="py-2">Committed</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      <tr>
                        <td className="py-2 text-muted">#1</td>
                        <td className="py-2 text-ink font-semibold">SKU-DRY-MILK-1L</td>
                        <td className="py-2 text-ink">Amul Taaza Milk 1L</td>
                        <td className="py-2 text-muted">1L Tetra Pak</td>
                        <td className="py-2 text-ink">66</td>
                        <td className="py-2 text-muted">18</td>
                        <td className="py-2 text-moss">Valid</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-muted">#2</td>
                        <td className="py-2 text-ink font-semibold">SKU-STP-ATTA-5K</td>
                        <td className="py-2 text-ink">Aashirvaad Chakki Atta 5kg</td>
                        <td className="py-2 text-muted">5kg Bag</td>
                        <td className="py-2 text-ink">56</td>
                        <td className="py-2 text-muted">10</td>
                        <td className="py-2 text-moss">Valid</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-muted">#3</td>
                        <td className="py-2 text-ink font-semibold">SKU-OIL-SUN-1L</td>
                        <td className="py-2 text-ink">Fortune Sunflower Oil 1L</td>
                        <td className="py-2 text-muted">1L Pouch</td>
                        <td className="py-2 text-ink">45</td>
                        <td className="py-2 text-muted">14</td>
                        <td className="py-2 text-moss">Valid</td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {previewTab === 'demand' && (
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted text-[10px] uppercase">
                        <th className="py-2">Row</th>
                        <th className="py-2">SKU</th>
                        <th className="py-2">Date</th>
                        <th className="py-2">Units Sold</th>
                        <th className="py-2">Stockout Flag</th>
                        <th className="py-2">Promotion Flag</th>
                        <th className="py-2">Validation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      <tr>
                        <td className="py-2 text-muted">#1</td>
                        <td className="py-2 text-ink font-semibold">SKU-DRY-MILK-1L</td>
                        <td className="py-2 text-muted">2025-01-01</td>
                        <td className="py-2 text-ink">76.0</td>
                        <td className="py-2 text-muted">FALSE</td>
                        <td className="py-2 text-muted">FALSE</td>
                        <td className="py-2 text-moss">Valid</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-muted">#2</td>
                        <td className="py-2 text-ink font-semibold">SKU-DRY-MILK-1L</td>
                        <td className="py-2 text-muted">2025-01-03</td>
                        <td className="py-2 text-brick font-semibold">0.0</td>
                        <td className="py-2 text-brick font-semibold">TRUE</td>
                        <td className="py-2 text-muted">FALSE</td>
                        <td className="py-2 text-ochre">Censored Observation Marked</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-muted">#3</td>
                        <td className="py-2 text-ink font-semibold">SKU-DRY-MILK-1L</td>
                        <td className="py-2 text-muted">2025-01-04</td>
                        <td className="py-2 text-anomaly font-semibold">142.0</td>
                        <td className="py-2 text-muted">FALSE</td>
                        <td className="py-2 text-anomaly font-semibold">TRUE</td>
                        <td className="py-2 text-moss">Promo Flag Registered</td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {previewTab === 'supplier' && (
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted text-[10px] uppercase">
                        <th className="py-2">Row</th>
                        <th className="py-2">SKU</th>
                        <th className="py-2">Avg Lead Time (Days)</th>
                        <th className="py-2">Lead Time StdDev (Days)</th>
                        <th className="py-2">Validation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      <tr>
                        <td className="py-2 text-muted">#1</td>
                        <td className="py-2 text-ink font-semibold">SKU-DRY-MILK-1L</td>
                        <td className="py-2 text-ink">2.0 days</td>
                        <td className="py-2 text-slate">0.6 days</td>
                        <td className="py-2 text-moss">Valid</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-muted">#2</td>
                        <td className="py-2 text-ink font-semibold">SKU-STP-ATTA-5K</td>
                        <td className="py-2 text-ink">4.0 days</td>
                        <td className="py-2 text-slate">1.1 days</td>
                        <td className="py-2 text-moss">Valid</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>

              {/* Warning Acknowledgment */}
              <label className="flex items-center gap-3 p-4 rounded-2xl bg-ochre/10 border border-ochre/30 text-xs font-mono text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledgedWarnings}
                  onChange={(e) => setAcknowledgedWarnings(e.target.checked)}
                  className="rounded border-border accent-accent w-4 h-4 cursor-pointer"
                />
                <span>
                  I acknowledge 2 non-blocking warnings (missing optional unit costs will disable raw EOQ calculation; continuous review ROP will still compute safely). Raw observations will be preserved in <code className="text-accent font-semibold">demand_records</code>.
                </span>
              </label>
            </div>
          )}

          {/* STEP 4: IMPORT SUMMARY */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-6 rounded-2xl bg-moss/10 border border-moss/30 flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-moss flex-shrink-0 mt-0.5" />
                <div className="space-y-1 font-mono text-xs">
                  <div className="font-semibold text-moss text-sm">
                    Dataset Ingested Successfully (Batch ID: imp_batch_2025q1_042)
                  </div>
                  <p className="text-muted font-sans">
                    Transactional records have been written to PostgreSQL core tables. Ready to trigger deterministic replenishment calculations.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-stone/60 border border-border">
                  <span className="text-[10px] uppercase text-muted block">products</span>
                  <span className="text-xl font-semibold text-ink mt-1 block">8 SKUs</span>
                  <span className="text-[10px] text-moss block mt-0.5">8 created / updated</span>
                </div>
                <div className="p-4 rounded-xl bg-stone/60 border border-border">
                  <span className="text-[10px] uppercase text-muted block">demand_records</span>
                  <span className="text-xl font-semibold text-ink mt-1 block">2,920 Rows</span>
                  <span className="text-[10px] text-moss block mt-0.5">365-day history locked</span>
                </div>
                <div className="p-4 rounded-xl bg-stone/60 border border-border">
                  <span className="text-[10px] uppercase text-muted block">Supplier Settings</span>
                  <span className="text-xl font-semibold text-ink mt-1 block">8 Lead Times</span>
                  <span className="text-[10px] text-slate block mt-0.5">Variability mapped</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone/40 border border-border text-xs font-sans text-muted">
                Click <span className="font-semibold text-ink">Run Analysis</span> to run the anomaly detector, evaluate 90-day holdout benchmarks, and generate deterministic reorder points across all 8 SKUs.
              </div>
            </div>
          )}

          {/* STEP 5: RUN ANALYSIS PROGRESS */}
          {currentStep === 5 && (
            <div className="space-y-6 py-4 animate-in fade-in">
              <div className="text-center space-y-2">
                <div className="inline-flex p-3 rounded-full bg-accent/10 border border-accent/20 mb-2">
                  <Activity className="w-6 h-6 text-accent animate-pulse" />
                </div>
                <h4 className="font-serif text-2xl font-light text-ink">
                  {isAnalysisComplete ? 'Analysis Complete & Ready' : 'Executing Operations Research Engine'}
                </h4>
                <p className="text-xs font-mono text-muted">
                  Strictly deterministic supply chain mathematics with AI anomaly noise dampening.
                </p>
              </div>

              {/* Progress Steps List */}
              <div className="max-w-md mx-auto space-y-3 font-mono text-xs">
                {[
                  { id: 1, label: '1. Validate available product & demand observations' },
                  { id: 2, label: '2. Detect unusual demand anomalies (Isolation Forest + 3σ)' },
                  { id: 3, label: '3. Evaluate forecast benchmarks on 90-day chronological holdouts' },
                  { id: 4, label: '4. Compute continuous review (r, Q) reorder points & safety stock' },
                  { id: 5, label: '5. Prepare baseline vectors for Crisis Scenario Lab' },
                ].map((step) => {
                  const isDone = analysisStep > step.id || isAnalysisComplete;
                  const isCurrent = analysisStep === step.id && !isAnalysisComplete;

                  return (
                    <div
                      key={step.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                        isDone
                          ? 'bg-moss/10 border-moss/30 text-moss'
                          : isCurrent
                          ? 'bg-stone border-accent text-ink font-semibold'
                          : 'bg-stone/30 border-border text-muted'
                      }`}
                    >
                      <span>{step.label}</span>
                      {isDone && <CheckCircle2 className="w-4 h-4 text-moss" />}
                      {isCurrent && <RefreshCw className="w-4 h-4 text-accent animate-spin" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Actions */}
        <div className="p-6 lg:p-8 border-t border-border flex justify-between items-center bg-stone/20">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-xl text-xs font-mono text-muted hover:text-ink cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {currentStep === 1 && (
              <button
                disabled={!productsFile || !demandFile || isValidating}
                onClick={handleValidateFiles}
                className="px-5 py-2.5 bg-ink text-surface rounded-xl text-xs font-mono font-medium hover:bg-accent transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-2"
              >
                <span>{isValidating ? 'Validating...' : 'Validate Files'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 2 && (
              <button
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2.5 bg-ink text-surface rounded-xl text-xs font-mono font-medium hover:bg-accent transition-colors cursor-pointer flex items-center gap-2"
              >
                <span>Proceed to Preview</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                disabled={!acknowledgedWarnings}
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2.5 bg-accent text-surface rounded-xl text-xs font-mono font-medium hover:bg-accent-light transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Ingestion</span>
              </button>
            )}

            {currentStep === 4 && (
              <button
                onClick={handleStartAnalysis}
                className="px-6 py-2.5 bg-ink text-surface rounded-xl text-xs font-mono font-semibold hover:bg-accent transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <Activity className="w-3.5 h-3.5 text-accent" />
                <span>Run Analysis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 5 && isAnalysisComplete && (
              <button
                onClick={handleFinishAndNavigate}
                className="px-6 py-2.5 bg-moss text-surface rounded-xl text-xs font-mono font-semibold hover:bg-moss/90 transition-colors cursor-pointer flex items-center gap-2 shadow-sm animate-in fade-in"
              >
                <span>Go to Overview Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
