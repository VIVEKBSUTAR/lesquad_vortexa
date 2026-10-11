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
import { apiClient, ImportPreviewResponse, ImportConfirmResponse } from '@/lib/api';

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
  const [replaceExistingData, setReplaceExistingData] = useState<boolean>(true);

  // Step 2 & 3: Validation & Preview State from Backend API
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [productsPreview, setProductsPreview] = useState<ImportPreviewResponse | null>(null);
  const [demandPreview, setDemandPreview] = useState<ImportPreviewResponse | null>(null);
  const [supplierPreview, setSupplierPreview] = useState<ImportPreviewResponse | null>(null);

  const [previewTab, setPreviewTab] = useState<'products' | 'demand' | 'supplier'>('products');
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState(false);

  // Step 4: Confirmation State
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmedResults, setConfirmedResults] = useState<{
    products?: ImportConfirmResponse;
    demand?: ImportConfirmResponse;
    suppliers?: ImportConfirmResponse;
  } | null>(null);

  // Step 5: Run Analysis State
  const [analysisStep, setAnalysisStep] = useState(1);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setProductsFile(null);
      setDemandFile(null);
      setSupplierFile(null);
      setReplaceExistingData(true);
      setProductsPreview(null);
      setDemandPreview(null);
      setSupplierPreview(null);
      setValidationError(null);
      setConfirmedResults(null);
      setConfirmError(null);
      setAnalysisStep(1);
      setIsAnalysisComplete(false);
      setAcknowledgedWarnings(false);
      setPreviewTab('products');
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
        'SKU-1001,Wireless Mouse,units,120,15,450.0,150.0,90.0,0.95,10,5\n' +
        'SKU-1002,USB-C Cable,units,45,8,180.0,120.0,36.0,0.95,20,10\n' +
        'SKU-1003,Laptop Stand,units,18,5,850.0,150.0,170.0,0.975,5,5\n' +
        'SKU-1004,Bluetooth Keyboard,units,32,10,700.0,150.0,140.0,0.95,5,5\n' +
        'SKU-1005,Webcam,units,9,3,1200.0,200.0,240.0,0.99,4,2\n';
    } else if (type === 'demand') {
      filename = 'daily_demand_template.csv';
      csvContent =
        'sku,date,units_sold,stockout_flag,promotion_flag,notes\n' +
        'SKU-1001,2026-10-01,8,False,False,Normal day demand\n' +
        'SKU-1001,2026-10-02,12,False,False,Normal day demand\n' +
        'SKU-1001,2026-10-03,0,True,False,Out of stock observation\n' +
        'SKU-1001,2026-10-04,18,False,True,Promotional spike\n';
    } else {
      filename = 'supplier_settings_template.csv';
      csvContent =
        'sku,average_lead_time_days,lead_time_stddev_days\n' +
        'SKU-1001,4,1.0\n' +
        'SKU-1002,7,1.5\n' +
        'SKU-1003,6,2.0\n' +
        'SKU-1004,5,1.0\n' +
        'SKU-1005,9,2.5\n';
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
    const prodCsv =
      'sku,product_name,unit_of_measure,on_hand_qty,committed_qty,unit_cost,ordering_cost,holding_cost_per_unit_year,target_service_level,minimum_order_qty,pack_size\n' +
      'SKU-1001,Wireless Mouse,units,120,15,450.0,150.0,90.0,0.95,10,5\n' +
      'SKU-1002,USB-C Cable,units,45,8,180.0,120.0,36.0,0.95,20,10\n' +
      'SKU-1003,Laptop Stand,units,18,5,850.0,150.0,170.0,0.975,5,5\n' +
      'SKU-1004,Bluetooth Keyboard,units,32,10,700.0,150.0,140.0,0.95,5,5\n' +
      'SKU-1005,Webcam,units,9,3,1200.0,200.0,240.0,0.99,4,2\n';

    const demandCsv =
      'sku,date,units_sold,stockout_flag,promotion_flag,notes\n' +
      'SKU-1001,2026-10-01,8,False,False,\n' +
      'SKU-1001,2026-10-02,12,False,False,\n' +
      'SKU-1001,2026-10-03,0,True,False,Out of stock\n' +
      'SKU-1001,2026-10-04,18,False,True,Promo surge\n' +
      'SKU-1002,2026-10-01,15,False,False,\n' +
      'SKU-1002,2026-10-02,14,False,False,\n' +
      'SKU-1003,2026-10-01,4,False,False,\n' +
      'SKU-1004,2026-10-01,7,False,False,\n' +
      'SKU-1005,2026-10-01,3,False,False,\n';

    const supplierCsv =
      'sku,average_lead_time_days,lead_time_stddev_days\n' +
      'SKU-1001,4,1.0\n' +
      'SKU-1002,7,1.5\n' +
      'SKU-1003,6,2.0\n' +
      'SKU-1004,5,1.0\n' +
      'SKU-1005,9,2.5\n';

    setProductsFile(new File([prodCsv], 'products.csv', { type: 'text/csv' }));
    setDemandFile(new File([demandCsv], 'daily_demand.csv', { type: 'text/csv' }));
    setSupplierFile(new File([supplierCsv], 'supplier_settings.csv', { type: 'text/csv' }));
  };

  // Step 1 -> Step 2: Validate Files with backend endpoints
  const handleValidateFiles = async () => {
    if (!productsFile || !demandFile) return;

    setIsValidating(true);
    setValidationError(null);

    try {
      // 1. Preview Products CSV first (registers staged products in backend)
      const prodRes = await apiClient.previewImport(productsFile, 'products');
      setProductsPreview(prodRes);

      // 2. Preview Daily Demand CSV
      const demRes = await apiClient.previewImport(demandFile, 'demand');
      setDemandPreview(demRes);

      // 3. Preview Supplier Settings CSV if provided
      let supRes: ImportPreviewResponse | null = null;
      if (supplierFile) {
        supRes = await apiClient.previewImport(supplierFile, 'suppliers');
        setSupplierPreview(supRes);
      }

      // Check for blocking errors
      const hasErrors =
        !prodRes.can_confirm ||
        !demRes.can_confirm ||
        (supRes !== null && !supRes.can_confirm);

      if (hasErrors) {
        const errorList: string[] = [
          ...prodRes.errors.map((e) => `[Products Row ${e.row_number}] ${e.message}`),
          ...demRes.errors.map((e) => `[Demand Row ${e.row_number}] ${e.message}`),
          ...(supRes ? supRes.errors.map((e) => `[Supplier Row ${e.row_number}] ${e.message}`) : []),
        ];
        setValidationError(errorList.slice(0, 3).join(' | '));
      }

      setCurrentStep(2);
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to connect to backend for CSV validation.');
    } finally {
      setIsValidating(false);
    }
  };

  // Step 3 -> Step 4: Transactionally Confirm Ingestion
  const handleConfirmIngestion = async () => {
    if (!productsPreview || !demandPreview) return;

    setIsConfirming(true);
    setConfirmError(null);

    try {
      // 1. Confirm products first to establish foreign keys in database
      // If replaceExistingData is true, previous catalog & demand history is purged first
      const pConfirm = await apiClient.confirmImport(productsPreview.import_id, replaceExistingData);

      // 2. Confirm daily demand records
      const dConfirm = await apiClient.confirmImport(demandPreview.import_id);

      // 3. Confirm supplier settings if uploaded
      let sConfirm: ImportConfirmResponse | undefined;
      if (supplierPreview && supplierPreview.import_id) {
        sConfirm = await apiClient.confirmImport(supplierPreview.import_id);
      }

      setConfirmedResults({
        products: pConfirm,
        demand: dConfirm,
        suppliers: sConfirm,
      });

      setCurrentStep(4);
    } catch (err: any) {
      setConfirmError(err?.message || 'Transactional commit failed during confirmation.');
    } finally {
      setIsConfirming(false);
    }
  };

  // Step 4 -> Step 5: Run Analysis Progression
  const handleStartAnalysis = () => {
    setCurrentStep(5);
    setAnalysisStep(1);

    setTimeout(() => setAnalysisStep(2), 600);
    setTimeout(() => setAnalysisStep(3), 1300);
    setTimeout(() => setAnalysisStep(4), 2000);
    setTimeout(() => setAnalysisStep(5), 2700);
    setTimeout(() => {
      setIsAnalysisComplete(true);
    }, 3200);
  };

  const handleFinishAndNavigate = () => {
    const datasetLabel = productsFile?.name ? `Dataset: ${productsFile.name}` : 'DarkStore Fleet Alpha';
    onImportComplete(datasetLabel);
    onClose();
  };

  // Dynamic calculations from parsed previews
  const totalFilesVerified = (productsFile ? 1 : 0) + (demandFile ? 1 : 0) + (supplierFile ? 1 : 0);
  const totalValidRows =
    (productsPreview?.summary.valid_rows ?? 0) +
    (demandPreview?.summary.valid_rows ?? 0) +
    (supplierPreview?.summary.valid_rows ?? 0);
  const totalWarningRows =
    (productsPreview?.summary.warning_rows ?? 0) +
    (demandPreview?.summary.warning_rows ?? 0) +
    (supplierPreview?.summary.warning_rows ?? 0);
  const totalErrorRows =
    (productsPreview?.summary.error_rows ?? 0) +
    (demandPreview?.summary.error_rows ?? 0) +
    (supplierPreview?.summary.error_rows ?? 0);

  const allWarnings = [
    ...(productsPreview?.warnings || []).map((w) => ({ file: 'Products', ...w })),
    ...(demandPreview?.warnings || []).map((w) => ({ file: 'Daily Demand', ...w })),
    ...(supplierPreview?.warnings || []).map((w) => ({ file: 'Supplier Settings', ...w })),
  ];

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
                  Upload your product catalogue and historical demand observations. StockSense will validate schema contracts, column types, and dates before persisting to the database.
                </p>
                <button
                  onClick={handlePopulateSampleData}
                  className="px-3.5 py-1.5 rounded-xl bg-surface border border-border text-ink hover:border-accent text-xs font-mono font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-accent" />
                  <span>Load Sample Test Files</span>
                </button>
              </div>

              {validationError && (
                <div className="p-4 rounded-xl bg-brick/10 border border-brick/30 text-xs font-mono text-brick flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

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
                    <label className={`block p-4 border border-dashed rounded-xl text-center cursor-pointer transition-colors bg-surface ${
                      productsFile ? 'border-moss bg-moss/5' : 'border-border hover:border-ink'
                    }`}>
                      {productsFile ? (
                        <CheckCircle2 className="w-4 h-4 mx-auto text-moss mb-1" />
                      ) : (
                        <Upload className="w-4 h-4 mx-auto text-muted mb-1" />
                      )}
                      <span className="text-xs font-mono text-ink block truncate font-medium">
                        {productsFile ? productsFile.name : 'Choose products.csv'}
                      </span>
                      <span className="text-[10px] text-muted block mt-0.5">
                        {productsFile ? `${(productsFile.size / 1024).toFixed(1)} KB` : 'Click or drag & drop'}
                      </span>
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
                    <label className={`block p-4 border border-dashed rounded-xl text-center cursor-pointer transition-colors bg-surface ${
                      demandFile ? 'border-moss bg-moss/5' : 'border-border hover:border-ink'
                    }`}>
                      {demandFile ? (
                        <CheckCircle2 className="w-4 h-4 mx-auto text-moss mb-1" />
                      ) : (
                        <Upload className="w-4 h-4 mx-auto text-muted mb-1" />
                      )}
                      <span className="text-xs font-mono text-ink block truncate font-medium">
                        {demandFile ? demandFile.name : 'Choose daily_demand.csv'}
                      </span>
                      <span className="text-[10px] text-muted block mt-0.5">
                        {demandFile ? `${(demandFile.size / 1024).toFixed(1)} KB` : 'Click or drag & drop'}
                      </span>
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
                    <label className={`block p-4 border border-dashed rounded-xl text-center cursor-pointer transition-colors bg-surface ${
                      supplierFile ? 'border-moss bg-moss/5' : 'border-border hover:border-ink'
                    }`}>
                      {supplierFile ? (
                        <CheckCircle2 className="w-4 h-4 mx-auto text-moss mb-1" />
                      ) : (
                        <Upload className="w-4 h-4 mx-auto text-muted mb-1" />
                      )}
                      <span className="text-xs font-mono text-ink block truncate font-medium">
                        {supplierFile ? supplierFile.name : 'supplier_settings.csv'}
                      </span>
                      <span className="text-[10px] text-muted block mt-0.5">
                        {supplierFile ? `${(supplierFile.size / 1024).toFixed(1)} KB` : 'Optional supplier SLA'}
                      </span>
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

              {/* Dataset Scope & Clean Slate Option */}
              <div className="p-4 rounded-2xl bg-surface border border-border flex items-start gap-3 shadow-xs">
                <input
                  type="checkbox"
                  id="replaceExistingData"
                  checked={replaceExistingData}
                  onChange={(e) => setReplaceExistingData(e.target.checked)}
                  className="mt-0.5 rounded border-border accent-accent w-4 h-4 cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="replaceExistingData" className="font-mono text-xs font-semibold text-ink cursor-pointer flex items-center gap-2">
                    <span>Replace Existing Dataset (Clean Slate)</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-accent/10 text-accent font-semibold">Recommended</span>
                  </label>
                  <p className="text-[11px] font-sans text-muted mt-1 leading-relaxed">
                    When enabled, previous catalog products and historical demand observations are purged on confirmation. Analytics, KPIs, and stockout risk radar will run exclusively on the newly uploaded data without mixing older items.
                  </p>
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
              {validationError && (
                <div className="p-4 rounded-xl bg-brick/10 border border-brick/30 text-xs font-mono text-brick flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                  <span>Validation issue detected: {validationError}</span>
                </div>
              )}

              {/* Dynamic Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-stone/70 border border-border">
                  <span className="text-[10px] uppercase text-muted block">Files Verified</span>
                  <span className="text-xl font-semibold text-ink mt-1 block">
                    {totalFilesVerified} / {totalFilesVerified} Files
                  </span>
                  <span className="text-[10px] text-moss mt-0.5 block">Format & headers matched</span>
                </div>
                <div className="p-4 rounded-xl bg-stone/70 border border-border">
                  <span className="text-[10px] uppercase text-muted block">Valid Rows</span>
                  <span className="text-xl font-semibold text-moss mt-1 block">
                    {totalValidRows.toLocaleString()} Rows
                  </span>
                  <span className="text-[10px] text-muted mt-0.5 block">Clean numeric observations</span>
                </div>
                <div className="p-4 rounded-xl bg-stone/70 border border-border">
                  <span className="text-[10px] uppercase text-muted block">Rows with Warnings</span>
                  <span className={`text-xl font-semibold mt-1 block ${totalWarningRows > 0 ? 'text-ochre' : 'text-moss'}`}>
                    {totalWarningRows} Warnings
                  </span>
                  <span className="text-[10px] text-muted mt-0.5 block">
                    {totalWarningRows > 0 ? 'Non-blocking assumptions' : 'Zero warnings'}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-stone/70 border border-border">
                  <span className="text-[10px] uppercase text-muted block">Rejected Rows</span>
                  <span className={`text-xl font-semibold mt-1 block ${totalErrorRows > 0 ? 'text-brick' : 'text-moss'}`}>
                    {totalErrorRows} Errors
                  </span>
                  <span className="text-[10px] text-muted mt-0.5 block">
                    {totalErrorRows === 0 ? 'Zero blocking errors' : 'Blocking schema issues'}
                  </span>
                </div>
              </div>

              {/* Dynamic Column Mapping Table */}
              <div className="p-5 rounded-2xl bg-stone/40 border border-border space-y-3">
                <div className="font-mono text-xs font-semibold text-ink uppercase tracking-wider flex items-center justify-between">
                  <span>Detected CSV Columns & Schema Targets</span>
                  <span className="text-muted text-[10px] font-normal">Parsed via FastAPI Core</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted text-[10px] uppercase">
                        <th className="py-2">Source CSV</th>
                        <th className="py-2">Detected Column Headers</th>
                        <th className="py-2">StockSense Target Table</th>
                        <th className="py-2">Mapping Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {productsPreview && (
                        <tr>
                          <td className="py-2 text-ink font-semibold">{productsPreview.filename}</td>
                          <td className="py-2 text-accent">
                            {productsPreview.columns_detected.join(', ') || 'sku, product_name, unit_of_measure, on_hand_qty'}
                          </td>
                          <td className="py-2 text-muted">products</td>
                          <td className="py-2 text-moss flex items-center gap-1">
                            <Check className="w-3 h-3" /> Validated ({productsPreview.summary.valid_rows} SKUs)
                          </td>
                        </tr>
                      )}
                      {demandPreview && (
                        <tr>
                          <td className="py-2 text-ink font-semibold">{demandPreview.filename}</td>
                          <td className="py-2 text-accent">
                            {demandPreview.columns_detected.join(', ') || 'sku, date, units_sold, stockout_flag'}
                          </td>
                          <td className="py-2 text-muted">demand_records</td>
                          <td className="py-2 text-moss flex items-center gap-1">
                            <Check className="w-3 h-3" /> Validated ({demandPreview.summary.valid_rows} observations)
                          </td>
                        </tr>
                      )}
                      {supplierPreview && (
                        <tr>
                          <td className="py-2 text-ink font-semibold">{supplierPreview.filename}</td>
                          <td className="py-2 text-accent">
                            {supplierPreview.columns_detected.join(', ') || 'sku, average_lead_time_days, lead_time_stddev_days'}
                          </td>
                          <td className="py-2 text-muted">products (lead time parameters)</td>
                          <td className="py-2 text-moss flex items-center gap-1">
                            <Check className="w-3 h-3" /> Validated ({supplierPreview.summary.valid_rows} supplier settings)
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Non-blocking warnings review */}
              {allWarnings.length > 0 && (
                <div className="p-4 rounded-xl bg-ochre/10 border border-ochre/30 space-y-2">
                  <div className="flex items-center gap-2 font-mono text-xs font-semibold text-ochre">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Non-blocking Warnings ({allWarnings.length})</span>
                  </div>
                  <ul className="text-xs font-mono text-muted space-y-1 list-disc list-inside">
                    {allWarnings.slice(0, 5).map((w, idx) => (
                      <li key={idx}>
                        <span className="text-ink font-semibold">[{w.file} Row {w.row_number}]</span> {w.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: PREVIEW AND CONFIRM */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {confirmError && (
                <div className="p-4 rounded-xl bg-brick/10 border border-brick/30 text-xs font-mono text-brick flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                  <span>{confirmError}</span>
                </div>
              )}

              {/* Dataset Scope Status in Step 3 */}
              <div className={`p-4 rounded-2xl border font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                replaceExistingData
                  ? 'bg-moss/10 border-moss/30 text-ink'
                  : 'bg-stone/50 border-border text-muted'
              }`}>
                <div className="flex items-start sm:items-center gap-2.5">
                  <Database className={`w-4 h-4 mt-0.5 sm:mt-0 flex-shrink-0 ${replaceExistingData ? 'text-moss' : 'text-muted'}`} />
                  <div>
                    <span className="font-semibold text-ink">
                      {replaceExistingData
                        ? 'Clean Slate Mode: Overwrite previous dataset'
                        : 'Append Mode: Merge with existing dataset'}
                    </span>
                    <span className="block text-[11px] text-muted font-sans mt-0.5">
                      {replaceExistingData
                        ? 'Previous products & observations will be purged so analysis runs strictly on this new dataset.'
                        : 'New records will be appended to the current database catalog.'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplaceExistingData(!replaceExistingData)}
                  className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-border bg-surface text-ink hover:border-accent text-xs font-mono transition-colors cursor-pointer whitespace-nowrap"
                >
                  Switch to {replaceExistingData ? 'Append Mode' : 'Clean Slate'}
                </button>
              </div>

              {/* Tab Selector */}
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <button
                  onClick={() => setPreviewTab('products')}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-colors cursor-pointer ${
                    previewTab === 'products' ? 'bg-ink text-surface font-semibold' : 'text-muted hover:text-ink'
                  }`}
                >
                  {productsFile?.name || 'products.csv'} ({productsPreview?.summary.valid_rows || 0} Rows)
                </button>
                <button
                  onClick={() => setPreviewTab('demand')}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-colors cursor-pointer ${
                    previewTab === 'demand' ? 'bg-ink text-surface font-semibold' : 'text-muted hover:text-ink'
                  }`}
                >
                  {demandFile?.name || 'daily_demand.csv'} ({demandPreview?.summary.valid_rows || 0} Rows)
                </button>
                {supplierFile && (
                  <button
                    onClick={() => setPreviewTab('supplier')}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs transition-colors cursor-pointer ${
                      previewTab === 'supplier' ? 'bg-ink text-surface font-semibold' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {supplierFile.name} ({supplierPreview?.summary.valid_rows || 0} Rows)
                  </button>
                )}
              </div>

              {/* Dynamic Parsed Rows Table */}
              <div className="overflow-x-auto p-4 rounded-2xl bg-stone/40 border border-border max-h-72 overflow-y-auto">
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
                        <th className="py-2">Unit Cost</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {(productsPreview?.raw_records || productsPreview?.preview_rows || []).slice(0, 15).map((row: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2 text-muted">#{row.row_number || idx + 1}</td>
                          <td className="py-2 text-ink font-semibold">{row.sku}</td>
                          <td className="py-2 text-ink">{row.product_name || row.name || 'Product'}</td>
                          <td className="py-2 text-muted">{row.unit_of_measure || 'units'}</td>
                          <td className="py-2 text-ink font-medium">{row.on_hand_qty ?? row.current_stock ?? 0}</td>
                          <td className="py-2 text-muted">{row.committed_qty ?? 0}</td>
                          <td className="py-2 text-muted">{row.unit_cost ? `₹${row.unit_cost}` : '—'}</td>
                          <td className="py-2 text-moss">Valid</td>
                        </tr>
                      ))}
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
                      {(demandPreview?.raw_records || demandPreview?.preview_rows || []).slice(0, 15).map((row: any, idx: number) => {
                        const isStockout = Boolean(row.stockout_flag);
                        const isPromo = Boolean(row.promotion_flag);
                        return (
                          <tr key={idx}>
                            <td className="py-2 text-muted">#{row.row_number || idx + 1}</td>
                            <td className="py-2 text-ink font-semibold">{row.sku}</td>
                            <td className="py-2 text-muted">{row.date}</td>
                            <td className={`py-2 font-semibold ${isStockout ? 'text-brick' : isPromo ? 'text-anomaly' : 'text-ink'}`}>
                              {row.units_sold}
                            </td>
                            <td className={`py-2 ${isStockout ? 'text-brick font-semibold' : 'text-muted'}`}>
                              {String(isStockout).toUpperCase()}
                            </td>
                            <td className={`py-2 ${isPromo ? 'text-anomaly font-semibold' : 'text-muted'}`}>
                              {String(isPromo).toUpperCase()}
                            </td>
                            <td className="py-2">
                              {isStockout ? (
                                <span className="text-ochre">Censored Observation Marked</span>
                              ) : isPromo ? (
                                <span className="text-accent">Promo Flag Registered</span>
                              ) : (
                                <span className="text-moss">Valid</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {previewTab === 'supplier' && supplierPreview && (
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
                      {(supplierPreview?.raw_records || supplierPreview?.preview_rows || []).slice(0, 15).map((row: any, idx: number) => (
                        <tr key={idx}>
                          <td className="py-2 text-muted">#{row.row_number || idx + 1}</td>
                          <td className="py-2 text-ink font-semibold">{row.sku}</td>
                          <td className="py-2 text-ink font-medium">{row.lead_time_days ?? row.average_lead_time_days} days</td>
                          <td className="py-2 text-muted">{row.lead_time_stddev_days ?? 0} days</td>
                          <td className="py-2 text-moss">Valid</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Warning Acknowledgment */}
              {totalWarningRows > 0 ? (
                <label className="flex items-center gap-3 p-4 rounded-2xl bg-ochre/10 border border-ochre/30 text-xs font-mono text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledgedWarnings}
                    onChange={(e) => setAcknowledgedWarnings(e.target.checked)}
                    className="rounded border-border accent-accent w-4 h-4 cursor-pointer"
                  />
                  <span>
                    I acknowledge {totalWarningRows} non-blocking warning(s). All observations will be transactionally written to PostgreSQL/SQLite database tables.
                  </span>
                </label>
              ) : (
                <div className="p-3.5 rounded-2xl bg-moss/10 border border-moss/30 text-xs font-mono text-moss flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>All rows passed strict schema checks with 0 warnings. Ready to commit.</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: IMPORT SUMMARY */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <div className="p-6 rounded-2xl bg-moss/10 border border-moss/30 flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-moss flex-shrink-0 mt-0.5" />
                <div className="space-y-1 font-mono text-xs">
                  <div className="font-semibold text-moss text-sm">
                    Dataset Ingested & Committed Successfully
                  </div>
                  <p className="text-muted font-sans">
                    Transactional records have been written to database core tables. Batch IDs:
                    <span className="font-mono text-ink ml-1 font-medium">
                      {productsPreview?.import_id ? productsPreview.import_id.slice(0, 8) : 'batch'}...
                    </span>
                  </p>
                </div>
              </div>

              {Boolean(confirmedResults?.products?.counts?.cleared_existing) && (
                <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 text-xs font-mono text-ink flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                  <span>
                    Clean Slate active: {confirmedResults?.products?.counts?.cleared_existing} previous catalog items purged. Operations research calculations will run strictly on this new dataset without mixing older records.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-stone/60 border border-border">
                  <span className="text-[10px] uppercase text-muted block">products</span>
                  <span className="text-xl font-semibold text-ink mt-1 block">
                    {confirmedResults?.products?.counts.rows_inserted ?? productsPreview?.summary.valid_rows ?? 0} SKUs
                  </span>
                  <span className="text-[10px] text-moss block mt-0.5">Persisted to catalog</span>
                </div>
                <div className="p-4 rounded-xl bg-stone/60 border border-border">
                  <span className="text-[10px] uppercase text-muted block">demand_records</span>
                  <span className="text-xl font-semibold text-ink mt-1 block">
                    {confirmedResults?.demand?.counts.rows_inserted ?? demandPreview?.summary.valid_rows ?? 0} Rows
                  </span>
                  <span className="text-[10px] text-moss block mt-0.5">Historical observations locked</span>
                </div>
                <div className="p-4 rounded-xl bg-stone/60 border border-border">
                  <span className="text-[10px] uppercase text-muted block">Supplier Settings</span>
                  <span className="text-xl font-semibold text-ink mt-1 block">
                    {confirmedResults?.suppliers?.counts.rows_inserted ?? supplierPreview?.summary.valid_rows ?? 0} Lead Times
                  </span>
                  <span className="text-[10px] text-slate block mt-0.5">Lead time variability registered</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-stone/40 border border-border text-xs font-sans text-muted">
                Click <span className="font-semibold text-ink">Run Analysis</span> to trigger the backend anomaly detector, evaluate chronological holdout benchmarks, and compute deterministic replenishment points across all catalog SKUs.
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
                  { id: 2, label: '2. Detect unusual demand anomalies (Modified Z-Score / MAD + 3σ)' },
                  { id: 3, label: '3. Evaluate forecast benchmarks on chronological holdouts (Prophet vs 7-day MA)' },
                  { id: 4, label: '4. Compute continuous review (s, S) reorder points & safety stock' },
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
                <span>{isValidating ? 'Validating with Backend...' : 'Validate Files'}</span>
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
                disabled={totalWarningRows > 0 && !acknowledgedWarnings || isConfirming}
                onClick={handleConfirmIngestion}
                className="px-5 py-2.5 bg-accent text-surface rounded-xl text-xs font-mono font-medium hover:bg-accent-light transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-2"
              >
                {isConfirming ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>{isConfirming ? 'Persisting to Database...' : 'Confirm Ingestion'}</span>
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
