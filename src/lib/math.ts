/**
 * StockSense Deterministic Operations Research Replenishment Engine
 * 
 * CORE ARCHITECTURAL PRINCIPLE:
 * Deterministic mathematics dictates inventory thresholds (Safety Stock, ROP, EOQ).
 * Machine learning / heuristic AI NEVER overrides these mathematical bounds;
 * it is strictly isolated to classifying and clamping historical demand anomalies.
 */

import { ComputedMetrics, Product, ProductStatus } from './types';

/**
 * Calculates arithmetic mean.
 */
export function calculateMean(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculates sample variance (N - 1 denominator, or N if N=1).
 */
export function calculateVariance(values: number[]): number {
  if (!values || values.length <= 1) return 0;
  const mean = calculateMean(values);
  const sumSquaredDiff = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
  return sumSquaredDiff / (values.length - 1);
}

/**
 * Calculates sample standard deviation.
 */
export function calculateStandardDeviation(values: number[]): number {
  return Math.sqrt(calculateVariance(values));
}

/**
 * High-accuracy rational approximation of the Inverse Normal Cumulative Distribution Function (Quantile function).
 * Converts target service level probability P in (0, 1) into Z-Score.
 * Accurate to within 1.15e-9 across standard ranges.
 * e.g., 0.90 -> ~1.2816, 0.95 -> ~1.6449, 0.99 -> ~2.3263.
 */
export function calculateZScore(serviceLevel: number): number {
  if (serviceLevel <= 0.0001) return -3.719;
  if (serviceLevel >= 0.9999) return 3.719;

  // Coefficients in rational approximations
  const a = [
    -3.969683028665376e1,
    2.209460984245205e2,
    -2.759285104469687e2,
    1.38357751867269e2,
    -3.066479806614716e1,
    2.506628277459239e0,
  ];

  const b = [
    -5.447609879822406e1,
    1.615858368580409e2,
    -1.556989798598866e2,
    6.680131188771972e1,
    -1.328068155288572e1,
  ];

  const c = [
    -7.784894002430293e-3,
    -3.223964580411365e-1,
    -2.400758277161838e0,
    -2.549732539343734e0,
    4.374664141464968e0,
    2.938163982698783e0,
  ];

  const d = [
    7.784695709041462e-3,
    3.224671290700398e-1,
    2.445134137142996e0,
    3.754408661907416e0,
  ];

  const q = serviceLevel - 0.5;

  if (Math.abs(q) <= 0.42) {
    const r = q * q;
    return (
      (q *
        (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5])) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1.0)
    );
  }

  const r = serviceLevel < 0.5 ? serviceLevel : 1.0 - serviceLevel;
  const s = Math.sqrt(-Math.log(r));
  let z =
    (((((c[0] * s + c[1]) * s + c[2]) * s + c[3]) * s + c[4]) * s + c[5]) /
    ((((d[0] * s + d[1]) * s + d[2]) * s + d[3]) * s + 1.0);

  return serviceLevel < 0.5 ? -z : z;
}

/**
 * EXACT DETERMINISTIC FORMULA 1:
 * Safety Stock (SS) with stochastic demand AND stochastic lead time:
 * SS = Z-Score * SQRT((Avg_Lead_Time * Demand_Variance) + (Avg_Demand^2 * Lead_Time_Variance))
 */
export function calculateSafetyStock(
  avgLeadTime: number,
  demandVariance: number,
  avgDemand: number,
  leadTimeVariance: number,
  zScore: number
): number {
  const demandTerm = Math.max(0, avgLeadTime * demandVariance);
  const leadTimeTerm = Math.max(0, Math.pow(avgDemand, 2) * leadTimeVariance);
  const combinedSigma = Math.sqrt(demandTerm + leadTimeTerm);
  return Math.max(0, zScore * combinedSigma);
}

/**
 * EXACT DETERMINISTIC FORMULA 2:
 * Reorder Point (ROP) = (Avg_Demand * Avg_Lead_Time) + SS
 */
export function calculateReorderPoint(
  avgDemand: number,
  avgLeadTime: number,
  safetyStock: number
): number {
  return Math.max(0, avgDemand * avgLeadTime + safetyStock);
}

/**
 * EXACT DETERMINISTIC FORMULA 3:
 * Economic Order Quantity (EOQ) = SQRT((2 * Annual_Demand * Ordering_Cost) / Holding_Cost)
 */
export function calculateEOQ(
  annualDemand: number,
  orderingCost: number,
  holdingCost: number
): number {
  if (holdingCost <= 0) return 0;
  return Math.sqrt((2 * Math.max(0, annualDemand) * orderingCost) / holdingCost);
}

