export default function MetricsBar({ metrics }) {
  const cards = [
    {
      label: 'Due Today',
      value: metrics.today,
      color: 'text-slate-100',
      bg:    'bg-slate-800/80',
      border:'border-slate-700/50',
    },
    {
      label: 'Done Today',
      value: metrics.done,
      color: 'text-green-400',
      bg:    'bg-green-500/10',
      border:'border-green-500/20',
    },
    {
      label: 'Overdue',
      value: metrics.overdue,
      color: metrics.overdue > 0 ? 'text-red-400' : 'text-slate-500',
      bg:    metrics.overdue > 0 ? 'bg-red-500/10' : 'bg-slate-800/40',
      border:metrics.overdue > 0 ? 'border-red-500/20' : 'border-slate-700/30',
    },
    {
      label: 'Backlog',
      value: metrics.backlog,
      color: metrics.backlog > 0 ? 'text-amber-400' : 'text-slate-500',
      bg:    'bg-amber-500/10',
      border:'border-amber-500/20',
    },
  ];

  return (
    <div className="flex gap-3 px-4 py-3 border-b border-slate-800/80 shrink-0">
      {cards.map(c => (
        <div
          key={c.label}
          className={`flex-1 rounded-xl px-4 py-3 ${c.bg} border ${c.border}`}
        >
          <div className={`text-2xl font-bold tabular-nums ${c.color}`}>{c.value}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
