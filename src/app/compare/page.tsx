'use client';

import { Suspense, useState } from 'react';
import { useRouter } from 'next/navigation';
import CitySearch from '@/components/CitySearch';
import { AnalysisReport, CityResult } from '@/lib/types';

interface MetricRow {
  label: string;
  a: string;
  b: string;
  aNum?: number;
  bNum?: number;
  higherIsBetter?: boolean;
}

function buildRows(a: AnalysisReport, b: AnalysisReport): MetricRow[] {
  const fmt = (v: number | null | undefined, prefix = '', suffix = '', decimals = 0) =>
    v != null ? `${prefix}${v.toFixed(decimals)}${suffix}` : 'N/A';

  return [
    {
      label: 'Median Home Value',
      a: a.property.medianPrice ? `$${(a.property.medianPrice / 1000).toFixed(0)}K` : 'N/A',
      b: b.property.medianPrice ? `$${(b.property.medianPrice / 1000).toFixed(0)}K` : 'N/A',
      aNum: a.property.medianPrice ?? undefined,
      bNum: b.property.medianPrice ?? undefined,
      higherIsBetter: false,
    },
    {
      label: 'YoY Price Change',
      a: fmt(a.property.yoyChange, '', '%', 1),
      b: fmt(b.property.yoyChange, '', '%', 1),
      aNum: a.property.yoyChange ?? undefined,
      bNum: b.property.yoyChange ?? undefined,
      higherIsBetter: true,
    },
    {
      label: 'Median Rent / mo',
      a: a.property.medianRent ? `$${a.property.medianRent.toLocaleString()}` : 'N/A',
      b: b.property.medianRent ? `$${b.property.medianRent.toLocaleString()}` : 'N/A',
      aNum: a.property.medianRent ?? undefined,
      bNum: b.property.medianRent ?? undefined,
      higherIsBetter: true,
    },
    {
      label: 'Gross Rental Yield',
      a: fmt(a.property.rentalYield, '', '%', 1),
      b: fmt(b.property.rentalYield, '', '%', 1),
      aNum: a.property.rentalYield ?? undefined,
      bNum: b.property.rentalYield ?? undefined,
      higherIsBetter: true,
    },
    {
      label: '30-Yr Mortgage Rate',
      a: fmt(a.economic.fred?.mortgageRate, '', '%', 2),
      b: fmt(b.economic.fred?.mortgageRate, '', '%', 2),
    },
    {
      label: 'Market Health Score',
      a: `${a.healthScore.overall}/100 — ${a.healthScore.label}`,
      b: `${b.healthScore.overall}/100 — ${b.healthScore.label}`,
      aNum: a.healthScore.overall,
      bNum: b.healthScore.overall,
      higherIsBetter: true,
    },
    {
      label: 'Avg Price / sqft',
      a: fmt(a.property.avgPricePerSqft, '$', '/sqft'),
      b: fmt(b.property.avgPricePerSqft, '$', '/sqft'),
      aNum: a.property.avgPricePerSqft ?? undefined,
      bNum: b.property.avgPricePerSqft ?? undefined,
      higherIsBetter: false,
    },
  ];
}

function CityColumn({ city, onClear }: { city: CityResult | null; onClear: () => void }) {
  const [selected, setSelected] = useState<CityResult | null>(city);
  return { selected, setSelected };
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}><div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}/></div>}>
      <CompareContent />
    </Suspense>
  );
}

