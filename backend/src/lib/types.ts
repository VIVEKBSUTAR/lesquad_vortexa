export type AnomalyType = 'promo' | 'data_error' | 'censored';

export type ProductStatus = 'healthy' | 'watch' | 'order';

export type ProductCategory =
  | 'Robotics'
  | 'Industrial Automation'
  | 'Power & Cables'
  | 'Electronics'
  | 'Energy Systems'
  | 'Process & Consumables'
  | 'Engineering Supplies';

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
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  description: string;
  profile: 'intermittent' | 'steady' | 'seasonal' | 'mixed';
  baseDailyDemand: number;
  baseLeadTimeDays: number;
  unitCost: number;
  orderingCost: number;
  holdingCost: number; // annual per unit
  targetServiceLevel: number;
  onHand: number;
  onOrder: number;
  backorders: number;
  leadTimes: number[]; // 10 observed lead times
  dailyDemand: number[]; // 365 daily demand points
  anomalies: Anomaly[];
  // Holdout verification (last 90 days)
  holdoutActual: number[];
  holdoutBaselinePred: number[];
  holdoutStockSensePred: number[];
  holdoutDates: string[];
  holdoutBaselineMAE: number;
  holdoutStockSenseMAE: number;
  holdoutGainPct: number;
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
  eoq: number;
  inventoryPosition: number;
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
  leadTimeDelayDays: number; // 0 to 30 days
  demandSurgeMultiplier: number; // 1.0 to 3.0x
  serviceLevelOverride?: number; // optional override
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
