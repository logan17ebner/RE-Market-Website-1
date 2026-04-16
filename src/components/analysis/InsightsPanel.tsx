interface Props {
  insights: string[];
  risks: string[];
  opportunities: string[];
}

function Section({ title, items, accentColor }: { title: string; items: string[]; accentColor: string }) {
  return (
    <div className="card p-6">
      <p className="label-upper mb-4" style={{ color: accentColor }}>{title}</p>
      <ul className="space-y-3.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full" style={{ background: accentColor, marginTop: 7 }}/>
            <span className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontWeight: 300 }}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function InsightsPanel({ insights, risks, opportunities }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Section title="Key Insights" items={insights} accentColor="var(--text)" />
      <Section title="Risk Factors" items={risks} accentColor="var(--accent)" />
      <Section title="Opportunities" items={opportunities} accentColor="#2d7a4f" />
    </div>
  );
}
