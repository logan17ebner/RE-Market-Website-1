'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine } from 'recharts';
import { PriceDataPoint } from '@/lib/types';

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-md">
      <p style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="font-semibold mt-0.5" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--text)' }}>{payload[0].value.toFixed(2)}%</p>
    </div>
  );
}

export default function EconomicChart({ data, title }: { data: PriceDataPoint[]; title: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6 flex items-center justify-center h-[220px]">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No data available</p>
      </div>
    );
  }
  return (
    <div className="card p-6">
      <p className="label-upper mb-4">{title}</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
          <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false}/>
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(1)}%`} width={40}/>
          <Tooltip content={<CustomTooltip/>}/>
          <ReferenceLine y={0} stroke="var(--border-strong)" strokeWidth={1}/>
          <Bar dataKey="value" radius={[2,2,0,0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.value >= 0 ? 'var(--text)' : 'var(--accent)'} opacity={0.75}/>
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
