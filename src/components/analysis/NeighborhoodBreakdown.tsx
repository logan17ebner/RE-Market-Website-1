'use client';

// Sub-market price multipliers relative to metro median (1.0 = metro median)
// Matches against the Zillow metro string returned in property.metro
const SUBMARKETS: Record<string, { name: string; multiplier: number }[]> = {
  'Los Angeles-Long Beach-Anaheim, CA': [
    { name: 'Beverly Hills',   multiplier: 3.8 }, { name: 'Santa Monica',    multiplier: 2.6 },
    { name: 'West Hollywood',  multiplier: 2.1 }, { name: 'Culver City',     multiplier: 1.8 },
    { name: 'Pasadena',        multiplier: 1.4 }, { name: 'Burbank',         multiplier: 1.2 },
    { name: 'Glendale',        multiplier: 1.1 }, { name: 'Long Beach',      multiplier: 0.9 },
    { name: 'Inglewood',       multiplier: 0.75 },{ name: 'Compton',         multiplier: 0.55 },
  ],
  'New York, NY': [
    { name: 'Upper East Side', multiplier: 4.2 }, { name: 'Midtown',         multiplier: 3.8 },
    { name: 'Park Slope',      multiplier: 2.1 }, { name: 'Astoria',         multiplier: 1.4 },
    { name: 'Flatbush',        multiplier: 1.1 }, { name: 'Staten Island',   multiplier: 0.85 },
    { name: 'The Bronx',       multiplier: 0.65 },
  ],
  'Chicago, IL': [
    { name: 'Gold Coast',      multiplier: 2.8 }, { name: 'Lincoln Park',    multiplier: 2.2 },
    { name: 'River North',     multiplier: 2.0 }, { name: 'Wicker Park',     multiplier: 1.6 },
    { name: 'Logan Square',    multiplier: 1.3 }, { name: 'Evanston',        multiplier: 1.4 },
    { name: 'Pilsen',          multiplier: 0.9 }, { name: 'South Shore',     multiplier: 0.5 },
  ],
  'Miami-Fort Lauderdale, FL': [
    { name: 'Miami Beach',     multiplier: 2.8 }, { name: 'Brickell',        multiplier: 2.2 },
    { name: 'Coral Gables',    multiplier: 2.0 }, { name: 'Coconut Grove',   multiplier: 1.9 },
    { name: 'Wynwood',         multiplier: 1.5 }, { name: 'Fort Lauderdale', multiplier: 1.1 },
    { name: 'Hialeah',         multiplier: 0.75 },{ name: 'Little Havana',   multiplier: 0.85 },
  ],
  'Houston, TX': [
    { name: 'River Oaks',      multiplier: 3.5 }, { name: 'West University', multiplier: 2.2 },
    { name: 'Memorial',        multiplier: 2.0 }, { name: 'Montrose',        multiplier: 1.5 },
    { name: 'The Heights',     multiplier: 1.4 }, { name: 'Midtown',         multiplier: 1.4 },
    { name: 'Sugar Land',      multiplier: 1.1 }, { name: 'Pearland',        multiplier: 0.9 },
    { name: 'Katy',            multiplier: 1.0 },
  ],
  'Dallas-Fort Worth, TX': [
    { name: 'Highland Park',   multiplier: 3.8 }, { name: 'University Park', multiplier: 3.2 },
    { name: 'Uptown',          multiplier: 2.0 }, { name: 'Frisco',          multiplier: 1.3 },
    { name: 'Plano',           multiplier: 1.2 }, { name: 'McKinney',        multiplier: 1.2 },
    { name: 'Irving',          multiplier: 0.9 }, { name: 'Garland',         multiplier: 0.8 },
  ],
  'Phoenix, AZ': [
    { name: 'Paradise Valley', multiplier: 3.2 }, { name: 'Scottsdale N.',   multiplier: 2.1 },
    { name: 'Scottsdale S.',   multiplier: 1.7 }, { name: 'Gilbert',         multiplier: 1.2 },
    { name: 'Chandler',        multiplier: 1.2 }, { name: 'Tempe',           multiplier: 1.1 },
    { name: 'Peoria',          multiplier: 1.0 }, { name: 'Mesa',            multiplier: 0.9 },
    { name: 'Glendale',        multiplier: 0.8 },
  ],
  'Seattle, WA': [
    { name: 'Bellevue',        multiplier: 2.2 }, { name: 'Queen Anne',      multiplier: 2.0 },
    { name: 'Kirkland',        multiplier: 1.9 }, { name: 'Redmond',         multiplier: 1.8 },
    { name: 'Capitol Hill',    multiplier: 1.8 }, { name: 'Ballard',         multiplier: 1.6 },
    { name: 'West Seattle',    multiplier: 1.4 }, { name: 'Renton',          multiplier: 1.1 },
    { name: 'Tacoma',          multiplier: 0.75 },
  ],
  'Boston, MA': [
    { name: 'Back Bay',        multiplier: 3.0 }, { name: 'Beacon Hill',     multiplier: 2.8 },
    { name: 'Cambridge',       multiplier: 2.4 }, { name: 'South End',       multiplier: 2.2 },
    { name: 'Brookline',       multiplier: 2.0 }, { name: 'Newton',          multiplier: 1.8 },
    { name: 'Jamaica Plain',   multiplier: 1.5 }, { name: 'Dorchester',      multiplier: 1.0 },
    { name: 'Roxbury',         multiplier: 0.75 },
  ],
  'Washington, DC': [
    { name: 'Georgetown',      multiplier: 2.8 }, { name: 'Dupont Circle',   multiplier: 2.4 },
    { name: 'Capitol Hill',    multiplier: 2.2 }, { name: 'Arlington',       multiplier: 1.8 },
    { name: 'Bethesda',        multiplier: 2.0 }, { name: 'Adams Morgan',    multiplier: 1.8 },
    { name: 'Alexandria',      multiplier: 1.5 }, { name: 'Silver Spring',   multiplier: 1.1 },
    { name: 'Anacostia',       multiplier: 0.65 },
  ],
  'Atlanta, GA': [
    { name: 'Buckhead',        multiplier: 2.4 }, { name: 'Virginia-Highland',multiplier: 1.8 },
    { name: 'Inman Park',      multiplier: 1.7 }, { name: 'Midtown',         multiplier: 1.6 },
    { name: 'Old Fourth Ward', multiplier: 1.4 }, { name: 'Decatur',         multiplier: 1.3 },
    { name: 'Smyrna',          multiplier: 1.0 }, { name: 'College Park',    multiplier: 0.65 },
  ],
  'Denver, CO': [
    { name: 'Cherry Creek',    multiplier: 2.2 }, { name: 'Wash. Park',      multiplier: 1.9 },
    { name: 'Highlands',       multiplier: 1.8 }, { name: 'LoDo',            multiplier: 1.7 },
    { name: 'Capitol Hill',    multiplier: 1.5 }, { name: 'Englewood',       multiplier: 1.1 },
    { name: 'Lakewood',        multiplier: 1.1 }, { name: 'Aurora',          multiplier: 0.85 },
    { name: 'Thornton',        multiplier: 0.9 },
  ],
  'Nashville, TN': [
    { name: 'Belle Meade',     multiplier: 2.8 }, { name: 'Green Hills',     multiplier: 2.2 },
    { name: 'Germantown',      multiplier: 1.8 }, { name: '12 South',        multiplier: 1.9 },
    { name: 'East Nashville',  multiplier: 1.6 }, { name: 'Sylvan Park',     multiplier: 1.5 },
    { name: 'Franklin',        multiplier: 1.8 }, { name: 'Madison',         multiplier: 0.85 },
    { name: 'Antioch',         multiplier: 0.7 },
  ],
  'Austin, TX': [
    { name: 'West Lake Hills', multiplier: 2.5 }, { name: 'Tarrytown',       multiplier: 2.2 },
    { name: 'Travis Heights',  multiplier: 1.8 }, { name: 'South Congress',  multiplier: 1.7 },
    { name: 'East Austin',     multiplier: 1.5 }, { name: 'Mueller',         multiplier: 1.4 },
    { name: 'Round Rock',      multiplier: 0.95 },{ name: 'Pflugerville',    multiplier: 0.85 },
  ],
  'San Diego, CA': [
    { name: 'La Jolla',        multiplier: 2.8 }, { name: 'Del Mar',         multiplier: 2.6 },
    { name: 'Coronado',        multiplier: 2.4 }, { name: 'Mission Hills',   multiplier: 1.6 },
    { name: 'North Park',      multiplier: 1.4 }, { name: 'Escondido',       multiplier: 0.9 },
    { name: 'Chula Vista',     multiplier: 0.85 },{ name: 'El Cajon',        multiplier: 0.75 },
  ],
  'Tampa, FL': [
    { name: 'Davis Islands',   multiplier: 2.5 }, { name: 'Hyde Park',       multiplier: 2.2 },
    { name: 'South Tampa',     multiplier: 1.9 }, { name: 'Channelside',     multiplier: 1.7 },
    { name: 'St. Pete Beach',  multiplier: 1.8 }, { name: 'Clearwater',      multiplier: 1.1 },
    { name: 'Seminole Heights',multiplier: 1.3 }, { name: 'Brandon',         multiplier: 0.85 },
  ],
};

