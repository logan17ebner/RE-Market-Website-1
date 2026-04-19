import { CityClass, CityResult } from '../types';

// Haversine distance in miles
function distanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Major world cities with approximate populations
const MAJOR_CITIES = [
  // Global gateways (pop >5M)
  { name: 'New York', lat: 40.71, lon: -74.01, pop: 8400000, class: 'global-gateway' as CityClass },
  { name: 'Los Angeles', lat: 34.05, lon: -118.24, pop: 3900000, class: 'global-gateway' as CityClass },
  { name: 'London', lat: 51.51, lon: -0.13, pop: 9000000, class: 'global-gateway' as CityClass },
  { name: 'Tokyo', lat: 35.68, lon: 139.69, pop: 13960000, class: 'global-gateway' as CityClass },
  { name: 'Paris', lat: 48.85, lon: 2.35, pop: 2200000, class: 'global-gateway' as CityClass },
  { name: 'Singapore', lat: 1.35, lon: 103.82, pop: 5850000, class: 'global-gateway' as CityClass },
  { name: 'Hong Kong', lat: 22.32, lon: 114.17, pop: 7500000, class: 'global-gateway' as CityClass },
  { name: 'Shanghai', lat: 31.22, lon: 121.47, pop: 24900000, class: 'global-gateway' as CityClass },
  { name: 'Dubai', lat: 25.2, lon: 55.27, pop: 3500000, class: 'global-gateway' as CityClass },
  { name: 'Sydney', lat: -33.87, lon: 151.21, pop: 5300000, class: 'global-gateway' as CityClass },
  { name: 'Toronto', lat: 43.65, lon: -79.38, pop: 2930000, class: 'global-gateway' as CityClass },
  // Major metros (pop 1-5M)
  { name: 'Chicago', lat: 41.88, lon: -87.63, pop: 2700000, class: 'major-metro' as CityClass },
  { name: 'Houston', lat: 29.76, lon: -95.37, pop: 2300000, class: 'major-metro' as CityClass },
  { name: 'Philadelphia', lat: 39.95, lon: -75.17, pop: 1600000, class: 'major-metro' as CityClass },
  { name: 'Phoenix', lat: 33.45, lon: -112.07, pop: 1600000, class: 'major-metro' as CityClass },
  { name: 'San Antonio', lat: 29.42, lon: -98.49, pop: 1430000, class: 'major-metro' as CityClass },
  { name: 'Dallas', lat: 32.78, lon: -96.80, pop: 1300000, class: 'major-metro' as CityClass },
  { name: 'San Jose', lat: 37.34, lon: -121.89, pop: 1010000, class: 'major-metro' as CityClass },
  { name: 'Austin', lat: 30.27, lon: -97.74, pop: 980000, class: 'major-metro' as CityClass },
  { name: 'San Francisco', lat: 37.77, lon: -122.42, pop: 870000, class: 'global-gateway' as CityClass },
  { name: 'Seattle', lat: 47.61, lon: -122.33, pop: 750000, class: 'major-metro' as CityClass },
  { name: 'Miami', lat: 25.77, lon: -80.19, pop: 460000, class: 'major-metro' as CityClass },
  { name: 'Atlanta', lat: 33.75, lon: -84.39, pop: 500000, class: 'major-metro' as CityClass },
  { name: 'Boston', lat: 42.36, lon: -71.06, pop: 690000, class: 'major-metro' as CityClass },
  { name: 'Denver', lat: 39.74, lon: -104.99, pop: 720000, class: 'major-metro' as CityClass },
  { name: 'Nashville', lat: 36.17, lon: -86.78, pop: 690000, class: 'major-metro' as CityClass },
  { name: 'Portland', lat: 45.52, lon: -122.68, pop: 650000, class: 'major-metro' as CityClass },
  { name: 'Las Vegas', lat: 36.17, lon: -115.14, pop: 650000, class: 'major-metro' as CityClass },
  { name: 'Berlin', lat: 52.52, lon: 13.40, pop: 3700000, class: 'major-metro' as CityClass },
  { name: 'Madrid', lat: 40.42, lon: -3.70, pop: 3300000, class: 'major-metro' as CityClass },
  { name: 'Amsterdam', lat: 52.37, lon: 4.90, pop: 920000, class: 'major-metro' as CityClass },
  { name: 'Munich', lat: 48.14, lon: 11.58, pop: 1490000, class: 'major-metro' as CityClass },
  { name: 'Barcelona', lat: 41.39, lon: 2.15, pop: 1620000, class: 'major-metro' as CityClass },
  { name: 'Rome', lat: 41.90, lon: 12.50, pop: 2870000, class: 'major-metro' as CityClass },
  { name: 'Milan', lat: 45.46, lon: 9.19, pop: 1400000, class: 'major-metro' as CityClass },
  { name: 'Warsaw', lat: 52.23, lon: 21.01, pop: 1860000, class: 'major-metro' as CityClass },
  { name: 'Seoul', lat: 37.57, lon: 126.98, pop: 9770000, class: 'global-gateway' as CityClass },
  { name: 'Beijing', lat: 39.91, lon: 116.39, pop: 21540000, class: 'global-gateway' as CityClass },
  { name: 'Mumbai', lat: 19.08, lon: 72.88, pop: 20700000, class: 'global-gateway' as CityClass },
  { name: 'São Paulo', lat: -23.55, lon: -46.63, pop: 12300000, class: 'global-gateway' as CityClass },
  { name: 'Mexico City', lat: 19.43, lon: -99.13, pop: 9200000, class: 'global-gateway' as CityClass },
  { name: 'Lagos', lat: 6.52, lon: 3.38, pop: 15000000, class: 'global-gateway' as CityClass },
  { name: 'Cairo', lat: 30.06, lon: 31.25, pop: 10100000, class: 'global-gateway' as CityClass },
  { name: 'Istanbul', lat: 41.01, lon: 28.96, pop: 15460000, class: 'global-gateway' as CityClass },
  { name: 'Bangkok', lat: 13.75, lon: 100.52, pop: 10500000, class: 'global-gateway' as CityClass },
  { name: 'Nairobi', lat: -1.29, lon: 36.82, pop: 4400000, class: 'major-metro' as CityClass },
  { name: 'Johannesburg', lat: -26.20, lon: 28.04, pop: 5630000, class: 'major-metro' as CityClass },
  { name: 'Melbourne', lat: -37.81, lon: 144.96, pop: 5150000, class: 'global-gateway' as CityClass },
  { name: 'Vienna', lat: 48.21, lon: 16.37, pop: 1930000, class: 'major-metro' as CityClass },
  { name: 'Zurich', lat: 47.38, lon: 8.54, pop: 440000, class: 'major-metro' as CityClass },
  { name: 'Stockholm', lat: 59.33, lon: 18.07, pop: 980000, class: 'major-metro' as CityClass },
  { name: 'Lisbon', lat: 38.72, lon: -9.14, pop: 550000, class: 'major-metro' as CityClass },
  { name: 'Brussels', lat: 50.85, lon: 4.35, pop: 1210000, class: 'major-metro' as CityClass },
  { name: 'Kuala Lumpur', lat: 3.14, lon: 101.69, pop: 1980000, class: 'major-metro' as CityClass },
  { name: 'Jakarta', lat: -6.21, lon: 106.85, pop: 10560000, class: 'global-gateway' as CityClass },
  { name: 'Manila', lat: 14.60, lon: 120.98, pop: 1780000, class: 'major-metro' as CityClass },
];

