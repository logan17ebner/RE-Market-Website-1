import { EconomicIndicators, PriceDataPoint } from '../types';

const BASE = 'https://api.worldbank.org/v2';

async function fetchIndicator(countryCode: string, indicator: string, years = 10) {
  const url = `${BASE}/country/${countryCode}/indicator/${indicator}?format=json&mrv=${years}&per_page=${years}`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length < 2) return null;
  return data[1] as Array<{ date: string; value: number | null }>;
}

function latestNonNull(data: Array<{ date: string; value: number | null }> | null) {
  if (!data) return null;
  const found = data.find((d) => d.value !== null);
  return found ? { value: found.value as number, year: parseInt(found.date) } : null;
}

function toHistory(data: Array<{ date: string; value: number | null }> | null): PriceDataPoint[] {
  if (!data) return [];
  return data
    .filter((d) => d.value !== null)
    .reverse()
    .map((d) => ({ period: d.date, value: d.value as number }));
}

export async function getEconomicIndicators(countryCode: string): Promise<EconomicIndicators> {
  const [gdpData, gdpPCData, inflationData, popData] = await Promise.all([
    fetchIndicator(countryCode, 'NY.GDP.MKTP.KD.ZG', 10), // GDP growth %
    fetchIndicator(countryCode, 'NY.GDP.PCAP.CD', 10),     // GDP per capita USD
    fetchIndicator(countryCode, 'FP.CPI.TOTL.ZG', 10),    // Inflation %
    fetchIndicator(countryCode, 'SP.POP.TOTL', 5),         // Population
  ]);

  const gdp = latestNonNull(gdpData);
  const gdpPC = latestNonNull(gdpPCData);
  const inflation = latestNonNull(inflationData);
  const pop = latestNonNull(popData);

  return {
    gdpGrowth: gdp?.value ?? null,
    gdpPerCapita: gdpPC?.value ?? null,
    inflation: inflation?.value ?? null,
    population: pop?.value ?? null,
    unemploymentRate: null, // requires separate call; omit for now
    gdpHistory: toHistory(gdpData),
    country: countryCode.toUpperCase(),
    year: gdp?.year ?? new Date().getFullYear() - 1,
  };
}
