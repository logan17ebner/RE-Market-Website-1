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
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-1">Comparable Markets</h3>
      <p className="text-xs text-slate-600 mb-4">Avg price per sq ft (USD)</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false}/>
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${v}`}
          />
          <YAxis
            type="category"
            dataKey="city"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip
            formatter={(value) => [`$${value}/sqft`, 'Avg Price']}
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Bar dataKey="avgPricePerSqft" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.isCurrent ? '#3b82f6' : '#334155'}
                opacity={entry.isCurrent ? 1 : 0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
