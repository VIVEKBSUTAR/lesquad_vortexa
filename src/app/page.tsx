'use client';

import React, { useState, useEffect } from 'react';
import { ProductWithComputed } from '@/lib/types';
import { apiClient } from '@/lib/api';
import { Header, ActiveNavTab } from '@/components/navigation/Header';
import { ProductShowcase } from '@/components/product/ProductShowcase';
import { OverviewView } from '@/components/views/OverviewView';
import { InventoryView } from '@/components/views/InventoryView';
import { DemandInsightsView } from '@/components/views/DemandInsightsView';
import { ScenarioLabView } from '@/components/views/ScenarioLabView';

export default function Home() {
  const [products, setProducts] = useState<ProductWithComputed[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('product');
  const [selectedProduct, setSelectedProduct] = useState<ProductWithComputed | null>(null);
  const [isLiveBackend, setIsLiveBackend] = useState(false);

  // Initialize product data on mount
  useEffect(() => {
    const loadData = async () => {
      await apiClient.getHealth();
      setIsLiveBackend(apiClient.isConnectedToLiveBackend);
      const prods = await apiClient.getProducts();
      setProducts(prods);
      if (prods.length > 0) setSelectedProduct(prods[0]);
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

  const handleSimulateInCrisis = (p: ProductWithComputed) => {
    setSelectedProduct(p);
    setActiveTab('scenario');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const refreshProducts = async () => {
    const prods = await apiClient.getProducts();
    setProducts(prods);
  };

  if (!products.length) {
    return (
      <div className="min-h-screen bg-stone flex items-center justify-center font-mono text-xs text-muted">
        Initializing deterministic operations research engine...
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
          isConnectedToLiveBackend={isLiveBackend}
        />

        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'product' && (
            <ProductShowcase
              products={products}
              onNavigateToTab={(tab) => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSimulateInCrisis={handleSimulateInCrisis}
            />
          )}

          {activeTab === 'overview' && (
            <OverviewView
              products={products}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onSimulateInCrisis={handleSimulateInCrisis}
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
    </div>
  );
}
