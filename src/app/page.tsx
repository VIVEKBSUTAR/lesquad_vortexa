'use client';

import React, { useState, useEffect } from 'react';
import { ProductWithComputed } from '@/lib/types';
import { apiClient } from '@/lib/api';
import { calculateZScore, computeProductMetrics } from '@/lib/math';
import { Header, ActiveNavTab } from '@/components/navigation/Header';
import { ProductShowcase } from '@/components/product/ProductShowcase';
import { OverviewView } from '@/components/views/OverviewView';
import { InventoryView } from '@/components/views/InventoryView';
import { DemandInsightsView } from '@/components/views/DemandInsightsView';
import { ScenarioLabView } from '@/components/views/ScenarioLabView';
import { FormulasAssumptionsModal } from '@/components/modals/FormulasAssumptionsModal';

export default function Home() {
  const [products, setProducts] = useState<ProductWithComputed[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('product');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithComputed | null>(null);
  const [isLiveBackend, setIsLiveBackend] = useState(false);
  const [serviceLevel, setServiceLevel] = useState(0.95);
  const [isFormulasModalOpen, setIsFormulasModalOpen] = useState(false);

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

    // Check query params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'overview' || tabParam === 'inventory' || tabParam === 'demand' || tabParam === 'scenario') {
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

  return (
    <div className="relative min-h-screen bg-stone selection:bg-accent/20">
      {/* Subtle filmic grain overlay */}
      <div className="grain-overlay" />

      {/* Main Product Application Layer */}
      <div className="relative z-20">
        <Header
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          serviceLevel={serviceLevel}
          onSelectServiceLevel={handleSelectServiceLevel}
          onOpenFormulasModal={() => setIsFormulasModalOpen(true)}
          isConnectedToLiveBackend={isLiveBackend}
        />

        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'product' && (
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
          )}

          {activeTab === 'overview' && (
            <OverviewView
              products={products}
              serviceLevel={serviceLevel}
              zScore={zScore}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onSimulateInCrisis={handleSimulateInCrisis}
              onOpenFormulasModal={() => setIsFormulasModalOpen(true)}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              products={products}
              onRefreshProducts={refreshProducts}
              onSimulateInCrisis={handleSimulateInCrisis}
            />
          )}

          {activeTab === 'demand' && (
            <DemandInsightsView
              products={products}
            />
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
