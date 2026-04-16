interface Props {
  label: string;
  value: string | number;
  change?: number | null;
  subtext?: string;
  icon?: string;
  highlight?: boolean;
}

export default function MetricCard({ label, value, change, subtext, highlight }: Props) {
  return (
    <div
      className="card card-hover p-5 flex flex-col gap-2"
      style={highlight ? { borderColor: 'var(--accent)', borderLeftWidth: 3 } : {}}
    >
      <p className="label-upper">{label}</p>
      <p className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--text)' }}>
        {value}
      </p>
      {change !== undefined && change !== null && (
        <p className="text-xs font-medium" style={{ color: change >= 0 ? '#2d7a4f' : '#b91c1c' }}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% YoY
        </p>
      )}
      {subtext && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{subtext}</p>}
    </div>
  );
}
