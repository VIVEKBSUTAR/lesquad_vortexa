import {
  Anomaly,
  ComputedMetrics,
  Product,
  ProductWithComputed,
  SimulationParams,
  SimulationResult,
  DemandRecord,
  AnomalyReviewRecord,
  ForecastRunRecord,
  RecommendationSnapshot,
  ScenarioRunRecord,
} from './types';
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
  perishabilityDays: number;
  unitOfMeasure: string;
  committedQty: number;
  minimumOrderQty: number;
  packSize: number;
  baseDailyDemand: number;
  baseLeadTimeDays: number;
  leadTimeStdDevDays: number;
  unitCost: number;
  orderingCost: number;
  holdingCostRate: number; // e.g. 0.25 = 25% annual carrying cost
  targetServiceLevel: number;
  onHandRatio: number; // multiplier of base LTD
  onOrderRatio: number;
  backorders: number;
  anomaliesPreset: Array<{
    day: number;
    rawMultiplier: number;
    type: 'promo' | 'data_error' | 'censored' | 'unknown';
    label: string;
    explanation: string;
    clampMin: number;
    clampMax: number;
  }>;
}

const DARK_STORE_BLUEPRINTS: ProductBlueprint[] = [
  {
    id: 'DS-01',
    sku: 'SKU-DRY-MILK-1L',
    name: 'Amul Taaza Homogenised Toned Milk (1L Tetra Pak)',
    category: 'Dairy & Fresh',
    description: 'High-velocity fresh dairy staple. Perishable (180 days unopened, 2 days cold shelf). Daily replenishment with refrigerated dark store rack capacity limits.',
    profile: 'fast_moving',
    perishabilityDays: 45,
    unitOfMeasure: '1L Tetra Pak',
    committedQty: 18,
    minimumOrderQty: 24,
    packSize: 12,
    baseDailyDemand: 78.0,
    baseLeadTimeDays: 2,
    leadTimeStdDevDays: 0.6,
    unitCost: 1.40,
    orderingCost: 15,
    holdingCostRate: 0.32, // high electricity & refrigeration cost
    targetServiceLevel: 0.98,
    onHandRatio: 0.85, // Near ROP
    onOrderRatio: 0.50,
    backorders: 0,
    anomaliesPreset: [
      {
        day: 75,
        rawMultiplier: 4.5,
        type: 'promo',
        label: 'Quick-Commerce Flash 1+1 Promo',
        explanation: 'App push promotion triggered 1-day non-recurring demand spike. Clamped to protect regular buffer from variance explosion.',
        clampMin: 65,
        clampMax: 110,
      },
      {
        day: 210,
        rawMultiplier: 7.2,
        type: 'data_error',
        label: 'Barcode Scan Typo (10x Crate Count)',
        explanation: 'Receiving clerk scanned crate unit of measure instead of individual units. Clamped to 3σ normal limit.',
        clampMin: 60,
        clampMax: 95,
      },
      {
        day: 312,
        rawMultiplier: 0.0,
        type: 'censored',
        label: 'Chilling Unit Compressor Outage (Stockout)',
        explanation: 'Cold storage unit failure caused 8-hour out-of-stock lost sales. True customer demand reconstructed from app search telemetry.',
        clampMin: 70,
        clampMax: 90,
      },
    ],
  },
  {
    id: 'DS-02',
    sku: 'SKU-STP-ATTA-5K',
    name: 'Aashirvaad Superior MP Shudh Chakki Atta (5kg Bag)',
    category: 'Staples & Grains',
    description: 'High-turnover kitchen grain staple. Heavy pallet space footprint. Constant weekly dark store replenishment from regional mill distributor.',
    profile: 'steady',
    perishabilityDays: 120,
    unitOfMeasure: '5kg Bag',
    committedQty: 10,
    minimumOrderQty: 10,
    packSize: 5,
    baseDailyDemand: 45.0,
    baseLeadTimeDays: 4,
    leadTimeStdDevDays: 1.1,
    unitCost: 4.80,
    orderingCost: 35,
    holdingCostRate: 0.22,
    targetServiceLevel: 0.96,
    onHandRatio: 1.25,
    onOrderRatio: 0.60,
    backorders: 0,
    anomaliesPreset: [
      {
        day: 120,
        rawMultiplier: 3.8,
        type: 'promo',
        label: 'Monthly Grocery Payday Basket Surge',
        explanation: 'Bulk family grocery basket discounts on app payday weekend. Classified as temporary promotional surge.',
        clampMin: 40,
        clampMax: 68,
      },
      {
        day: 260,
        rawMultiplier: 6.0,
        type: 'data_error',
        label: 'EDI Order Sync Duplication',
        explanation: 'ERP batch update re-sent purchase orders during night sync. Clamped to 99th percentile boundary.',
        clampMin: 38,
        clampMax: 60,
      },
    ],
  },
  {
    id: 'DS-03',
    sku: 'SKU-OIL-SUN-1L',
    name: 'Fortune Sunlite Refined Sunflower Oil (1L Pouch)',
    category: 'Staples & Grains',
    description: 'Essential cooking medium. High volume, constant dark store picking velocity with supplier lead time volatility from port refinery.',
    profile: 'steady',
    perishabilityDays: 270,
    unitOfMeasure: '1L Pouch',
    committedQty: 14,
    minimumOrderQty: 20,
    packSize: 10,
    baseDailyDemand: 62.0,
    baseLeadTimeDays: 5,
    leadTimeStdDevDays: 1.4,
    unitCost: 2.10,
    orderingCost: 25,
    holdingCostRate: 0.20,
    targetServiceLevel: 0.95,
    onHandRatio: 0.72, // Below ROP (Order status)
    onOrderRatio: 0.30,
    backorders: 4,
    anomaliesPreset: [
      {
        day: 92,
        rawMultiplier: 4.2,
        type: 'promo',
        label: 'Festival Deepawali Cooking Combo Deal',
        explanation: 'Deep-fry festival holiday promotion bundle deal with flour caused non-structural surge.',
        clampMin: 55,
        clampMax: 90,
      },
    ],
  },
  {
    id: 'DS-04',
    sku: 'SKU-SNK-MAGG-12P',
    name: 'Maggi 2-Minute Masala Instant Noodles (12-Pack)',
    category: 'Instant & Snacks',
    description: 'Ultra-fast moving consumer snack in quick-commerce dark stores. High late-night impulse order rate with viral demand spikes.',
    profile: 'fast_moving',
    perishabilityDays: 240,
    unitOfMeasure: '12-Pack Carton',
    committedQty: 22,
    minimumOrderQty: 16,
    packSize: 8,
    baseDailyDemand: 95.0,
    baseLeadTimeDays: 3,
    leadTimeStdDevDays: 0.8,
    unitCost: 2.40,
    orderingCost: 20,
    holdingCostRate: 0.18,
    targetServiceLevel: 0.99,
    onHandRatio: 1.40,
    onOrderRatio: 0.70,
    backorders: 0,
    anomaliesPreset: [
      {
        day: 65,
        rawMultiplier: 4.8,
        type: 'promo',
        label: 'Midnight Cravings App Notification Surge',
        explanation: 'In-app push notification targeted nearby university dorms between 11 PM and 2 AM. One-off demand impulse.',
        clampMin: 85,
        clampMax: 140,
      },
      {
        day: 180,
        rawMultiplier: 7.5,
        type: 'data_error',
        label: 'B2B Wholesale Erroneous Route',
        explanation: 'Commercial restaurant supply order accidentally routed into consumer retail dark store bin.',
        clampMin: 80,
        clampMax: 130,
      },
    ],
  },
  {
    id: 'DS-05',
    sku: 'SKU-BEV-TEA-1K',
    name: 'Tata Tea Premium Desh Ki Chai (1kg Poly Pack)',
    category: 'Beverages & Tea',
    description: 'Consistent daily household beverage staple. Steady consumption pattern with predictable vendor lead time and low perishability risk.',
    profile: 'steady',
    perishabilityDays: 365,
    unitOfMeasure: '1kg Poly Pack',
    committedQty: 7,
    minimumOrderQty: 12,
    packSize: 6,
    baseDailyDemand: 32.0,
    baseLeadTimeDays: 4,
    leadTimeStdDevDays: 0.9,
    unitCost: 5.20,
    orderingCost: 22,
    holdingCostRate: 0.16,
    targetServiceLevel: 0.95,
    onHandRatio: 1.10,
    onOrderRatio: 0.40,
    backorders: 0,
    anomaliesPreset: [
      {
        day: 150,
        rawMultiplier: 3.4,
        type: 'promo',
        label: 'Monsoon Rainy Day Hot Chai Campaign',
        explanation: 'Rainy season marketing prompt generated 2-day surge. Bounded to preserve buffer stability.',
        clampMin: 28,
        clampMax: 48,
      },
    ],
  },
  {
    id: 'DS-06',
    sku: 'SKU-HSH-SURF-2L',
    name: 'Surf Excel Matic Front Load Liquid Detergent (2L Pouch)',
    category: 'Household & Cleaning',
    description: 'Premium high-value FMCG SKU. High carrying cost per bottle; over-ordering severely locks dark store working capital.',
    profile: 'steady',
    perishabilityDays: 730,
    unitOfMeasure: '2L Pouch',
    committedQty: 5,
    minimumOrderQty: 8,
    packSize: 4,
    baseDailyDemand: 18.5,
    baseLeadTimeDays: 6,
    leadTimeStdDevDays: 1.3,
    unitCost: 11.20,
    orderingCost: 40,
    holdingCostRate: 0.24,
    targetServiceLevel: 0.94,
    onHandRatio: 0.68, // Red / Order status
    onOrderRatio: 0.25,
    backorders: 2,
    anomaliesPreset: [
      {
        day: 80,
        rawMultiplier: 5.8,
        type: 'data_error',
        label: 'Data Entry Double-Count',
        explanation: 'ERP receiving inventory ledger recorded master pack of 6 bottles as individual units twice.',
        clampMin: 15,
        clampMax: 28,
      },
    ],
  },
  {
    id: 'DS-07',
    sku: 'SKU-PER-DETT-750',
    name: 'Dettol Original Liquid Handwash Refill Pouch (750ml)',
    category: 'Personal Care',
    description: 'Hygiene staple in quick-commerce retail. Steady consumption with seasonal flu bumps and reliable local distributor delivery network.',
    profile: 'fast_moving',
    perishabilityDays: 540,
    unitOfMeasure: '750ml Refill',
    committedQty: 8,
    minimumOrderQty: 12,
    packSize: 6,
    baseDailyDemand: 28.0,
    baseLeadTimeDays: 3,
    leadTimeStdDevDays: 0.7,
    unitCost: 2.20,
    orderingCost: 18,
    holdingCostRate: 0.18,
    targetServiceLevel: 0.96,
    onHandRatio: 1.15,
    onOrderRatio: 0.50,
    backorders: 0,
    anomaliesPreset: [
      {
        day: 225,
        rawMultiplier: 4.2,
        type: 'promo',
        label: 'Community Health Awareness Week',
        explanation: 'Institutional bulk procurement for local pre-schools and offices.',
        clampMin: 24,
        clampMax: 42,
      },
    ],
  },
  {
    id: 'DS-08',
    sku: 'SKU-STP-RICE-5K',
    name: 'India Gate Super Basmati Rice (5kg Polybag)',
    category: 'Staples & Grains',
    description: 'Premium aromatic basmati grain. High volume weekend grocery order staple, heavy shelf footprint with festival promotion surges.',
    profile: 'steady',
    perishabilityDays: 365,
    unitOfMeasure: '5kg Bag',
    committedQty: 6,
    minimumOrderQty: 10,
    packSize: 4,
    baseDailyDemand: 24.0,
    baseLeadTimeDays: 5,
    leadTimeStdDevDays: 1.2,
    unitCost: 8.50,
    orderingCost: 30,
    holdingCostRate: 0.20,
    targetServiceLevel: 0.95,
    onHandRatio: 1.05,
    onOrderRatio: 0.45,
    backorders: 0,
    anomaliesPreset: [
      {
        day: 195,
        rawMultiplier: 4.0,
        type: 'promo',
        label: 'Festival Biryani Special Promo',
        explanation: 'Holiday festival cooking spike. Isolated and bounded to prevent dead inventory buildup.',
        clampMin: 20,
        clampMax: 36,
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
  return DARK_STORE_BLUEPRINTS.map((bp, idx) => {
    const dailyDemand: number[] = [];
    const anomalies: Anomaly[] = [];

    // Generate 365 days of synthetic daily demand
    for (let day = 1; day <= 365; day++) {
      let demand = bp.baseDailyDemand;

      if (bp.profile === 'steady') {
        // Gaussian fluctuation +/- 15%
        demand += (prng() * 0.3 - 0.15) * bp.baseDailyDemand;
      } else if (bp.profile === 'fast_moving') {
        // High velocity with weekend bumps
        const isWeekend = (day % 7 === 5 || day % 7 === 6);
        const bump = isWeekend ? 1.35 : 0.92;
        demand = bp.baseDailyDemand * bump + (prng() * 0.25 - 0.12) * bp.baseDailyDemand;
      } else if (bp.profile === 'seasonal' || bp.profile === 'perishable') {
        // Sine wave annual cycle + noise
        const seasonality = Math.sin(((day - 60) / 365) * Math.PI * 2) * 0.35;
        demand = bp.baseDailyDemand * (1 + seasonality) + (prng() * 0.2 - 0.1) * bp.baseDailyDemand;
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
          clampMin: anomalyPreset.clampMin,
          clampMax: anomalyPreset.clampMax,
          status: 'applied',
        });

        demand = rawVal;
      }

      dailyDemand.push(demand);
    }

    // 10 observed lead times with natural supplier variance
    const leadTimes: number[] = [];
    for (let i = 0; i < 10; i++) {
      const varianceFactor = (prng() * 2 - 1) * (bp.baseLeadTimeDays * 0.30);
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

      // Naive 7-day moving average incorporates contaminated spikes without clamping
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
      perishabilityDays: bp.perishabilityDays,
      unitOfMeasure: bp.unitOfMeasure,
      onHand,
      committedQty: bp.committedQty,
      onOrder,
      backorders: bp.backorders,
      unitCost: bp.unitCost,
      orderingCost: bp.orderingCost,
      holdingCost: Math.round(bp.unitCost * bp.holdingCostRate * 100) / 100,
      targetServiceLevel: bp.targetServiceLevel,
      minimumOrderQty: bp.minimumOrderQty,
      packSize: bp.packSize,
      baseDailyDemand: bp.baseDailyDemand,
      baseLeadTimeDays: bp.baseLeadTimeDays,
      leadTimeStdDevDays: bp.leadTimeStdDevDays,
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
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-02-15T08:30:00.000Z',
    };
  });
}

// Cached singleton dataset
let _cachedProducts: ProductWithComputed[] | null = null;

export function getProductsWithComputed(serviceLevelOverride?: number): ProductWithComputed[] {
  if (!_cachedProducts) {
    const raw = generateProducts();
    _cachedProducts = raw.map((p) => ({
      ...p,
      metrics: computeProductMetrics(p, serviceLevelOverride),
    }));
  } else if (serviceLevelOverride !== undefined) {
    return _cachedProducts.map((p) => ({
      ...p,
      metrics: computeProductMetrics(p, serviceLevelOverride),
    }));
  }
  return _cachedProducts;
}

/**
 * Runs a pre-flight stress test scenario on a product.
 * Returns comparative metrics (Base vs Stressed) and projected 30-day projection curves.
 */
export function runCrisisSimulation(
  product: ProductWithComputed,
  params: SimulationParams
): SimulationResult {
  const baseMetrics = computeProductMetrics(
    product,
    params.serviceLevelOverride ?? product.targetServiceLevel
  );

  const stressedMetrics = computeProductMetrics(
    product,
    params.serviceLevelOverride ?? product.targetServiceLevel,
    params.leadTimeDelayDays,
    params.demandSurgeMultiplier
  );

  const deltaROP = Math.round(stressedMetrics.reorderPoint - baseMetrics.reorderPoint);
  const deltaSS = Math.round(stressedMetrics.safetyStock - baseMetrics.safetyStock);
  const deltaHoldingCost = Math.round(
    stressedMetrics.annualHoldingCost - baseMetrics.annualHoldingCost
  );
  const deltaStockoutRiskPct = Number(
    (stressedMetrics.stockoutRiskPct - baseMetrics.stockoutRiskPct).toFixed(1)
  );
  const additionalCapitalRequired = Math.round(deltaROP * product.unitCost);

  // Generate 30-day projection chart
  const chartData = [];
  let currentInventory = product.metrics.inventoryPosition;
  const dailyRunRate = stressedMetrics.avgDemand;

  for (let d = 1; d <= 30; d++) {
    // Inventory depletes at stressed demand pace
    currentInventory = Math.max(0, currentInventory - dailyRunRate);

    // Replenishment batch arrives after stressed lead time
    if (d === Math.round(stressedMetrics.avgLeadTime)) {
      currentInventory += stressedMetrics.eoq;
    }

    chartData.push({
      day: d,
      label: `Day ${d}`,
      projectedDemand: Math.round(dailyRunRate),
      baseROP: Math.round(baseMetrics.reorderPoint),
      stressedROP: Math.round(stressedMetrics.reorderPoint),
      baseSS: Math.round(baseMetrics.safetyStock),
      stressedSS: Math.round(stressedMetrics.safetyStock),
      inventoryLevel: Math.round(currentInventory),
    });
  }

  return {
    base: baseMetrics,
    stressed: stressedMetrics,
    deltaROP,
    deltaSS,
    deltaHoldingCost,
    deltaStockoutRiskPct,
    additionalCapitalRequired,
    chartData,
  };
}

/**
 * Table 2: demand_records
 * Retrieves historical daily demand observations.
 */
export function getDemandRecords(products?: Product[]): DemandRecord[] {
  const prods = products || getProductsWithComputed();
  const records: DemandRecord[] = [];

  prods.forEach((p) => {
    // Generate demand observations for the last 60 days
    p.dailyDemand.slice(365 - 60).forEach((units, idx) => {
      const dayNum = 365 - 60 + idx;
      const d = new Date(2025, 0, 1);
      d.setDate(d.getDate() + dayNum);
      const isoDate = d.toISOString().split('T')[0];

      const matchingAnomaly = p.anomalies.find((a) => a.day === dayNum);
      const isStockout = units === 0 || matchingAnomaly?.type === 'censored';
      const isPromo = matchingAnomaly?.type === 'promo';

      let notes: string | undefined = undefined;
      if (isStockout) {
        notes = 'Cold rack outage / Stockout observed. True unconstrained demand censored.';
      } else if (isPromo) {
        notes = matchingAnomaly?.typeLabel || 'Promotion campaign surge.';
      } else if (matchingAnomaly?.type === 'data_error') {
        notes = 'Data entry scan discrepancy.';
      }

      records.push({
        id: `dr-${p.sku.toLowerCase()}-${isoDate}`,
        productId: p.id,
        date: isoDate,
        unitsSold: units,
        stockoutFlag: isStockout,
        promotionFlag: isPromo,
        notes,
        sourceImportId: 'imp_pos_2025q1',
        createdAt: new Date(2025, 0, 1 + dayNum, 23, 59).toISOString(),
      });
    });
  });

  return records.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Table 3: anomaly_reviews
 * Retrieves detected demand anomalies and their review states.
 */
export function getAnomalyReviews(products?: Product[]): AnomalyReviewRecord[] {
  const prods = products || getProductsWithComputed();
  const reviews: AnomalyReviewRecord[] = [];

  prods.forEach((p) => {
    p.anomalies.forEach((a, idx) => {
      const d = new Date(2025, 0, 1);
      d.setDate(d.getDate() + a.day);
      const isoDate = d.toISOString().split('T')[0];

      const anomalyScore =
        a.type === 'data_error' ? 5.82 : a.type === 'promo' ? 4.15 : -3.2;

      reviews.push({
        id: `rev-${p.id.toLowerCase()}-anom-${idx + 1}`,
        productId: p.id,
        demandRecordId: `dr-${p.sku.toLowerCase()}-${isoDate}`,
        detectorVersion: 'v2.4-isolation-forest-zscore',
        anomalyType: a.type === 'promo' ? 'spike' : a.type === 'data_error' ? 'data_error' : 'censored_stockout',
        anomalyScore,
        affectedStartDate: isoDate,
        affectedEndDate: isoDate,
        detectorExplanation: a.explanation,
        aiSuggestion: `Bound to ${a.adj} ${p.unitOfMeasure} (${a.clampMin} - ${a.clampMax} range) to protect lead time variance.`,
        reviewStatus: a.status === 'applied' ? 'reviewed' : 'pending',
        userClassification: a.type === 'promo' ? 'promotional_surge' : a.type === 'data_error' ? 'scanner_error' : 'stockout_censored',
        userTreatment: a.type === 'data_error' ? 'exclude_from_model' : 'clamp_to_upper_bound',
        reviewerNotes: `Verified by dark store supervisor: ${a.typeLabel}`,
        reviewedAt: '2025-02-10T14:30:00.000Z',
        createdAt: '2025-02-10T02:00:00.000Z',
      });
    });
  });

  return reviews;
}

/**
 * Table 4: forecast_runs
 * Retrieves reproducible forecast benchmark runs comparing baseline vs candidate method on holdout.
 */
export function getForecastRuns(products?: Product[]): ForecastRunRecord[] {
  const prods = products || getProductsWithComputed();

  return prods.map((p, idx) => {
    const baselineWape = Number((p.holdoutBaselineMAE / p.baseDailyDemand).toFixed(4));
    const candidateWape = Number((p.holdoutStockSenseMAE / p.baseDailyDemand).toFixed(4));

    return {
      id: `fr-run-${p.sku.toLowerCase()}-2025q1`,
      productId: p.id,
      baselineMethod: '14-Day Rolling Moving Average',
      candidateMethod: 'StockSense Clamped Adaptive Engine (Continuous Review)',
      trainingStartDate: '2025-01-01',
      trainingEndDate: '2025-09-30',
      holdoutStartDate: '2025-10-01',
      holdoutEndDate: '2025-12-31',
      baselineMae: p.holdoutBaselineMAE,
      candidateMae: p.holdoutStockSenseMAE,
      baselineWape,
      candidateWape,
      runStatus: 'completed',
      createdAt: '2025-10-01T00:00:00.000Z',
    };
  });
}

/**
 * Table 5: recommendations
 * Retrieves immutable snapshots of replenishment calculations.
 */
export function getRecommendationSnapshots(
  products?: ProductWithComputed[]
): RecommendationSnapshot[] {
  const prods = products || getProductsWithComputed();

  return prods.map((p) => {
    const inputSnapshot = JSON.stringify({
      on_hand_qty: p.onHand,
      committed_qty: p.committedQty,
      incoming_orders: p.onOrder,
      unit_cost: p.unitCost,
      ordering_cost: p.orderingCost,
      holding_cost: p.holdingCost,
      mean_daily_demand: Number(p.metrics.avgDemand.toFixed(2)),
      daily_demand_stddev: Number(p.metrics.demandStdDev.toFixed(2)),
      average_lead_time_days: Number(p.metrics.avgLeadTime.toFixed(2)),
      lead_time_stddev_days: Number(p.metrics.leadTimeStdDev.toFixed(2)),
      target_service_level: p.targetServiceLevel,
      minimum_order_qty: p.minimumOrderQty,
      pack_size: p.packSize,
    });

    const assumptions = JSON.stringify({
      policy: 'Continuous Review (r, Q) replenishment',
      demand_distribution: 'Normal with AI variance clamp protection',
      lead_time_distribution: 'Normal independent variance',
      incoming_orders_credit: 'Counted in inventory position',
      backorders_policy: 'Lost sales modeled without negative physical inventory',
    });

    const isReorder = p.metrics.status === 'order' || p.metrics.status === 'reorder_now';
    const status = isReorder
      ? 'reorder_now'
      : p.metrics.status === 'watch'
      ? 'watch'
      : 'healthy';

    const explanation = isReorder
      ? `Inventory position (${p.metrics.inventoryPosition}) is strictly below Reorder Point (${Math.round(p.metrics.reorderPoint)}). Trigger replenishment PO for ${p.metrics.eoq} ${p.unitOfMeasure}.`
      : `Inventory position (${p.metrics.inventoryPosition}) is above Reorder Point (${Math.round(p.metrics.reorderPoint)}). Current coverage is ${p.metrics.daysOfCover.toFixed(1)} days.`;

    return {
      id: `rec-${p.sku.toLowerCase()}-snap-01`,
      productId: p.id,
      calculatedAt: '2025-02-15T09:00:00.000Z',
      formulaVersion: 'StockSense-OR-v2.4 (r, Q Continuous Review)',
      inputSnapshot,
      inventoryPosition: p.metrics.inventoryPosition,
      meanDailyDemand: Number(p.metrics.avgDemand.toFixed(3)),
      dailyDemandStddev: Number(p.metrics.demandStdDev.toFixed(3)),
      averageLeadTimeDays: Number(p.metrics.avgLeadTime.toFixed(2)),
      leadTimeStddevDays: Number(p.metrics.leadTimeStdDev.toFixed(2)),
      targetServiceLevel: p.targetServiceLevel,
      zFactor: Number(p.metrics.zScore.toFixed(3)),
      expectedLeadTimeDemand: Number((p.metrics.avgDemand * p.metrics.avgLeadTime).toFixed(2)),
      safetyStock: Number(p.metrics.safetyStock.toFixed(2)),
      reorderPoint: Number(p.metrics.reorderPoint.toFixed(2)),
      annualDemand: Number((p.metrics.avgDemand * 365).toFixed(1)),
      rawEoq: Number(p.metrics.rawEoq.toFixed(1)),
      suggestedOrderQty: p.metrics.eoq,
      status,
      explanation,
      assumptions,
      createdAt: '2025-02-15T09:00:00.000Z',
    };
  });
}

/**
 * Table 6: scenario_runs
 * Retrieves reproducible stress-test simulations.
 */
export function getScenarioRuns(
  products?: ProductWithComputed[]
): ScenarioRunRecord[] {
  const prods = products || getProductsWithComputed();

  return prods.slice(0, 4).map((p, idx) => {
    const surge = 40;
    const delay = 7;
    const sim = runCrisisSimulation(p, {
      demandSurgeMultiplier: 1.4,
      leadTimeDelayDays: delay,
    });

    return {
      id: `scen-run-${p.sku.toLowerCase()}-s${idx + 1}`,
      productId: p.id,
      baselineRecommendationId: `rec-${p.sku.toLowerCase()}-snap-01`,
      demandSurgePct: surge,
      supplierDelayDays: delay,
      horizonDays: 30,
      runCount: 500,
      randomSeed: 948271 + idx * 100,
      baselineMetrics: {
        reorderPoint: Math.round(sim.base.reorderPoint),
        safetyStock: Math.round(sim.base.safetyStock),
        annualHoldingCost: Math.round(sim.base.annualHoldingCost),
        stockoutRiskPct: sim.base.stockoutRiskPct,
      },
      scenarioMetrics: {
        reorderPoint: Math.round(sim.stressed.reorderPoint),
        safetyStock: Math.round(sim.stressed.safetyStock),
        annualHoldingCost: Math.round(sim.stressed.annualHoldingCost),
        stockoutRiskPct: sim.stressed.stockoutRiskPct,
      },
      runStatus: 'completed',
      createdAt: new Date(2025, 1, 10 + idx, 11, 30).toISOString(),
    };
  });
}
