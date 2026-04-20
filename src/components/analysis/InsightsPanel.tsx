'use client';

import { SourcedInsight } from '@/lib/types';

interface Props {
  insights: string[];
  risks: string[];
  opportunities: string[];
  localInsights?: SourcedInsight[];
}

const TYPE_STYLE: Record<SourcedInsight['type'], { label: string; color: string; bg: string; border: string }> = {
  insight:     { label: 'Insight',     color: '#1a1514',  bg: 'rgba(26,21,20,0.05)',   border: 'rgba(26,21,20,0.15)'  },
  risk:        { label: 'Risk',        color: '#8B1C13',  bg: 'rgba(139,28,19,0.06)',  border: 'rgba(139,28,19,0.2)'  },
  opportunity: { label: 'Opportunity', color: '#2d7a4f',  bg: 'rgba(45,122,79,0.06)',  border: 'rgba(45,122,79,0.2)'  },
};

function LocalInsightCard({ item }: { item: SourcedInsight }) {
  const style = TYPE_STYLE[item.type];
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{ background: style.bg, border: `1px solid ${style.border}` }}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: style.color + '18', color: style.color, letterSpacing: '0.06em' }}
        >
          {style.label.toUpperCase()}
        </span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>
        {item.text}
      </p>
      {item.source && (
        item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold hover:underline mt-auto"
            style={{ color: style.color, opacity: 0.85 }}
          >
            {item.source} ↗
          </a>
        ) : (
          <span className="text-xs mt-auto" style={{ color: 'var(--text-muted)' }}>{item.source}</span>
        )
      )}
    </div>
  );
}

function GenericSection({ title, items, accentColor }: { title: string; items: string[]; accentColor: string }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="label-upper mb-3" style={{ color: accentColor }}>{title}</p>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span className="shrink-0 w-1 h-1 rounded-full" style={{ background: accentColor, opacity: 0.5, marginTop: 7 }} />
            <span className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontWeight: 300, opacity: 0.75 }}>
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function InsightsPanel({ insights, risks, opportunities, localInsights = [] }: Props) {
  const hasLocal = localInsights.length > 0;

  return (
    <div className="space-y-6">

      {/* ── Local Intelligence (prominent) ── */}
      {hasLocal && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {/* Header bar */}
          <div
            className="px-6 py-4 flex items-center gap-3"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
            <p className="text-xs font-semibold tracking-widest uppercase">Local Market Intelligence</p>
            <span className="ml-auto text-xs opacity-70">Sourced from recent news &amp; RE reports</span>
          </div>

          {/* Cards grid */}
          <div
            className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            style={{ background: 'var(--surface)' }}
          >
            {localInsights.map((item, i) => (
              <LocalInsightCard key={i} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* ── Supporting Analysis (generic) ── */}
      <div className={hasLocal ? 'opacity-75' : ''}>
        <p className="label-upper mb-4" style={{ color: 'var(--text-muted)' }}>
          {hasLocal ? 'Supporting Analysis' : 'Market Analysis'}
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-5">
            <GenericSection title="Key Insights"  items={insights}      accentColor="var(--text)" />
          </div>
          <div className="card p-5">
            <GenericSection title="Risk Factors"  items={risks}         accentColor="var(--accent)" />
          </div>
          <div className="card p-5">
            <GenericSection title="Opportunities" items={opportunities} accentColor="#2d7a4f" />
          </div>
        </div>
      </div>

    </div>
  );
}
