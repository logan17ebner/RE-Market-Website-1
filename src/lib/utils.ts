import { MarketHealthScore, MarketType } from './types';

export function formatCurrency(value: number, currency = 'USD', compact = false): string {
  if (compact && value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (compact && value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (compact && value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, compact = false): string {
  if (compact && value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (compact && value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (compact && value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function getHealthLabel(score: number): MarketHealthScore['label'] {
  if (score >= 80) return 'Hot';
  if (score >= 65) return 'Warm';
  if (score >= 45) return 'Neutral';
  if (score >= 30) return 'Cooling';
  return 'Cold';
}

export function getHealthColor(label: MarketHealthScore['label']): string {
  const colors: Record<MarketHealthScore['label'], string> = {
    Hot: '#ef4444',
    Warm: '#f97316',
    Neutral: '#eab308',
    Cooling: '#3b82f6',
    Cold: '#6366f1',
  };
  return colors[label];
}

export function getMarketTypeLabel(type: MarketType): string {
  const labels: Record<MarketType, string> = {
    residential: 'Residential',
    commercial: 'Commercial',
    retail: 'Retail',
    industrial: 'Industrial',
    office: 'Office',
    land: 'Land / Development',
  };
  return labels[type];
}

export function getMarketTypeDescription(type: MarketType): string {
  const descriptions: Record<MarketType, string> = {
    residential: 'Houses, apartments, condos & townhomes',
    commercial: 'Mixed-use, multi-family & commercial properties',
    retail: 'Storefronts, shopping centers & high-street retail',
    industrial: 'Warehouses, logistics hubs & manufacturing',
    office: 'Class A/B office space & business parks',
    land: 'Undeveloped land & development sites',
  };
  return descriptions[type];
}

export function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
