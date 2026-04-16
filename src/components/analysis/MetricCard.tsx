interface Props {
  label: string;
  value: string;
  change?: number | null;
  subtext?: string;
  icon?: string;
  highlight?: boolean;
}

export default function MetricCard({ label, value, change, subtext, icon, highlight }: Props) {
  return (
    <div className={`card p-5 card-hover flex flex-col gap-2 ${highlight ? 'border-blue-500/30 bg-blue-500/5' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {change !== undefined && change !== null && (
        <div className={`text-sm font-medium ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}% YoY
        </div>
      )}
      {subtext && <div className="text-xs text-slate-500">{subtext}</div>}
    </div>
  );
}
