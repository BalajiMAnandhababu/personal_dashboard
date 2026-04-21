import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../lib/api.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

const STATUS_CYCLE = ['todo', 'inprogress', 'done', 'blocked'];
const STATUS_STYLE = {
  todo:       { label: 'To Do',       cls: 'bg-slate-700 text-slate-300 border-slate-600' },
  inprogress: { label: 'In Progress', cls: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  done:       { label: 'Done',        cls: 'bg-green-500/20 text-green-300 border-green-500/40' },
  blocked:    { label: 'Blocked',     cls: 'bg-red-500/20 text-red-300 border-red-500/40' },
};

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Q1 · Do Now' },
  { value: 2, label: 'Q2 · Schedule' },
  { value: 3, label: 'Q3 · Delegate' },
  { value: 4, label: 'Q4 · Eliminate' },
];

const CATEGORY_OPTIONS = [
  { value: 'strategy',    label: 'Strategy' },
  { value: 'operations',  label: 'Operations' },
  { value: 'follow-up',   label: 'Follow-up' },
  { value: 'development', label: 'Development' },
];

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts);
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtDuration(mins) {
  if (!mins) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtElapsed(secs) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// ─── Field wrapper ───────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-1.5">{label}</p>
      {children}
    </div>
  );
}

const inputCls = 'w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/70 transition-colors';
const selectCls = 'w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/70 transition-colors cursor-pointer';

// ─── Assignee searchable dropdown ────────────────────────────────────────────

