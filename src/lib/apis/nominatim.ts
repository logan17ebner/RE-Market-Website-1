import { CityResult } from '../types';

export async function searchCities(query: string): Promise<CityResult[]> {
  if (!query || query.length < 2) return [];

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&extratags=1&limit=8&featuretype=city&accept-language=en`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'REMarketAnalysis/1.0' },
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];

  const data = await res.json();

  const results: CityResult[] = [];
  const seen = new Set<string>();

  for (const item of data) {
    const address = item.address || {};
    const extra = item.extratags || {};

    const cityName =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      item.name;
    const country = address.country || '';
    const countryCode = (address.country_code || '').toUpperCase();
    const state = address.state || address.region || '';

    if (!cityName || !country) continue;

    const key = `${cityName}-${countryCode}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const displayName = state
      ? `${cityName}, ${state}, ${country}`
      : `${cityName}, ${country}`;

    // Parse population from extratags if available
    const population = extra.population ? parseInt(extra.population, 10) : undefined;

    results.push({
      id: item.place_id?.toString() || key,
      name: cityName,
      displayName,
      country,
      countryCode,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      state,
      population: isNaN(population as number) ? undefined : population,
    });
  }

  return results.slice(0, 6);
}
