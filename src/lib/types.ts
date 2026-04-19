export type MarketType = 'residential' | 'commercial' | 'retail' | 'industrial' | 'office' | 'land';

export type CityClass =
  | 'global-gateway'   // NYC, London, Tokyo — pop >5M, financial hub
  | 'major-metro'      // Chicago, Sydney, Berlin — pop 1-5M
  | 'large-city'       // Atlanta, Denver, Lisbon — pop 300k-1M
  | 'mid-city'         // pop 100k-300k, standalone
  | 'suburb-primary'   // <30mi from global-gateway city
  | 'suburb-secondary' // <30mi from major-metro city
  | 'small-city'       // pop <100k, not a suburb
  | 'emerging';        // lower-income country city

export interface CityResult {
  id: string;
  name: string;
  displayName: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  state?: string;
  population?: number;
  cityClass?: CityClass;
}

export interface MarketConfig {
  city: CityResult;
  marketType: MarketType;
}

export interface PriceDataPoint {
  period: string;
  value: number;
  label?: string;
}

export interface MarketMetric {
  label: string;
  value: string | number;
  change?: number; // percentage change YoY
  unit?: string;
  source?: string;
}

export interface FredData {
  mortgageRate: number | null;
  mortgageRateHistory: PriceDataPoint[];
  homePriceIndex: PriceDataPoint[];
  housingStarts: PriceDataPoint[];
}

export interface EconomicIndicators {
  gdpGrowth: number | null;
  gdpPerCapita: number | null;
  inflation: number | null;
  population: number | null;
  unemploymentRate: number | null;
  gdpHistory: PriceDataPoint[];
  country: string;
  year: number;
  fred?: FredData;
}

export interface PropertyMarketData {
  avgPricePerSqft: number | null;
  medianPrice: number | null;
  priceHistory: PriceDataPoint[];
  daysOnMarket: number | null;
  inventory: number | null;
  rentalYield: number | null;
  vacancyRate: number | null;
  capRate: number | null;
  source: string;
  lastUpdated: string;
  isEstimated: boolean;
}

export interface MarketHealthScore {
  overall: number; // 0-100
  supplyDemand: number;
  priceGrowth: number;
  economicStrength: number;
  investmentPotential: number;
  label: 'Cold' | 'Cooling' | 'Neutral' | 'Warm' | 'Hot';
}

export interface ComparableMarket {
  city: string;
  country: string;
  avgPricePerSqft: number;
  yoyChange: number;
  healthScore: number;
}

export interface AnalysisReport {
  config: MarketConfig;
  generatedAt: string;
  economic: EconomicIndicators;
  property: PropertyMarketData;
  healthScore: MarketHealthScore;
  comparables: ComparableMarket[];
  insights: string[];
  risks: string[];
  opportunities: string[];
}
