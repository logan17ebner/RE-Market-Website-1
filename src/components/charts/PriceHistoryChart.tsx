'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
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
    <div className="card px-3 py-2 text-xs shadow-md">
      <p style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="font-semibold mt-0.5" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--text)' }}>
        {unit === '$' ? `$${payload[0].value.toLocaleString()}` : `${payload[0].value.toFixed(2)}%`}
      </p>
    </div>
  );
}

export default function PriceHistoryChart({ data, title, unit = '$', color = '#8B1C13' }: Props) {
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
          <p className="label-upper">{title}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>24-month history</p>
        </div>
        <span className="tag" style={{ background: pct >= 0 ? 'rgba(45,122,79,0.1)' : 'rgba(185,28,28,0.08)', color: pct >= 0 ? '#2d7a4f' : '#b91c1c' }}>
          {pct >= 0 ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={formatted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`g-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.12}/>
              <stop offset="100%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
          <XAxis dataKey="displayPeriod" tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-inter)' }} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
          <YAxis domain={[yMin, yMax]} tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-inter)' }} axisLine={false} tickLine={false} width={55} tickFormatter={(v) => unit === '$' ? `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}` : `${v.toFixed(1)}%`}/>
          <Tooltip content={<CustomTooltip unit={unit}/>}/>
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#g-${color.replace('#','')})`} dot={false} activeDot={{ r: 3, fill: color, strokeWidth: 0 }}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
