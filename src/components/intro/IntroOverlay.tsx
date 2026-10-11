'use client';

import React, { useEffect, useState } from 'react';
import { ArrowDown, Play, FastForward } from 'lucide-react';

interface IntroOverlayProps {
  onSkip: () => void;
  isIntroActive: boolean;
}

export const IntroOverlay: React.FC<IntroOverlayProps> = ({ onSkip, isIntroActive }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isIntroActive) return;

    const startTime = performance.now();
    const duration = 7000; // 7 seconds intro

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const p = Math.min(1, elapsed / duration);
      setProgress(p);

      if (p >= 1) {
        clearInterval(interval);
        onSkip();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isIntroActive, onSkip]);

  if (!isIntroActive) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between p-8 sm:p-12 transition-opacity duration-1000">
      {/* Top Bar Indicator */}
      <div className="flex justify-between items-center w-full">
        <div className="font-mono text-xs text-muted flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
          Sequence 01 : Procedural Product Orbit (0-7s)
        </div>

        {/* Skip to App Button */}
        <button
          onClick={onSkip}
          className="pointer-events-auto px-5 py-2 rounded-full bg-surface/90 backdrop-blur border border-border hover:border-ink hover:bg-ink hover:text-surface text-ink text-xs font-mono font-medium transition-all duration-300 shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <span>Skip to App</span>
          <FastForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center Hero Wordmark */}
      <div className="text-center my-auto space-y-4">
        <div className="overflow-hidden">
          <h1 className="font-serif text-6xl sm:text-8xl md:text-9xl font-light text-ink tracking-tight select-none drop-shadow-sm">
            StockSense
          </h1>
        </div>
        <p className="font-sans text-muted text-base sm:text-xl font-light tracking-wide max-w-xl mx-auto">
          Inventory decisions you can check.
        </p>
        <div className="flex items-center justify-center gap-4 text-xs font-mono text-muted pt-2">
          <span>Stochastic Lead Time</span>
          <span>•</span>
          <span>Variance-Bounded Clamps</span>
          <span>•</span>
          <span>Zero Hallucinations</span>
        </div>
      </div>

      {/* Bottom Progress Bar & Scroll Prompt */}
      <div className="w-full max-w-md mx-auto space-y-3 text-center">
        <div className="h-[2px] w-full bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-75 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-mono text-muted">
          <span>Orbital Revolutions Active</span>
          <span>Camera Plunge in {(7 * (1 - progress)).toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
};
