import { PriceDataPoint } from '../types';

export interface ZillowResult {
  metro: string;
  state: string;
  medianHomeValue: number;
  priceHistory: PriceDataPoint[];
  yoyChange: number;
  medianRent: number | null;
  rentHistory: PriceDataPoint[];
  lastUpdated: string;
}

// Zillow Research public CSV files — no API key required, updated monthly
const ZHVI_URL =
  'https://files.zillowstatic.com/research/public_csvs/zhvi/Metro_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv';
const ZORI_URL =
  'https://files.zillowstatic.com/research/public_csvs/zori/Metro_zori_uc_sfrcondomfr_sm_month.csv';

function parseCSVLine(line: string): string[] {
  const cols: string[] = [];
  let cur = '';
  let inQ = false;
  for (const c of line) {
    if (c === '"') { inQ = !inQ; continue; }
    if (c === ',' && !inQ) { cols.push(cur); cur = ''; continue; }
    cur += c;
  }
  cols.push(cur);
  return cols;
}

interface MetroRow {
  regionName: string;
  stateName: string;
  sizeRank: number;
  dateValues: Map<string, number>;
}

async function fetchCSV(url: string): Promise<MetroRow[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'REMarketAnalysis/1.0' },
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`Zillow CSV ${res.status}`);
  const text = await res.text();
  const lines = text.split('\n');
  if (lines.length < 2) throw new Error('empty csv');

  const headers = parseCSVLine(lines[0]);
  const rnIdx = headers.findIndex(h => h === 'RegionName');
  const snIdx = headers.findIndex(h => h === 'StateName');
  const srIdx = headers.findIndex(h => h === 'SizeRank');
  const dateCols: { date: string; idx: number }[] = headers
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => /^\d{4}-\d{2}-\d{2}$/.test(h))
    .map(({ h, i }) => ({ date: h, idx: i }));

  const rows: MetroRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    const regionName = (cols[rnIdx] ?? '').trim();
    const stateName = (cols[snIdx] ?? '').trim();
    if (!regionName) continue;

    const dateValues = new Map<string, number>();
    for (const { date, idx } of dateCols) {
      const v = parseFloat(cols[idx]);
      if (!isNaN(v) && v > 0) dateValues.set(date, Math.round(v));
    }
    rows.push({ regionName, stateName, sizeRank: parseInt(cols[srIdx] ?? '999', 10), dateValues });
  }
  return rows;
}

function buildHistory(row: MetroRow, months = 24): PriceDataPoint[] {
  const sorted = Array.from(row.dateValues.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-months);
  return sorted.map(([period, value]) => ({ period, value }));
}

function findMetro(rows: MetroRow[], cityName: string, stateName: string, nearestMajor?: string): MetroRow | null {
  const cn = cityName.toLowerCase().trim();
  const sn = stateName.toLowerCase().trim();
  const nm = (nearestMajor ?? '').toLowerCase().trim();

  // 1. City name is the start of RegionName, same state
  for (const r of rows) {
    const rn = r.regionName.toLowerCase();
    if (rn.startsWith(cn + ',') && r.stateName.toLowerCase() === sn) return r;
  }

  // 2. Nearest major city is the start of RegionName, same state
  if (nm) {
    for (const r of rows) {
      const rn = r.regionName.toLowerCase();
      if (rn.startsWith(nm + ',') && r.stateName.toLowerCase() === sn) return r;
    }
    // Same nearest major, any state (for cities near a metro that spans states)
    for (const r of rows) {
      if (r.regionName.toLowerCase().startsWith(nm + ',')) return r;
    }
  }

  // 3. Largest metro (lowest SizeRank) in same state
  const stateRows = rows.filter(r => r.stateName.toLowerCase() === sn);
  if (stateRows.length > 0) return stateRows.sort((a, b) => a.sizeRank - b.sizeRank)[0];

  return null;
}

export async function getZillowData(
  cityName: string,
  stateName: string,
  nearestMajor?: string,
): Promise<ZillowResult | null> {
  if (!stateName) return null;
  try {
    const [zhviRows, zoriRows] = await Promise.all([
      fetchCSV(ZHVI_URL),
      fetchCSV(ZORI_URL).catch(() => [] as MetroRow[]),
    ]);

    const zhvi = findMetro(zhviRows, cityName, stateName, nearestMajor);
    if (!zhvi) return null;

    const priceHistory = buildHistory(zhvi, 24);
    if (priceHistory.length < 2) return null;

    const latest = priceHistory[priceHistory.length - 1].value;
    const yearAgo = priceHistory[Math.max(0, priceHistory.length - 13)].value;
    const yoyChange = yearAgo > 0 ? Math.round(((latest - yearAgo) / yearAgo) * 1000) / 10 : 0;
    const lastUpdated = priceHistory[priceHistory.length - 1].period;

    const zori = findMetro(zoriRows, cityName, stateName, nearestMajor);
    const rentHistory = zori ? buildHistory(zori, 24) : [];
    const medianRent = rentHistory.length > 0 ? rentHistory[rentHistory.length - 1].value : null;

    return {
      metro: zhvi.regionName,
      state: zhvi.stateName,
      medianHomeValue: latest,
      priceHistory,
      yoyChange,
      medianRent,
      rentHistory,
      lastUpdated,
    };
  } catch (err) {
    console.error('Zillow fetch error:', err);
    return null;
  }
}
