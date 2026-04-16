'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { ComparableMarket } from '@/lib/types';

interface Props {
  data: ComparableMarket[];
  currentCity: string;
  currentValue: number;
}

export default function ComparableMarketsChart({ data, currentCity, currentValue }: Props) {
  const chartData = [
    { city: currentCity, avgPricePerSqft: currentValue, isCurrent: true },
    ...data.map((d) => ({ city: d.city, avgPricePerSqft: d.avgPricePerSqft, isCurrent: false })),
  ].sort((a, b) => b.avgPricePerSqft - a.avgPricePerSqft);

  return (
    <div className="card p-6">
      <p className="label-upper mb-1">Comparable Markets</p>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Avg price per sq ft (USD)</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
          <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`}/>
          <YAxis type="category" dataKey="city" tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontFamily: 'var(--font-playfair)' }} axisLine={false} tickLine={false} width={85}/>
          <Tooltip
            formatter={(value) => [`$${value}/sqft`, 'Avg Price']}
            contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 3, fontSize: 12 }}
            labelStyle={{ color: 'var(--text-secondary)' }}
          />
          <Bar dataKey="avgPricePerSqft" radius={[0,2,2,0]} maxBarSize={20}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.isCurrent ? 'var(--accent)' : 'var(--text)'} opacity={entry.isCurrent ? 1 : 0.25}/>
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
