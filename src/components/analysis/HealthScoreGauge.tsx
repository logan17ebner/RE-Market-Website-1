'use client';

import { MarketHealthScore } from '@/lib/types';
import { getHealthColor } from '@/lib/utils';

interface Props {
  score: MarketHealthScore;
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span className="font-medium text-white">{value}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function HealthScoreGauge({ score }: Props) {
  const color = getHealthColor(score.label);
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score.overall / 100) * circumference;

  return (
    <div className="card p-6">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">Market Health</h3>

      <div className="flex items-center gap-6 mb-6">
        {/* SVG Gauge */}
        <div className="relative shrink-0">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="10"/>
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 6px ${color}80)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white">{score.overall}</span>
            <span className="text-xs text-slate-500">/100</span>
          </div>
        </div>

        <div>
          <div className="text-2xl font-bold mb-1" style={{ color }}>
            {score.label}
          </div>
          <div className="text-sm text-slate-400">Market Condition</div>
          <div className="mt-2 text-xs text-slate-500">
            {score.label === 'Hot' && 'Strong demand, rising prices, low inventory'}
            {score.label === 'Warm' && 'Above-average demand, stable appreciation'}
            {score.label === 'Neutral' && 'Balanced supply and demand conditions'}
            {score.label === 'Cooling' && 'Softening demand, price stabilization'}
            {score.label === 'Cold' && 'Weak demand, oversupply, price pressure'}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <ScoreBar label="Supply & Demand" value={score.supplyDemand} color="#3b82f6" />
        <ScoreBar label="Price Growth" value={score.priceGrowth} color="#8b5cf6" />
        <ScoreBar label="Economic Strength" value={score.economicStrength} color="#10b981" />
        <ScoreBar label="Investment Potential" value={score.investmentPotential} color="#f59e0b" />
      </div>
    </div>
  );
}
