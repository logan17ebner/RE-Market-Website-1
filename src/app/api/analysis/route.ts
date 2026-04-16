import { NextRequest, NextResponse } from 'next/server';
import { getEconomicIndicators } from '@/lib/apis/worldbank';
import { getPropertyMarketData } from '@/lib/apis/propertyData';
import { computeHealthScore, generateInsights } from '@/lib/apis/insights';
import { getUSHousingData } from '@/lib/apis/fred';
import { AnalysisReport, CityResult, MarketType, ComparableMarket } from '@/lib/types';

// Tiered comparable cities by market type and GDP-per-capita tier
// Tier 1: >$50k GDP/cap (global gateway), Tier 2: $25-50k (major metro),
// Tier 3: $10-25k (regional hub), Tier 4: <$10k (emerging)
type Tier = 1 | 2 | 3 | 4;

interface ComparableEntry extends ComparableMarket {
  tier: Tier;
  region: string;
}

const ALL_COMPARABLES: Record<MarketType, ComparableEntry[]> = {
  residential: [
    { city: 'Manhattan', country: 'USA', avgPricePerSqft: 1850, yoyChange: 2.1, healthScore: 62, tier: 1, region: 'north-america' },
    { city: 'London', country: 'UK', avgPricePerSqft: 1200, yoyChange: 1.8, healthScore: 60, tier: 1, region: 'europe' },
    { city: 'Singapore', country: 'Singapore', avgPricePerSqft: 1250, yoyChange: 3.2, healthScore: 74, tier: 1, region: 'asia' },
    { city: 'Sydney', country: 'Australia', avgPricePerSqft: 820, yoyChange: 6.1, healthScore: 78, tier: 1, region: 'oceania' },
    { city: 'Toronto', country: 'Canada', avgPricePerSqft: 780, yoyChange: 4.2, healthScore: 72, tier: 1, region: 'north-america' },
    { city: 'Paris', country: 'France', avgPricePerSqft: 760, yoyChange: 1.5, healthScore: 59, tier: 1, region: 'europe' },
    { city: 'Berlin', country: 'Germany', avgPricePerSqft: 540, yoyChange: 2.8, healthScore: 61, tier: 2, region: 'europe' },
    { city: 'Miami', country: 'USA', avgPricePerSqft: 620, yoyChange: 5.8, healthScore: 76, tier: 2, region: 'north-america' },
    { city: 'Chicago', country: 'USA', avgPricePerSqft: 310, yoyChange: 3.1, healthScore: 64, tier: 2, region: 'north-america' },
    { city: 'Atlanta', country: 'USA', avgPricePerSqft: 210, yoyChange: 4.5, healthScore: 68, tier: 2, region: 'north-america' },
    { city: 'Nashville', country: 'USA', avgPricePerSqft: 240, yoyChange: 5.2, healthScore: 70, tier: 2, region: 'north-america' },
    { city: 'Dallas', country: 'USA', avgPricePerSqft: 195, yoyChange: 4.8, healthScore: 69, tier: 2, region: 'north-america' },
    { city: 'Memphis', country: 'USA', avgPricePerSqft: 115, yoyChange: 3.8, healthScore: 58, tier: 3, region: 'north-america' },
    { city: 'Birmingham', country: 'USA', avgPricePerSqft: 105, yoyChange: 3.5, healthScore: 56, tier: 3, region: 'north-america' },
    { city: 'Lisbon', country: 'Portugal', avgPricePerSqft: 420, yoyChange: 6.8, healthScore: 74, tier: 2, region: 'europe' },
    { city: 'Madrid', country: 'Spain', avgPricePerSqft: 380, yoyChange: 4.5, healthScore: 67, tier: 2, region: 'europe' },
    { city: 'Warsaw', country: 'Poland', avgPricePerSqft: 220, yoyChange: 5.1, healthScore: 65, tier: 2, region: 'europe' },
    { city: 'Bangkok', country: 'Thailand', avgPricePerSqft: 185, yoyChange: 4.1, healthScore: 63, tier: 3, region: 'asia' },
    { city: 'Kuala Lumpur', country: 'Malaysia', avgPricePerSqft: 145, yoyChange: 3.2, healthScore: 60, tier: 3, region: 'asia' },
    { city: 'Istanbul', country: 'Turkey', avgPricePerSqft: 120, yoyChange: 8.5, healthScore: 55, tier: 3, region: 'europe' },
    { city: 'Mumbai', country: 'India', avgPricePerSqft: 110, yoyChange: 5.8, healthScore: 61, tier: 4, region: 'asia' },
    { city: 'São Paulo', country: 'Brazil', avgPricePerSqft: 130, yoyChange: 7.2, healthScore: 58, tier: 4, region: 'south-america' },
    { city: 'Cairo', country: 'Egypt', avgPricePerSqft: 55, yoyChange: 6.1, healthScore: 48, tier: 4, region: 'africa' },
    { city: 'Nairobi', country: 'Kenya', avgPricePerSqft: 45, yoyChange: 4.8, healthScore: 52, tier: 4, region: 'africa' },
  ],
  office: [
    { city: 'Manhattan', country: 'USA', avgPricePerSqft: 1100, yoyChange: -3.2, healthScore: 45, tier: 1, region: 'north-america' },
    { city: 'London', country: 'UK', avgPricePerSqft: 850, yoyChange: -1.5, healthScore: 52, tier: 1, region: 'europe' },
    { city: 'Singapore', country: 'Singapore', avgPricePerSqft: 980, yoyChange: 2.1, healthScore: 68, tier: 1, region: 'asia' },
    { city: 'Paris', country: 'France', avgPricePerSqft: 720, yoyChange: 0.5, healthScore: 55, tier: 1, region: 'europe' },
    { city: 'Munich', country: 'Germany', avgPricePerSqft: 680, yoyChange: 0.8, healthScore: 55, tier: 1, region: 'europe' },
    { city: 'Sydney', country: 'Australia', avgPricePerSqft: 620, yoyChange: -0.8, healthScore: 53, tier: 1, region: 'oceania' },
    { city: 'Chicago', country: 'USA', avgPricePerSqft: 420, yoyChange: -2.1, healthScore: 48, tier: 2, region: 'north-america' },
    { city: 'Miami', country: 'USA', avgPricePerSqft: 490, yoyChange: 1.5, healthScore: 62, tier: 2, region: 'north-america' },
    { city: 'Atlanta', country: 'USA', avgPricePerSqft: 295, yoyChange: 0.8, healthScore: 57, tier: 2, region: 'north-america' },
    { city: 'Dallas', country: 'USA', avgPricePerSqft: 310, yoyChange: 1.2, healthScore: 60, tier: 2, region: 'north-america' },
    { city: 'Nashville', country: 'USA', avgPricePerSqft: 280, yoyChange: 2.1, healthScore: 63, tier: 2, region: 'north-america' },
    { city: 'New Orleans', country: 'USA', avgPricePerSqft: 195, yoyChange: 1.8, healthScore: 54, tier: 3, region: 'north-america' },
    { city: 'Memphis', country: 'USA', avgPricePerSqft: 145, yoyChange: 0.5, healthScore: 49, tier: 3, region: 'north-america' },
    { city: 'Jacksonville', country: 'USA', avgPricePerSqft: 185, yoyChange: 2.2, healthScore: 55, tier: 3, region: 'north-america' },
    { city: 'Warsaw', country: 'Poland', avgPricePerSqft: 310, yoyChange: 2.8, healthScore: 64, tier: 2, region: 'europe' },
    { city: 'Madrid', country: 'Spain', avgPricePerSqft: 380, yoyChange: 1.5, healthScore: 59, tier: 2, region: 'europe' },
    { city: 'Dubai', country: 'UAE', avgPricePerSqft: 420, yoyChange: 7.5, healthScore: 72, tier: 2, region: 'middle-east' },
    { city: 'Bangkok', country: 'Thailand', avgPricePerSqft: 165, yoyChange: 1.8, healthScore: 55, tier: 3, region: 'asia' },
    { city: 'Mumbai', country: 'India', avgPricePerSqft: 145, yoyChange: 4.2, healthScore: 60, tier: 4, region: 'asia' },
    { city: 'Lagos', country: 'Nigeria', avgPricePerSqft: 85, yoyChange: 3.5, healthScore: 44, tier: 4, region: 'africa' },
  ],
  retail: [
    { city: 'Manhattan', country: 'USA', avgPricePerSqft: 1400, yoyChange: -1.2, healthScore: 52, tier: 1, region: 'north-america' },
    { city: 'London', country: 'UK', avgPricePerSqft: 1100, yoyChange: -0.8, healthScore: 54, tier: 1, region: 'europe' },
    { city: 'Paris', country: 'France', avgPricePerSqft: 950, yoyChange: 1.8, healthScore: 58, tier: 1, region: 'europe' },
    { city: 'Milan', country: 'Italy', avgPricePerSqft: 780, yoyChange: 2.2, healthScore: 61, tier: 1, region: 'europe' },
    { city: 'Sydney', country: 'Australia', avgPricePerSqft: 640, yoyChange: 2.5, healthScore: 63, tier: 1, region: 'oceania' },
    { city: 'Tokyo', country: 'Japan', avgPricePerSqft: 720, yoyChange: 1.5, healthScore: 60, tier: 1, region: 'asia' },
    { city: 'Chicago', country: 'USA', avgPricePerSqft: 380, yoyChange: -1.5, healthScore: 50, tier: 2, region: 'north-america' },
    { city: 'Madrid', country: 'Spain', avgPricePerSqft: 520, yoyChange: 4.5, healthScore: 69, tier: 2, region: 'europe' },
    { city: 'Seoul', country: 'South Korea', avgPricePerSqft: 650, yoyChange: 3.8, healthScore: 66, tier: 2, region: 'asia' },
    { city: 'Miami', country: 'USA', avgPricePerSqft: 420, yoyChange: 3.2, healthScore: 65, tier: 2, region: 'north-america' },
    { city: 'Atlanta', country: 'USA', avgPricePerSqft: 245, yoyChange: 2.8, healthScore: 61, tier: 2, region: 'north-america' },
    { city: 'Nashville', country: 'USA', avgPricePerSqft: 265, yoyChange: 3.5, healthScore: 64, tier: 2, region: 'north-america' },
    { city: 'New Orleans', country: 'USA', avgPricePerSqft: 175, yoyChange: 1.5, healthScore: 52, tier: 3, region: 'north-america' },
    { city: 'Memphis', country: 'USA', avgPricePerSqft: 120, yoyChange: 0.8, healthScore: 47, tier: 3, region: 'north-america' },
    { city: 'Dubai', country: 'UAE', avgPricePerSqft: 350, yoyChange: 8.2, healthScore: 70, tier: 2, region: 'middle-east' },
    { city: 'Bangkok', country: 'Thailand', avgPricePerSqft: 190, yoyChange: 3.5, healthScore: 60, tier: 3, region: 'asia' },
    { city: 'Istanbul', country: 'Turkey', avgPricePerSqft: 145, yoyChange: 7.8, healthScore: 52, tier: 3, region: 'europe' },
    { city: 'Mumbai', country: 'India', avgPricePerSqft: 120, yoyChange: 5.5, healthScore: 58, tier: 4, region: 'asia' },
  ],
  industrial: [
    { city: 'Los Angeles', country: 'USA', avgPricePerSqft: 285, yoyChange: 8.5, healthScore: 85, tier: 1, region: 'north-america' },
    { city: 'London', country: 'UK', avgPricePerSqft: 245, yoyChange: 7.2, healthScore: 82, tier: 1, region: 'europe' },
    { city: 'Singapore', country: 'Singapore', avgPricePerSqft: 280, yoyChange: 5.5, healthScore: 80, tier: 1, region: 'asia' },
    { city: 'Sydney', country: 'Australia', avgPricePerSqft: 210, yoyChange: 10.2, healthScore: 88, tier: 1, region: 'oceania' },
    { city: 'Chicago', country: 'USA', avgPricePerSqft: 165, yoyChange: 9.5, healthScore: 85, tier: 2, region: 'north-america' },
    { city: 'Rotterdam', country: 'Netherlands', avgPricePerSqft: 185, yoyChange: 8.1, healthScore: 82, tier: 2, region: 'europe' },
    { city: 'Dallas', country: 'USA', avgPricePerSqft: 145, yoyChange: 9.8, healthScore: 84, tier: 2, region: 'north-america' },
    { city: 'Atlanta', country: 'USA', avgPricePerSqft: 135, yoyChange: 8.9, healthScore: 82, tier: 2, region: 'north-america' },
    { city: 'Memphis', country: 'USA', avgPricePerSqft: 95, yoyChange: 7.5, healthScore: 76, tier: 3, region: 'north-america' },
    { city: 'New Orleans', country: 'USA', avgPricePerSqft: 80, yoyChange: 5.2, healthScore: 65, tier: 3, region: 'north-america' },
    { city: 'Warsaw', country: 'Poland', avgPricePerSqft: 120, yoyChange: 11.5, healthScore: 79, tier: 2, region: 'europe' },
    { city: 'Bangkok', country: 'Thailand', avgPricePerSqft: 75, yoyChange: 6.8, healthScore: 68, tier: 3, region: 'asia' },
    { city: 'Mumbai', country: 'India', avgPricePerSqft: 60, yoyChange: 8.2, healthScore: 65, tier: 4, region: 'asia' },
    { city: 'São Paulo', country: 'Brazil', avgPricePerSqft: 70, yoyChange: 7.5, healthScore: 62, tier: 4, region: 'south-america' },
  ],
  commercial: [
    { city: 'Singapore', country: 'Singapore', avgPricePerSqft: 920, yoyChange: 5.8, healthScore: 81, tier: 1, region: 'asia' },
    { city: 'Hong Kong', country: 'China', avgPricePerSqft: 1100, yoyChange: -2.1, healthScore: 44, tier: 1, region: 'asia' },
    { city: 'Dubai', country: 'UAE', avgPricePerSqft: 410, yoyChange: 8.2, healthScore: 76, tier: 2, region: 'middle-east' },
    { city: 'Amsterdam', country: 'Netherlands', avgPricePerSqft: 680, yoyChange: 3.1, healthScore: 67, tier: 1, region: 'europe' },
    { city: 'Miami', country: 'USA', avgPricePerSqft: 480, yoyChange: 4.5, healthScore: 72, tier: 2, region: 'north-america' },
    { city: 'Chicago', country: 'USA', avgPricePerSqft: 350, yoyChange: 1.8, healthScore: 60, tier: 2, region: 'north-america' },
    { city: 'Atlanta', country: 'USA', avgPricePerSqft: 270, yoyChange: 3.2, healthScore: 64, tier: 2, region: 'north-america' },
    { city: 'Dallas', country: 'USA', avgPricePerSqft: 290, yoyChange: 3.8, healthScore: 66, tier: 2, region: 'north-america' },
    { city: 'Nashville', country: 'USA', avgPricePerSqft: 260, yoyChange: 4.2, healthScore: 67, tier: 2, region: 'north-america' },
    { city: 'New Orleans', country: 'USA', avgPricePerSqft: 185, yoyChange: 2.1, healthScore: 55, tier: 3, region: 'north-america' },
    { city: 'Bangkok', country: 'Thailand', avgPricePerSqft: 160, yoyChange: 3.5, healthScore: 59, tier: 3, region: 'asia' },
    { city: 'Istanbul', country: 'Turkey', avgPricePerSqft: 140, yoyChange: 6.5, healthScore: 54, tier: 3, region: 'europe' },
    { city: 'Mumbai', country: 'India', avgPricePerSqft: 125, yoyChange: 5.2, healthScore: 58, tier: 4, region: 'asia' },
    { city: 'Lagos', country: 'Nigeria', avgPricePerSqft: 80, yoyChange: 4.2, healthScore: 46, tier: 4, region: 'africa' },
  ],
  land: [
    { city: 'Austin', country: 'USA', avgPricePerSqft: 95, yoyChange: 5.2, healthScore: 71, tier: 2, region: 'north-america' },
    { city: 'Nashville', country: 'USA', avgPricePerSqft: 88, yoyChange: 6.1, healthScore: 72, tier: 2, region: 'north-america' },
    { city: 'Dallas', country: 'USA', avgPricePerSqft: 75, yoyChange: 4.8, healthScore: 68, tier: 2, region: 'north-america' },
    { city: 'Atlanta', country: 'USA', avgPricePerSqft: 68, yoyChange: 4.5, healthScore: 67, tier: 2, region: 'north-america' },
    { city: 'New Orleans', country: 'USA', avgPricePerSqft: 38, yoyChange: 2.5, healthScore: 54, tier: 3, region: 'north-america' },
    { city: 'Memphis', country: 'USA', avgPricePerSqft: 28, yoyChange: 2.1, healthScore: 50, tier: 3, region: 'north-america' },
    { city: 'Lisbon', country: 'Portugal', avgPricePerSqft: 140, yoyChange: 6.8, healthScore: 74, tier: 2, region: 'europe' },
    { city: 'Bangkok', country: 'Thailand', avgPricePerSqft: 55, yoyChange: 4.1, healthScore: 63, tier: 3, region: 'asia' },
    { city: 'Cape Town', country: 'South Africa', avgPricePerSqft: 45, yoyChange: 3.5, healthScore: 59, tier: 3, region: 'africa' },
    { city: 'Nairobi', country: 'Kenya', avgPricePerSqft: 30, yoyChange: 3.8, healthScore: 55, tier: 4, region: 'africa' },
    { city: 'Ho Chi Minh City', country: 'Vietnam', avgPricePerSqft: 42, yoyChange: 5.5, healthScore: 62, tier: 4, region: 'asia' },
    { city: 'Colombo', country: 'Sri Lanka', avgPricePerSqft: 25, yoyChange: 2.8, healthScore: 48, tier: 4, region: 'asia' },
  ],
};

