'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnalysisReport, CityResult, MarketType } from '@/lib/types';
import { formatCurrency, formatNumber, formatPercent, getMarketTypeLabel } from '@/lib/utils';
import MetricCard from '@/components/analysis/MetricCard';
import InsightsPanel from '@/components/analysis/InsightsPanel';
import PriceHistoryChart from '@/components/charts/PriceHistoryChart';
import EconomicChart from '@/components/charts/EconomicChart';
import ComparableMarketsChart from '@/components/charts/ComparableMarketsChart';

type LoadState = 'idle' | 'loading' | 'done' | 'error';

export default function AnalysisPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AnalysisContent />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ background: 'var(--bg)' }}>
      <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}/>
      <div className="text-center">
        <p className="editorial-title text-xl" style={{ color: 'var(--text)' }}>Generating Analysis</p>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Fetching live market data…</p>
      </div>
      <div className="flex flex-col gap-1.5 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        <span>Zillow Research — home values &amp; rents</span>
        <span>FRED — mortgage rates &amp; housing indicators</span>
        <span>World Bank — US economic data</span>
      </div>
    </div>
  );
}

function AnalysisContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const cityStr = params.get('city');
    const marketType = params.get('marketType') as MarketType | null;
    if (!cityStr || !marketType) { router.push('/'); return; }

    let city: CityResult;
    try { city = JSON.parse(decodeURIComponent(cityStr)); }
    catch { router.push('/'); return; }

    setLoadState('loading');
    fetch('/api/analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, marketType }),
    })
      .then(r => r.json())
      .then(data => { setReport(data); setLoadState('done'); })
      .catch(() => setLoadState('error'));
  }, [params, router]);

  async function handleExport() {
    if (!report) return;
    setExporting(true);
    try {
      const { exportAnalysisPDF } = await import('@/lib/pdfExport');
      await exportAnalysisPDF(report, 'analysis-export');
    } finally {
      setExporting(false);
    }
  }

  if (loadState === 'loading') return <LoadingScreen />;
  if (loadState === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg)' }}>
        <p className="editorial-title text-xl" style={{ color: 'var(--text)' }}>Failed to generate analysis</p>
        <button onClick={() => router.push('/')} className="btn-primary px-6 py-2">Try Again</button>
      </div>
    );
  }
  if (!report) return null;

  const { config, economic, property, comparables, insights, risks, opportunities } = report;
  const { city, marketType } = config;

  const hasZillow = !!property.metro && marketType === 'residential';
  const mortgageRate = economic.fred?.mortgageRate ?? null;
  const fredDate = economic.fred?.mortgageRateHistory?.slice(-1)[0]?.period?.slice(0, 7);

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* Sticky header */}
      <header className="sticky top-0 z-40 backdrop-blur-md" style={{ background: 'rgba(245,240,232,0.92)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} aria-label="Back" style={{ color: 'var(--text-muted)' }} className="hover:opacity-60 transition-opacity">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div>
              <p className="text-sm font-medium" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--text)' }}>
                {city.name} — <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>{getMarketTypeLabel(marketType)}</span>
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {hasZillow ? property.metro : city.displayName}
              </p>
            </div>
          </div>
          <button onClick={handleExport} disabled={exporting} className="btn-outline flex items-center gap-2 px-4 py-2">
            {exporting
              ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
              : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            }
            Export PDF
          </button>
        </div>
      </header>

      <div id="analysis-export" className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* Title */}
        <div className="pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="label-upper mb-2">Market Analysis Report</p>
          <h1 className="editorial-title text-4xl sm:text-5xl" style={{ color: 'var(--text)' }}>
            {city.name}<br/>
            <span className="editorial-italic">{getMarketTypeLabel(marketType)} Market</span>
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{city.displayName}</p>
        </div>

        {/* Data confidence banner */}
        {hasZillow ? (
          <div className="flex items-start gap-3 rounded-lg px-4 py-3" style={{ background: 'rgba(45,122,79,0.08)', border: '1px solid rgba(45,122,79,0.25)' }}>
            <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: '#2d7a4f' }}/>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#2d7a4f' }}>Live data — Zillow Research + FRED</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Home values and rents pulled directly from Zillow ZHVI/ZORI for the <strong>{property.metro}</strong> metro, updated monthly. Mortgage data from FRED, updated weekly.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg px-4 py-3" style={{ background: 'rgba(180,120,0,0.07)', border: '1px solid rgba(180,120,0,0.2)' }}>
            <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: '#b47800' }}/>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#b47800' }}>
                {marketType === 'residential' ? 'FRED live · Zillow metro match not found' : `FRED live · ${getMarketTypeLabel(marketType)} benchmark estimates`}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Mortgage and credit data from FRED (live). Property price figures are national US benchmarks from CBRE / JLL 2024 — not localized to this specific market.
              </p>
            </div>
          </div>
        )}

        {/* ── Key indicators ───────────────────────────── */}
        <div>
          <p className="label-upper mb-3">Key Indicators</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {hasZillow ? (
              <>
                <MetricCard
                  label="Median Home Value"
                  value={property.medianPrice ? formatCurrency(property.medianPrice, 'USD', true) : 'N/A'}
                  change={property.yoyChange}
                  source={`Zillow ZHVI · ${property.lastUpdated?.slice(0, 7)}`}
                  highlight
                />
                <MetricCard
                  label="Median Rent / mo"
                  value={property.medianRent ? `$${property.medianRent.toLocaleString()}` : 'N/A'}
                  source="Zillow ZORI · all home types"
                />
                <MetricCard
                  label="Gross Rental Yield"
                  value={property.rentalYield ? `${property.rentalYield.toFixed(1)}%` : 'N/A'}
                  source="Annual rent ÷ home value"
                />
                <MetricCard
                  label="30-Yr Mortgage Rate"
                  value={mortgageRate !== null ? `${mortgageRate.toFixed(2)}%` : 'N/A'}
                  source={`FRED · ${fredDate ?? 'current'}`}
                />
              </>
            ) : (
              <>
                <MetricCard
                  label="30-Yr Mortgage Rate"
                  value={mortgageRate !== null ? `${mortgageRate.toFixed(2)}%` : 'N/A'}
                  source={`FRED · ${fredDate ?? 'current'}`}
                  highlight
                />
                <MetricCard
                  label="Price / sqft (est.)"
                  value={property.avgPricePerSqft ? `$${property.avgPricePerSqft}` : 'N/A'}
                  source="US benchmark · CBRE/JLL 2024"
                />
                <MetricCard
                  label="GDP Growth"
                  value={economic.gdpGrowth !== null ? formatPercent(economic.gdpGrowth) : 'N/A'}
                  source={`World Bank · ${economic.year}`}
                />
                <MetricCard
                  label="Inflation Rate"
                  value={economic.inflation !== null ? formatPercent(economic.inflation) : 'N/A'}
                  source={`World Bank · ${economic.year}`}
                />
              </>
            )}
          </div>
        </div>

        {/* ── Zillow price + rent charts (residential only) ── */}
        {hasZillow && (
          <div className="space-y-3">
            <p className="label-upper">Price &amp; Rent Trends — Zillow Research · {property.metro}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PriceHistoryChart
                data={property.priceHistory}
                title="Median Home Value (ZHVI)"
                unit="$"
                color="#8B1C13"
              />
              {property.rentHistory && property.rentHistory.length > 1 && (
                <PriceHistoryChart
                  data={property.rentHistory}
                  title="Median Monthly Rent (ZORI)"
                  unit="$"
                  color="#1a1514"
                />
              )}
            </div>
          </div>
        )}

        {/* ── FRED mortgage & credit ───────────────────── */}
        {economic.fred && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <p className="label-upper">Mortgage &amp; Credit — FRED (St. Louis Fed)</p>
              <span className="tag tag-accent" style={{ fontSize: '0.6rem' }}>Live</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MetricCard
                label="30-Yr Mortgage Rate"
                value={economic.fred.mortgageRate !== null ? `${economic.fred.mortgageRate.toFixed(2)}%` : 'N/A'}
                source="FRED MORTGAGE30US · weekly"
                highlight
              />
              <MetricCard
                label="Case-Shiller HPI"
                value={economic.fred.homePriceIndex.length > 0
                  ? economic.fred.homePriceIndex[economic.fred.homePriceIndex.length - 1].value.toFixed(1)
                  : 'N/A'}
                source="FRED CSUSHPINSA · monthly"
              />
              <MetricCard
                label="Housing Starts"
                value={economic.fred.housingStarts.length > 0
                  ? `${economic.fred.housingStarts[economic.fred.housingStarts.length - 1].value.toFixed(0)}K`
                  : 'N/A'}
                source="FRED HOUST · annualized"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PriceHistoryChart
                data={economic.fred.mortgageRateHistory}
                title="30-Year Fixed Mortgage Rate"
                unit="%"
                color="#8B1C13"
              />
              <PriceHistoryChart
                data={economic.fred.homePriceIndex}
                title="Case-Shiller Home Price Index"
                unit="$"
                color="#1a1514"
              />
            </div>
          </div>
        )}

        {/* ── Comparable markets ───────────────────────── */}
        <ComparableMarketsChart
          data={comparables}
          currentCity={city.name}
          currentValue={property.avgPricePerSqft ?? 0}
        />

        {/* ── Insights ─────────────────────────────────── */}
        <InsightsPanel insights={insights} risks={risks} opportunities={opportunities} />

        {/* ── US Economic context — World Bank ─────────── */}
        <div className="space-y-3">
          <p className="label-upper">US Economic Context — World Bank {economic.year}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EconomicChart data={economic.gdpHistory} title="US GDP Growth Rate (% YoY)" />
            <div className="card p-6 grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: 'GDP Per Capita', value: economic.gdpPerCapita ? formatCurrency(economic.gdpPerCapita, 'USD', true) : 'N/A' },
                { label: 'GDP Growth', value: economic.gdpGrowth !== null ? formatPercent(economic.gdpGrowth) : 'N/A' },
                { label: 'Inflation', value: economic.inflation !== null ? formatPercent(economic.inflation) : 'N/A' },
                { label: 'Unemployment', value: economic.unemploymentRate !== null ? formatPercent(economic.unemploymentRate) : 'N/A' },
                { label: 'Population', value: economic.population ? formatNumber(economic.population, true) : 'N/A' },
                { label: 'Data Year', value: economic.year.toString() },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="label-upper mb-1">{label}</p>
                  <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--text)' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Data sources ─────────────────────────────── */}
        <div className="card p-5">
          <p className="label-upper mb-3">Data Sources</p>
          <div className="flex flex-wrap gap-2">
            {[
              ...(hasZillow ? [
                { label: 'Zillow ZHVI', sub: 'Median home values by metro · monthly', url: 'https://www.zillow.com/research/data/' },
                { label: 'Zillow ZORI', sub: 'Observed rent index by metro · monthly', url: 'https://www.zillow.com/research/data/' },
              ] : [
                { label: 'CBRE / JLL / CoStar', sub: 'US property benchmarks · 2024', url: 'https://www.cbre.com/insights' },
              ]),
              { label: 'FRED — St. Louis Fed', sub: 'Mortgage rates, HPI, housing starts · weekly', url: 'https://fred.stlouisfed.org/' },
              { label: 'World Bank Open Data', sub: 'US GDP, inflation, employment · annual', url: 'https://data.worldbank.org/' },
              { label: 'OpenStreetMap Nominatim', sub: 'City geocoding · live', url: 'https://nominatim.openstreetmap.org/' },
            ].map(({ label, sub, url }) => (
              <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                className="flex flex-col gap-0.5 px-3 py-2 rounded-lg hover:opacity-80 transition-opacity"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{label} ↗</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>
              </a>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
