'use client';

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine,
} from 'recharts';
import { PriceDataPoint } from '@/lib/types';

interface Props {
  data: PriceDataPoint[];
  title: string;
  unit?: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-white font-semibold">{payload[0].value.toFixed(2)}%</p>
    </div>
  );
}

export default function EconomicChart({ data, title }: Props) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6 flex items-center justify-center h-[220px]">
        <p className="text-slate-500 text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false}/>
          <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false}/>
          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v.toFixed(1)}%`} width={45}/>
          <Tooltip content={<CustomTooltip />}/>
          <ReferenceLine y={0} stroke="#334155" strokeWidth={1}/>
          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.value >= 0 ? '#10b981' : '#ef4444'} opacity={0.8}/>
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