/**
 * EXACT DETERMINISTIC FORMULA 4:
 * Inventory Position = On_Hand + On_Order - Backorders
 */
export function calculateInventoryPosition(
  onHand: number,
  onOrder: number,
  backorders: number
): number {
  return onHand + onOrder - backorders;
}

/**
 * Computes all operational metrics for a product, applying AI anomaly clamping
 * to protect variance from artificial blowup.
 */
export function computeProductMetrics(
  product: Product,
  serviceLevelOverride?: number,
  leadTimeOffset: number = 0,
  demandMultiplier: number = 1.0
): ComputedMetrics {
  // 1. Apply AI anomaly clamping to demand data
  const cleanedDemand = [...product.dailyDemand].map((val) => val * demandMultiplier);
  product.anomalies.forEach((anomaly) => {
    if (anomaly.day >= 1 && anomaly.day <= cleanedDemand.length) {
      cleanedDemand[anomaly.day - 1] = anomaly.adj * demandMultiplier;
    }
  });

  // 2. Adjust observed lead times
  const adjustedLeadTimes = product.leadTimes.map((lt) => Math.max(1, lt + leadTimeOffset));

  const avgDemand = calculateMean(cleanedDemand);
  const demandVariance = calculateVariance(cleanedDemand);
  const demandStdDev = Math.sqrt(demandVariance);

  const avgLeadTime = calculateMean(adjustedLeadTimes);
  const leadTimeVariance = calculateVariance(adjustedLeadTimes);
  const leadTimeStdDev = Math.sqrt(leadTimeVariance);

  const targetSL = serviceLevelOverride ?? product.targetServiceLevel;
  const zScore = calculateZScore(targetSL);

  const safetyStock = calculateSafetyStock(
    avgLeadTime,
    demandVariance,
    avgDemand,
    leadTimeVariance,
    zScore
  );

  const reorderPoint = calculateReorderPoint(avgDemand, avgLeadTime, safetyStock);

  const annualDemand = avgDemand * 365;
  const rawEoq = calculateEOQ(annualDemand, product.orderingCost, product.holdingCost);
  let eoq = rawEoq;
  if (product.packSize && product.packSize > 1) {
    eoq = Math.ceil(eoq / product.packSize) * product.packSize;
  }
  if (product.minimumOrderQty && product.minimumOrderQty > 1) {
    eoq = Math.max(product.minimumOrderQty, eoq);
  }

  // Schema Note: On-Hand minus committed quantity
  const inventoryPosition = Math.max(0, product.onHand - (product.committedQty || 0));

  // Status classification: Moss (healthy), Ochre (watch), Brick (order-now)
  let status: ProductStatus = 'healthy';
  if (inventoryPosition <= reorderPoint) {
    status = 'order';
  } else if (inventoryPosition <= reorderPoint * 1.25) {
    status = 'watch';
  }

  const daysOfCover = avgDemand > 0 ? Math.round(inventoryPosition / avgDemand) : 999;
  const annualHoldingCost = (safetyStock + eoq / 2) * product.holdingCost;

  // Stockout risk estimation based on normal approximation of current inventory vs lead time demand
  const stdLTD = Math.sqrt(
    Math.max(0, avgLeadTime * demandVariance + Math.pow(avgDemand, 2) * leadTimeVariance)
  );
  let stockoutRiskPct = (1 - targetSL) * 100;
  if (stdLTD > 0) {
    const k = (inventoryPosition - avgDemand * avgLeadTime) / stdLTD;
    if (k <= 0) {
      stockoutRiskPct = 50 + Math.min(50, Math.abs(k) * 20);
    } else {
      stockoutRiskPct = Math.max(0.01, (1 - normalCDF(k)) * 100);
    }
  }

  return {
    avgDemand,
    demandVariance,
    demandStdDev,
    avgLeadTime,
    leadTimeVariance,
    leadTimeStdDev,
    zScore,
    safetyStock,
    reorderPoint,
    rawEoq,
    eoq,
    inventoryPosition,
    status,
    daysOfCover,
    annualHoldingCost,
    stockoutRiskPct,
    cleanedDemand,
  };
}

/**
 * Standard Normal Cumulative Distribution Function (error function approximation)
 */
export function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

/**
 * Computes Mean Absolute Error (MAE)
 */
export function calculateMAE(actual: number[], predicted: number[]): number {
  if (!actual.length || actual.length !== predicted.length) return 0;
  let totalError = 0;
  for (let i = 0; i < actual.length; i++) {
    totalError += Math.abs(actual[i] - predicted[i]);
  }
  return totalError / actual.length;
}
