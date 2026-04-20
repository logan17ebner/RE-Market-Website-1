import { NextRequest, NextResponse } from 'next/server';
import { getEconomicIndicators } from '@/lib/apis/worldbank';
import { getPropertyMarketData } from '@/lib/apis/propertyData';
import { computeHealthScore, generateInsights } from '@/lib/apis/insights';
import { getUSHousingData } from '@/lib/apis/fred';
import { getZillowData } from '@/lib/apis/zillow';
import { classifyCity } from '@/lib/apis/cityClassifier';
import { getLocalInsights } from '@/lib/apis/localInsights';
import { AnalysisReport, CityClass, CityResult, MarketType, ComparableMarket, PropertyMarketData } from '@/lib/types';

interface ComparableEntry extends ComparableMarket {
  cityClass: CityClass[];  // which city classes this comp is good for
}

// Comparable cities keyed by market type, each tagged with which city classes they suit
const ALL_COMPARABLES: Record<MarketType, ComparableEntry[]> = {
  residential: [
    // Global gateways
    { city: 'Manhattan', country: 'USA', avgPricePerSqft: 1850, yoyChange: 2.1, healthScore: 62, cityClass: ['global-gateway'] },
    { city: 'London', country: 'UK', avgPricePerSqft: 1200, yoyChange: 1.8, healthScore: 60, cityClass: ['global-gateway'] },
    { city: 'Singapore', country: 'Singapore', avgPricePerSqft: 1250, yoyChange: 3.2, healthScore: 74, cityClass: ['global-gateway'] },
    { city: 'Sydney', country: 'Australia', avgPricePerSqft: 820, yoyChange: 6.1, healthScore: 78, cityClass: ['global-gateway'] },
    { city: 'Toronto', country: 'Canada', avgPricePerSqft: 780, yoyChange: 4.2, healthScore: 72, cityClass: ['global-gateway'] },
    { city: 'Paris', country: 'France', avgPricePerSqft: 760, yoyChange: 1.5, healthScore: 59, cityClass: ['global-gateway'] },
    // Major metros
    { city: 'Chicago', country: 'USA', avgPricePerSqft: 310, yoyChange: 3.1, healthScore: 64, cityClass: ['major-metro'] },
    { city: 'Miami', country: 'USA', avgPricePerSqft: 620, yoyChange: 5.8, healthScore: 76, cityClass: ['major-metro'] },
    { city: 'Berlin', country: 'Germany', avgPricePerSqft: 540, yoyChange: 2.8, healthScore: 61, cityClass: ['major-metro'] },
    { city: 'Amsterdam', country: 'Netherlands', avgPricePerSqft: 580, yoyChange: 3.2, healthScore: 65, cityClass: ['major-metro'] },
    { city: 'Vienna', country: 'Austria', avgPricePerSqft: 460, yoyChange: 1.8, healthScore: 62, cityClass: ['major-metro'] },
    // Large cities
    { city: 'Atlanta', country: 'USA', avgPricePerSqft: 210, yoyChange: 4.5, healthScore: 68, cityClass: ['large-city'] },
    { city: 'Nashville', country: 'USA', avgPricePerSqft: 240, yoyChange: 5.2, healthScore: 70, cityClass: ['large-city'] },
    { city: 'Denver', country: 'USA', avgPricePerSqft: 280, yoyChange: 3.8, healthScore: 68, cityClass: ['large-city'] },
    { city: 'Portland', country: 'USA', avgPricePerSqft: 295, yoyChange: 2.5, healthScore: 64, cityClass: ['large-city'] },
    { city: 'Lisbon', country: 'Portugal', avgPricePerSqft: 420, yoyChange: 6.8, healthScore: 74, cityClass: ['large-city'] },
    { city: 'Barcelona', country: 'Spain', avgPricePerSqft: 390, yoyChange: 4.2, healthScore: 68, cityClass: ['large-city'] },
    // Mid cities
    { city: 'Raleigh', country: 'USA', avgPricePerSqft: 195, yoyChange: 4.8, healthScore: 67, cityClass: ['mid-city'] },
    { city: 'Richmond', country: 'USA', avgPricePerSqft: 175, yoyChange: 4.1, healthScore: 64, cityClass: ['mid-city'] },
    { city: 'Boise', country: 'USA', avgPricePerSqft: 210, yoyChange: 5.5, healthScore: 68, cityClass: ['mid-city'] },
    { city: 'Spokane', country: 'USA', avgPricePerSqft: 145, yoyChange: 3.2, healthScore: 60, cityClass: ['mid-city'] },
    // Suburbs of global gateways
    { city: 'Evanston, IL', country: 'USA', avgPricePerSqft: 310, yoyChange: 3.5, healthScore: 66, cityClass: ['suburb-primary'] },
    { city: 'Newton, MA', country: 'USA', avgPricePerSqft: 480, yoyChange: 4.2, healthScore: 70, cityClass: ['suburb-primary'] },
    { city: 'Bethesda, MD', country: 'USA', avgPricePerSqft: 520, yoyChange: 3.8, healthScore: 71, cityClass: ['suburb-primary'] },
    { city: 'Pasadena, CA', country: 'USA', avgPricePerSqft: 650, yoyChange: 3.1, healthScore: 68, cityClass: ['suburb-primary'] },
    { city: 'Hoboken, NJ', country: 'USA', avgPricePerSqft: 720, yoyChange: 4.5, healthScore: 72, cityClass: ['suburb-primary'] },
    { city: 'Brookline, MA', country: 'USA', avgPricePerSqft: 560, yoyChange: 3.9, healthScore: 70, cityClass: ['suburb-primary'] },
    { city: 'Montclair, NJ', country: 'USA', avgPricePerSqft: 410, yoyChange: 4.1, healthScore: 68, cityClass: ['suburb-primary'] },
    { city: 'Greenwich, CT', country: 'USA', avgPricePerSqft: 680, yoyChange: 5.2, healthScore: 74, cityClass: ['suburb-primary'] },
    { city: 'Naperville, IL', country: 'USA', avgPricePerSqft: 230, yoyChange: 3.2, healthScore: 65, cityClass: ['suburb-primary'] },
    { city: 'Palo Alto, CA', country: 'USA', avgPricePerSqft: 1100, yoyChange: 2.8, healthScore: 70, cityClass: ['suburb-primary'] },
    { city: 'Surrey', country: 'UK', avgPricePerSqft: 580, yoyChange: 2.1, healthScore: 64, cityClass: ['suburb-primary'] },
    { city: 'Versailles', country: 'France', avgPricePerSqft: 440, yoyChange: 1.8, healthScore: 61, cityClass: ['suburb-primary'] },
    // Suburbs of major metros
    { city: 'Oak Park, IL', country: 'USA', avgPricePerSqft: 195, yoyChange: 2.8, healthScore: 62, cityClass: ['suburb-secondary'] },
    { city: 'Decatur, GA', country: 'USA', avgPricePerSqft: 185, yoyChange: 4.5, healthScore: 64, cityClass: ['suburb-secondary'] },
    { city: 'Scottsdale, AZ', country: 'USA', avgPricePerSqft: 310, yoyChange: 4.8, healthScore: 68, cityClass: ['suburb-secondary'] },
    { city: 'Plano, TX', country: 'USA', avgPricePerSqft: 195, yoyChange: 4.2, healthScore: 67, cityClass: ['suburb-secondary'] },
    { city: 'Bellevue, WA', country: 'USA', avgPricePerSqft: 480, yoyChange: 3.5, healthScore: 70, cityClass: ['suburb-secondary'] },
    // Small cities
    { city: 'Memphis', country: 'USA', avgPricePerSqft: 115, yoyChange: 3.8, healthScore: 58, cityClass: ['small-city'] },
    { city: 'Birmingham', country: 'USA', avgPricePerSqft: 105, yoyChange: 3.5, healthScore: 56, cityClass: ['small-city'] },
    { city: 'Jackson', country: 'USA', avgPricePerSqft: 95, yoyChange: 2.8, healthScore: 52, cityClass: ['small-city'] },
    // Emerging
    { city: 'Bangkok', country: 'Thailand', avgPricePerSqft: 185, yoyChange: 4.1, healthScore: 63, cityClass: ['emerging'] },
    { city: 'Mumbai', country: 'India', avgPricePerSqft: 110, yoyChange: 5.8, healthScore: 61, cityClass: ['emerging'] },
    { city: 'São Paulo', country: 'Brazil', avgPricePerSqft: 130, yoyChange: 7.2, healthScore: 58, cityClass: ['emerging'] },
    { city: 'Cairo', country: 'Egypt', avgPricePerSqft: 55, yoyChange: 6.1, healthScore: 48, cityClass: ['emerging'] },
    { city: 'Nairobi', country: 'Kenya', avgPricePerSqft: 45, yoyChange: 4.8, healthScore: 52, cityClass: ['emerging'] },
    { city: 'Istanbul', country: 'Turkey', avgPricePerSqft: 120, yoyChange: 8.5, healthScore: 55, cityClass: ['emerging'] },
  ],
  office: [
    { city: 'Manhattan', country: 'USA', avgPricePerSqft: 1100, yoyChange: -3.2, healthScore: 45, cityClass: ['global-gateway'] },
    { city: 'London', country: 'UK', avgPricePerSqft: 850, yoyChange: -1.5, healthScore: 52, cityClass: ['global-gateway'] },
    { city: 'Singapore', country: 'Singapore', avgPricePerSqft: 980, yoyChange: 2.1, healthScore: 68, cityClass: ['global-gateway'] },
    { city: 'Paris', country: 'France', avgPricePerSqft: 720, yoyChange: 0.5, healthScore: 55, cityClass: ['global-gateway'] },
    { city: 'Tokyo', country: 'Japan', avgPricePerSqft: 780, yoyChange: 1.2, healthScore: 62, cityClass: ['global-gateway'] },
    { city: 'Chicago', country: 'USA', avgPricePerSqft: 420, yoyChange: -2.1, healthScore: 48, cityClass: ['major-metro'] },
    { city: 'Miami', country: 'USA', avgPricePerSqft: 490, yoyChange: 1.5, healthScore: 62, cityClass: ['major-metro'] },
    { city: 'Munich', country: 'Germany', avgPricePerSqft: 680, yoyChange: 0.8, healthScore: 55, cityClass: ['major-metro'] },
    { city: 'Amsterdam', country: 'Netherlands', avgPricePerSqft: 640, yoyChange: 1.2, healthScore: 58, cityClass: ['major-metro'] },
    { city: 'Atlanta', country: 'USA', avgPricePerSqft: 295, yoyChange: 0.8, healthScore: 57, cityClass: ['large-city'] },
    { city: 'Denver', country: 'USA', avgPricePerSqft: 320, yoyChange: 1.5, healthScore: 60, cityClass: ['large-city'] },
    { city: 'Nashville', country: 'USA', avgPricePerSqft: 280, yoyChange: 2.1, healthScore: 63, cityClass: ['large-city'] },
    { city: 'Raleigh', country: 'USA', avgPricePerSqft: 240, yoyChange: 2.5, healthScore: 62, cityClass: ['mid-city', 'large-city'] },
    { city: 'Richmond', country: 'USA', avgPricePerSqft: 210, yoyChange: 1.8, healthScore: 58, cityClass: ['mid-city'] },
    { city: 'Harrisburg, PA', country: 'USA', avgPricePerSqft: 165, yoyChange: 1.5, healthScore: 55, cityClass: ['suburb-primary', 'mid-city'] },
    { city: 'King of Prussia, PA', country: 'USA', avgPricePerSqft: 285, yoyChange: 2.8, healthScore: 63, cityClass: ['suburb-primary'] },
    { city: 'Tysons, VA', country: 'USA', avgPricePerSqft: 310, yoyChange: 2.2, healthScore: 62, cityClass: ['suburb-primary'] },
    { city: 'Stamford, CT', country: 'USA', avgPricePerSqft: 420, yoyChange: 1.5, healthScore: 60, cityClass: ['suburb-primary'] },
    { city: 'Schaumburg, IL', country: 'USA', avgPricePerSqft: 195, yoyChange: 1.2, healthScore: 56, cityClass: ['suburb-primary', 'suburb-secondary'] },
    { city: 'Plano, TX', country: 'USA', avgPricePerSqft: 220, yoyChange: 2.5, healthScore: 61, cityClass: ['suburb-secondary'] },
    { city: 'Bellevue, WA', country: 'USA', avgPricePerSqft: 480, yoyChange: 2.8, healthScore: 65, cityClass: ['suburb-secondary'] },
    { city: 'Memphis', country: 'USA', avgPricePerSqft: 145, yoyChange: 0.5, healthScore: 49, cityClass: ['small-city'] },
    { city: 'Jackson', country: 'USA', avgPricePerSqft: 110, yoyChange: 0.2, healthScore: 44, cityClass: ['small-city'] },
    { city: 'Mumbai', country: 'India', avgPricePerSqft: 145, yoyChange: 4.2, healthScore: 60, cityClass: ['emerging'] },
    { city: 'Lagos', country: 'Nigeria', avgPricePerSqft: 85, yoyChange: 3.5, healthScore: 44, cityClass: ['emerging'] },
    { city: 'Bangkok', country: 'Thailand', avgPricePerSqft: 165, yoyChange: 1.8, healthScore: 55, cityClass: ['emerging'] },
  ],
  retail: [
    { city: 'Manhattan', country: 'USA', avgPricePerSqft: 1400, yoyChange: -1.2, healthScore: 52, cityClass: ['global-gateway'] },
    { city: 'London', country: 'UK', avgPricePerSqft: 1100, yoyChange: -0.8, healthScore: 54, cityClass: ['global-gateway'] },
    { city: 'Paris', country: 'France', avgPricePerSqft: 950, yoyChange: 1.8, healthScore: 58, cityClass: ['global-gateway'] },
    { city: 'Tokyo', country: 'Japan', avgPricePerSqft: 720, yoyChange: 1.5, healthScore: 60, cityClass: ['global-gateway'] },
    { city: 'Chicago', country: 'USA', avgPricePerSqft: 380, yoyChange: -1.5, healthScore: 50, cityClass: ['major-metro'] },
    { city: 'Miami', country: 'USA', avgPricePerSqft: 420, yoyChange: 3.2, healthScore: 65, cityClass: ['major-metro'] },
    { city: 'Madrid', country: 'Spain', avgPricePerSqft: 520, yoyChange: 4.5, healthScore: 69, cityClass: ['major-metro'] },
    { city: 'Atlanta', country: 'USA', avgPricePerSqft: 245, yoyChange: 2.8, healthScore: 61, cityClass: ['large-city'] },
    { city: 'Nashville', country: 'USA', avgPricePerSqft: 265, yoyChange: 3.5, healthScore: 64, cityClass: ['large-city'] },
    { city: 'Raleigh', country: 'USA', avgPricePerSqft: 210, yoyChange: 3.2, healthScore: 62, cityClass: ['mid-city', 'large-city'] },
    { city: 'King of Prussia, PA', country: 'USA', avgPricePerSqft: 220, yoyChange: 2.1, healthScore: 59, cityClass: ['suburb-primary'] },
    { city: 'Short Hills, NJ', country: 'USA', avgPricePerSqft: 310, yoyChange: 2.5, healthScore: 63, cityClass: ['suburb-primary'] },
    { city: 'Tysons, VA', country: 'USA', avgPricePerSqft: 260, yoyChange: 2.2, healthScore: 61, cityClass: ['suburb-primary'] },
    { city: 'Scottsdale, AZ', country: 'USA', avgPricePerSqft: 280, yoyChange: 3.8, healthScore: 64, cityClass: ['suburb-secondary'] },
    { city: 'Plano, TX', country: 'USA', avgPricePerSqft: 195, yoyChange: 3.1, healthScore: 61, cityClass: ['suburb-secondary'] },
    { city: 'Memphis', country: 'USA', avgPricePerSqft: 120, yoyChange: 0.8, healthScore: 47, cityClass: ['small-city'] },
    { city: 'Bangkok', country: 'Thailand', avgPricePerSqft: 190, yoyChange: 3.5, healthScore: 60, cityClass: ['emerging'] },
    { city: 'Mumbai', country: 'India', avgPricePerSqft: 120, yoyChange: 5.5, healthScore: 58, cityClass: ['emerging'] },
  ],
  industrial: [
    { city: 'Los Angeles', country: 'USA', avgPricePerSqft: 285, yoyChange: 8.5, healthScore: 85, cityClass: ['global-gateway'] },
    { city: 'London', country: 'UK', avgPricePerSqft: 245, yoyChange: 7.2, healthScore: 82, cityClass: ['global-gateway'] },
    { city: 'Singapore', country: 'Singapore', avgPricePerSqft: 280, yoyChange: 5.5, healthScore: 80, cityClass: ['global-gateway'] },
    { city: 'Chicago', country: 'USA', avgPricePerSqft: 165, yoyChange: 9.5, healthScore: 85, cityClass: ['major-metro'] },
    { city: 'Dallas', country: 'USA', avgPricePerSqft: 145, yoyChange: 9.8, healthScore: 84, cityClass: ['major-metro'] },
    { city: 'Rotterdam', country: 'Netherlands', avgPricePerSqft: 185, yoyChange: 8.1, healthScore: 82, cityClass: ['major-metro'] },
    { city: 'Atlanta', country: 'USA', avgPricePerSqft: 135, yoyChange: 8.9, healthScore: 82, cityClass: ['large-city', 'major-metro'] },
    { city: 'Denver', country: 'USA', avgPricePerSqft: 125, yoyChange: 7.8, healthScore: 78, cityClass: ['large-city'] },
    { city: 'Lehigh Valley, PA', country: 'USA', avgPricePerSqft: 110, yoyChange: 10.5, healthScore: 82, cityClass: ['suburb-primary', 'mid-city'] },
    { city: 'Inland Empire, CA', country: 'USA', avgPricePerSqft: 155, yoyChange: 9.2, healthScore: 83, cityClass: ['suburb-primary'] },
    { city: 'Elgin, IL', country: 'USA', avgPricePerSqft: 95, yoyChange: 8.5, healthScore: 76, cityClass: ['suburb-primary', 'suburb-secondary'] },
    { city: 'Memphis', country: 'USA', avgPricePerSqft: 95, yoyChange: 7.5, healthScore: 76, cityClass: ['small-city', 'mid-city'] },
    { city: 'Savannah', country: 'USA', avgPricePerSqft: 88, yoyChange: 9.8, healthScore: 78, cityClass: ['small-city', 'mid-city'] },
    { city: 'Warsaw', country: 'Poland', avgPricePerSqft: 120, yoyChange: 11.5, healthScore: 79, cityClass: ['emerging', 'major-metro'] },
    { city: 'Bangkok', country: 'Thailand', avgPricePerSqft: 75, yoyChange: 6.8, healthScore: 68, cityClass: ['emerging'] },
  ],
  commercial: [
    { city: 'Singapore', country: 'Singapore', avgPricePerSqft: 920, yoyChange: 5.8, healthScore: 81, cityClass: ['global-gateway'] },
    { city: 'Hong Kong', country: 'China', avgPricePerSqft: 1100, yoyChange: -2.1, healthScore: 44, cityClass: ['global-gateway'] },
    { city: 'Manhattan', country: 'USA', avgPricePerSqft: 850, yoyChange: 2.5, healthScore: 65, cityClass: ['global-gateway'] },
    { city: 'Miami', country: 'USA', avgPricePerSqft: 480, yoyChange: 4.5, healthScore: 72, cityClass: ['major-metro'] },
    { city: 'Chicago', country: 'USA', avgPricePerSqft: 350, yoyChange: 1.8, healthScore: 60, cityClass: ['major-metro'] },
    { city: 'Amsterdam', country: 'Netherlands', avgPricePerSqft: 680, yoyChange: 3.1, healthScore: 67, cityClass: ['major-metro'] },
    { city: 'Atlanta', country: 'USA', avgPricePerSqft: 270, yoyChange: 3.2, healthScore: 64, cityClass: ['large-city'] },
    { city: 'Nashville', country: 'USA', avgPricePerSqft: 260, yoyChange: 4.2, healthScore: 67, cityClass: ['large-city'] },
    { city: 'Raleigh', country: 'USA', avgPricePerSqft: 225, yoyChange: 3.8, healthScore: 63, cityClass: ['mid-city', 'large-city'] },
    { city: 'King of Prussia, PA', country: 'USA', avgPricePerSqft: 245, yoyChange: 2.5, healthScore: 61, cityClass: ['suburb-primary'] },
    { city: 'Stamford, CT', country: 'USA', avgPricePerSqft: 380, yoyChange: 2.1, healthScore: 62, cityClass: ['suburb-primary'] },
    { city: 'Scottsdale, AZ', country: 'USA', avgPricePerSqft: 290, yoyChange: 3.5, healthScore: 63, cityClass: ['suburb-secondary'] },
    { city: 'Plano, TX', country: 'USA', avgPricePerSqft: 230, yoyChange: 3.2, healthScore: 62, cityClass: ['suburb-secondary'] },
    { city: 'Memphis', country: 'USA', avgPricePerSqft: 155, yoyChange: 1.8, healthScore: 52, cityClass: ['small-city'] },
    { city: 'Dubai', country: 'UAE', avgPricePerSqft: 410, yoyChange: 8.2, healthScore: 76, cityClass: ['emerging', 'global-gateway'] },
    { city: 'Bangkok', country: 'Thailand', avgPricePerSqft: 160, yoyChange: 3.5, healthScore: 59, cityClass: ['emerging'] },
  ],
  land: [
    { city: 'Long Island', country: 'USA', avgPricePerSqft: 180, yoyChange: 4.8, healthScore: 69, cityClass: ['suburb-primary'] },
    { city: 'Westchester, NY', country: 'USA', avgPricePerSqft: 210, yoyChange: 5.2, healthScore: 72, cityClass: ['suburb-primary'] },
    { city: 'Fairfax, VA', country: 'USA', avgPricePerSqft: 175, yoyChange: 4.5, healthScore: 68, cityClass: ['suburb-primary'] },
    { city: 'Montgomery Co., MD', country: 'USA', avgPricePerSqft: 195, yoyChange: 4.2, healthScore: 70, cityClass: ['suburb-primary'] },
    { city: 'DuPage Co., IL', country: 'USA', avgPricePerSqft: 120, yoyChange: 3.8, healthScore: 65, cityClass: ['suburb-primary', 'suburb-secondary'] },
    { city: 'Scottsdale, AZ', country: 'USA', avgPricePerSqft: 145, yoyChange: 5.5, healthScore: 68, cityClass: ['suburb-secondary'] },
    { city: 'Frisco, TX', country: 'USA', avgPricePerSqft: 110, yoyChange: 5.8, healthScore: 70, cityClass: ['suburb-secondary'] },
    { city: 'Austin', country: 'USA', avgPricePerSqft: 95, yoyChange: 5.2, healthScore: 71, cityClass: ['major-metro', 'large-city'] },
    { city: 'Nashville', country: 'USA', avgPricePerSqft: 88, yoyChange: 6.1, healthScore: 72, cityClass: ['major-metro', 'large-city'] },
    { city: 'Raleigh', country: 'USA', avgPricePerSqft: 78, yoyChange: 5.5, healthScore: 68, cityClass: ['mid-city', 'large-city'] },
    { city: 'Memphis', country: 'USA', avgPricePerSqft: 28, yoyChange: 2.1, healthScore: 50, cityClass: ['small-city'] },
    { city: 'Lisbon', country: 'Portugal', avgPricePerSqft: 140, yoyChange: 6.8, healthScore: 74, cityClass: ['large-city', 'major-metro'] },
    { city: 'Bangkok', country: 'Thailand', avgPricePerSqft: 55, yoyChange: 4.1, healthScore: 63, cityClass: ['emerging'] },
    { city: 'Cape Town', country: 'South Africa', avgPricePerSqft: 45, yoyChange: 3.5, healthScore: 59, cityClass: ['emerging'] },
  ],
};

