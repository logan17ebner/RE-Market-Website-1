interface Props {
  insights: string[];
  risks: string[];
  opportunities: string[];
}

function ListItem({ text, type }: { text: string; type: 'insight' | 'risk' | 'opportunity' }) {
  const styles = {
    insight: { dot: 'bg-blue-400', text: 'text-slate-300' },
    risk: { dot: 'bg-red-400', text: 'text-slate-300' },
    opportunity: { dot: 'bg-green-400', text: 'text-slate-300' },
  };
  return (
    <li className="flex gap-3 items-start">
      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${styles[type].dot}`}/>
      <span className={`text-sm leading-relaxed ${styles[type].text}`}>{text}</span>
    </li>
  );
}

export default function InsightsPanel({ insights, risks, opportunities }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>📊</span> Key Insights
        </h3>
        <ul className="space-y-3">
          {insights.map((item, i) => <ListItem key={i} text={item} type="insight"/>)}
        </ul>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>⚠️</span> Risk Factors
        </h3>
        <ul className="space-y-3">
          {risks.map((item, i) => <ListItem key={i} text={item} type="risk"/>)}
        </ul>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span>💡</span> Opportunities
        </h3>
        <ul className="space-y-3">
          {opportunities.map((item, i) => <ListItem key={i} text={item} type="opportunity"/>)}
        </ul>
      </div>
    </div>
  );
}
