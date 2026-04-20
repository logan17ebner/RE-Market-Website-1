import { SourcedInsight } from '@/lib/types';

interface Props {
  insights: string[];
  risks: string[];
  opportunities: string[];
  localInsights?: SourcedInsight[];
}

function Section({
  title,
  items,
  local,
  accentColor,
}: {
  title: string;
  items: string[];
  local: SourcedInsight[];
  accentColor: string;
}) {
  return (
    <div className="card p-6">
      <p className="label-upper mb-4" style={{ color: accentColor }}>{title}</p>
      <ul className="space-y-3.5">
        {/* Local sourced insights first */}
        {local.map((item, i) => (
          <li key={`local-${i}`} className="flex gap-3 items-start">
            <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full" style={{ background: accentColor, marginTop: 7 }} />
            <span className="flex-1 min-w-0">
              <span className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontWeight: 300 }}>
                {item.text}
              </span>
              {item.source && (
                <span className="block mt-1">
                  {item.url ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs hover:underline"
                      style={{ color: accentColor, opacity: 0.8 }}
                    >
                      {item.source} ↗
                    </a>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.source}</span>
                  )}
                </span>
              )}
            </span>
          </li>
        ))}
        {/* Fallback generated insights */}
        {items.map((item, i) => (
          <li key={`gen-${i}`} className="flex gap-3 items-start">
            <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full" style={{ background: accentColor, opacity: 0.4, marginTop: 7 }} />
            <span className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontWeight: 300, opacity: 0.7 }}>
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function InsightsPanel({ insights, risks, opportunities, localInsights = [] }: Props) {
  const localByType = (type: SourcedInsight['type']) => localInsights.filter(i => i.type === type);

  return (
    <div className="space-y-4">
      {localInsights.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-600" />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Local insights sourced from recent news &amp; real estate reports
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Section title="Key Insights"  items={insights}      local={localByType('insight')}     accentColor="var(--text)" />
        <Section title="Risk Factors"  items={risks}         local={localByType('risk')}        accentColor="var(--accent)" />
        <Section title="Opportunities" items={opportunities} local={localByType('opportunity')} accentColor="#2d7a4f" />
      </div>
    </div>
  );
}