function AssigneeField({ value, people, onChange }) {
  const [open, setOpen]         = useState(false);
  const [search, setSearch]     = useState('');
  const ref                     = useRef(null);
  const selected                = value ? people.find(p => p.id === value) : null;

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = people.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const pick = (id) => {
    onChange(id);
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 hover:border-slate-600 transition-colors text-left"
      >
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${selected ? 'text-white' : 'bg-slate-700 text-slate-400'}`}
              style={selected ? { backgroundColor: selected.avatar_color || '#334155' } : {}}>
          {selected ? selected.initials : 'B'}
        </span>
        <span className="flex-1 truncate">{selected ? selected.name : 'Babaji (Me)'}</span>
        <span className="text-slate-600 text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden">
          <div className="p-2 border-b border-slate-700">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto py-1">
            <button onClick={() => pick(null)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
              <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">B</span>
              Babaji (Me)
            </button>
            {filtered.map(p => (
              <button key={p.id} onClick={() => pick(p.id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: p.avatar_color || '#334155' }}>
                  {p.initials}
                </span>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export default function TaskDetailPanel({ taskId, companies, people, onClose, onUpdate }) {
  const [visible,  setVisible]  = useState(false);
  const [task,     setTask]     = useState(null);
  const [form,     setForm]     = useState({});
  const [subtasks, setSubtasks] = useState([]);
  const [history,  setHistory]  = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const [editingTitle, setEditingTitle] = useState(false);
  const [newSubtask,   setNewSubtask]   = useState('');
  const [addingSubtask, setAddingSubtask] = useState(false);

  const [timerRunning,  setTimerRunning]  = useState(false);
  const [timerStart,    setTimerStart]    = useState(null);
  const [elapsed,       setElapsed]       = useState(0);
  const [activeLogId,   setActiveLogId]   = useState(null);
  const timerRef = useRef(null);

  // Slide-in on mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  // Load task data
  const load = useCallback(async () => {
    setLoading(true);
    const [t, s, h, tl] = await Promise.all([
      api.tasks.get(taskId),
      api.tasks.getSubtasks(taskId),
      api.tasks.getHistory(taskId),
      api.timeLogs.list(taskId),
    ]);
    setTask(t);
    setForm({
      title:             t.title,
      description:       t.description ?? '',
      company_id:        t.company_id,
      assigned_to:       t.assigned_to,
      priority_quadrant: t.priority_quadrant,
      category:          t.category,
      due_date:          t.due_date ?? '',
      estimated_hours:   t.estimated_hours ?? '',
      actual_hours:      t.actual_hours ?? '',
      status:            t.status,
      due_time:          t.due_time ?? '',
      recurrence:        t.recurrence ?? '',
    });
    setSubtasks(s ?? []);
    setHistory(h ?? []);
    setTimeLogs(tl ?? []);
    setLoading(false);
  }, [taskId]);

  useEffect(() => { load(); }, [load]);

  // Timer tick
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - timerStart) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning, timerStart]);

  // ── Save helpers ──────────────────────────────────────────────────────────

  const save = useCallback(async (patch) => {
    const updated = await api.tasks.update(taskId, patch);
    setTask(updated);
    setForm(prev => ({ ...prev, ...patch }));
    onUpdate(taskId, patch);
    const h = await api.tasks.getHistory(taskId);
    setHistory(h ?? []);
  }, [taskId, onUpdate]);

  const handleFieldChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    save({ [key]: value === '' ? null : value });
  };

  const handleTitleBlur = () => {
    setEditingTitle(false);
    if (form.title.trim() && form.title !== task?.title) {
      save({ title: form.title.trim() });
    }
  };

  const handleDescriptionBlur = () => {
    if (form.description !== task?.description) {
      save({ description: form.description || null });
    }
  };

  const cycleStatus = () => {
    const idx  = STATUS_CYCLE.indexOf(form.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    handleFieldChange('status', next);
  };

  // ── Subtasks ─────────────────────────────────────────────────────────────

  const addSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtask.trim() || addingSubtask) return;
    setAddingSubtask(true);
    const sub = await api.tasks.create({
      title:          newSubtask.trim(),
      parent_task_id: taskId,
      company_id:     task?.company_id ?? null,
      status:         'todo',
    });
    setSubtasks(prev => [...prev, sub]);
    setNewSubtask('');
    setAddingSubtask(false);
  };

  const toggleSubtask = async (sub) => {
    const next    = sub.status === 'done' ? 'todo' : 'done';
    const updated = await api.tasks.update(sub.id, { status: next });
    setSubtasks(prev => prev.map(s => s.id === sub.id ? updated : s));
  };

  const deleteSubtask = async (subId) => {
    await api.tasks.delete(subId);
    setSubtasks(prev => prev.filter(s => s.id !== subId));
  };

  // ── Timer ────────────────────────────────────────────────────────────────

  const startTimer = async () => {
    const log = await api.timeLogs.start(taskId);
    setActiveLogId(log.id);
    setTimerStart(Date.now());
    setTimerRunning(true);
    setElapsed(0);
  };

  const stopTimer = async () => {
    await api.timeLogs.stop(activeLogId);
    setTimerRunning(false);
    setActiveLogId(null);
    const tl = await api.timeLogs.list(taskId);
    setTimeLogs(tl ?? []);
  };

  const totalMinutes = timeLogs
    .filter(l => l.duration_minutes)
    .reduce((sum, l) => sum + l.duration_minutes, 0);

  // ── Derived ──────────────────────────────────────────────────────────────

  const company = companies.find(c => c.id === form.company_id);
  const status  = STATUS_STYLE[form.status] ?? STATUS_STYLE.todo;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div className={`
        fixed right-0 top-0 bottom-0 z-50
        w-full max-w-[480px]
        bg-slate-950 border-l border-slate-800
        flex flex-col shadow-2xl
        transition-transform duration-300 ease-out
        ${visible ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-600 text-sm gap-3">
            <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
            Loading…
          </div>
        ) : (
          <>
            {/* ── SECTION 1: Header ──────────────────────────────────────── */}
            <div className="px-5 py-4 border-b border-slate-800 shrink-0">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  {/* Status badge — click to cycle */}
                  <button
                    onClick={cycleStatus}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border mb-2 transition-all hover:opacity-80 ${status.cls}`}
                  >
                    {status.label}
                  </button>

                  {/* Editable title */}
                  {editingTitle ? (
                    <input
                      autoFocus
                      type="text"
                      value={form.title}
                      onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      onBlur={handleTitleBlur}
                      onKeyDown={e => e.key === 'Enter' && e.target.blur()}
                      className="w-full bg-transparent text-lg font-semibold text-slate-100 focus:outline-none border-b border-blue-500 pb-0.5"
                    />
                  ) : (
                    <h2
                      onClick={() => setEditingTitle(true)}
                      className="text-lg font-semibold text-slate-100 cursor-text hover:text-white transition-colors leading-snug"
                    >
                      {form.title}
                    </h2>
                  )}

                  {/* Company */}
                  {company && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: company.color }} />
                      <span className="text-xs text-slate-500">{company.name}</span>
                    </div>
                  )}
                </div>

                {/* Close */}
                <button
                  onClick={handleClose}
                  className="text-slate-600 hover:text-slate-300 transition-colors text-2xl leading-none shrink-0 mt-0.5"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">

              {/* ── SECTION 2: Details grid ──────────────────────────────── */}
              <div className="px-5 py-4 border-b border-slate-800">
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  <Field label="Assigned To">
                    <AssigneeField
                      value={form.assigned_to}
                      people={people}
                      onChange={v => handleFieldChange('assigned_to', v)}
                    />
                  </Field>

                  <Field label="Priority">
                    <select
                      value={form.priority_quadrant ?? ''}
                      onChange={e => handleFieldChange('priority_quadrant', e.target.value ? parseInt(e.target.value) : null)}
                      className={selectCls}
                    >
                      <option value="">— None —</option>
                      {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </Field>

                  <Field label="Category">
                    <select
                      value={form.category ?? ''}
                      onChange={e => handleFieldChange('category', e.target.value || null)}
                      className={selectCls}
                    >
                      <option value="">— None —</option>
                      {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </Field>

                  <Field label="Due Date">
                    <input
                      type="date"
                      value={form.due_date ?? ''}
                      onChange={e => handleFieldChange('due_date', e.target.value || null)}
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Due Time">
                    <input
                      type="time"
                      value={form.due_time ?? ''}
                      onChange={e => handleFieldChange('due_time', e.target.value || null)}
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Recurrence">
                    <select
                      value={form.recurrence ?? ''}
                      onChange={e => handleFieldChange('recurrence', e.target.value || null)}
                      className={selectCls}
                    >
                      <option value="">None</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </Field>

                  <Field label="Est. Hours">
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={form.estimated_hours ?? ''}
                      onChange={e => handleFieldChange('estimated_hours', e.target.value ? parseFloat(e.target.value) : null)}
                      className={inputCls}
                      placeholder="0"
                    />
                  </Field>

                  <Field label="Actual Hours">
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={form.actual_hours ?? ''}
                      onChange={e => handleFieldChange('actual_hours', e.target.value ? parseFloat(e.target.value) : null)}
                      className={inputCls}
                      placeholder="0"
                    />
                  </Field>
                </div>
              </div>

              {/* ── SECTION 3: Description ───────────────────────────────── */}
              <div className="px-5 py-4 border-b border-slate-800">
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-2">Description</p>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  onBlur={handleDescriptionBlur}
                  placeholder="Add a description..."
                  className="w-full bg-transparent text-sm text-slate-300 placeholder-slate-700 resize-none focus:outline-none leading-relaxed"
                />
              </div>

              {/* ── SECTION 4: Subtasks ──────────────────────────────────── */}
              <div className="px-5 py-4 border-b border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Subtasks</p>
                  {subtasks.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded-full">
                      {subtasks.filter(s => s.status === 'done').length}/{subtasks.length}
                    </span>
                  )}
                </div>

                <div className="space-y-1 mb-3">
                  {subtasks.map(sub => (
                    <div key={sub.id} className="flex items-center gap-2 group py-1">
                      <button
                        onClick={() => toggleSubtask(sub)}
                        className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                          sub.status === 'done' ? 'bg-green-500 border-green-500' : 'border-slate-600 hover:border-green-400 bg-transparent'
                        }`}
                      >
                        {sub.status === 'done' && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <span className={`flex-1 text-sm ${sub.status === 'done' ? 'line-through text-slate-600' : 'text-slate-300'}`}>
                        {sub.title}
                      </span>
                      <button
                        onClick={() => deleteSubtask(sub.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-700 hover:text-red-400 transition-all text-sm leading-none px-1"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                  {subtasks.length === 0 && (
                    <p className="text-xs text-slate-700 italic">No subtasks yet</p>
                  )}
                </div>

                <form onSubmit={addSubtask} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={e => setNewSubtask(e.target.value)}
                    placeholder="Add a subtask..."
                    className="flex-1 bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!newSubtask.trim() || addingSubtask}
                    className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40 font-medium px-2 py-1.5 transition-colors"
                  >
                    + Add
                  </button>
                </form>
              </div>

              {/* ── SECTION 5: Timer ─────────────────────────────────────── */}
              <div className="px-5 py-4 border-b border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Time Tracked</p>
                    <p className="text-lg font-bold text-slate-300 font-mono mt-0.5 tabular-nums">
                      {timerRunning ? fmtElapsed(elapsed) : fmtDuration(totalMinutes)}
                    </p>
                  </div>
                  <button
                    onClick={timerRunning ? stopTimer : startTimer}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      timerRunning
                        ? 'bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30'
                        : 'bg-green-500/20 text-green-300 border-green-500/40 hover:bg-green-500/30'
                    }`}
                  >
                    <span>{timerRunning ? '⏹' : '▶'}</span>
                    {timerRunning ? 'Stop Timer' : 'Start Timer'}
                  </button>
                </div>

                {timeLogs.length > 0 && (
                  <div className="space-y-1.5">
                    {timeLogs.slice(0, 5).map(log => (
                      <div key={log.id} className="flex items-center justify-between text-xs text-slate-600">
                        <span>{new Date(log.started_at).toLocaleDateString('en-IN', { day:'numeric', month:'short' })} · {new Date(log.started_at).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}</span>
                        <span className="text-slate-500">{log.duration_minutes ? fmtDuration(log.duration_minutes) : <span className="text-green-500 text-[10px]">running</span>}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── SECTION 6: Activity / History ────────────────────────── */}
              <div className="px-5 py-4">
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Activity</p>
                {history.length === 0 ? (
                  <p className="text-xs text-slate-700 italic">No activity yet</p>
                ) : (
                  <div className="space-y-2.5">
                    {history.map(h => (
                      <div key={h.id} className="flex items-start gap-2 text-xs">
                        <div className="w-1 h-1 rounded-full bg-slate-700 mt-1.5 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-slate-600">
                            <span className="text-slate-500 font-medium">{h.changed_by}</span>
                            {' '}changed{' '}
                            <span className="text-slate-400">{h.field_changed}</span>
                            {h.old_value ? <> from <span className="line-through text-slate-600">{h.old_value}</span></> : ''}
                            {' '}→{' '}
                            <span className="text-slate-300">{h.new_value}</span>
                          </span>
                          <span className="text-slate-700 ml-2">· {timeAgo(h.changed_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </>
        )}
      </div>
    </>
  );
}
