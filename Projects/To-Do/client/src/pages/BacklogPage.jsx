import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTasks } from '../hooks/useTasks.js';
import { useCompanies } from '../hooks/useCompanies.js';
import { usePeople } from '../hooks/usePeople.js';
import QuickAddBar from '../components/tasks/QuickAddBar.jsx';
import TaskDetailPanel from '../components/tasks/TaskDetailPanel.jsx';
import { CategoryBadge } from '../components/ui/Badge.jsx';

// ── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_LABELS = { 1: 'Do Now', 2: 'Schedule', 3: 'Delegate', 4: 'Eliminate' };
const PRIORITY_CLS    = { 1: 'text-red-400', 2: 'text-blue-400', 3: 'text-amber-400', 4: 'text-slate-500' };

const CATEGORIES = [
  { value: 'strategy',    label: 'Strategy' },
  { value: 'operations',  label: 'Operations' },
  { value: 'follow-up',   label: 'Follow-up' },
  { value: 'development', label: 'Development' },
];

const STATUSES = [
  { value: 'todo',       label: 'Todo' },
  { value: 'inprogress', label: 'In Progress' },
  { value: 'done',       label: 'Done' },
  { value: 'blocked',    label: 'Blocked' },
];

function getToday() { return new Date().toISOString().split('T')[0]; }

