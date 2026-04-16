'use client';

import { MarketType } from '@/lib/types';
import { getMarketTypeDescription, getMarketTypeLabel } from '@/lib/utils';

const MARKET_ICONS: Record<MarketType, string> = {
  residential: '🏠',
  commercial: '🏢',
  retail: '🏪',
  industrial: '🏭',
  office: '💼',
  land: '🌍',
};

const MARKET_TYPES: MarketType[] = ['residential', 'commercial', 'retail', 'industrial', 'office', 'land'];

interface Props {
  selected: MarketType;
  onChange: (type: MarketType) => void;
}

export default function MarketTypeSelector({ selected, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {MARKET_TYPES.map((type) => {
        const active = type === selected;
        return (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={`flex flex-col items-start gap-1 p-4 rounded-xl border transition-all duration-150 text-left ${
              active
                ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.15)]'
                : 'bg-slate-800/40 border-slate-700 hover:border-slate-500 hover:bg-slate-800/60'
            }`}
          >
            <span className="text-2xl">{MARKET_ICONS[type]}</span>
            <span className={`text-sm font-semibold ${active ? 'text-blue-300' : 'text-slate-200'}`}>
              {getMarketTypeLabel(type)}
            </span>
            <span className="text-xs text-slate-500 leading-tight">{getMarketTypeDescription(type)}</span>
          </button>
        );
      })}
    </div>
  );
}