export function classifyCity(
  lat: number,
  lon: number,
  population: number | null,
  gdpPerCapita: number | null
): { cityClass: CityClass; nearestMajor: string | null; distanceMi: number | null } {
  // Find nearest major city
  let nearestMajor: (typeof MAJOR_CITIES)[0] | null = null;
  let minDist = Infinity;

  for (const mc of MAJOR_CITIES) {
    const d = distanceMiles(lat, lon, mc.lat, mc.lon);
    if (d < minDist) {
      minDist = d;
      nearestMajor = mc;
    }
  }

  const distMi = nearestMajor ? minDist : null;
  const nearestName = nearestMajor?.name ?? null;

  // Is this city itself a major city? (within 5 miles of a known major city)
  if (nearestMajor && minDist < 5) {
    return { cityClass: nearestMajor.class, nearestMajor: null, distanceMi: null };
  }

  // Emerging market check
  const isEmerging = gdpPerCapita !== null && gdpPerCapita < 15000;

  // Suburban classification: within 35 miles of a major city
  if (nearestMajor && minDist < 35) {
    if (isEmerging) return { cityClass: 'emerging', nearestMajor: nearestName, distanceMi: minDist };
    if (nearestMajor.class === 'global-gateway') {
      return { cityClass: 'suburb-primary', nearestMajor: nearestName, distanceMi: minDist };
    }
    return { cityClass: 'suburb-secondary', nearestMajor: nearestName, distanceMi: minDist };
  }

  // Standalone city — classify by population
  if (isEmerging) return { cityClass: 'emerging', nearestMajor: nearestName, distanceMi: minDist };

  const pop = population ?? 0;
  if (pop >= 1000000) return { cityClass: 'major-metro', nearestMajor: nearestName, distanceMi: minDist };
  if (pop >= 300000) return { cityClass: 'large-city', nearestMajor: nearestName, distanceMi: minDist };
  if (pop >= 100000) return { cityClass: 'mid-city', nearestMajor: nearestName, distanceMi: minDist };
  return { cityClass: 'small-city', nearestMajor: nearestName, distanceMi: minDist };
}
