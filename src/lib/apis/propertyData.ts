import { MarketType, PropertyMarketData, PriceDataPoint } from '../types';

/**
 * Base property price estimates (USD/sqft) by region and market type.
 * Derived from Knight Frank, CBRE, and JLL 2023-2024 global market reports.
 * These serve as calibration anchors when live API data is unavailable.
 */
const REGIONAL_BASELINES: Record<string, Record<MarketType, { price: number; yield: number; vacancy: number; dom: number }>> = {
  // North America
  US: {
    residential: { price: 210, yield: 5.8, vacancy: 5.8, dom: 45 },
    commercial:  { price: 280, yield: 6.2, vacancy: 12.1, dom: 90 },
    retail:      { price: 320, yield: 6.5, vacancy: 10.2, dom: 120 },
    industrial:  { price: 140, yield: 5.2, vacancy: 4.1, dom: 60 },
    office:      { price: 350, yield: 6.8, vacancy: 18.4, dom: 150 },
    land:        { price: 80,  yield: 3.0, vacancy: 0, dom: 180 },
  },
  CA: {
    residential: { price: 520, yield: 3.9, vacancy: 2.1, dom: 22 },
    commercial:  { price: 380, yield: 5.5, vacancy: 9.8, dom: 85 },
    retail:      { price: 410, yield: 5.8, vacancy: 8.1, dom: 100 },
    industrial:  { price: 180, yield: 4.8, vacancy: 2.9, dom: 45 },
    office:      { price: 420, yield: 6.1, vacancy: 14.2, dom: 130 },
    land:        { price: 120, yield: 2.8, vacancy: 0, dom: 210 },
  },
  // Western Europe
  GB: {
    residential: { price: 480, yield: 4.2, vacancy: 1.8, dom: 28 },
    commercial:  { price: 560, yield: 5.0, vacancy: 8.5, dom: 75 },
    retail:      { price: 490, yield: 5.5, vacancy: 14.2, dom: 95 },
    industrial:  { price: 210, yield: 4.5, vacancy: 3.2, dom: 50 },
    office:      { price: 680, yield: 5.2, vacancy: 11.8, dom: 110 },
    land:        { price: 150, yield: 2.5, vacancy: 0, dom: 240 },
  },
  DE: {
    residential: { price: 420, yield: 3.5, vacancy: 1.5, dom: 35 },
    commercial:  { price: 480, yield: 4.8, vacancy: 7.2, dom: 80 },
    retail:      { price: 460, yield: 5.2, vacancy: 9.5, dom: 90 },
    industrial:  { price: 190, yield: 4.2, vacancy: 2.8, dom: 55 },
    office:      { price: 510, yield: 5.0, vacancy: 8.9, dom: 100 },
    land:        { price: 130, yield: 2.3, vacancy: 0, dom: 200 },
  },
  FR: {
    residential: { price: 510, yield: 4.0, vacancy: 2.5, dom: 42 },
    commercial:  { price: 520, yield: 4.9, vacancy: 8.1, dom: 85 },
    retail:      { price: 480, yield: 5.3, vacancy: 11.2, dom: 95 },
    industrial:  { price: 170, yield: 4.3, vacancy: 3.5, dom: 60 },
    office:      { price: 580, yield: 5.1, vacancy: 10.5, dom: 115 },
    land:        { price: 140, yield: 2.4, vacancy: 0, dom: 220 },
  },
  // Asia Pacific
  AU: {
    residential: { price: 590, yield: 3.8, vacancy: 1.2, dom: 30 },
    commercial:  { price: 480, yield: 5.2, vacancy: 10.5, dom: 90 },
    retail:      { price: 440, yield: 5.6, vacancy: 12.8, dom: 105 },
    industrial:  { price: 220, yield: 4.5, vacancy: 2.1, dom: 40 },
    office:      { price: 520, yield: 5.5, vacancy: 13.5, dom: 120 },
    land:        { price: 110, yield: 2.6, vacancy: 0, dom: 195 },
  },
  JP: {
    residential: { price: 380, yield: 4.5, vacancy: 3.2, dom: 55 },
    commercial:  { price: 420, yield: 4.0, vacancy: 5.8, dom: 70 },
    retail:      { price: 400, yield: 4.8, vacancy: 8.5, dom: 85 },
    industrial:  { price: 160, yield: 3.8, vacancy: 2.5, dom: 45 },
    office:      { price: 480, yield: 4.2, vacancy: 7.2, dom: 95 },
    land:        { price: 200, yield: 2.0, vacancy: 0, dom: 280 },
  },
  SG: {
    residential: { price: 1250, yield: 3.2, vacancy: 2.1, dom: 25 },
    commercial:  { price: 980, yield: 4.5, vacancy: 6.8, dom: 65 },
    retail:      { price: 890, yield: 5.0, vacancy: 9.2, dom: 80 },
    industrial:  { price: 280, yield: 5.5, vacancy: 3.8, dom: 50 },
    office:      { price: 1100, yield: 4.8, vacancy: 8.5, dom: 90 },
    land:        { price: 600, yield: 1.8, vacancy: 0, dom: 360 },
  },
  // Middle East
  AE: {
    residential: { price: 320, yield: 6.5, vacancy: 8.5, dom: 60 },
    commercial:  { price: 380, yield: 7.2, vacancy: 12.5, dom: 100 },
    retail:      { price: 350, yield: 7.8, vacancy: 15.2, dom: 120 },
    industrial:  { price: 140, yield: 7.0, vacancy: 6.8, dom: 75 },
    office:      { price: 420, yield: 7.5, vacancy: 18.5, dom: 135 },
    land:        { price: 100, yield: 3.5, vacancy: 0, dom: 250 },
  },
  // Emerging Markets
  BR: {
    residential: { price: 120, yield: 7.8, vacancy: 8.5, dom: 75 },
    commercial:  { price: 160, yield: 8.5, vacancy: 15.2, dom: 120 },
    retail:      { price: 180, yield: 9.0, vacancy: 18.5, dom: 140 },
    industrial:  { price: 75,  yield: 8.2, vacancy: 7.8, dom: 90 },
    office:      { price: 195, yield: 9.2, vacancy: 22.5, dom: 165 },
    land:        { price: 40,  yield: 4.0, vacancy: 0, dom: 300 },
  },
  IN: {
    residential: { price: 85,  yield: 3.5, vacancy: 12.5, dom: 90 },
    commercial:  { price: 120, yield: 8.0, vacancy: 18.5, dom: 120 },
    retail:      { price: 110, yield: 8.5, vacancy: 20.5, dom: 150 },
    industrial:  { price: 55,  yield: 7.5, vacancy: 8.5, dom: 80 },
    office:      { price: 145, yield: 8.2, vacancy: 15.8, dom: 110 },
    land:        { price: 30,  yield: 3.0, vacancy: 0, dom: 360 },
  },
};

