'use client';

interface Alert {
  type: 'positive' | 'warning' | 'negative' | 'info';
  title: string;
  body: string;
}

const STYLE = {
  positive: { bg: 'rgba(45,122,79,0.09)',  border: 'rgba(45,122,79,0.28)',  color: '#2d7a4f', dot: '#2d7a4f'  },
  warning:  { bg: 'rgba(180,120,0,0.09)',  border: 'rgba(180,120,0,0.28)',  color: '#b47800', dot: '#b47800'  },
  negative: { bg: 'rgba(139,28,19,0.09)',  border: 'rgba(139,28,19,0.22)',  color: '#8B1C13', dot: '#8B1C13'  },
  info:     { bg: 'rgba(91,106,191,0.09)', border: 'rgba(91,106,191,0.28)', color: '#5b6abf', dot: '#5b6abf'  },
};

interface Props {
  yoyChange?:    number | null;
  mortgageRate?: number | null;
  healthScore:   number;
  healthLabel:   string;
  rentalYield?:  number | null;
  cityName:      string;
}

export default function AlertsBanner({ yoyChange, mortgageRate, healthScore, healthLabel, rentalYield, cityName }: Props) {
  const alerts: Alert[] = [];

  // Price trend
  if (yoyChange != null) {
    if (yoyChange >= 10) {
      alerts.push({ type: 'positive', title: 'Strong appreciation', body: `${cityName} home values are up ${yoyChange.toFixed(1)}% year-over-year — well above the national average. Seller's market conditions.` });
    } else if (yoyChange >= 5) {
      alerts.push({ type: 'positive', title: 'Healthy growth', body: `Prices up ${yoyChange.toFixed(1)}% YoY in ${cityName}. Steady demand with above-average appreciation.` });
    } else if (yoyChange < -3) {
      alerts.push({ type: 'negative', title: 'Price correction underway', body: `Home values in ${cityName} are down ${Math.abs(yoyChange).toFixed(1)}% YoY. Buyer negotiating power has increased.` });
    } else if (yoyChange < 0) {
      alerts.push({ type: 'warning', title: 'Softening prices', body: `Values dipped ${Math.abs(yoyChange).toFixed(1)}% YoY — a modest pullback typical of rate-driven cooling.` });
    }
  }

  // Mortgage rate environment
  if (mortgageRate != null) {
    if (mortgageRate >= 7.5) {
      alerts.push({ type: 'negative', title: 'High rate environment', body: `30-year fixed at ${mortgageRate.toFixed(2)}%. Financing costs are significantly elevated — factor affordability carefully.` });
    } else if (mortgageRate >= 6.5) {
      alerts.push({ type: 'warning', title: 'Elevated mortgage rates', body: `30-year fixed at ${mortgageRate.toFixed(2)}%. Rates remain above the 2010–2020 average, compressing buyer purchasing power.` });
    } else if (mortgageRate <= 5) {
      alerts.push({ type: 'positive', title: 'Favorable financing', body: `30-year fixed at ${mortgageRate.toFixed(2)}% — historically low. Favorable conditions for leveraged acquisitions.` });
    }
  }

  // Market health extremes
  if (healthScore >= 78) {
    alerts.push({ type: 'positive', title: `${healthLabel} market — ${healthScore}/100`, body: `Strong demand signals, tight supply, and solid fundamentals place ${cityName} among the top-performing US markets.` });
  } else if (healthScore <= 38) {
    alerts.push({ type: 'negative', title: `${healthLabel} market — ${healthScore}/100`, body: `Weak demand indicators suggest buyer-friendly conditions. Thorough due diligence on rental absorption is advised.` });
  }

  // Yield
  if (rentalYield != null && rentalYield >= 8) {
    alerts.push({ type: 'positive', title: 'High-yield market', body: `Gross rental yield of ${rentalYield.toFixed(1)}% is well above average — attractive for income-focused investors.` });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {alerts.slice(0, 3).map((alert, i) => {
        const s = STYLE[alert.type];
        return (
          <div
            key={i}
            className="flex items-start gap-3 rounded-xl px-5 py-4"
            style={{ background: s.bg, border: `1px solid ${s.border}` }}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: s.dot }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: s.color }}>{alert.title}</p>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{alert.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