function CompareContent() {
  const router = useRouter();
  const [cityA, setCityA] = useState<CityResult | null>(null);
  const [cityB, setCityB] = useState<CityResult | null>(null);
  const [reportA, setReportA] = useState<AnalysisReport | null>(null);
  const [reportB, setReportB] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function fetchReport(city: CityResult): Promise<AnalysisReport> {
    const res = await fetch('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, marketType: 'residential' }),
    });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  }

  async function handleCompare() {
    if (!cityA || !cityB) return;
    setLoading(true);
    setError('');
    try {
      const [rA, rB] = await Promise.all([fetchReport(cityA), fetchReport(cityB)]);
      setReportA(rA);
      setReportB(rB);
    } catch {
      setError('Failed to load one or both cities. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const rows = reportA && reportB ? buildRows(reportA, reportB) : [];

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Nav */}
      <header className="flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <button onClick={() => router.push('/')} className="editorial-italic text-xl" style={{ color: 'var(--accent)' }}>
          RE Market Intelligence
        </button>
        <span className="label-upper hidden sm:block">City Comparison</span>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">

        {/* Search row */}
        <div>
          <h1 className="editorial-title text-4xl mb-2" style={{ color: 'var(--text)' }}>
            Compare <span className="editorial-italic">Two Markets</span>
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            Search any two US cities to see a side-by-side residential market breakdown.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="card p-5 space-y-3">
              <p className="label-upper">City A</p>
              <CitySearch onSelect={setCityA} selected={cityA} />
            </div>
            <div className="card p-5 space-y-3">
              <p className="label-upper">City B</p>
              <CitySearch onSelect={setCityB} selected={cityB} />
            </div>
          </div>
          <button
            onClick={handleCompare}
            disabled={!cityA || !cityB || loading}
            className="btn-primary px-8 py-3 flex items-center gap-2"
          >
            {loading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>}
            {loading ? 'Fetching data…' : 'Compare Markets'}
          </button>
          {error && <p className="text-sm mt-3" style={{ color: 'var(--accent)' }}>{error}</p>}
        </div>

        {/* Results */}
        {reportA && reportB && cityA && cityB && (
          <div className="space-y-8">
            {/* Header — city names only, no comparative framing */}
            <div className="grid grid-cols-2 gap-4">
              {[{ r: reportA, c: cityA }, { r: reportB, c: cityB }].map(({ r, c }) => (
                <div key={c.id} className="card p-5">
                  <p className="editorial-title text-2xl" style={{ color: 'var(--text)' }}>{c.name}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{r.property.metro ?? c.displayName}</p>
                </div>
              ))}
            </div>

            {/* Metric comparison table */}
            <div className="card overflow-hidden">
              <div className="grid grid-cols-3 px-5 py-3" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                <p className="label-upper">Metric</p>
                <p className="label-upper text-center">{cityA.name}</p>
                <p className="label-upper text-center">{cityB.name}</p>
              </div>
              {rows.map((row, i) => {
                const aWins = row.aNum != null && row.bNum != null && row.higherIsBetter != null
                  ? (row.higherIsBetter ? row.aNum > row.bNum : row.aNum < row.bNum)
                  : false;
                const bWins = row.aNum != null && row.bNum != null && row.higherIsBetter != null
                  ? (row.higherIsBetter ? row.bNum > row.aNum : row.bNum < row.aNum)
                  : false;

                return (
                  <div
                    key={row.label}
                    className="grid grid-cols-3 px-5 py-3.5 items-center"
                    style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{row.label}</p>
                    <p className="text-sm font-semibold text-center" style={{ color: aWins ? '#2d7a4f' : bWins ? 'var(--text)' : 'var(--text)', fontFamily: 'var(--font-playfair)' }}>
                      {row.a}{aWins && <span className="ml-1 text-xs">▲</span>}
                    </p>
                    <p className="text-sm font-semibold text-center" style={{ color: bWins ? '#2d7a4f' : aWins ? 'var(--text)' : 'var(--text)', fontFamily: 'var(--font-playfair)' }}>
                      {row.b}{bWins && <span className="ml-1 text-xs">▲</span>}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Local intelligence — city-specific sourced insights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[{ r: reportA, c: cityA }, { r: reportB, c: cityB }].map(({ r, c }) => {
                const local = r.localInsights ?? [];
                const dataPoints = [
                  r.property.medianPrice   && `Median home value: $${(r.property.medianPrice / 1000).toFixed(0)}K`,
                  r.property.yoyChange != null && `YoY price change: ${r.property.yoyChange >= 0 ? '+' : ''}${r.property.yoyChange.toFixed(1)}%`,
                  r.property.medianRent    && `Median rent: $${r.property.medianRent.toLocaleString()}/mo`,
                  r.property.rentalYield   && `Gross yield: ${r.property.rentalYield.toFixed(1)}%`,
                ].filter(Boolean) as string[];

                return (
                  <div key={c.id} className="card p-5 space-y-3">
                    {local.length > 0 ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: 'var(--accent)' }} />
                            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--accent)' }} />
                          </span>
                          <p className="label-upper">{c.name} — Local Intelligence</p>
                        </div>
                        <ul className="space-y-3">
                          {local.slice(0, 4).map((item, i) => (
                            <li key={i} className="flex gap-2 items-start">
                              <span
                                className="text-xs px-1.5 py-0.5 rounded flex-shrink-0 font-medium"
                                style={{
                                  background: item.type === 'risk' ? 'rgba(139,28,19,0.1)' : item.type === 'opportunity' ? 'rgba(45,122,79,0.1)' : 'rgba(26,21,20,0.07)',
                                  color: item.type === 'risk' ? '#8B1C13' : item.type === 'opportunity' ? '#2d7a4f' : 'var(--text)',
                                }}
                              >
                                {item.type}
                              </span>
                              <span className="flex-1 min-w-0">
                                <span className="text-xs leading-relaxed block" style={{ color: 'var(--text-secondary)' }}>{item.text}</span>
                                {item.url && (
                                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs hover:underline" style={{ color: 'var(--accent)', opacity: 0.8 }}>
                                    {item.source} ↗
                                  </a>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <>
                        <p className="label-upper" style={{ color: 'var(--text-muted)' }}>{c.name} — Market Data</p>
                        <ul className="space-y-2">
                          {dataPoints.map((pt, i) => (
                            <li key={i} className="flex gap-2 items-start">
                              <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: 'var(--text-muted)', marginTop: 7 }} />
                              <span className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
