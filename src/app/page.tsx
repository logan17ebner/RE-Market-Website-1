'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CitySearch from '@/components/CitySearch';
import MarketTypeSelector from '@/components/MarketTypeSelector';
import { CityResult, MarketType } from '@/lib/types';
import { getMarketTypeLabel } from '@/lib/utils';

const SAMPLE_CITIES = [
  { name: 'New York', flag: '🇺🇸' },
  { name: 'London', flag: '🇬🇧' },
  { name: 'Tokyo', flag: '🇯🇵' },
  { name: 'Dubai', flag: '🇦🇪' },
  { name: 'Sydney', flag: '🇦🇺' },
  { name: 'Berlin', flag: '🇩🇪' },
];

export default function HomePage() {
  const router = useRouter();
  const [city, setCity] = useState<CityResult | null>(null);
  const [marketType, setMarketType] = useState<MarketType>('residential');
  const [loading, setLoading] = useState(false);

  function handleAnalyze() {
    if (!city) return;
    setLoading(true);
    const params = new URLSearchParams({
      city: encodeURIComponent(JSON.stringify(city)),
      marketType,
    });
    router.push(`/analysis?${params.toString()}`);
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <span className="font-bold text-white tracking-tight">RE Market Intelligence</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span className="hidden sm:block">Global Coverage</span>
          <span className="hidden sm:block">6 Market Types</span>
          <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-medium">
            ● Live Data
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-3xl">
          <div className="flex justify-center mb-6">
            <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-300 tracking-widest uppercase">
              Institutional-Grade Market Analysis
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-center leading-tight mb-4">
            Real Estate Intelligence
            <br />
            <span className="gradient-text">for Any City on Earth</span>
          </h1>

          <p className="text-center text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Generate a comprehensive market analysis package using live World Bank economic data, regional benchmarks, and AI-powered insights — in seconds.
          </p>

          {/* Sample cities strip */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {SAMPLE_CITIES.map((c) => (
              <span
                key={c.name}
                className="px-3 py-1 rounded-full text-xs bg-slate-800 border border-slate-700 text-slate-400"
              >
                {c.flag} {c.name}
              </span>
            ))}
            <span className="px-3 py-1 rounded-full text-xs bg-slate-800 border border-slate-700 text-slate-500 italic">
              + 10,000 cities
            </span>
          </div>

          {/* Config card */}
          <div className="card p-6 sm:p-8 space-y-7 shadow-2xl">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                1. Search for a City
              </label>
              <CitySearch onSelect={setCity} selected={city} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">
                2. Select Market Type
              </label>
              <MarketTypeSelector selected={marketType} onChange={setMarketType} />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!city || loading}
              className="w-full py-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  Loading Analysis…
                </>
              ) : city ? (
                `3. Generate Analysis → ${city.name} / ${getMarketTypeLabel(marketType)}`
              ) : (
                '3. Select a city to begin'
              )}
            </button>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {[
              '📊 24-Month Price Charts',
              '🌍 World Bank Live Data',
              '📈 Market Health Score',
              '💹 Yield & Cap Rate Analysis',
              '🏗️ Supply & Demand Metrics',
              '⚖️ Comparable Markets',
              '🔍 Risks & Opportunities',
              '📄 PDF Export',
            ].map((f) => (
              <span
                key={f}
                className="text-xs text-slate-500 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-800"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800/60 px-6 py-4 text-center text-xs text-slate-600">
        Economic data from World Bank Open Data &amp; FRED (St. Louis Fed). City search via OpenStreetMap Nominatim.
        Property benchmarks from Knight Frank, CBRE &amp; JLL 2024 global market reports. For informational purposes only.
      </footer>
    </main>
  );
}
