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
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin"/>
      <p className="text-white font-semibold text-lg">Loading…</p>
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

  if (loadState === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin"/>
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg">Generating Analysis</p>
          <p className="text-slate-500 text-sm mt-1">Fetching live economic & market data…</p>
        </div>
        <div className="flex flex-col gap-2 text-xs text-slate-600 text-center">
          <span>📡 Connecting to World Bank Open Data</span>
          <span>📊 Loading regional market benchmarks</span>
          <span>🔍 Computing market health score</span>
        </div>
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <span className="text-4xl">⚠️</span>
        <p className="text-white font-semibold">Failed to generate analysis</p>
        <button onClick={() => router.push('/')} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition">
          Try Again
        </button>
      </div>
    );
  }

  if (!report) return null;

  const { config, economic, property, healthScore, comparables, insights, risks, opportunities } = report;
  const { city, marketType } = config;

  // YoY price change
  const hist = property.priceHistory;
  const priceYoY = hist.length >= 13
    ? ((hist[hist.length - 1].value - hist[hist.length - 13].value) / hist[hist.length - 13].value) * 100
    : null;

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/')}
              className="text-slate-400 hover:text-white transition p-1"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{city.name}</span>
                <span className="text-slate-600">/</span>
                <span className="text-blue-400 text-sm font-medium">{getMarketTypeLabel(marketType)}</span>
              </div>
              <p className="text-xs text-slate-600">{city.displayName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"/>
              Live data as of {new Date(report.generatedAt).toLocaleDateString()}
            </span>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 transition text-sm disabled:opacity-50"
            >
              {exporting ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
              )}
              Export PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div id="analysis-export" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Title bar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              {city.name} <span className="gradient-text">{getMarketTypeLabel(marketType)} Market</span>
            </h1>
            <p className="text-slate-400 mt-1">{city.displayName} · {getMarketTypeLabel(marketType)} Real Estate Analysis</p>
          </div>
          <div className="flex items-center gap-3">
            {property.isEstimated && (
              <span className="text-xs px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                ⚠ Benchmark estimates
              </span>
            )}
            <span className="text-xs px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
              World Bank: {economic.year}
            </span>
          </div>
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            label="Avg Price / sqft"
            value={property.avgPricePerSqft ? `$${property.avgPricePerSqft}` : 'N/A'}
            change={priceYoY}
            icon="💰"
            highlight
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
            label="GDP Growth"
            value={economic.gdpGrowth !== null ? `${economic.gdpGrowth.toFixed(1)}%` : 'N/A'}
            icon="🌍"
          />
          <MetricCard
            label="Inflation"
            value={economic.inflation !== null ? `${economic.inflation.toFixed(1)}%` : 'N/A'}
            icon="📊"
          />
        </div>

        {/* Health score + Price chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <HealthScoreGauge score={healthScore} />
          <div className="lg:col-span-2">
            <PriceHistoryChart
              data={property.priceHistory}
              title="Avg Price / sqft — 24-Month Trend"
              unit="$"
              color="#3b82f6"
            />
          </div>
        </div>

        {/* Economic data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EconomicChart
            data={economic.gdpHistory}
            title="GDP Growth Rate (% YoY)"
          />
          <div className="card p-6 flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Country Economic Profile</h3>
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
                  <p className="text-xs text-slate-600 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-600">Source: World Bank Open Data API</p>
            </div>
          </div>
        </div>

        {/* Comparable markets */}
        <ComparableMarketsChart
          data={comparables}
          currentCity={city.name}
          currentValue={property.avgPricePerSqft ?? 0}
        />

        {/* Investment metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricCard label="Cap Rate" value={property.capRate ? `${property.capRate.toFixed(1)}%` : 'N/A'} icon="🏦"/>
          <MetricCard label="Gross Yield" value={property.rentalYield ? `${property.rentalYield.toFixed(1)}%` : 'N/A'} icon="💹"/>
          <MetricCard
            label="Median Price"
            value={property.medianPrice ? formatCurrency(property.medianPrice, 'USD', true) : 'N/A'}
            icon="🏠"
          />
          <MetricCard
            label="Health Score"
            value={`${healthScore.overall} / 100`}
            subtext={healthScore.label}
            icon="⚡"
          />
        </div>

        {/* Insights */}
        <InsightsPanel insights={insights} risks={risks} opportunities={opportunities} />

        {/* Data sources footer */}
        <div className="card p-4 mt-4">
          <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Data Sources</p>
          <div className="flex flex-wrap gap-2">
            {[
              { icon: '📡', label: 'World Bank Open Data', sublabel: 'GDP, inflation, population — updated annually', url: 'https://data.worldbank.org/' },
              { icon: '🏦', label: 'FRED — St. Louis Fed', sublabel: 'Mortgage rates, housing index — updated weekly', url: 'https://fred.stlouisfed.org/' },
              { icon: '🗺️', label: 'OpenStreetMap Nominatim', sublabel: 'Global city geocoding — live', url: 'https://nominatim.openstreetmap.org/' },
              { icon: '🏢', label: 'Knight Frank Global Report', sublabel: 'Commercial benchmarks — 2024', url: 'https://www.knightfrank.com/research' },
              { icon: '📊', label: 'CBRE Market Outlook', sublabel: 'Industrial & office benchmarks — 2024', url: 'https://www.cbre.com/insights/books/global-real-estate-market-outlook-2024' },
              { icon: '🌐', label: 'JLL Global Research', sublabel: 'Retail & residential benchmarks — 2024', url: 'https://www.jll.com/en/trends-and-insights/research' },
            ].map(({ icon, label, sublabel, url }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/40 hover:bg-slate-800 transition-all group"
              >
                <span className="text-base mt-0.5">{icon}</span>
                <div>
                  <p className="text-xs font-medium text-slate-300 group-hover:text-blue-300 transition-colors">{label} ↗</p>
                  <p className="text-xs text-slate-600">{sublabel}</p>
                </div>
              </a>
            ))}
          </div>
          <p className="text-xs text-slate-700 mt-3">For informational purposes only. Property price data uses regional benchmarks calibrated by GDP per capita.</p>
        </div>
      </div>
    </main>
  );
}
