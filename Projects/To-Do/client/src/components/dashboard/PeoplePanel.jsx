import { useState } from 'react';
import Avatar from '../ui/Avatar.jsx';

export default function PeoplePanel({ people, tasks, selectedPerson, onSelectPerson }) {
  const [search, setSearch] = useState('');

  const today = new Date().toISOString().split('T')[0];

  const enriched = [
    {
      id: null,
      name: 'Babaji (Me)',
      initials: 'B',
      avatar_color: '#334155',
      taskCount: tasks.filter((t) => t.assigned_to == null && t.status !== 'done').length,
      overdue: tasks.filter(
        (t) => t.assigned_to == null && t.due_date && t.due_date < today && t.status !== 'done'
      ).length,
    },
    ...people.map((p) => ({
      ...p,
      taskCount: tasks.filter((t) => t.assigned_to === p.id && t.status !== 'done').length,
      overdue: tasks.filter(
        (t) => t.assigned_to === p.id && t.due_date && t.due_date < today && t.status !== 'done'
      ).length,
    })),
  ].filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="w-56 shrink-0 border-l border-slate-800 flex flex-col bg-slate-900/50">
      <div className="px-3 py-2.5 border-b border-slate-800">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">People</p>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-slate-500"
        />
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {enriched.map((p) => {
          const active = selectedPerson === p.id;
          return (
            <button
              key={p.id ?? 'me'}
              onClick={() => onSelectPerson(active ? undefined : p.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                active ? 'bg-slate-700' : 'hover:bg-slate-800/60'
              }`}
            >
              <Avatar person={p.id ? p : null} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-200 truncate">{p.name}</p>
                <p className="text-[10px] text-slate-500">{p.taskCount} open</p>
              </div>
              {p.overdue > 0 && (
                <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                  {p.overdue}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