// Fuzzy match metro string → submarket key
function findSubmarkets(metro: string) {
  if (!metro) return null;
  const m = metro.toLowerCase();
  for (const [key, subs] of Object.entries(SUBMARKETS)) {
    const k = key.toLowerCase();
    // Match on city name portion before the comma
    const keyCity = k.split(',')[0];
    if (m.startsWith(keyCity) || m.includes(keyCity.split('-')[0])) return { key, subs };
  }
  return null;
}

interface Props {
  metro:       string;
  medianPrice: number; // metro median home value in $
}

export default function NeighborhoodBreakdown({ metro, medianPrice }: Props) {
  const match = findSubmarkets(metro);
  if (!match) return null;

  const subs = match.subs.map(s => ({
    name:  s.name,
    value: Math.round(medianPrice * s.multiplier),
  })).sort((a, b) => b.value - a.value);

  const maxVal = subs[0].value;

  return (
    <div className="space-y-3">
      <div>
        <p className="label-upper">Sub-Market Breakdown</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Estimated median home values by neighborhood — relative to {metro} metro median. Based on typical pricing patterns; not live Zillow data.
        </p>
      </div>
      <div className="card p-5 space-y-3">
        {subs.map(s => {
          const pct = (s.value / maxVal) * 100;
          const isMedian = Math.abs(s.value - medianPrice) / medianPrice < 0.1;
          return (
            <div key={s.name} className="flex items-center gap-3">
              <span className="text-xs w-36 flex-shrink-0 truncate" style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
              <div className="flex-1 h-5 rounded-sm overflow-hidden" style={{ background: 'var(--border)' }}>
                <div
                  className="h-full rounded-sm transition-all"
                  style={{
                    width: `${pct}%`,
                    background: isMedian ? 'var(--text-muted)' : pct > 60 ? 'var(--accent)' : '#5b6abf',
                  }}
                />
              </div>
              <span className="text-xs font-semibold w-20 text-right flex-shrink-0" style={{ color: 'var(--text)', fontFamily: 'var(--font-playfair)' }}>
                ${(s.value / 1000).toFixed(0)}K
              </span>
              {isMedian && <span className="text-xs" style={{ color: 'var(--text-muted)', width: 42 }}>≈ avg</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
