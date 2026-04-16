import { NextRequest, NextResponse } from 'next/server';
import { getEconomicIndicators } from '@/lib/apis/worldbank';
import { getPropertyMarketData } from '@/lib/apis/propertyData';
import { computeHealthScore, generateInsights } from '@/lib/apis/insights';
import { AnalysisReport, CityResult, MarketType, ComparableMarket } from '@/lib/types';

const COMPARABLES_DB: Record<string, ComparableMarket[]> = {
  residential: [
    { city: 'Toronto', country: 'Canada', avgPricePerSqft: 780, yoyChange: 4.2, healthScore: 72 },
    { city: 'Sydney', country: 'Australia', avgPricePerSqft: 820, yoyChange: 6.1, healthScore: 78 },
    { city: 'Berlin', country: 'Germany', avgPricePerSqft: 540, yoyChange: 2.8, healthScore: 61 },
    { city: 'Tokyo', country: 'Japan', avgPricePerSqft: 610, yoyChange: 3.5, healthScore: 65 },
  ],
  commercial: [
    { city: 'Singapore', country: 'Singapore', avgPricePerSqft: 920, yoyChange: 5.8, healthScore: 81 },
    { city: 'Hong Kong', country: 'China', avgPricePerSqft: 1100, yoyChange: -2.1, healthScore: 44 },
    { city: 'Dubai', country: 'UAE', avgPricePerSqft: 410, yoyChange: 8.2, healthScore: 76 },
    { city: 'Amsterdam', country: 'Netherlands', avgPricePerSqft: 680, yoyChange: 3.1, healthScore: 67 },
  ],
  retail: [
    { city: 'Paris', country: 'France', avgPricePerSqft: 950, yoyChange: 1.8, healthScore: 58 },
    { city: 'Milan', country: 'Italy', avgPricePerSqft: 780, yoyChange: 2.2, healthScore: 61 },
    { city: 'Madrid', country: 'Spain', avgPricePerSqft: 520, yoyChange: 4.5, healthScore: 69 },
    { city: 'Seoul', country: 'South Korea', avgPricePerSqft: 650, yoyChange: 3.8, healthScore: 66 },
  ],
  industrial: [
    { city: 'Chicago', country: 'USA', avgPricePerSqft: 165, yoyChange: 9.5, healthScore: 85 },
    { city: 'Rotterdam', country: 'Netherlands', avgPricePerSqft: 185, yoyChange: 8.1, healthScore: 82 },
    { city: 'Melbourne', country: 'Australia', avgPricePerSqft: 210, yoyChange: 10.2, healthScore: 88 },
    { city: 'Warsaw', country: 'Poland', avgPricePerSqft: 120, yoyChange: 11.5, healthScore: 79 },
  ],
  office: [
    { city: 'London', country: 'UK', avgPricePerSqft: 850, yoyChange: -1.5, healthScore: 52 },
    { city: 'New York', country: 'USA', avgPricePerSqft: 1100, yoyChange: -3.2, healthScore: 45 },
    { city: 'Munich', country: 'Germany', avgPricePerSqft: 680, yoyChange: 0.8, healthScore: 55 },
    { city: 'Stockholm', country: 'Sweden', avgPricePerSqft: 590, yoyChange: -0.5, healthScore: 53 },
  ],
  land: [
    { city: 'Austin', country: 'USA', avgPricePerSqft: 95, yoyChange: 5.2, healthScore: 71 },
    { city: 'Lisbon', country: 'Portugal', avgPricePerSqft: 140, yoyChange: 6.8, healthScore: 74 },
    { city: 'Bangkok', country: 'Thailand', avgPricePerSqft: 55, yoyChange: 4.1, healthScore: 63 },
    { city: 'Cape Town', country: 'South Africa', avgPricePerSqft: 45, yoyChange: 3.5, healthScore: 59 },
  ],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const city: CityResult = body.city;
    const marketType: MarketType = body.marketType;

    if (!city || !marketType) {
      return NextResponse.json({ error: 'Missing city or marketType' }, { status: 400 });
    }

    const [economic, property] = await Promise.all([
      getEconomicIndicators(city.countryCode.toLowerCase()),
      getPropertyMarketData(city.countryCode, marketType, null, city.name),
    ]);

    // Re-run property with gdpPerCapita for better calibration
    const propertyCalibrated = await getPropertyMarketData(
      city.countryCode,
      marketType,
      economic.gdpPerCapita,
      city.name
    );

    const healthScore = computeHealthScore(economic, propertyCalibrated, marketType);
    const comparables = COMPARABLES_DB[marketType] ?? COMPARABLES_DB.residential;

    const partialReport = {
      config: { city, marketType },
      generatedAt: new Date().toISOString(),
      economic,
      property: propertyCalibrated,
      healthScore,
      comparables,
    };

    const { insights, risks, opportunities } = generateInsights(partialReport);

    const report: AnalysisReport = {
      ...partialReport,
      insights,
      risks,
      opportunities,
    };

    return NextResponse.json(report);
  } catch (err) {
    console.error('Analysis error:', err);
    return NextResponse.json({ error: 'Failed to generate analysis' }, { status: 500 });
  }
}
