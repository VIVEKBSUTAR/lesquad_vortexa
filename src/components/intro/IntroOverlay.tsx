'use client';

import React, { useEffect, useState } from 'react';
import { FastForward } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col justify-between p-6 sm:p-10 transition-opacity duration-1000">
      {/* Top Bar Indicator */}
      <div className="flex justify-between items-center w-full">
        <div className="bg-surface/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-border shadow-xs font-mono text-[11px] text-muted flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
          <span>Orbital Revolutions Active (0-7s)</span>
        </div>

        {/* Skip to App Button */}
        <button
          onClick={onSkip}
          className="pointer-events-auto px-5 py-2 rounded-full bg-surface/95 backdrop-blur-md border border-border hover:border-ink hover:bg-ink hover:text-surface text-ink text-xs font-mono font-medium transition-all duration-300 shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <span>Skip to App</span>
          <FastForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center Hero Card - Fully protected with a clean, high-contrast, frosted surface */}
      <div className="my-auto pointer-events-auto">
        <div className="bg-surface/95 backdrop-blur-2xl border border-border rounded-3xl p-8 sm:p-12 max-w-2xl mx-auto shadow-premium text-center space-y-4">
          <h1 className="font-serif text-5xl sm:text-7xl font-light text-ink tracking-tight select-none">
            StockSense
          </h1>
          <p className="font-sans text-muted text-base sm:text-lg font-light tracking-wide">
            Inventory decisions you can check.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono text-muted pt-2 border-t border-border/60">
            <span>Stochastic Lead Time</span>
            <span>•</span>
            <span>Variance-Bounded Clamps</span>
            <span>•</span>
            <span>Pure Operations Research</span>
          </div>
        </div>
      </div>

      {/* Bottom Progress Bar */}
      <div className="w-full max-w-sm mx-auto space-y-2 text-center bg-surface/90 backdrop-blur-md p-3.5 rounded-2xl border border-border shadow-xs">
        <div className="h-[2px] w-full bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-75 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-muted">
          <span>Camera Trajectory Plunge</span>
          <span>{(7 * (1 - progress)).toFixed(1)}s remaining</span>
        </div>
      </div>
    </div>
  );
};
