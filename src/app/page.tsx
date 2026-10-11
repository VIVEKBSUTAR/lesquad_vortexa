'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getProductsWithComputed } from '@/lib/data';
import { ProductWithComputed } from '@/lib/types';
import { StockSense3D } from '@/components/canvas/StockSense3D';
import { Header } from '@/components/navigation/Header';
import { StoryView } from '@/components/story/StoryView';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { IntroOverlay } from '@/components/intro/IntroOverlay';

export default function Home() {
  const [products, setProducts] = useState<ProductWithComputed[]>([]);
  const [mode, setMode] = useState<'story' | 'dashboard'>('story');
  const [isIntroActive, setIsIntroActive] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeChapter, setActiveChapter] = useState(0);

  // Initialize data on client
  useEffect(() => {
    const prods = getProductsWithComputed();
    setProducts(prods);

    // Check for query param ?skip=1
    if (typeof window !== 'undefined' && window.location.search.includes('skip=1')) {
      setIsIntroActive(false);
      setMode('dashboard');
    }
  }, []);

  // Handle window scroll to synchronize with 3D camera
  useEffect(() => {
    if (mode !== 'story' || isIntroActive) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0;
      setScrollProgress(progress);

      // Map progress to chapter (0 to 4)
      const chIndex = Math.min(4, Math.floor(progress * 5));
      setActiveChapter(chIndex);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mode, isIntroActive]);

  const handleSkipIntro = () => {
    setIsIntroActive(false);
  };

  const handleEnterDashboard = () => {
    setIsIntroActive(false);
    setMode('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectChapter = (chIndex: number) => {
    const targetElement = document.getElementById(`chapter-${chIndex}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
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
      {/* Grain overlay for filmic industrial aesthetic */}
      <div className="grain-overlay" />

      {/* Persistent Single 3D WebGL Canvas */}
      <StockSense3D
        products={products}
        mode={mode}
        scrollProgress={scrollProgress}
        introCompleted={!isIntroActive}
        onIntroComplete={() => setIsIntroActive(false)}
      />

      {/* Sequence 1 Intro Overlay */}
      <IntroOverlay
        isIntroActive={isIntroActive}
        onSkip={handleSkipIntro}
      />

      {/* Main DOM UI Layer */}
      <div className={`relative z-20 transition-opacity duration-700 ${isIntroActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <Header
          mode={mode}
          onToggleMode={(newMode) => {
            setMode(newMode);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          showSkipIntro={isIntroActive}
          onSkipIntro={handleEnterDashboard}
        />

        <main className="w-full">
          {mode === 'story' ? (
            <StoryView
              products={products}
              activeChapter={activeChapter}
              onSelectChapter={handleSelectChapter}
              onEnterDashboard={handleEnterDashboard}
            />
          ) : (
            <DashboardView
              products={products}
              onBackToStory={() => {
                setMode('story');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
