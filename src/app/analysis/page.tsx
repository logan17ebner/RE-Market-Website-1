'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnalysisReport, CityResult, MarketType } from '@/lib/types';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import MetricCard, { SourceInfo } from '@/components/analysis/MetricCard';
import InsightsPanel from '@/components/analysis/InsightsPanel';
import AlertsBanner from '@/components/analysis/AlertsBanner';
import MarketMap from '@/components/analysis/MarketMap';
import NeighborhoodBreakdown from '@/components/analysis/NeighborhoodBreakdown';
import PriceHistoryChart from '@/components/charts/PriceHistoryChart';
import EconomicChart from '@/components/charts/EconomicChart';
import ComparableMarketsChart from '@/components/charts/ComparableMarketsChart';

type LoadState = 'idle' | 'loading' | 'done' | 'error';

const SECTION_KEYS = ['keyIndicators', 'priceTrends', 'mortgage', 'comparables', 'map', 'neighborhood', 'insights', 'economic'] as const;
type Section = typeof SECTION_KEYS[number];
const SECTION_LABELS: Record<Section, string> = {
  keyIndicators: 'Key Indicators',
  priceTrends:   'Price & Rent Trends',
  mortgage:      'Mortgage & Credit',
  comparables:   'Comparable Markets',
  map:           'Market Map',
  neighborhood:  'Sub-Markets',
  insights:      'Insights',
  economic:      'Economic Context',
};
const ALL_VISIBLE = Object.fromEntries(SECTION_KEYS.map(k => [k, true])) as Record<Section, boolean>;