function thisFriday() {
  const d = new Date();
  const day = d.getDay(); // 0=Sun … 6=Sat
  const offset = day === 6 ? 6 : (5 - day + 7) % 7;
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DueDateCell({ date }) {
  const today = getToday();
  if (!date) return <span className="text-slate-700 text-xs">No date</span>;
  const label = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  if (date < today) return <span className="text-red-400 text-xs font-medium">⚠ {label}</span>;
  if (date === today) return <span className="text-amber-400 text-xs font-medium">Today</span>;
  return <span className="text-slate-400 text-xs">{label}</span>;
}

function SortHeader({ label, field, sortKey, sortDir, onSort, className = '' }) {
  const active = sortKey === field;
  return (
    <th
      onClick={() => onSort(field)}
      className={`px-3 py-3 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-slate-300 select-none whitespace-nowrap ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={active ? 'text-slate-200' : 'text-slate-700'}>
          {active ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </span>
    </th>
  );
}

function RowMenu({ task, onEdit, onDelete, onUpdate }) {
  const [open, setOpen]             = useState(false);
  const [showPriority, setShowPri] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) { setShowPri(false); return; }
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const act = (fn) => { setOpen(false); fn(); };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-300 rounded hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100"
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-48 py-1 overflow-hidden">
          <button onClick={() => act(() => onUpdate({ due_date: getToday() }))}
            className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
            Assign to Today
          </button>
          <button onClick={() => act(() => onUpdate({ due_date: thisFriday() }))}
            className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
            Assign to This Week
          </button>
          <button
            onClick={() => setShowPri(v => !v)}
            className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors flex items-center justify-between"
          >
            Change Priority
            <span className="text-slate-600 text-xs">{showPriority ? '▲' : '▼'}</span>
          </button>
          {showPriority && (
            <div className="bg-slate-900/80 border-t border-slate-700">
              {[1, 2, 3, 4].map(q => (
                <button key={q} onClick={() => act(() => onUpdate({ priority_quadrant: q }))}
                  className={`w-full text-left px-6 py-2 text-xs hover:bg-slate-700 transition-colors ${PRIORITY_CLS[q]}`}>
                  {PRIORITY_LABELS[q]}
                </button>
              ))}
            </div>
          )}
          <div className="border-t border-slate-700 mt-1 pt-1">
            <button onClick={() => act(onEdit)}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors">
              Edit
            </button>
            <button
              onClick={() => act(() => { if (window.confirm(`Delete "${task.title}"?`)) onDelete(); })}
              className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700 transition-colors">
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasFilters, onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-700">
      <svg className="w-16 h-16" fill="none" viewBox="0 0 64 56" stroke="currentColor" strokeWidth={1.5}>
        <rect x="4"  y="36" width="56" height="14" rx="3" />
        <rect x="4"  y="20" width="44" height="12" rx="3" />
        <rect x="4"  y="6"  width="32" height="10" rx="3" />
      </svg>
      <p className="text-base font-semibold text-slate-600">No tasks found</p>
      <p className="text-sm">
        {hasFilters ? 'Try adjusting your filters or add a new task' : 'Add your first task to get started'}
      </p>
      <button onClick={onAdd}
        className="mt-1 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors">
        + Add Task
      </button>
    </div>
  );
}

// ── Filter pill helpers ───────────────────────────────────────────────────────

const pillBase  = 'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap';
const pillActive = 'bg-slate-700 text-white border-slate-600';
const pillIdle   = 'bg-transparent text-slate-500 border-slate-700 hover:border-slate-500 hover:text-slate-300';

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BacklogPage() {
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks();
  const { companies } = useCompanies();
  const { people }    = usePeople();

  const [filters, setFilters] = useState({
    company_id:  null,
    category:    null,
    assigned_to: null,  // null=All, 'me'=Babaji, uuid=person
    status:      null,
    search:      '',
  });
  const [sortKey, setSortKey] = useState('priority_quadrant');
  const [sortDir, setSortDir] = useState('asc');
  const [selected,      setSelected]      = useState(new Set());
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showQuickAdd,  setShowQuickAdd]  = useState(false);
  const [bulkPriority,  setBulkPriority]  = useState(false);

  // Filter helpers
  const setFilter = (key, val) =>
    setFilters(p => ({ ...p, [key]: p[key] === val ? null : val }));

  const clearFilter = (key) =>
    setFilters(p => ({ ...p, [key]: null }));

  // ── Filter ───────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const s = filters.search.toLowerCase();
    return tasks.filter(t => {
      if (filters.company_id && t.company_id !== filters.company_id) return false;
      if (filters.category   && t.category   !== filters.category)   return false;
      if (filters.status     && t.status     !== filters.status)      return false;
      if (filters.assigned_to === 'me' && t.assigned_to !== null)     return false;
      if (filters.assigned_to && filters.assigned_to !== 'me' && t.assigned_to !== filters.assigned_to) return false;
      if (s && !t.title.toLowerCase().includes(s))                    return false;
      return true;
    });
  }, [tasks, filters]);

  // ── Sort ────────────────────────────────────────────────────────────────

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av = a[sortKey];
      let bv = b[sortKey];
      if (av == null) av = sortDir === 'asc' ? '\uFFFF' : '';
      if (bv == null) bv = sortDir === 'asc' ? '\uFFFF' : '';
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key) => {
    if (key === sortKey) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  // ── Select ──────────────────────────────────────────────────────────────

  const toggleSelect = (id) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAll = () =>
    setSelected(prev => prev.size === sorted.length ? new Set() : new Set(sorted.map(t => t.id)));

  // ── Row actions ─────────────────────────────────────────────────────────

  const handleUpdate = useCallback(async (id, patch) => {
    await updateTask(id, patch);
  }, [updateTask]);

  const handleDelete = useCallback(async (id) => {
    await deleteTask(id);
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
  }, [deleteTask]);

  // ── Bulk actions ────────────────────────────────────────────────────────

  const bulkUpdate = async (updates) => {
    const ids = [...selected];
    await Promise.all(ids.map(id => updateTask(id, updates)));
    setSelected(new Set());
    setBulkPriority(false);
  };

  const bulkDelete = async () => {
    const ids = [...selected];
    if (!window.confirm(`Delete ${ids.length} task${ids.length !== 1 ? 's' : ''}? This cannot be undone.`)) return;
    await Promise.all(ids.map(id => deleteTask(id)));
    setSelected(new Set());
  };

  const hasFilters = !!(filters.company_id || filters.category || filters.status || filters.assigned_to || filters.search);

  const allChecked = sorted.length > 0 && selected.size === sorted.length;
  const someChecked = selected.size > 0 && selected.size < sorted.length;

  return (
    <div className="flex flex-col bg-slate-950 text-slate-200" style={{ minHeight: '100vh' }}>

      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-slate-800 shrink-0 flex items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <h1 className="text-xl font-bold text-slate-100">Backlog</h1>
          <span className="text-xs font-semibold text-slate-500 bg-slate-800 px-2.5 py-1 rounded-full tabular-nums">
            {filtered.length}
          </span>
        </div>
        <input
          type="text"
          placeholder="Search tasks…"
          value={filters.search}
          onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors w-52"
        />
        <button
          onClick={() => setShowQuickAdd(v => !v)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors whitespace-nowrap"
        >
          + Add Task
        </button>
      </div>

      {/* ── Quick Add inline ── */}
      {showQuickAdd && (
        <div className="shrink-0 border-b border-slate-800">
          <QuickAddBar
            companies={companies}
            people={people}
            onTaskCreate={async (data) => {
              await createTask(data);
              setShowQuickAdd(false);
            }}
          />
        </div>
      )}

      {/* ── Filters ── */}
      <div className="shrink-0 px-6 py-3 border-b border-slate-800 space-y-2.5 bg-slate-950/80">

        {/* Company row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-16 shrink-0">Company</span>
          <button onClick={() => clearFilter('company_id')} className={`${pillBase} ${!filters.company_id ? pillActive : pillIdle}`}>
            All
          </button>
          {companies.map(c => (
            <button
              key={c.id}
              onClick={() => setFilter('company_id', c.id)}
              className={`${pillBase} flex items-center gap-1.5 ${filters.company_id === c.id ? 'text-white border-transparent' : pillIdle}`}
              style={filters.company_id === c.id ? { backgroundColor: c.color + 'cc', borderColor: c.color } : {}}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
              {c.name}
            </button>
          ))}
        </div>

        {/* Category + Status row */}
        <div className="flex items-center gap-x-6 gap-y-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-16 shrink-0">Category</span>
            <button onClick={() => clearFilter('category')} className={`${pillBase} ${!filters.category ? pillActive : pillIdle}`}>All</button>
            {CATEGORIES.map(c => (
              <button key={c.value} onClick={() => setFilter('category', c.value)}
                className={`${pillBase} ${filters.category === c.value ? pillActive : pillIdle}`}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-12 shrink-0">Status</span>
            <button onClick={() => clearFilter('status')} className={`${pillBase} ${!filters.status ? pillActive : pillIdle}`}>All</button>
            {STATUSES.map(s => (
              <button key={s.value} onClick={() => setFilter('status', s.value)}
                className={`${pillBase} ${filters.status === s.value ? pillActive : pillIdle}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Assignee row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider w-16 shrink-0">Assignee</span>
          <button onClick={() => clearFilter('assigned_to')}
            className={`${pillBase} ${!filters.assigned_to ? pillActive : pillIdle}`}>
            All
          </button>
          <button onClick={() => setFilter('assigned_to', 'me')}
            className={`${pillBase} flex items-center gap-1.5 ${filters.assigned_to === 'me' ? pillActive : pillIdle}`}>
            <span className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-400">B</span>
            Babaji
          </button>
          {people.map(p => (
            <button key={p.id} onClick={() => setFilter('assigned_to', p.id)}
              className={`${pillBase} flex items-center gap-1.5 ${filters.assigned_to === p.id ? pillActive : pillIdle}`}>
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                style={{ backgroundColor: p.avatar_color || '#334155' }}>
                {p.initials}
              </span>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-600">
            <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onAdd={() => setShowQuickAdd(true)} />
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 sticky top-0 bg-slate-950 z-10">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    ref={el => { if (el) { el.indeterminate = someChecked; } }}
                    checked={allChecked}
                    onChange={toggleAll}
                    className="accent-blue-500 cursor-pointer"
                  />
                </th>
                <SortHeader label="Title"    field="title"             sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="min-w-[200px]" />
                <SortHeader label="Company"  field="company_id"        sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Category" field="category"          sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Priority" field="priority_quadrant" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Assigned" field="assigned_to"       sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Due"      field="due_date"          sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                <SortHeader label="Est h"    field="estimated_hours"   sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="text-right" />
                <th className="px-3 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((task, idx) => {
                const isSelected = selected.has(task.id);
                return (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`border-b border-slate-800/50 cursor-pointer transition-colors group ${
                      isSelected ? 'bg-blue-500/5' : idx % 2 === 0 ? 'hover:bg-slate-900/60' : 'bg-slate-900/20 hover:bg-slate-900/50'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3 w-10" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(task.id)}
                        className="accent-blue-500 cursor-pointer" />
                    </td>

                    {/* Title */}
                    <td className="px-3 py-3 min-w-[200px] max-w-[320px]">
                      <p className={`text-sm truncate ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-100 font-medium'}`}>
                        {task.title}
                      </p>
                    </td>

                    {/* Company */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {task.company ? (
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: task.company.color }} />
                          {task.company.name}
                        </span>
                      ) : <span className="text-slate-700 text-xs">—</span>}
                    </td>

                    {/* Category */}
                    <td className="px-3 py-3">
                      <CategoryBadge category={task.category} />
                    </td>

                    {/* Priority */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {task.priority_quadrant ? (
                        <span className={`text-xs font-medium ${PRIORITY_CLS[task.priority_quadrant]}`}>
                          {PRIORITY_LABELS[task.priority_quadrant]}
                        </span>
                      ) : <span className="text-slate-700 text-xs">—</span>}
                    </td>

                    {/* Assignee */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {task.assigned_to ? (
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                            style={{ backgroundColor: task.assignee?.avatar_color || '#334155' }}>
                            {task.assignee?.initials ?? '?'}
                          </span>
                          {task.assignee?.name ?? '—'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                          <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-400">B</span>
                          Babaji
                        </span>
                      )}
                    </td>

                    {/* Due date */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <DueDateCell date={task.due_date} />
                    </td>

                    {/* Est hours */}
                    <td className="px-3 py-3 text-xs text-slate-500 text-right">
                      {task.estimated_hours != null ? task.estimated_hours : '—'}
                    </td>

                    {/* Row menu */}
                    <td className="px-3 py-3 w-12" onClick={e => e.stopPropagation()}>
                      <RowMenu
                        task={task}
                        onEdit={() => setSelectedTaskId(task.id)}
                        onDelete={() => handleDelete(task.id)}
                        onUpdate={(patch) => handleUpdate(task.id, patch)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Bulk Actions Bar ── */}
      {selected.size > 0 && (
        <div className="sticky bottom-0 z-20 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 px-6 py-3 flex items-center gap-3 flex-wrap shrink-0">
          <span className="text-sm font-semibold text-slate-200">
            {selected.size} task{selected.size !== 1 ? 's' : ''} selected
          </span>
          <div className="w-px h-5 bg-slate-700 mx-1 shrink-0" />
          <button onClick={() => bulkUpdate({ due_date: getToday() })}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors">
            Assign to Today
          </button>
          <button onClick={() => bulkUpdate({ due_date: thisFriday() })}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors">
            This Week
          </button>
          <div className="relative">
            <button onClick={() => setBulkPriority(v => !v)}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1">
              Priority <span className="text-slate-600">▾</span>
            </button>
            {bulkPriority && (
              <div className="absolute bottom-10 left-0 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1 w-36 z-30">
                {[1, 2, 3, 4].map(q => (
                  <button key={q} onClick={() => bulkUpdate({ priority_quadrant: q })}
                    className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-700 transition-colors ${PRIORITY_CLS[q]}`}>
                    {PRIORITY_LABELS[q]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={bulkDelete}
            className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors">
            Delete
          </button>
          <button onClick={() => { setSelected(new Set()); setBulkPriority(false); }}
            className="ml-auto text-xs text-slate-600 hover:text-slate-400 transition-colors">
            ✕ Clear
          </button>
        </div>
      )}

      {/* ── Task Detail Panel ── */}
      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          companies={companies}
          people={people}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={updateTask}
        />
      )}
    </div>
  );
}
