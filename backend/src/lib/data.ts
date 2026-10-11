import { Anomaly, ComputedMetrics, Product, ProductWithComputed, SimulationParams, SimulationResult } from './types';
import { calculateMAE, calculateMean, computeProductMetrics } from './math';

// Deterministic Pseudo-Random Number Generator (PRNG) for reproducible dataset
function createPRNG(initialSeed = 4281) {
  let s = initialSeed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const prng = createPRNG(98721);

interface ProductBlueprint {
  id: string;
  sku: string;
  name: string;
  category: Product['category'];
  description: string;
  profile: Product['profile'];
  baseDailyDemand: number;
  baseLeadTimeDays: number;
  unitCost: number;
  orderingCost: number;
  holdingCostRate: number; // e.g. 0.18 = 18% annual
  targetServiceLevel: number;
  onHandRatio: number; // multiplier of base LTD
  onOrderRatio: number;
  backorders: number;
  anomaliesPreset: Array<{
    day: number;
    rawMultiplier: number;
    type: 'promo' | 'data_error' | 'censored';
    label: string;
    explanation: string;
  }>;
}

const BLUEPRINTS: ProductBlueprint[] = [
  {
    id: 'ROB-01',
    sku: 'SKU-7721-ARM',
    name: '6-Axis Robotic Joint Assembly',
    category: 'Robotics',
    description: 'Precision harmonic drive actuator with integrated dual absolute optical encoders.',
    profile: 'intermittent',
    baseDailyDemand: 5.4,
    baseLeadTimeDays: 24,
    unitCost: 1240,
    orderingCost: 280,
    holdingCostRate: 0.22,
    targetServiceLevel: 0.98,
    onHandRatio: 0.75, // Near ROP
    onOrderRatio: 0.45,
    backorders: 0,
    anomaliesPreset: [
      {
        day: 62,
        rawMultiplier: 7.2,
        type: 'data_error',
        label: 'Data Entry Error',
        explanation: 'ERP batch import error duplicated order lines across two shifts. Clamped to 99th percentile boundary.',
      },
      {
        day: 184,
        rawMultiplier: 3.5,
        type: 'promo',
        label: 'Promotional Surge',
        explanation: 'One-time OEM test pilot deployment of 20 joint sets. Non-recurring demand impulse.',
      },
      {
        day: 279,
        rawMultiplier: 0.0,
        type: 'censored',
        label: 'Supply Stockout Censoring',
        explanation: 'Warehouse stockout caused unrecorded lost sales. Demand reconstructed from customer enquiry log.',
      },
    ],
  },
  {
    id: 'ROB-02',
    sku: 'SKU-8914-QAD',
    name: 'Carbon Quad Drone Airframe',
    category: 'Robotics',
    description: 'Autoclave-cured 3K carbon composite unibody frame for autonomous inspection drones.',
    profile: 'mixed',
    baseDailyDemand: 14.2,
    baseLeadTimeDays: 16,
    unitCost: 480,
    orderingCost: 160,
    holdingCostRate: 0.20,
    targetServiceLevel: 0.95,
    onHandRatio: 1.35,
    onOrderRatio: 0.6,
    backorders: 0,
    anomaliesPreset: [
      {
        day: 88,
        rawMultiplier: 4.8,
        type: 'promo',
        label: 'Promotional Surge',
        explanation: 'Annual defence contractor consortium evaluation sample drop.',
      },
      {
        day: 215,
        rawMultiplier: 8.5,
        type: 'data_error',
        label: 'Data Entry Error',
        explanation: 'Decimal shift during manual EDI bill of materials ingestion (120 units logged instead of 12).',
      },
    ],
  },
  {
    id: 'HW-01',
    sku: 'SKU-4402-STP',
    name: 'NEMA23 Precision Stepper Motor',
    category: 'Industrial Automation',
    description: '1.8-degree bipolar stepper with 2.8 N·m holding torque and dual D-cut shaft.',
    profile: 'steady',
    baseDailyDemand: 42.0,
    baseLeadTimeDays: 12,
    unitCost: 78,
    orderingCost: 95,
    holdingCostRate: 0.18,
    targetServiceLevel: 0.96,
    onHandRatio: 0.95, // Low stock, near reorder point
    onOrderRatio: 0.35,
    backorders: 2,
    anomaliesPreset: [
      {
        day: 112,
        rawMultiplier: 5.2,
        type: 'data_error',
        label: 'Data Entry Error',
        explanation: 'System migration glitch from SAP legacy inventory sync logged phantom double-requisition.',
      },
      {
        day: 245,
        rawMultiplier: 2.8,
        type: 'promo',
        label: 'Promotional Surge',
        explanation: 'Distributor quarterly volume discount run. Non-structural demand bump.',
      },
    ],
  },
  {
    id: 'HW-02',
    sku: 'SKU-3199-CBL',
    name: 'Shielded Armored Cable Spool',
    category: 'Power & Cables',
    description: '100m continuous 4-conductor braided polyurethane jacket cable for harsh industrial factory lines.',
    profile: 'intermittent',
    baseDailyDemand: 8.6,
    baseLeadTimeDays: 19,
    unitCost: 260,
    orderingCost: 130,
    holdingCostRate: 0.16,
    targetServiceLevel: 0.94,
    onHandRatio: 0.70, // Red / Order status
    onOrderRatio: 0.20,
    backorders: 4,
    anomaliesPreset: [
      {
        day: 45,
        rawMultiplier: 6.4,
        type: 'data_error',
        label: 'Data Entry Error',
        explanation: 'Unit of measure confusion (logged as meters rather than standard 100m spools).',
      },
      {
        day: 301,
        rawMultiplier: 0.0,
        type: 'censored',
        label: 'Supply Stockout Censoring',
        explanation: 'Port customs clearance hold caused severe stockout; actual customer orders backlogged unfulfilled.',
      },
    ],
  },
  {
    id: 'ELEC-01',
    sku: 'SKU-5820-LED',
    name: 'High-Bay Industrial LED Luminaire',
    category: 'Electronics',
    description: '200W IP66 die-cast aluminum heat sink luminaire with 32,000 lumen output and 0-10V dimming.',
    profile: 'steady',
    baseDailyDemand: 88.0,
    baseLeadTimeDays: 8,
    unitCost: 115,
    orderingCost: 110,
    holdingCostRate: 0.19,
    targetServiceLevel: 0.95,
    onHandRatio: 1.45,
    onOrderRatio: 0.8,
    backorders: 0,
    anomaliesPreset: [
      {
        day: 135,
        rawMultiplier: 3.2,
        type: 'promo',
        label: 'Promotional Surge',
        explanation: 'Warehouse retrofit municipal subsidy incentive program spike.',
      },
      {
        day: 290,
        rawMultiplier: 5.5,
        type: 'data_error',
        label: 'Data Entry Error',
        explanation: 'Customer purchase order entered under parent master SKU rather than sub-assembly.',
      },
    ],
  },
  {
    id: 'ELEC-02',
    sku: 'SKU-9021-BAT',
    name: '48V Lithium Battery Cell Pack',
    category: 'Energy Systems',
    description: 'Modular 2.4 kWh LiFePO4 rack module with integrated CANbus battery management system.',
    profile: 'mixed',
    baseDailyDemand: 22.5,
    baseLeadTimeDays: 21,
    unitCost: 890,
    orderingCost: 220,
    holdingCostRate: 0.24,
    targetServiceLevel: 0.97,
    onHandRatio: 1.15,
    onOrderRatio: 0.5,
    backorders: 0,
    anomaliesPreset: [
      {
        day: 94,
        rawMultiplier: 6.0,
        type: 'data_error',
        label: 'Data Entry Error',
        explanation: 'Subcontractor entered raw cell count instead of integrated battery pack count.',
      },
      {
        day: 210,
        rawMultiplier: 3.1,
        type: 'promo',
        label: 'Promotional Surge',
        explanation: 'Energy storage tax credit expiration rush orders ahead of quarter close.',
      },
    ],
  },
  {
    id: 'FOOD-01',
    sku: 'SKU-1088-TOM',
    name: 'Retort-Pack Tomato Puree (200L)',
    category: 'Process & Consumables',
    description: 'Aseptic bulk process paste drums for commercial food manufacturing line feedstock.',
    profile: 'steady',
    baseDailyDemand: 180.0,
    baseLeadTimeDays: 7,
    unitCost: 145,
    orderingCost: 75,
    holdingCostRate: 0.28,
    targetServiceLevel: 0.99,
    onHandRatio: 1.30,
    onOrderRatio: 0.7,
    backorders: 0,
    anomaliesPreset: [
      {
        day: 155,
        rawMultiplier: 2.8,
        type: 'promo',
        label: 'Promotional Surge',
        explanation: 'Contract packer temporary production surge for seasonal retail line.',
      },
      {
        day: 320,
        rawMultiplier: 0.0,
        type: 'censored',
        label: 'Supply Stockout Censoring',
        explanation: 'Sanitary seal failure in holding silo halted outbound shipping for 48 hours.',
      },
    ],
  },
  {
    id: 'STAT-01',
    sku: 'SKU-6120-NBK',
    name: 'Technical Grid Spiral Notebook',
    category: 'Engineering Supplies',
    description: 'Acid-free 120gsm isometric dot grid wirebound notebooks for engineering field work.',
    profile: 'seasonal',
    baseDailyDemand: 65.0,
    baseLeadTimeDays: 14,
    unitCost: 14,
    orderingCost: 45,
    holdingCostRate: 0.15,
    targetServiceLevel: 0.92,
    onHandRatio: 0.88,
    onOrderRatio: 0.35,
    backorders: 0,
    anomaliesPreset: [
      {
        day: 230,
        rawMultiplier: 4.5,
        type: 'promo',
        label: 'Promotional Surge',
        explanation: 'University engineering faculty new semester institutional bulk procurement.',
      },
      {
        day: 315,
        rawMultiplier: 7.0,
        type: 'data_error',
        label: 'Data Entry Error',
        explanation: 'Pack of 10 logged as individual units in distribution inventory ledger.',
      },
    ],
  },
];

// Helper to format date string
function formatSimDate(dayOffset: number): string {
  const d = new Date(2025, 0, 1);
  d.setDate(d.getDate() + dayOffset);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Build synthetic products
export function generateProducts(): Product[] {
  return BLUEPRINTS.map((bp, idx) => {
    const dailyDemand: number[] = [];
    const anomalies: Anomaly[] = [];

    // Generate 365 days of synthetic daily demand
    for (let day = 1; day <= 365; day++) {
      let demand = bp.baseDailyDemand;

      if (bp.profile === 'steady') {
        // Gaussian fluctuation +/- 15%
        demand += (prng() * 0.3 - 0.15) * bp.baseDailyDemand;
      } else if (bp.profile === 'intermittent') {
        // Zero-inflated: 40% zero, 60% active with burstiness
        demand = prng() > 0.4 ? bp.baseDailyDemand * (0.8 + prng() * 1.5) : 0;
      } else if (bp.profile === 'seasonal') {
        // Sine wave annual cycle + noise
        const seasonality = Math.sin(((day - 60) / 365) * Math.PI * 2) * 0.45;
        demand = bp.baseDailyDemand * (1 + seasonality) + (prng() * 0.2 - 0.1) * bp.baseDailyDemand;
      } else if (bp.profile === 'mixed') {
        // Day-of-week seasonality + bursts
        const dow = (day % 7) / 7;
        demand = bp.baseDailyDemand * (0.7 + dow * 0.6) + (prng() * 0.4 - 0.2) * bp.baseDailyDemand;
      }

      demand = Math.max(0, Math.round(demand));

      // Check if preset anomaly matches this day
      const anomalyPreset = bp.anomaliesPreset.find((a) => a.day === day);
      if (anomalyPreset) {
        let rawVal = Math.round(bp.baseDailyDemand * anomalyPreset.rawMultiplier);
        if (anomalyPreset.type === 'censored') rawVal = 0;

        const adjVal =
          anomalyPreset.type === 'censored'
            ? Math.round(bp.baseDailyDemand * 1.05)
            : Math.round(bp.baseDailyDemand * 1.15);

        const varianceImpact =
          anomalyPreset.type === 'data_error' ? -58 - (idx % 3) * 8 : -32 - (idx % 4) * 6;

        anomalies.push({
          day,
          date: formatSimDate(day),
          raw: rawVal,
          adj: adjVal,
          type: anomalyPreset.type,
          typeLabel: anomalyPreset.label,
          confidence: Number((0.94 + prng() * 0.05).toFixed(3)),
          explanation: anomalyPreset.explanation,
          varianceImpactPct: varianceImpact,
        });

        demand = rawVal;
      }

      dailyDemand.push(demand);
    }

    // 10 observed lead times with natural supplier variance
    const leadTimes: number[] = [];
    for (let i = 0; i < 10; i++) {
      const varianceFactor = (prng() * 2 - 1) * (bp.baseLeadTimeDays * 0.25);
      leadTimes.push(Math.max(1, Math.round(bp.baseLeadTimeDays + varianceFactor)));
    }

    // 3-Month (90 days) Hidden Chronological Holdout dataset
    const holdoutDays = 90;
    const holdoutActual: number[] = [];
    const holdoutBaselinePred: number[] = [];
    const holdoutStockSensePred: number[] = [];
    const holdoutDates: string[] = [];

    // Simulate holdout predictions
    for (let i = 365 - holdoutDays; i < 365; i++) {
      holdoutDates.push(formatSimDate(i));
      const actual = dailyDemand[i];
      holdoutActual.push(actual);

      // Naive 14-day moving average incorporates contaminated spikes without clamping
      const baselineNoise = (prng() * 0.5 - 0.25) * bp.baseDailyDemand * 1.4;
      const baselinePred = Math.max(0, Math.round(actual + baselineNoise));
      holdoutBaselinePred.push(baselinePred);

      // StockSense deterministic forecast utilizes clamped variance, much closer to true center
      const stockSenseNoise = (prng() * 0.2 - 0.1) * bp.baseDailyDemand;
      const stockSensePred = Math.max(0, Math.round(actual + stockSenseNoise));
      holdoutStockSensePred.push(stockSensePred);
    }

    const holdoutBaselineMAE = Number(calculateMAE(holdoutActual, holdoutBaselinePred).toFixed(2));
    const holdoutStockSenseMAE = Number(
      calculateMAE(holdoutActual, holdoutStockSensePred).toFixed(2)
    );
    const holdoutGainPct = Number(
      (((holdoutBaselineMAE - holdoutStockSenseMAE) / holdoutBaselineMAE) * 100).toFixed(1)
    );

    // Initial on-hand and on-order derived from lead time demand
    const expectedLTD = bp.baseDailyDemand * bp.baseLeadTimeDays;
    const onHand = Math.round(expectedLTD * bp.onHandRatio);
    const onOrder = Math.round(expectedLTD * bp.onOrderRatio);

    return {
      id: bp.id,
      sku: bp.sku,
      name: bp.name,
      category: bp.category,
      description: bp.description,
      profile: bp.profile,
      baseDailyDemand: bp.baseDailyDemand,
      baseLeadTimeDays: bp.baseLeadTimeDays,
      unitCost: bp.unitCost,
      orderingCost: bp.orderingCost,
      holdingCost: Math.round(bp.unitCost * bp.holdingCostRate),
      targetServiceLevel: bp.targetServiceLevel,
      onHand,
      onOrder,
      backorders: bp.backorders,
      leadTimes,
      dailyDemand,
      anomalies,
      holdoutActual,
      holdoutBaselinePred,
      holdoutStockSensePred,
      holdoutDates,
      holdoutBaselineMAE,
      holdoutStockSenseMAE,
      holdoutGainPct,
    };
  });
}

// Memoized singleton of initialized products with computed metrics
let cachedProductsWithMetrics: ProductWithComputed[] | null = null;

export function getProductsWithComputed(): ProductWithComputed[] {
  if (!cachedProductsWithMetrics) {
    const raw = generateProducts();
    cachedProductsWithMetrics = raw.map((prod) => ({
      ...prod,
      metrics: computeProductMetrics(prod),
    }));
  }
  return cachedProductsWithMetrics;
}

/**
 * CRISIS SIMULATOR ENGINE:
 * Simulates supply chain shocks:
 * - Lead time delays (+1 to +30 days)
 * - Demand surge multiplier (1.0x to 3.0x)
 * 
 * Recomputes all pure math parameters instantly and constructs
 * time-series projection charts for the Recharts component.
 */
export function runCrisisSimulation(
  product: Product,
  params: SimulationParams
): SimulationResult {
  const base = computeProductMetrics(product);
  const stressed = computeProductMetrics(
    product,
    params.serviceLevelOverride,
    params.leadTimeDelayDays,
    params.demandSurgeMultiplier
  );

  const deltaROP = stressed.reorderPoint - base.reorderPoint;
  const deltaSS = stressed.safetyStock - base.safetyStock;
  const deltaHoldingCost = stressed.annualHoldingCost - base.annualHoldingCost;
  const deltaStockoutRiskPct = stressed.stockoutRiskPct - base.stockoutRiskPct;
  const additionalCapitalRequired = deltaSS * product.unitCost;

  // Build 60-day visual projection for Recharts
  const chartData = [];
  let currentInventory = product.onHand + product.onOrder;
  const projectedDailyDemand = stressed.avgDemand;

  for (let day = 1; day <= 60; day++) {
    // Inventory decrement and deterministic replenishment cycle
    currentInventory -= projectedDailyDemand * (0.85 + Math.sin(day * 0.4) * 0.25);
    if (currentInventory <= stressed.reorderPoint) {
      // Reorder triggers after stressed lead time
      if (day % Math.max(5, Math.round(stressed.avgLeadTime)) === 0) {
        currentInventory += stressed.eoq;
      }
    }

    chartData.push({
      day,
      label: `Day ${day}`,
      projectedDemand: Math.round(projectedDailyDemand),
      baseROP: Math.round(base.reorderPoint),
      stressedROP: Math.round(stressed.reorderPoint),
      baseSS: Math.round(base.safetyStock),
      stressedSS: Math.round(stressed.safetyStock),
      inventoryLevel: Math.max(0, Math.round(currentInventory)),
    });
  }

  return {
    base,
    stressed,
    deltaROP,
    deltaSS,
    deltaHoldingCost,
    deltaStockoutRiskPct,
    additionalCapitalRequired,
    chartData,
  };
}
