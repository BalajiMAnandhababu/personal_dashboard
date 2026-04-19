import { useState } from 'react';

const CATEGORY_PILLS = [
  { value: 'strategy',    label: 'Strategy',    active: 'bg-purple-500/30 text-purple-200 border-purple-400',  idle: 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-500' },
  { value: 'operations',  label: 'Operations',  active: 'bg-orange-500/30 text-orange-200 border-orange-400',  idle: 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-500' },
  { value: 'follow-up',   label: 'Follow-up',   active: 'bg-cyan-500/30 text-cyan-200 border-cyan-400',        idle: 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-500' },
  { value: 'development', label: 'Dev',         active: 'bg-emerald-500/30 text-emerald-200 border-emerald-400', idle: 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-500' },
];

const PRIORITY_PILLS = [
  { value: 1, label: 'Do Now',    active: 'bg-red-500/30 text-red-200 border-red-400',     idle: 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-500' },
  { value: 2, label: 'Schedule',  active: 'bg-blue-500/30 text-blue-200 border-blue-400',   idle: 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-500' },
  { value: 3, label: 'Delegate',  active: 'bg-amber-500/30 text-amber-200 border-amber-400',idle: 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-500' },
  { value: 4, label: 'Eliminate', active: 'bg-slate-600/60 text-slate-300 border-slate-500', idle: 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-500' },
];

const sel = 'w-full bg-slate-700/60 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors';

export default function AISuggestionCard({ title, suggestion, companies, people, onConfirm, onDismiss }) {
  const [form, setForm] = useState({
    title:             title ?? '',
    company_id:        suggestion?.company_id ?? null,
    category:          suggestion?.category ?? 'operations',
    priority_quadrant: suggestion?.priority_quadrant ?? 2,
    estimated_hours:   suggestion?.estimated_hours ?? 1,
    assigned_to:       null,
    due_date:          '',
  });

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const selectedCompany = companies.find(c => c.id === form.company_id);

  const handleSave = () => {
    onConfirm({
      ...form,
      company_id:        form.company_id || null,
      assigned_to:       form.assigned_to || null,
      due_date:          form.due_date || null,
      estimated_hours:   Number(form.estimated_hours),
      status:            'todo',
      ai_suggested:      true,
    });
  };

  return (
    <div className="mx-4 mb-2 bg-slate-900 border border-blue-500/40 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">AI Suggestion — review before saving</span>
        </div>
        <button onClick={onDismiss} className="text-slate-600 hover:text-slate-300 text-xl leading-none transition-colors">&times;</button>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Editable title */}
        <input
          type="text"
          value={form.title}
          onChange={e => set('title', e.target.value)}
          className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
          placeholder="Task title"
        />

        {/* Category pills */}
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Category</p>
          <div className="flex gap-2 flex-wrap">
            {CATEGORY_PILLS.map(p => (
              <button
                key={p.value}
                onClick={() => set('category', p.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${form.category === p.value ? p.active : p.idle}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority pills */}
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Priority</p>
          <div className="flex gap-2 flex-wrap">
            {PRIORITY_PILLS.map(p => (
              <button
                key={p.value}
                onClick={() => set('priority_quadrant', p.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${form.priority_quadrant === p.value ? p.active : p.idle}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Company + metadata row */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {/* Company with colored dot */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">Company</p>
            <div className="relative flex items-center">
              {selectedCompany && (
                <span
                  className="absolute left-3 w-2 h-2 rounded-full z-10 shrink-0 pointer-events-none"
                  style={{ backgroundColor: selectedCompany.color }}
                />
              )}
              <select
                value={form.company_id ?? ''}
                onChange={e => set('company_id', e.target.value || null)}
                className={`${sel} ${selectedCompany ? 'pl-7' : 'pl-3'} appearance-none`}
              >
                <option value="">— Me (Babaji)</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigned to */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">Assigned To</p>
            <select
              value={form.assigned_to ?? ''}
              onChange={e => set('assigned_to', e.target.value || null)}
              className={sel}
            >
              <option value="">Babaji (Me)</option>
              {people?.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Due date */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">Due Date</p>
            <input
              type="date"
              value={form.due_date}
              onChange={e => set('due_date', e.target.value)}
              className={sel}
            />
          </div>

          {/* Est. hours */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5">Est. Hours</p>
            <input
              type="number"
              step="0.25"
              min="0.25"
              value={form.estimated_hours}
              onChange={e => set('estimated_hours', e.target.value)}
              className={sel}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            onClick={onDismiss}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.title.trim()}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Save Task
          </button>
        </div>
      </div>
    </div>
  );
}
