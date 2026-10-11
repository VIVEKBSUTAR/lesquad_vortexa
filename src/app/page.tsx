'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getProductsWithComputed } from '@/lib/data';
import { ProductWithComputed } from '@/lib/types';
import { apiClient } from '@/lib/api';
import { StockSense3D } from '@/components/canvas/StockSense3D';
import { Header, ActiveNavTab } from '@/components/navigation/Header';
import { StoryView } from '@/components/story/StoryView';
import { OverviewView } from '@/components/views/OverviewView';
import { InventoryView } from '@/components/views/InventoryView';
import { DemandInsightsView } from '@/components/views/DemandInsightsView';
import { ScenarioLabView } from '@/components/views/ScenarioLabView';
import { IntroOverlay } from '@/components/intro/IntroOverlay';

export default function Home() {
  const [products, setProducts] = useState<ProductWithComputed[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('story');
  const [isIntroActive, setIsIntroActive] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeChapter, setActiveChapter] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithComputed | null>(null);
  const [isLiveBackend, setIsLiveBackend] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    const loadData = async () => {
      const health = await apiClient.getHealth();
      setIsLiveBackend(apiClient.isConnectedToLiveBackend);
      const prods = await apiClient.getProducts();
      setProducts(prods);
      if (prods.length > 0) setSelectedProduct(prods[0]);
    };
    loadData();

    // Check query params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('skip') === '1') {
        setIsIntroActive(false);
        setActiveTab('overview');
      }
    }
  }, []);

  // Window scroll tracking for 3D camera path during Story mode
  useEffect(() => {
    if (activeTab !== 'story' || isIntroActive) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0;
      setScrollProgress(progress);

      const chIndex = Math.min(4, Math.floor(progress * 5));
      setActiveChapter(chIndex);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab, isIntroActive]);

  const handleSkipIntro = () => {
    setIsIntroActive(false);
  };

  const handleEnterDashboard = () => {
    setIsIntroActive(false);
    setActiveTab('overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectChapter = (chIndex: number) => {
    const targetElement = document.getElementById(`chapter-${chIndex}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

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

  const isStoryMode = activeTab === 'story';

  return (
    <div className="relative min-h-screen bg-stone selection:bg-accent/20">
      {/* Subtle filmic grain overlay */}
      <div className="grain-overlay" />

      {/* Persistent Single 3D WebGL Canvas */}
      <StockSense3D
        products={products}
        mode={isStoryMode ? 'story' : 'dashboard'}
        scrollProgress={scrollProgress}
        introCompleted={!isIntroActive}
        onIntroComplete={() => setIsIntroActive(false)}
      />

      {/* Sequence 1: Orbital Intro Overlay */}
      <IntroOverlay
        isIntroActive={isIntroActive}
        onSkip={handleSkipIntro}
      />

      {/* Main DOM Layer */}
      <div className={`relative z-20 transition-opacity duration-700 ${isIntroActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <Header
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          showSkipIntro={isIntroActive}
          onSkipIntro={handleEnterDashboard}
          isConnectedToLiveBackend={isLiveBackend}
        />

        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'story' && (
            <StoryView
              products={products}
              activeChapter={activeChapter}
              onSelectChapter={handleSelectChapter}
              onEnterDashboard={handleEnterDashboard}
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