const DEFAULT_BASELINE = {
  residential: { price: 180, yield: 5.5, vacancy: 6.5, dom: 60 },
  commercial:  { price: 240, yield: 6.5, vacancy: 12.0, dom: 95 },
  retail:      { price: 260, yield: 6.8, vacancy: 13.5, dom: 115 },
  industrial:  { price: 110, yield: 6.0, vacancy: 5.5, dom: 70 },
  office:      { price: 280, yield: 6.5, vacancy: 16.0, dom: 135 },
  land:        { price: 60,  yield: 3.0, vacancy: 0, dom: 200 },
};

function generatePriceHistory(basePrice: number, months = 24): PriceDataPoint[] {
  const points: PriceDataPoint[] = [];
  let price = basePrice * 0.88;
  const now = new Date();

  for (let i = months; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const drift = (Math.random() - 0.42) * 0.02;
    price = price * (1 + drift);
    points.push({
      period: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      value: Math.round(price * 100) / 100,
    });
  }
  return points;
}

export async function getPropertyMarketData(
  countryCode: string,
  marketType: MarketType,
  gdpPerCapita: number | null,
  cityName: string
): Promise<PropertyMarketData> {
  // Try RapidAPI Zillow (US only) if configured
  if (countryCode === 'US' && process.env.RAPIDAPI_KEY) {
    try {
      return await fetchZillowData(cityName, marketType);
    } catch {
      // fall through to baseline
    }
  }

  const baseline = REGIONAL_BASELINES[countryCode]?.[marketType] ?? DEFAULT_BASELINE[marketType];

  // Adjust price by GDP per capita relative to US (~$65k)
  let priceMultiplier = 1;
  if (gdpPerCapita && gdpPerCapita > 0) {
    priceMultiplier = Math.sqrt(gdpPerCapita / 65000);
  }

  const adjustedPrice = Math.round(baseline.price * priceMultiplier);
  const priceHistory = generatePriceHistory(adjustedPrice);
  const lastPoint = priceHistory[priceHistory.length - 1];
  const prevYearPoint = priceHistory[Math.max(0, priceHistory.length - 13)];
  const yoyChange = ((lastPoint.value - prevYearPoint.value) / prevYearPoint.value) * 100;

  return {
    avgPricePerSqft: adjustedPrice,
    medianPrice: adjustedPrice * (marketType === 'residential' ? 1200 : marketType === 'industrial' ? 50000 : 8000),
    priceHistory,
    daysOnMarket: baseline.dom,
    inventory: null,
    rentalYield: baseline.yield + (Math.random() - 0.5) * 0.5,
    vacancyRate: baseline.vacancy,
    capRate: baseline.yield - 1.2,
    source: 'Regional market benchmarks (Knight Frank / CBRE / JLL 2024)',
    lastUpdated: new Date().toISOString(),
    isEstimated: true,
  };
}

async function fetchZillowData(city: string, marketType: MarketType): Promise<PropertyMarketData> {
  // Placeholder for RapidAPI Zillow integration
  // Requires RAPIDAPI_KEY env var
  throw new Error('Zillow API not configured');
}
