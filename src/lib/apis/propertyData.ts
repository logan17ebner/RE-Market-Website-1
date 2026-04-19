import { MarketType, PropertyMarketData } from '../types';

// US baseline benchmarks by market type (CBRE / JLL / CoStar 2024)
// Used for non-residential types where Zillow doesn't publish metro data
const US_BASELINES: Record<MarketType, { price: number; yield: number; vacancy: number; dom: number }> = {
  residential: { price: 210, yield: 5.8, vacancy: 5.8,  dom: 45  },
  commercial:  { price: 280, yield: 6.2, vacancy: 12.1, dom: 90  },
  retail:      { price: 320, yield: 6.5, vacancy: 10.2, dom: 120 },
  industrial:  { price: 140, yield: 5.2, vacancy: 4.1,  dom: 60  },
  office:      { price: 350, yield: 6.8, vacancy: 18.4, dom: 150 },
  land:        { price: 80,  yield: 3.0, vacancy: 0,    dom: 180 },
};

export async function getPropertyMarketData(
  marketType: MarketType,
): Promise<PropertyMarketData> {
  const baseline = US_BASELINES[marketType];

  return {
    avgPricePerSqft: baseline.price,
    medianPrice: null,
    priceHistory: [],
    daysOnMarket: baseline.dom,
    inventory: null,
    rentalYield: baseline.yield,
    vacancyRate: baseline.vacancy,
    capRate: baseline.yield - 1.2,
    source: `US benchmark — ${marketType} (CBRE / JLL / CoStar 2024)`,
    lastUpdated: new Date().toISOString(),
    isEstimated: true,
  };
}
