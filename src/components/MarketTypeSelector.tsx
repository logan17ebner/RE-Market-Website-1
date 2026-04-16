'use client';

import { MarketType } from '@/lib/types';
import { getMarketTypeDescription, getMarketTypeLabel } from '@/lib/utils';

const MARKET_TYPES: MarketType[] = ['residential', 'commercial', 'retail', 'industrial', 'office', 'land'];

interface Props {
  selected: MarketType;
  onChange: (type: MarketType) => void;
}

export default function MarketTypeSelector({ selected, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {MARKET_TYPES.map((type) => {
        const active = type === selected;
        return (
          <button
            key={type}
            onClick={() => onChange(type)}
            className="flex flex-col items-start gap-1.5 p-4 text-left transition-all duration-150"
            style={{
              background: active ? 'var(--text)' : 'var(--bg)',
              border: `1px solid ${active ? 'var(--text)' : 'var(--border-strong)'}`,
              borderRadius: 3,
            }}
          >
            <span className="text-xs font-semibold" style={{
              fontFamily: 'var(--font-playfair)',
              color: active ? 'var(--bg)' : 'var(--text)',
              letterSpacing: '0.01em',
            }}>
              {getMarketTypeLabel(type)}
            </span>
            <span className="text-xs leading-tight" style={{ color: active ? 'rgba(245,240,232,0.6)' : 'var(--text-muted)' }}>
              {getMarketTypeDescription(type)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