// Typed source info objects — passed to MetricCard for popover display
const SRC = {
  zillowZHVI: (d?: string): SourceInfo => ({
    name: 'Zillow Home Value Index (ZHVI)',
    url: 'https://www.zillow.com/research/data/',
    methodology: 'Smoothed, seasonally adjusted measure of the typical home value for the middle 50th percentile of homes in this metro.',
    lastUpdated: d,
  }),
  zillowZORI: (d?: string): SourceInfo => ({
    name: 'Zillow Observed Rent Index (ZORI)',
    url: 'https://www.zillow.com/research/data/',
    methodology: 'Typical asking rent across all home types and bedrooms in this metro, tracked from active listings.',
    lastUpdated: d,
  }),
  yieldCalc: (): SourceInfo => ({
    name: 'Calculated — Zillow ZHVI + ZORI',
    methodology: 'Gross rental yield = (median monthly rent × 12) ÷ median home value. Both figures sourced from live Zillow data for this metro.',
  }),
  fredMortgage: (d?: string): SourceInfo => ({
    name: 'FRED — MORTGAGE30US (Freddie Mac PMMS)',
    url: 'https://fred.stlouisfed.org/series/MORTGAGE30US',
    methodology: 'Weekly national average of 30-year fixed mortgage rates from Freddie Mac\'s Primary Mortgage Market Survey.',
    lastUpdated: d,
  }),
  fredHPI: (): SourceInfo => ({
    name: 'FRED — CSUSHPINSA (S&P Case-Shiller)',
    url: 'https://fred.stlouisfed.org/series/CSUSHPINSA',
    methodology: 'S&P CoreLogic Case-Shiller national home price index. Tracks repeat-sales prices for single-family homes across the US.',
  }),
  fredStarts: (): SourceInfo => ({
    name: 'FRED — HOUST (US Census Bureau)',
    url: 'https://fred.stlouisfed.org/series/HOUST',
    methodology: 'Monthly new residential construction starts in thousands of units, at seasonally adjusted annual rate.',
  }),
  wbGDP: (y: number): SourceInfo => ({
    name: 'World Bank Open Data',
    url: 'https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG',
    methodology: 'US annual GDP growth rate from World Bank national accounts data.',
    lastUpdated: String(y),
  }),
  wbInflation: (y: number): SourceInfo => ({
    name: 'World Bank Open Data',
    url: 'https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG',
    methodology: 'US consumer price inflation based on the CPI from World Bank data.',
    lastUpdated: String(y),
  }),
  wbGDPPC: (y: number): SourceInfo => ({
    name: 'World Bank Open Data',
    url: 'https://data.worldbank.org/indicator/NY.GDP.PCAP.CD',
    methodology: 'US GDP per capita in current USD from World Bank national accounts.',
    lastUpdated: String(y),
  }),
  benchmark: (): SourceInfo => ({
    name: 'Industry Benchmark — CBRE / JLL 2024',
    url: 'https://www.cbre.com/insights',
    methodology: 'National US residential price benchmark from CBRE and JLL 2024 market reports. Not localized to this specific metro.',
    lastUpdated: '2024',
  }),
};

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
  const [showCustomize, setShowCustomize] = useState(false);
  const [visible, setVisible] = useState<Record<Section, boolean>>(ALL_VISIBLE);

  // Load section visibility from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('re-report-sections');
      if (stored) setVisible(JSON.parse(stored));
    } catch {}
  }, []);

  function toggleSection(key: Section) {
    setVisible(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem('re-report-sections', JSON.stringify(next)); } catch {}
      return next;
    });
  }

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

  async function handleExportPDF() {
    if (!report) return;
    setExporting(true);
    try {
      const { exportAnalysisPDF } = await import('@/lib/pdfExport');
      await exportAnalysisPDF(report, 'analysis-export');
    } finally { setExporting(false); }
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

  const { config, economic, property, comparables, insights, risks, opportunities, localInsights } = report;
  const { city } = config;

  const hasZillow = !!property.metro;
  const mortgageRate = economic.fred?.mortgageRate ?? null;
  const fredDate = economic.fred?.mortgageRateHistory?.slice(-1)[0]?.period?.slice(0, 7);

  const housingStartsVal = economic.fred?.housingStarts?.slice(-1)[0]?.value;
  const housingStartsDisplay = housingStartsVal != null
    ? housingStartsVal >= 1000 ? `${(housingStartsVal / 1000).toFixed(1)}M` : `${housingStartsVal.toFixed(0)}K`
    : 'N/A';

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* Sticky header */}
      <header className="sticky top-0 z-40 backdrop-blur-md" style={{ background: 'rgba(245,240,232,0.92)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => router.push('/')} aria-label="Back" style={{ color: 'var(--text-muted)' }} className="hover:opacity-60 transition-opacity flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--text)' }}>
                {city.name} — <span style={{ fontStyle: 'italic', color: 'var(--accent)' }}>Residential</span>
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                {hasZillow ? property.metro : city.displayName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => router.push('/compare')}
              className="btn-outline px-3 py-2 text-xs hidden sm:block"
            >
              Compare
            </button>
            <button
              onClick={() => setShowCustomize(v => !v)}
              className="btn-outline px-3 py-2 text-xs"
              style={showCustomize ? { background: 'var(--text)', color: 'var(--bg)' } : {}}
            >
              Customize
            </button>
            <button onClick={handleExportPDF} disabled={exporting} className="btn-outline px-3 py-2 text-xs flex items-center gap-1.5">
              {exporting ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg> : null}
              {exporting ? 'Exporting…' : 'Export PDF'}
            </button>
          </div>
        </div>

        {/* Customize panel */}
        {showCustomize && (
          <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div className="max-w-5xl mx-auto px-6 py-3 flex flex-wrap gap-2">
              {SECTION_KEYS.map(key => (
                <button
                  key={key}
                  onClick={() => toggleSection(key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: visible[key] ? 'var(--accent)' : 'transparent',
                    color: visible[key] ? 'var(--bg)' : 'var(--text-muted)',
                    border: '1px solid',
                    borderColor: visible[key] ? 'var(--accent)' : 'var(--border)',
                  }}
                >
                  {visible[key] ? '✓ ' : ''}{SECTION_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <div id="analysis-export" className="max-w-5xl mx-auto px-6 py-10 space-y-10">

        {/* Title */}
        <div className="pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="label-upper mb-2">Residential Market Analysis</p>
          <h1 className="editorial-title text-4xl sm:text-5xl" style={{ color: 'var(--text)' }}>
            {city.name}<br/>
            <span className="editorial-italic">Residential Market</span>
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{city.displayName}</p>
        </div>

        {/* Confidence banner */}
        {hasZillow ? (
          <div className="flex items-start gap-3 rounded-lg px-4 py-3" style={{ background: 'rgba(45,122,79,0.08)', border: '1px solid rgba(45,122,79,0.25)' }}>
            <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: '#2d7a4f' }}/>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#2d7a4f' }}>Live data — Zillow Research + FRED</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Home values and rents from Zillow ZHVI/ZORI for the <strong>{property.metro}</strong> metro (updated monthly). Mortgage data from FRED (updated weekly). Click the <strong>ⓘ</strong> on any metric for source details.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-lg px-4 py-3" style={{ background: 'rgba(180,120,0,0.07)', border: '1px solid rgba(180,120,0,0.2)' }}>
            <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: '#b47800' }}/>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#b47800' }}>FRED live · Zillow metro not found</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Mortgage and credit data from FRED (live). Property price figures are national US benchmarks — not localized to this market. Click <strong>ⓘ</strong> on any metric for details.
              </p>
            </div>
          </div>
        )}

        {/* ── Alerts ───────────────────────────────────────── */}
        <AlertsBanner
          yoyChange={property.yoyChange}
          mortgageRate={mortgageRate}
          healthScore={report.healthScore.overall}
          healthLabel={report.healthScore.label}
          rentalYield={property.rentalYield}
          cityName={city.name}
        />

        {/* Legend */}
        <div className="flex items-center gap-4">
          {[
            { color: '#2d7a4f', label: 'Live data' },
            { color: '#b47800', label: 'Estimate' },
            { color: '#5b6abf', label: 'Calculated' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: color }}/>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>— click <strong>i</strong> on any card for source details</span>
        </div>

        {/* ── Key Indicators ──────────────────────────────── */}
        {visible.keyIndicators && (
          <div>
            <p className="label-upper mb-3">Key Indicators</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {hasZillow ? (
                <>
                  <MetricCard
                    label="Median Home Value"
                    value={property.medianPrice ? formatCurrency(property.medianPrice, 'USD', true) : 'N/A'}
                    change={property.yoyChange}
                    confidence="live"
                    source={`Zillow ZHVI · ${property.lastUpdated?.slice(0, 7)}`}
                    sourceInfo={SRC.zillowZHVI(property.lastUpdated?.slice(0, 7))}
                    highlight
                  />
                  <MetricCard
                    label="Median Rent / mo"
                    value={property.medianRent ? `$${property.medianRent.toLocaleString()}` : 'N/A'}
                    confidence="live"
                    source={`Zillow ZORI · ${property.lastUpdated?.slice(0, 7)}`}
                    sourceInfo={SRC.zillowZORI(property.lastUpdated?.slice(0, 7))}
                  />
                  <MetricCard
                    label="Gross Rental Yield"
                    value={property.rentalYield ? `${property.rentalYield.toFixed(1)}%` : 'N/A'}
                    confidence="calculated"
                    source="Annual rent ÷ home value"
                    sourceInfo={SRC.yieldCalc()}
                  />
                  <MetricCard
                    label="30-Yr Mortgage Rate"
                    value={mortgageRate !== null ? `${mortgageRate.toFixed(2)}%` : 'N/A'}
                    confidence="live"
                    source={`FRED · ${fredDate ?? 'current'}`}
                    sourceInfo={SRC.fredMortgage(fredDate)}
                  />
                </>
              ) : (
                <>
                  <MetricCard
                    label="30-Yr Mortgage Rate"
                    value={mortgageRate !== null ? `${mortgageRate.toFixed(2)}%` : 'N/A'}
                    confidence="live"
                    source={`FRED · ${fredDate ?? 'current'}`}
                    sourceInfo={SRC.fredMortgage(fredDate)}
                    highlight
                  />
                  <MetricCard
                    label="Price / sqft (est.)"
                    value={property.avgPricePerSqft ? `$${property.avgPricePerSqft}` : 'N/A'}
                    confidence="estimated"
                    source="US benchmark · CBRE/JLL 2024"
                    sourceInfo={SRC.benchmark()}
                  />
                  <MetricCard
                    label="GDP Growth"
                    value={economic.gdpGrowth !== null ? formatPercent(economic.gdpGrowth) : 'N/A'}
                    confidence="live"
                    source={`World Bank · ${economic.year}`}
                    sourceInfo={SRC.wbGDP(economic.year)}
                  />
                  <MetricCard
                    label="Inflation Rate"
                    value={economic.inflation !== null ? formatPercent(economic.inflation) : 'N/A'}
                    confidence="live"
                    source={`World Bank · ${economic.year}`}
                    sourceInfo={SRC.wbInflation(economic.year)}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Price & Rent Trends (Zillow only) ───────────── */}
        {visible.priceTrends && hasZillow && (
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

        {/* ── Mortgage & Credit (FRED) ─────────────────────── */}
        {visible.mortgage && economic.fred && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <p className="label-upper">Mortgage &amp; Credit — FRED (St. Louis Fed)</p>
              <span className="tag tag-accent" style={{ fontSize: '0.6rem' }}>Live</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <MetricCard
                label="30-Yr Mortgage Rate"
                value={economic.fred.mortgageRate !== null ? `${economic.fred.mortgageRate.toFixed(2)}%` : 'N/A'}
                confidence="live"
                source="FRED MORTGAGE30US · weekly"
                sourceInfo={SRC.fredMortgage(fredDate)}
                highlight
              />
              <MetricCard
                label="Case-Shiller HPI"
                value={economic.fred.homePriceIndex.length > 0
                  ? economic.fred.homePriceIndex[economic.fred.homePriceIndex.length - 1].value.toFixed(1)
                  : 'N/A'}
                confidence="live"
                source="FRED CSUSHPINSA · monthly"
                sourceInfo={SRC.fredHPI()}
              />
              <MetricCard
                label="Housing Starts"
                value={housingStartsDisplay}
                confidence="live"
                source="FRED HOUST · annualized"
                sourceInfo={SRC.fredStarts()}
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

        {/* ── Comparable Markets ───────────────────────────── */}
        {visible.comparables && (
          <ComparableMarketsChart
            data={comparables}
            currentCity={city.name}
            currentValue={property.avgPricePerSqft ?? 0}
          />
        )}

        {/* ── Market Map ───────────────────────────────────── */}
        {visible.map && (
          <div className="space-y-3">
            <p className="label-upper">Market Map</p>
            <div className="relative">
              <MarketMap
                cityName={city.name}
                cityLat={city.lat}
                cityLon={city.lon}
                comparables={comparables}
              />
            </div>
          </div>
        )}

        {/* ── Sub-Markets ──────────────────────────────────── */}
        {visible.neighborhood && property.metro && property.medianPrice && (
          <NeighborhoodBreakdown metro={property.metro} medianPrice={property.medianPrice} />
        )}

        {/* ── Insights ─────────────────────────────────────── */}
        {visible.insights && (
          <InsightsPanel insights={insights} risks={risks} opportunities={opportunities} localInsights={localInsights} />
        )}

        {/* ── Economic Context ─────────────────────────────── */}
        {visible.economic && (
          <div className="space-y-3">
            <p className="label-upper">US Economic Context — World Bank {economic.year}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <EconomicChart data={economic.gdpHistory} title="US GDP Growth Rate (% YoY)" />
              <div className="card p-6 grid grid-cols-2 gap-x-6 gap-y-4">
                <MetricCard
                  label="GDP Per Capita"
                  value={economic.gdpPerCapita ? formatCurrency(economic.gdpPerCapita, 'USD', true) : 'N/A'}
                  confidence="live"
                  source={`World Bank · ${economic.year}`}
                  sourceInfo={SRC.wbGDPPC(economic.year)}
                />
                <MetricCard
                  label="GDP Growth"
                  value={economic.gdpGrowth !== null ? formatPercent(economic.gdpGrowth) : 'N/A'}
                  confidence="live"
                  source={`World Bank · ${economic.year}`}
                  sourceInfo={SRC.wbGDP(economic.year)}
                />
                <MetricCard
                  label="Inflation"
                  value={economic.inflation !== null ? formatPercent(economic.inflation) : 'N/A'}
                  confidence="live"
                  source={`World Bank · ${economic.year}`}
                  sourceInfo={SRC.wbInflation(economic.year)}
                />
                <MetricCard
                  label="Population"
                  value={economic.population ? formatNumber(economic.population, true) : 'N/A'}
                  confidence="live"
                  source={`World Bank · ${economic.year}`}
                  sourceInfo={{ name: 'World Bank Open Data', url: 'https://data.worldbank.org/', methodology: 'US total population from World Bank development indicators.', lastUpdated: String(economic.year) }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Data Sources ─────────────────────────────────── */}
        <div className="card p-5">
          <p className="label-upper mb-3">Data Sources</p>
          <div className="flex flex-wrap gap-2">
            {[
              ...(hasZillow ? [
                { label: 'Zillow ZHVI', sub: 'Median home values by metro · monthly', url: 'https://www.zillow.com/research/data/' },
                { label: 'Zillow ZORI', sub: 'Observed rent index by metro · monthly', url: 'https://www.zillow.com/research/data/' },
              ] : [
                { label: 'CBRE / JLL', sub: 'US residential benchmarks · 2024', url: 'https://www.cbre.com/insights' },
              ]),
              { label: 'FRED — St. Louis Fed', sub: 'Mortgage rates, HPI, housing starts · weekly', url: 'https://fred.stlouisfed.org/' },
              { label: 'World Bank', sub: 'US GDP, inflation, population · annual', url: 'https://data.worldbank.org/' },
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
