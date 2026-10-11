'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';

interface NetworkTickerProps {
  initialValue: number;
}

export const NetworkTicker: React.FC<NetworkTickerProps> = ({ initialValue }) => {
  const [currentValue, setCurrentValue] = useState(initialValue);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setCurrentValue(initialValue);
  }, [initialValue]);

  const handleSimulateShift = () => {
    setIsAnimating(true);
    // Introduce random network shift between +15% and +40%
    const shiftMultiplier = 1.15 + Math.random() * 0.35;
    const nextVal = Math.round(initialValue * shiftMultiplier);
    setCurrentValue(nextVal);
    setTimeout(() => setIsAnimating(false), 800);
  };

  const handleReset = () => {
    setCurrentValue(initialValue);
  };

  const digits = Math.round(currentValue).toString().split('');

  return (
    <div className="bg-surface rounded-xl border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted">
          Global Operations Metric
        </div>
        <div className="text-base font-serif text-ink mt-0.5 font-normal">
          Aggregate Network Safety Buffer
        </div>
        <div className="text-[11px] text-muted font-sans mt-0.5">
          Sum of all 8 SKU deterministic safety stocks across warehouse hubs
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Mechanical rolling digit ticker */}
        <div className="flex items-center bg-stone px-4 py-2.5 rounded-lg border border-border shadow-inner font-mono text-2xl font-semibold text-moss">
          {digits.map((digit, i) => (
            <div
              key={i}
              className="inline-block overflow-hidden h-[1.25em] leading-[1.25em] w-[0.65em] text-center"
            >
              <div
                className="transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  transform: `translateY(-${parseInt(digit, 10)}em)`,
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <div key={num} className="h-[1.25em] leading-[1.25em]">
                    {num}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <span className="text-xs text-muted ml-2 font-normal">units</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateShift}
            disabled={isAnimating}
            className="px-3.5 py-2.5 bg-stone border border-border hover:border-ink rounded-lg text-xs font-mono text-ink transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Simulate upstream network shock"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnimating ? 'animate-spin' : ''}`} />
            <span>Shift Network</span>
          </button>
          {currentValue !== initialValue && (
            <button
              onClick={handleReset}
              className="px-2.5 py-2.5 text-xs font-mono text-muted hover:text-ink transition-colors cursor-pointer"
              title="Reset to base"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
