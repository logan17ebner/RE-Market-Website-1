'use client';

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import { PriceDataPoint } from '@/lib/types';
import { format, parseISO } from 'date-fns';

interface Props {
  data: PriceDataPoint[];
  title: string;
  unit?: string;
  color?: string;
}

function CustomTooltip({ active, payload, label, unit }: { active?: boolean; payload?: { value: number }[]; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-white font-semibold">{unit === '$' ? `$${payload[0].value.toLocaleString()}` : `${payload[0].value.toFixed(1)}%`}</p>
    </div>
  );
}

export default function PriceHistoryChart({ data, title, unit = '$', color = '#3b82f6' }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    displayPeriod: (() => {
      try { return format(parseISO(d.period + (d.period.length === 7 ? '-01' : '')), 'MMM yy'); }
      catch { return d.period; }
    })(),
  }));

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const yMin = Math.floor(min * 0.97);
  const yMax = Math.ceil(max * 1.03);

  const firstVal = data[0]?.value;
  const lastVal = data[data.length - 1]?.value;
  const pct = firstVal ? ((lastVal - firstVal) / firstVal) * 100 : 0;

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>
          <p className="text-xs text-slate-600 mt-0.5">24-month history</p>
        </div>
        <div className={`text-sm font-semibold px-2 py-1 rounded-lg ${pct >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {pct >= 0 ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}%
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false}/>
          <XAxis
            dataKey="displayPeriod"
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            width={55}
            tickFormatter={(v) => unit === '$' ? `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}` : `${v.toFixed(1)}%`}
          />
          <Tooltip content={<CustomTooltip unit={unit} />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${color.replace('#', '')})`}
            dot={false}
            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
