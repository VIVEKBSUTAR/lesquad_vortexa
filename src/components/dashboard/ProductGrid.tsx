'use client';

import React from 'react';
import { ProductWithComputed } from '@/lib/types';
import { ArrowUpRight, Box, Clock, Layers, ShieldCheck, AlertCircle } from 'lucide-react';

interface ProductGridProps {
  products: ProductWithComputed[];
  onSelectProduct: (product: ProductWithComputed) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  onSelectProduct,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="font-serif text-2xl text-ink font-normal">
            Autonomous Replenishment Roster
          </h3>
          <p className="text-muted text-xs font-sans mt-0.5">
            8 monitored industrial SKUs. Click any product to inspect mathematical audit trail.
          </p>
        </div>
        <div className="font-mono text-xs text-muted">
          Showing 8 Active SKUs
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((p) => {
          const statusConfig = {
            healthy: {
              color: 'text-moss',
              bg: 'bg-moss/10',
              border: 'border-moss/30',
              dot: 'bg-moss',
              label: 'Healthy Nominal',
            },
            watch: {
              color: 'text-ochre',
              bg: 'bg-ochre/10',
              border: 'border-ochre/30',
              dot: 'bg-ochre',
              label: 'Buffer Watch',
            },
            order: {
              color: 'text-brick',
              bg: 'bg-brick/10',
              border: 'border-brick/30',
              dot: 'bg-brick',
              label: 'Order Triggered',
            },
          }[p.metrics.status];

          return (
            <div
              key={p.id}
              onClick={() => onSelectProduct(p)}
              className="bg-surface rounded-xl border border-border p-5 hover:border-ink hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Header: SKU & Status */}
                <div className="flex justify-between items-center mb-3">
                  <span className="font-mono text-xs font-semibold text-muted">
                    {p.sku}
                  </span>
                  <div
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono font-medium ${statusConfig.color} ${statusConfig.bg} ${statusConfig.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                    <span>{statusConfig.label}</span>
                  </div>
                </div>

                {/* Name & Category */}
                <h4 className="font-serif text-lg text-ink font-normal leading-snug group-hover:text-accent transition-colors">
                  {p.name}
                </h4>
                <div className="text-[11px] text-muted font-sans mt-1">
                  {p.category}
                </div>
              </div>

              {/* Data Grid */}
              <div className="mt-5 pt-4 border-t border-border grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <div className="text-[10px] uppercase text-muted">Inventory Pos</div>
                  <div className="text-sm font-semibold text-ink mt-0.5">
                    {p.metrics.inventoryPosition}{' '}
                    <span className="text-[10px] text-muted font-normal">units</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase text-muted">Reorder Point</div>
                  <div className="text-sm font-semibold text-brick mt-0.5">
                    {Math.round(p.metrics.reorderPoint)}{' '}
                    <span className="text-[10px] text-muted font-normal">ROP</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase text-muted">Safety Stock</div>
                  <div className="text-sm font-semibold text-moss mt-0.5">
                    {Math.round(p.metrics.safetyStock)}{' '}
                    <span className="text-[10px] text-muted font-normal">SS</span>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase text-muted">Days of Cover</div>
                  <div className="text-sm font-semibold text-ink mt-0.5">
                    {p.metrics.daysOfCover}d
                  </div>
                </div>
              </div>

              {/* Footer row */}
              <div className="mt-4 pt-3 border-t border-border/60 flex justify-between items-center text-[10px] font-mono text-muted">
                <span>SL: {(p.targetServiceLevel * 100).toFixed(0)}%</span>
                <span className="group-hover:text-ink flex items-center gap-0.5 transition-colors">
                  Audit <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
