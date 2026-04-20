import { PriceDataPoint } from '../types';

const BASE = 'https://api.stlouisfed.org/fred/series/observations';

async function fetchSeries(seriesId: string, limit = 24): Promise<PriceDataPoint[]> {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return [];

  const url = `${BASE}?series_id=${seriesId}&api_key=${apiKey}&file_type=json&limit=${limit}&sort_order=desc`;
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.observations) return [];
    return (data.observations as Array<{ date: string; value: string }>)
      .filter((o) => o.value !== '.')
      .reverse()
      .map((o) => ({ period: o.date, value: parseFloat(o.value) }));
  } catch {
    return [];
  }
}

export async function getUSHousingData(): Promise<{
  mortgageRate: PriceDataPoint[];
  homePriceIndex: PriceDataPoint[];
  housingStarts: PriceDataPoint[];
}> {
  const [mortgageRate, homePriceIndex, housingStarts] = await Promise.all([
    fetchSeries('MORTGAGE30US', 52), // 30-year fixed mortgage rate (weekly)
    fetchSeries('CSUSHPINSA', 24),   // Case-Shiller Home Price Index (monthly)
    fetchSeries('HOUST', 24),        // Housing starts (monthly, thousands)
  ]);

  return { mortgageRate, homePriceIndex, housingStarts };
}
