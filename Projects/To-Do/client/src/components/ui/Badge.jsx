const CATEGORY_STYLES = {
  strategy:    'bg-purple-500/20 text-purple-300 border-purple-500/30',
  operations:  'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'follow-up': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  development: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

const STATUS_STYLES = {
  todo:       'bg-slate-700/60 text-slate-300 border-slate-600',
  inprogress: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  done:       'bg-green-500/20 text-green-300 border-green-500/30',
  blocked:    'bg-red-500/20 text-red-300 border-red-500/30',
};

const STATUS_LABELS = {
  todo: 'To Do', inprogress: 'In Progress', done: 'Done', blocked: 'Blocked',
};

export function CategoryBadge({ category }) {
  if (!category) return null;
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${CATEGORY_STYLES[category] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
      {category}
    </span>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_STYLES[status] ?? STATUS_STYLES.todo}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
