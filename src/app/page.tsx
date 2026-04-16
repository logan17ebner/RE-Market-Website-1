'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CitySearch from '@/components/CitySearch';
import MarketTypeSelector from '@/components/MarketTypeSelector';
import { CityResult, MarketType } from '@/lib/types';
import { getMarketTypeLabel } from '@/lib/utils';

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
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="editorial-italic text-xl" style={{ color: 'var(--accent)' }}>
          RE Market Intelligence
        </span>
        <nav className="flex items-center gap-8 text-xs" style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
          <span className="uppercase hidden sm:block">Global Coverage</span>
          <span className="uppercase hidden sm:block">6 Market Types</span>
          <span className="tag tag-accent">Live Data</span>
        </nav>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="w-full max-w-2xl">

          {/* Eyebrow */}
          <p className="label-upper text-center mb-6">Institutional-Grade Analysis</p>

          {/* Headline */}
          <h1 className="editorial-title text-5xl sm:text-6xl text-center mb-6" style={{ color: 'var(--text)' }}>
            Real Estate Intelligence<br />
            for <span className="editorial-italic">Any City on Earth</span>
          </h1>

          <p className="text-center text-sm leading-relaxed mb-12 max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Generate a comprehensive market analysis package using live World Bank economic data,
            regional benchmarks, and AI-powered insights — in seconds.
          </p>

          {/* Form card */}
          <div className="card p-8 sm:p-10 space-y-8">

            <div>
              <p className="label-upper mb-3">01 — Search for a City</p>
              <CitySearch onSelect={setCity} selected={city} />
            </div>

            <hr className="divider" />

            <div>
              <p className="label-upper mb-4">02 — Select Market Type</p>
              <MarketTypeSelector selected={marketType} onChange={setMarketType} />
            </div>

            <hr className="divider" />

            <button
              onClick={handleAnalyze}
              disabled={!city || loading}
              className="btn-primary w-full py-4 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  Generating Analysis…
                </>
              ) : city ? (
                `03 — Generate Analysis → ${city.name} / ${getMarketTypeLabel(marketType)}`
              ) : (
                '03 — Select a city to begin'
              )}
            </button>
          </div>

          {/* Feature strip */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-10">
            {['Price Trend Charts', 'World Bank Live Data', 'Market Health Score', 'Yield Analysis', 'PDF Export'].map((f) => (
              <span key={f} className="label-upper">{f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-5 text-center" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          Data: World Bank Open Data · FRED (St. Louis Fed) · OpenStreetMap · Knight Frank / CBRE / JLL 2024 — For informational purposes only
        </p>
      </footer>
    </main>
  );
}
