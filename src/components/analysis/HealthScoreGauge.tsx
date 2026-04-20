'use client';

import { MarketHealthScore } from '@/lib/types';

interface Props {
  score: MarketHealthScore;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5" style={{ fontSize: '0.7rem' }}>
        <span style={{ color: 'var(--text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ color: 'var(--text)', fontFamily: 'var(--font-playfair)', fontWeight: 600 }}>{value}</span>
      </div>
      <div className="h-1" style={{ background: 'var(--border)', borderRadius: 1 }}>
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${value}%`, background: 'var(--accent)', borderRadius: 1 }}
        />
      </div>
    </div>
  );
}

const LABEL_COLORS: Record<MarketHealthScore['label'], string> = {
  Hot: '#b91c1c', Warm: '#c2570a', Neutral: '#78716c', Cooling: '#1d4ed8', Cold: '#4338ca',
};

export default function HealthScoreGauge({ score }: Props) {
  const color = LABEL_COLORS[score.label];
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score.overall / 100) * circumference;

  return (
    <div className="card p-6">
      <p className="label-upper mb-5">Market Health</p>

      <div className="flex items-center gap-6 mb-6">
        <div className="relative shrink-0">
          <svg width="96" height="96" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="8"/>
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--text)' }}>{score.overall}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>/100</span>
          </div>
        </div>

        <div>
          <p className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-playfair)', fontStyle: 'italic', color }}>{score.label}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Market Condition</p>
          <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {score.label === 'Hot' && 'Strong demand, rising prices, low inventory'}
            {score.label === 'Warm' && 'Above-average demand, stable appreciation'}
            {score.label === 'Neutral' && 'Balanced supply and demand'}
            {score.label === 'Cooling' && 'Softening demand, price stabilization'}
            {score.label === 'Cold' && 'Weak demand, oversupply risk'}
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        <ScoreBar label="Supply & Demand" value={score.supplyDemand} />
        <ScoreBar label="Price Growth" value={score.priceGrowth} />
        <ScoreBar label="Economic Strength" value={score.economicStrength} />
        <ScoreBar label="Investment Potential" value={score.investmentPotential} />
      </div>
    </div>
  );
}
