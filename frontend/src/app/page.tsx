'use client';

import React, { useState, useEffect } from 'react';
import { ProductWithComputed } from '@/lib/types';
import { apiClient } from '@/lib/api';
import { calculateZScore, computeProductMetrics } from '@/lib/math';
import { TopBar } from '@/components/navigation/TopBar';
import { Sidebar } from '@/components/navigation/Sidebar';
import { ActiveNavTab } from '@/components/navigation/Header';
import { ProductShowcase } from '@/components/product/ProductShowcase';
import { OverviewView } from '@/components/views/OverviewView';
import { InventoryView } from '@/components/views/InventoryView';
import { DemandInsightsView } from '@/components/views/DemandInsightsView';
import { ScenarioLabView } from '@/components/views/ScenarioLabView';
import { ImportWizardModal } from '@/components/modals/ImportWizardModal';
import { FormulasAssumptionsModal } from '@/components/modals/FormulasAssumptionsModal';

export default function Home() {
  const [products, setProducts] = useState<ProductWithComputed[]>([]);
  // Default to the full-width animated landing showcase tour upon first visit
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('product');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithComputed | null>(null);
  const [isLiveBackend, setIsLiveBackend] = useState(false);
  const [serviceLevel, setServiceLevel] = useState(0.95);
  const [isFormulasModalOpen, setIsFormulasModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('DarkStore Fleet Alpha');
  const [dataStatus, setDataStatus] = useState<
    'not_imported' | 'imported' | 'analysis_ready' | 'needs_review'
  >('analysis_ready');

  const zScore = calculateZScore(serviceLevel);

  // Initialize product data on mount
  useEffect(() => {
    const loadData = async () => {
      await apiClient.getHealth();
      setIsLiveBackend(apiClient.isConnectedToLiveBackend);
      const prods = await apiClient.getProducts();
      // Apply initial service level to computed metrics
      const updated = prods.map((p) => ({
        ...p,
        metrics: computeProductMetrics(p, serviceLevel),
      }));
      setProducts(updated);
      if (updated.length > 0) setSelectedProduct(updated[0]);
    };
    loadData();

    // Check query params if user bookmarked a specific view
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (
        tabParam === 'overview' ||
        tabParam === 'inventory' ||
        tabParam === 'demand' ||
        tabParam === 'scenario' ||
        tabParam === 'product'
      ) {
        setActiveTab(tabParam as ActiveNavTab);
      }
    }
  }, []);

  // Recalculate metrics when global target service level changes
  const handleSelectServiceLevel = (level: number) => {
    setServiceLevel(level);
    setProducts((prev) =>
      prev.map((p) => ({
        ...p,
        targetServiceLevel: level,
        metrics: computeProductMetrics(p, level),
      }))
    );
  };

  const handleSimulateInCrisis = (p: ProductWithComputed) => {
    setSelectedProduct(p);
    setActiveTab('scenario');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProductFromOverview = (p: ProductWithComputed) => {
    setSelectedProduct(p);
    setActiveTab('inventory');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImportComplete = async (importedDatasetName: string) => {
    setWorkspaceName(importedDatasetName || 'DarkStore Fleet Alpha');
    setDataStatus('analysis_ready');
    await refreshProducts();
    setActiveTab('overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const refreshProducts = async () => {
    const prods = await apiClient.getProducts();
    const updated = prods.map((p) => ({
      ...p,
      metrics: computeProductMetrics(p, serviceLevel),
    }));
    setProducts(updated);
  };

  if (!products.length) {
    return (
      <div className="min-h-screen bg-stone flex items-center justify-center font-mono text-xs text-muted">
        Initializing deterministic operations research engine for dark store inventory...
      </div>
    );
  }

  const isTour = activeTab === 'product';

  return (
    <div className="relative min-h-screen bg-stone selection:bg-accent/20">
      {/* Subtle filmic grain overlay */}
      <div className="grain-overlay" />

      {/* Main Persistent Application Shell */}
      <div className="relative z-20 flex flex-col min-h-screen">
        {/* Top Bar */}
        <TopBar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          serviceLevel={serviceLevel}
          onSelectServiceLevel={handleSelectServiceLevel}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          onOpenFormulasModal={() => setIsFormulasModalOpen(true)}
          workspaceName={workspaceName}
          dataStatus={dataStatus}
          isLiveBackend={isLiveBackend}
        />

        {/* Conditional Layout: Full-width Landing Tour vs Persistent Dashboard Shell */}
        {isTour ? (
          /* Full-width Immersive Landing Page */
          <main className="w-full">
            <ProductShowcase
              products={products}
              serviceLevel={serviceLevel}
              zScore={zScore}
              onNavigateToTab={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSimulateInCrisis={handleSimulateInCrisis}
              onOpenFormulasModal={() => setIsFormulasModalOpen(true)}
            />
          </main>
        ) : (
          /* Workspace Shell with Left Sidebar */
          <div className="flex flex-1">
            {/* Left Persistent Sidebar */}
            <Sidebar
              activeTab={activeTab}
              onSelectTab={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenFormulasModal={() => setIsFormulasModalOpen(true)}
              workspaceName={workspaceName}
              dataStatus={dataStatus}
            />

            {/* Main Dashboard Area */}
            <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
              {activeTab === 'overview' && (
                <OverviewView
                  products={products}
                  serviceLevel={serviceLevel}
                  zScore={zScore}
                  onNavigateToTab={(tab) => {
                    setActiveTab(tab);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onSelectProduct={handleSelectProductFromOverview}
                  onOpenImportModal={() => setIsImportModalOpen(true)}
                  onOpenFormulasModal={() => setIsFormulasModalOpen(true)}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryView
                  products={products}
                  onRefreshProducts={refreshProducts}
                  onSimulateInCrisis={handleSimulateInCrisis}
                  onOpenImportModal={() => setIsImportModalOpen(true)}
                  onOpenFormulasModal={() => setIsFormulasModalOpen(true)}
                  initialSelectedProduct={selectedProduct}
                />
              )}

              {activeTab === 'demand' && (
                <DemandInsightsView products={products} />
              )}

              {activeTab === 'scenario' && (
                <ScenarioLabView
                  products={products}
                  selectedProduct={selectedProduct || products[0]}
                  onSelectProduct={setSelectedProduct}
                />
              )}
            </main>
          </div>
        )}
      </div>

      {/* Guided 5-Step CSV Import Workflow Modal */}
      <ImportWizardModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />

      {/* Operational Formulas & Assumptions Modal */}
      <FormulasAssumptionsModal
        isOpen={isFormulasModalOpen}
        onClose={() => setIsFormulasModalOpen(false)}
        currentServiceLevel={serviceLevel}
        currentZScore={zScore}
      />
    </div>
  );
}