function getComparables(
  cityName: string,
  marketType: MarketType,
  gdpPerCapita: number | null,
  countryCode: string
): ComparableMarket[] {
  const all = ALL_COMPARABLES[marketType] ?? ALL_COMPARABLES.residential;

  // Determine tier from GDP per capita
  let tier: Tier = 3;
  if (gdpPerCapita !== null) {
    if (gdpPerCapita >= 50000) tier = 1;
    else if (gdpPerCapita >= 25000) tier = 2;
    else if (gdpPerCapita >= 10000) tier = 3;
    else tier = 4;
  }

  // Exclude the searched city itself
  const pool = all.filter((c) => c.city.toLowerCase() !== cityName.toLowerCase());

  // Score each comparable: same tier = best, adjacent tier = ok
  const scored = pool.map((c) => {
    const tierDiff = Math.abs(c.tier - tier);
    const sameCountry = c.country === countryCode || (countryCode === 'US' && c.country === 'USA');
    // Prefer same-tier cities, slight bonus for same country (context), penalty for far tiers
    const score = (3 - tierDiff) * 10 + (sameCountry ? 3 : 0);
    return { ...c, score };
  });

  // Sort by score desc, take top 4, strip internal fields
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ city, country, avgPricePerSqft, yoyChange, healthScore }) => ({
      city, country, avgPricePerSqft, yoyChange, healthScore,
    }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const city: CityResult = body.city;
    const marketType: MarketType = body.marketType;

    if (!city || !marketType) {
      return NextResponse.json({ error: 'Missing city or marketType' }, { status: 400 });
    }

    const isUS = city.countryCode === 'US';

    const [economic, fredData] = await Promise.all([
      getEconomicIndicators(city.countryCode.toLowerCase()),
      isUS ? getUSHousingData() : Promise.resolve(null),
    ]);

    // Attach FRED data to economic indicators for US cities
    if (fredData) {
      const mortgageRate = fredData.mortgageRate.length > 0
        ? fredData.mortgageRate[fredData.mortgageRate.length - 1].value
        : null;
      economic.fred = {
        mortgageRate,
        mortgageRateHistory: fredData.mortgageRate,
        homePriceIndex: fredData.homePriceIndex,
        housingStarts: fredData.housingStarts,
      };
    }

    // Re-run property with gdpPerCapita for better calibration
    const propertyCalibrated = await getPropertyMarketData(
      city.countryCode,
      marketType,
      economic.gdpPerCapita,
      city.name
    );

    const healthScore = computeHealthScore(economic, propertyCalibrated, marketType);
    const comparables = getComparables(city.name, marketType, economic.gdpPerCapita, city.countryCode);

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
