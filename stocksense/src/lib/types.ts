export type AnomalyType = 'promo' | 'data_error' | 'censored' | 'unknown';

export type ProductStatus = 'healthy' | 'watch' | 'order' | 'reorder_now';

export type ProductCategory =
  | 'Dairy & Fresh'
  | 'Staples & Grains'
  | 'Instant & Snacks'
  | 'Beverages & Tea'
  | 'Household & Cleaning'
  | 'Personal Care';

export interface Anomaly {
  day: number;
  date: string;
  raw: number;
  adj: number;
  type: AnomalyType;
  typeLabel: string;
  confidence: number;
  explanation: string;
  varianceImpactPct: number;
  clampMin: number;
  clampMax: number;
  status: 'applied' | 'overridden' | 'pending';
}

/**
 * Table 1: products
 * Stores product identity, inventory quantities, replenishment inputs, and supplier lead-time settings.
 */
export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  description: string;
  profile: 'fast_moving' | 'steady' | 'seasonal' | 'perishable';
  perishabilityDays: number;
  unitOfMeasure: string; // e.g. piece, kg, litre, pouch, pack
  onHand: number; // on_hand_qty
  committedQty: number; // committed_qty
  onOrder: number;
  backorders: number;
  unitCost: number; // unit_cost
  orderingCost: number; // ordering_cost
  holdingCost: number; // holding_cost_per_unit_year
  targetServiceLevel: number; // target_service_level (e.g. 0.9500)
  minimumOrderQty: number; // minimum_order_qty (MOQ)
  packSize: number; // pack_size
  baseDailyDemand: number;
  baseLeadTimeDays: number; // average_lead_time_days
  leadTimeStdDevDays: number; // lead_time_stddev_days
  leadTimes: number[]; // 10 observed recent deliveries
  dailyDemand: number[]; // 365 daily demand points
  anomalies: Anomaly[];
  holdoutActual: number[];
  holdoutBaselinePred: number[];
  holdoutStockSensePred: number[];
  holdoutDates: string[];
  holdoutBaselineMAE: number;
  holdoutStockSenseMAE: number;
  holdoutGainPct: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Table 2: demand_records
 * Stores daily demand observations for a product. Preserves source observations & stockout flags.
 */
export interface DemandRecord {
  id: string;
  productId: string;
  date: string;
  unitsSold: number;
  stockoutFlag: boolean;
  promotionFlag: boolean;
  notes?: string;
  sourceImportId?: string;
  createdAt: string;
}

/**
 * Table 3: anomaly_reviews
 * Stores detected demand anomalies and the human review decision separately from automated suggestions.
 */
export interface AnomalyReviewRecord {
  id: string;
  productId: string;
  demandRecordId?: string;
  detectorVersion: string;
  anomalyType: string;
  anomalyScore: number;
  affectedStartDate: string;
  affectedEndDate: string;
  detectorExplanation: string;
  aiSuggestion: string;
  reviewStatus: 'pending' | 'reviewed';
  userClassification?: string;
  userTreatment?: string;
  reviewerNotes?: string;
  reviewedAt?: string;
  createdAt: string;
}

/**
 * Table 4: forecast_runs
 * Stores reproducible forecast benchmark runs, comparing baseline vs candidate method on holdout.
 */
export interface ForecastRunRecord {
  id: string;
  productId: string;
  baselineMethod: string;
  candidateMethod: string;
  trainingStartDate: string;
  trainingEndDate: string;
  holdoutStartDate: string;
  holdoutEndDate: string;
  baselineMae: number;
  candidateMae: number;
  baselineWape: number;
  candidateWape: number;
  runStatus: 'completed' | 'insufficient_data' | 'failed';
  failureReason?: string;
  createdAt: string;
}

/**
 * Table 5: recommendations
 * Stores immutable snapshots of replenishment calculations and their explanations.
 */
export interface RecommendationSnapshot {
  id: string;
  productId: string;
  calculatedAt: string;
  formulaVersion: string;
  inputSnapshot: string; // JSON snapshot of inputs
  inventoryPosition: number;
  meanDailyDemand: number;
  dailyDemandStddev: number;
  averageLeadTimeDays: number;
  leadTimeStddevDays: number;
  targetServiceLevel: number;
  zFactor: number;
  expectedLeadTimeDemand: number;
  safetyStock: number;
  reorderPoint: number;
  annualDemand: number;
  rawEoq: number;
  suggestedOrderQty: number; // after MOQ and pack size rounding
  status: 'reorder_now' | 'watch' | 'healthy' | 'insufficient_data';
  explanation: string;
  assumptions: string;
  createdAt: string;
}

/**
 * Table 6: scenario_runs
 * Stores repeatable baseline-versus-stress what-if simulations.
 */
export interface ScenarioRunRecord {
  id: string;
  productId: string;
  baselineRecommendationId?: string;
  demandSurgePct: number;
  supplierDelayDays: number;
  horizonDays: number;
  runCount: number;
  randomSeed: number;
  baselineMetrics: {
    reorderPoint: number;
    safetyStock: number;
    annualHoldingCost: number;
    stockoutRiskPct: number;
  };
  scenarioMetrics: {
    reorderPoint: number;
    safetyStock: number;
    annualHoldingCost: number;
    stockoutRiskPct: number;
  };
  runStatus: 'completed' | 'failed';
  createdAt: string;
}

export interface ComputedMetrics {
  avgDemand: number;
  demandVariance: number;
  demandStdDev: number;
  avgLeadTime: number;
  leadTimeVariance: number;
  leadTimeStdDev: number;
  zScore: number;
  safetyStock: number;
  reorderPoint: number;
  rawEoq: number;
  eoq: number; // rounded by packSize / MOQ
  inventoryPosition: number; // onHand - committedQty
  status: ProductStatus;
  daysOfCover: number;
  annualHoldingCost: number;
  stockoutRiskPct: number;
  cleanedDemand: number[];
}

export interface ProductWithComputed extends Product {
  metrics: ComputedMetrics;
}

export interface SimulationParams {
  leadTimeDelayDays: number; // 0 to 14 days
  demandSurgeMultiplier: number; // 1.0 to 2.5x
  serviceLevelOverride?: number;
}

export interface SimulationResult {
  base: ComputedMetrics;
  stressed: ComputedMetrics;
  deltaROP: number;
  deltaSS: number;
  deltaHoldingCost: number;
  deltaStockoutRiskPct: number;
  additionalCapitalRequired: number;
  chartData: Array<{
    day: number;
    label: string;
    projectedDemand: number;
    baseROP: number;
    stressedROP: number;
    baseSS: number;
    stressedSS: number;
    inventoryLevel: number;
  }>;
}