function getComparables(
  cityName: string,
  marketType: MarketType,
  cityClass: CityClass,
  gdpPerCapita: number | null
): ComparableMarket[] {
  const all = ALL_COMPARABLES[marketType] ?? ALL_COMPARABLES.residential;

  // Exclude the searched city itself
  const pool = all.filter((c) =>
    !c.city.toLowerCase().startsWith(cityName.toLowerCase()) &&
    !cityName.toLowerCase().startsWith(c.city.toLowerCase().split(',')[0])
  );

  // Adjacent city classes to fall back on if not enough exact matches
  const adjacentClasses: Record<CityClass, CityClass[]> = {
    'global-gateway':   ['major-metro'],
    'major-metro':      ['global-gateway', 'large-city'],
    'large-city':       ['major-metro', 'mid-city'],
    'mid-city':         ['large-city', 'small-city', 'suburb-secondary'],
    'suburb-primary':   ['suburb-secondary', 'mid-city'],
    'suburb-secondary': ['suburb-primary', 'mid-city'],
    'small-city':       ['mid-city', 'suburb-secondary'],
    'emerging':         ['emerging'],
  };

  const exactMatches = pool.filter((c) => c.cityClass.includes(cityClass));
  const fallback = pool.filter(
    (c) => !c.cityClass.includes(cityClass) &&
    adjacentClasses[cityClass].some((ac) => c.cityClass.includes(ac))
  );

  const candidates = [...exactMatches, ...fallback].slice(0, 8);

  // Shuffle slightly so same searches don't always show identical order
  const shuffled = candidates.sort(() => 0.05 - Math.random());

  return shuffled.slice(0, 4).map(({ city, country, avgPricePerSqft, yoyChange, healthScore }) => ({
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

    const { cityClass, nearestMajor } = classifyCity(city.lat, city.lon, city.population ?? null, null);

    const [economic, fredData, zillowData] = await Promise.all([
      getEconomicIndicators('us'),
      getUSHousingData(),
      getZillowData(city.name, city.state ?? '', nearestMajor ?? undefined),
    ]);

    const mortgageRate = fredData.mortgageRate.length > 0
      ? fredData.mortgageRate[fredData.mortgageRate.length - 1].value
      : null;
    economic.fred = {
      mortgageRate,
      mortgageRateHistory: fredData.mortgageRate,
      homePriceIndex: fredData.homePriceIndex,
      housingStarts: fredData.housingStarts,
    };

    const propertyCalibrated = await getPropertyMarketData(marketType);

    const property: PropertyMarketData = { ...propertyCalibrated };

    if (zillowData && marketType === 'residential') {
      // Zillow ZHVI is median home value (absolute $); derive $/sqft using ~1,600 sqft median US home
      const sqftEstimate = 1600;
      property.medianPrice = zillowData.medianHomeValue;
      property.avgPricePerSqft = Math.round(zillowData.medianHomeValue / sqftEstimate);
      property.priceHistory = zillowData.priceHistory;
      property.yoyChange = zillowData.yoyChange;
      property.medianRent = zillowData.medianRent ?? undefined;
      property.rentHistory = zillowData.rentHistory.length > 0 ? zillowData.rentHistory : undefined;
      property.metro = zillowData.metro;
      property.isEstimated = false;
      property.source = `Zillow Research — ${zillowData.metro}`;
      property.lastUpdated = zillowData.lastUpdated;
      // Derive rental yield from ZORI if available
      if (zillowData.medianRent && zillowData.medianHomeValue > 0) {
        property.rentalYield = Math.round(((zillowData.medianRent * 12) / zillowData.medianHomeValue) * 1000) / 10;
        property.capRate = Math.max(0, property.rentalYield - 1.5);
      }
    }

    const healthScore = computeHealthScore(economic, property, marketType);
    const comparables = getComparables(city.name, marketType, cityClass, economic.gdpPerCapita);

    const partialReport = {
      config: { city, marketType },
      generatedAt: new Date().toISOString(),
      economic,
      property,
      healthScore,
      comparables,
    };

    const { insights, risks, opportunities } = generateInsights(partialReport);
    const localInsights = await getLocalInsights(city.name, city.state ?? '');

    const report: AnalysisReport = {
      ...partialReport,
      insights,
      risks,
      opportunities,
      localInsights,
    };

    return NextResponse.json(report);
  } catch (err) {
    console.error('Analysis error:', err);
    return NextResponse.json({ error: 'Failed to generate analysis' }, { status: 500 });
  }
}
