'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnalysisReport, CityResult, MarketType } from '@/lib/types';
import { formatCurrency, formatNumber, formatPercent, getMarketTypeLabel } from '@/lib/utils';
import MetricCard from '@/components/analysis/MetricCard';
import HealthScoreGauge from '@/components/analysis/HealthScoreGauge';
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
        <span>Connecting to Zillow Research (home values &amp; rents)</span>
        <span>Loading FRED mortgage &amp; housing data</span>
        <span>Computing comparable market peers</span>
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
  const exportRef = useRef<HTMLDivElement>(null);

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
      .then((r) => r.json())
      .then((data) => { setReport(data); setLoadState('done'); })
      .catch(() => setLoadState('error'));
  }, [params, router]);

  async function handleExport() {
    if (!report) return;
    setExporting(true);
    try {
      const { exportAnalysisPDF } = await import('@/lib/pdfExport');
      await exportAnalysisPDF(report, 'analysis-export');
    } catch (err) {
      console.error('PDF export failed:', err);
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

  const { config, economic, property, healthScore, comparables, insights, risks, opportunities } = report;
  const { city, marketType } = config;

  const hist = property.priceHistory;
  const priceYoY = property.yoyChange ?? (
    hist.length >= 13
      ? ((hist[hist.length - 1].value - hist[hist.length - 13].value) / hist[hist.length - 13].value) * 100
      : null
  );

  const hasZillow = !!property.metro;
  const isResidential = marketType === 'residential';

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Sticky header */}
      <header className="sticky top-0 z-40 backdrop-blur-md" style={{ background: 'rgba(245,240,232,0.92)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
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
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 label-upper">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#2d7a4f' }}/>
              Live · {new Date(report.generatedAt).toLocaleDateString()}
            </span>
            <button onClick={handleExport} disabled={exporting} className="btn-outline flex items-center gap-2 px-4 py-2">
              {exporting ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
              )}
              Export PDF
            </button>
          </div>
        </div>
      </header>

      <div id="analysis-export" className="max-w-7xl mx-auto px-6 py-10 space-y-8">

        {/* Title bar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <p className="label-upper mb-2">Market Analysis Report</p>
            <h1 className="editorial-title text-4xl sm:text-5xl" style={{ color: 'var(--text)' }}>
              {city.name}<br />
              <span className="editorial-italic">{getMarketTypeLabel(marketType)} Market</span>
            </h1>
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{city.displayName}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {hasZillow && isResidential ? (
              <span className="tag tag-accent">Live — Zillow Research</span>
            ) : (
              <span className="tag tag-outline">Benchmark estimates</span>
            )}
            {economic.fred && <span className="tag tag-accent">FRED Live</span>}
          </div>
        </div>

        {/* ── SECTION 1: Key RE metrics ─────────────────────────── */}
        <div>
          <p className="label-upper mb-3">Property Market Overview</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {hasZillow && isResidential ? (
              <>
                <MetricCard
                  label="Median Home Value"
                  value={property.medianPrice ? formatCurrency(property.medianPrice, 'USD', true) : 'N/A'}
                  change={priceYoY}
                  icon="🏠"
                  highlight
                />
                <MetricCard
                  label="Avg Price / sqft"
                  value={property.avgPricePerSqft ? `$${property.avgPricePerSqft}` : 'N/A'}
                  icon="📐"
                />
                <MetricCard
                  label="YoY Change"
                  value={priceYoY !== null ? `${priceYoY >= 0 ? '+' : ''}${priceYoY.toFixed(1)}%` : 'N/A'}
                  icon="📈"
                />
                <MetricCard
                  label="Median Rent / mo"
                  value={property.medianRent ? `$${property.medianRent.toLocaleString()}` : 'N/A'}
                  subtext="ZORI — all home types"
                  icon="🏘️"
                />
                <MetricCard
                  label="Gross Rental Yield"
                  value={property.rentalYield ? `${property.rentalYield.toFixed(1)}%` : 'N/A'}
                  icon="💰"
                />
                <MetricCard
                  label="Days on Market"
                  value={property.daysOnMarket ? `${property.daysOnMarket}` : 'N/A'}
                  subtext="avg listing"
                  icon="📅"
                />
              </>
            ) : (
              <>
                <MetricCard
                  label="Avg Price / sqft"
                  value={property.avgPricePerSqft ? `$${property.avgPricePerSqft}` : 'N/A'}
                  change={priceYoY}
                  icon="💰"
                  highlight
                />
                <MetricCard
                  label="Median Price"
                  value={property.medianPrice ? formatCurrency(property.medianPrice, 'USD', true) : 'N/A'}
                  icon="🏠"
                />
                <MetricCard
                  label="Rental Yield"
                  value={property.rentalYield ? `${property.rentalYield.toFixed(1)}%` : 'N/A'}
                  icon="📈"
                />
                <MetricCard
                  label="Vacancy Rate"
                  value={property.vacancyRate ? `${property.vacancyRate.toFixed(1)}%` : 'N/A'}
                  icon="🏗️"
                />
                <MetricCard
                  label="Days on Market"
                  value={property.daysOnMarket ? `${property.daysOnMarket}` : 'N/A'}
                  subtext="avg listing"
                  icon="📅"
                />
                <MetricCard
                  label="Health Score"
                  value={`${healthScore.overall} / 100`}
                  subtext={healthScore.label}
                  icon="⚡"
                />
              </>
            )}
          </div>
        </div>

        {/* ── SECTION 2: Health score + price trend ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <HealthScoreGauge score={healthScore} />
          <div className="lg:col-span-2">
            <PriceHistoryChart
              data={property.priceHistory}
              title={hasZillow && isResidential ? `Median Home Value — ${property.metro}` : 'Avg Price / sqft — 24-Month Trend'}
              unit="$"
              color="#8B1C13"
            />
          </div>
        </div>

        {/* ── SECTION 3: Zillow live data (US residential only) ─── */}
        {hasZillow && isResidential && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <p className="label-upper">Live Market Data — Zillow Research</p>
              <span className="tag tag-accent" style={{ fontSize: '0.6rem' }}>Updated Monthly</span>
              <span className="tag tag-outline" style={{ fontSize: '0.6rem' }}>{property.metro}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MetricCard
                label="ZHVI — Median Home Value"
                value={property.medianPrice ? formatCurrency(property.medianPrice, 'USD', true) : 'N/A'}
                change={priceYoY}
                subtext={`As of ${property.lastUpdated?.slice(0, 7)}`}
                icon="🏠"
                highlight
              />
              <MetricCard
                label="ZORI — Median Monthly Rent"
                value={property.medianRent ? `$${property.medianRent.toLocaleString()}` : 'N/A'}
                subtext="All home types"
                icon="🏘️"
              />
              <MetricCard
                label="Gross Rental Yield"
                value={property.rentalYield ? `${property.rentalYield.toFixed(1)}%` : 'N/A'}
                subtext="Annual rent ÷ home value"
                icon="💹"
              />
            </div>

            {property.rentHistory && property.rentHistory.length > 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <PriceHistoryChart
                  data={property.priceHistory}
                  title="Median Home Value — 24 Months (ZHVI)"
                  unit="$"
                  color="#8B1C13"
                />
                <PriceHistoryChart
                  data={property.rentHistory}
                  title="Median Monthly Rent — 24 Months (ZORI)"
                  unit="$"
                  color="#1a1514"
                />
              </div>
            )}
          </div>
        )}

        {/* ── SECTION 4: Comparable markets ─────────────────────── */}
        <ComparableMarketsChart
          data={comparables}
          currentCity={city.name}
          currentValue={property.avgPricePerSqft ?? 0}
        />

        {/* ── SECTION 5: Investment metrics ─────────────────────── */}
        <div>
          <p className="label-upper mb-3">Investment Metrics</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard label="Cap Rate" value={property.capRate ? `${property.capRate.toFixed(1)}%` : 'N/A'} icon="🏦"/>
            <MetricCard label="Gross Yield" value={property.rentalYield ? `${property.rentalYield.toFixed(1)}%` : 'N/A'} icon="💹"/>
            <MetricCard label="Vacancy Rate" value={property.vacancyRate ? `${property.vacancyRate.toFixed(1)}%` : 'N/A'} icon="🏗️"/>
            <MetricCard label="Health Score" value={`${healthScore.overall} / 100`} subtext={healthScore.label} icon="⚡"/>
          </div>
        </div>

        {/* ── SECTION 6: FRED (US only) ─────────────────────────── */}
        {economic.fred && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <p className="label-upper">Mortgage &amp; Credit — FRED (St. Louis Fed)</p>
              <span className="tag tag-accent" style={{ fontSize: '0.6rem' }}>Updated Weekly</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MetricCard
                label="30-Yr Mortgage Rate"
                value={economic.fred.mortgageRate !== null ? `${economic.fred.mortgageRate.toFixed(2)}%` : 'N/A'}
                subtext="Current weekly avg"
                icon="🏦"
                highlight
              />
              <MetricCard
                label="Case-Shiller HPI"
                value={economic.fred.homePriceIndex.length > 0
                  ? economic.fred.homePriceIndex[economic.fred.homePriceIndex.length - 1].value.toFixed(1)
                  : 'N/A'}
                subtext="National home price index"
                icon="📈"
              />
              <MetricCard
                label="Housing Starts"
                value={economic.fred.housingStarts.length > 0
                  ? `${economic.fred.housingStarts[economic.fred.housingStarts.length - 1].value.toFixed(0)}K`
                  : 'N/A'}
                subtext="Monthly units (annualized)"
                icon="🏗️"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <PriceHistoryChart
                data={economic.fred.mortgageRateHistory}
                title="30-Year Mortgage Rate — 52 Weeks (FRED)"
                unit="%"
                color="#8B1C13"
              />
              <PriceHistoryChart
                data={economic.fred.homePriceIndex}
                title="Case-Shiller Home Price Index — 24 Months (FRED)"
                unit="$"
                color="#1a1514"
              />
            </div>
          </div>
        )}

        {/* ── SECTION 7: Insights ───────────────────────────────── */}
        <InsightsPanel insights={insights} risks={risks} opportunities={opportunities} />

        {/* ── SECTION 8: Economic context (supporting) ─────────── */}
        <details className="group">
          <summary className="cursor-pointer flex items-center gap-2 label-upper py-2 select-none" style={{ color: 'var(--text-muted)' }}>
            <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
            Country Economic Context
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <EconomicChart
              data={economic.gdpHistory}
              title="GDP Growth Rate (% YoY)"
            />
            <div className="card p-6 flex flex-col gap-4">
              <p className="label-upper">Country Economic Profile</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Country', value: city.country },
                  { label: 'Population', value: economic.population ? formatNumber(economic.population, true) : 'N/A' },
                  { label: 'GDP Per Capita', value: economic.gdpPerCapita ? formatCurrency(economic.gdpPerCapita, 'USD', true) : 'N/A' },
                  { label: 'GDP Growth', value: economic.gdpGrowth !== null ? formatPercent(economic.gdpGrowth) : 'N/A' },
                  { label: 'Inflation', value: economic.inflation !== null ? formatPercent(economic.inflation) : 'N/A' },
                  { label: 'Data Year', value: economic.year.toString() },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="label-upper mb-1">{label}</p>
                    <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--text)' }}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="label-upper">Source: World Bank Open Data API</p>
              </div>
            </div>
          </div>
        </details>

        {/* ── Data sources footer ───────────────────────────────── */}
        <div className="card p-5 mt-2">
          <p className="label-upper mb-3">Data Sources</p>
          <div className="flex flex-wrap gap-2">
            {[
              ...(hasZillow && isResidential ? [
                { icon: '🏠', label: 'Zillow Research — ZHVI', sublabel: 'Median home values by metro — updated monthly', url: 'https://www.zillow.com/research/data/' },
                { icon: '🏘️', label: 'Zillow Research — ZORI', sublabel: 'Observed rent index by metro — updated monthly', url: 'https://www.zillow.com/research/data/' },
              ] : [
                { icon: '🏢', label: 'Knight Frank Global Report', sublabel: 'Commercial benchmarks — 2024', url: 'https://www.knightfrank.com/research' },
                { icon: '📊', label: 'CBRE Market Outlook', sublabel: 'Industrial & office benchmarks — 2024', url: 'https://www.cbre.com/insights/books/global-real-estate-market-outlook-2024' },
              ]),
              { icon: '🏦', label: 'FRED — St. Louis Fed', sublabel: 'Mortgage rates, housing index — updated weekly', url: 'https://fred.stlouisfed.org/' },
              { icon: '📡', label: 'World Bank Open Data', sublabel: 'GDP, inflation, population — updated annually', url: 'https://data.worldbank.org/' },
              { icon: '🗺️', label: 'OpenStreetMap Nominatim', sublabel: 'Global city geocoding — live', url: 'https://nominatim.openstreetmap.org/' },
              { icon: '🌐', label: 'JLL Global Research', sublabel: 'Retail & residential benchmarks — 2024', url: 'https://www.jll.com/en/trends-and-insights/research' },
            ].map(({ icon, label, sublabel, url }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 px-3 py-2 rounded-lg transition-all group"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <span className="text-base mt-0.5">{icon}</span>
                <div>
                  <p className="text-xs font-medium group-hover:underline" style={{ color: 'var(--text)' }}>{label} ↗</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sublabel}</p>
                </div>
              </a>
            ))}
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            {hasZillow && isResidential
              ? `Property values sourced directly from Zillow Research public data for the ${property.metro} metro area. Non-residential market types use calibrated regional benchmarks.`
              : 'Property price data uses regional benchmarks calibrated by GDP per capita from Knight Frank, CBRE, and JLL 2024 reports.'}
          </p>
        </div>

      </div>
    </main>
  );
}
