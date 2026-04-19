import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePeople } from '../hooks/usePeople.js';
import { useCompanies } from '../hooks/useCompanies.js';
import { useTasks } from '../hooks/useTasks.js';

const AVATAR_COLORS = [
  { hex: '#334155', label: 'Slate' },
  { hex: '#1d4ed8', label: 'Blue' },
  { hex: '#7c3aed', label: 'Violet' },
  { hex: '#e11d48', label: 'Rose' },
  { hex: '#d97706', label: 'Amber' },
  { hex: '#059669', label: 'Emerald' },
  { hex: '#0891b2', label: 'Cyan' },
  { hex: '#db2777', label: 'Pink' },
];

function autoInitials(name) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── Person Modal ──────────────────────────────────────────────────────────────

function PersonModal({ person, companies, onSave, onClose }) {
  const [form, setForm] = useState({
    name:         person?.name         ?? '',
    initials:     person?.initials     ?? '',
    avatar_color: person?.avatar_color ?? AVATAR_COLORS[1].hex,
    company_ids:  person?.company_ids  ?? [],
    is_active:    person?.is_active    ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleNameChange = (name) => {
    set('name', name);
    if (!person) set('initials', autoInitials(name));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    try {
      await onSave({
        ...form,
        name:     form.name.trim(),
        initials: (form.initials.trim().slice(0, 2).toUpperCase()) || autoInitials(form.name),
      });
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const preview = form.initials || autoInitials(form.name) || '?';

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <h2 className="text-base font-semibold text-slate-100">
              {person ? 'Edit Person' : 'Add Person'}
            </h2>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-2xl leading-none">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Full Name *
              </label>
              <input
                autoFocus
                type="text"
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Ravi Kumar"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Initials */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Initials (max 2 chars)
              </label>
              <input
                type="text"
                value={form.initials}
                onChange={e => set('initials', e.target.value.slice(0, 2).toUpperCase())}
                maxLength={2}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Avatar color */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Avatar Color
              </label>
              <div className="flex gap-2 flex-wrap items-center">
                {AVATAR_COLORS.map(c => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => set('avatar_color', c.hex)}
                    title={c.label}
                    className="w-8 h-8 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: c.hex,
                      borderColor:     form.avatar_color === c.hex ? 'white' : 'transparent',
                      transform:       form.avatar_color === c.hex ? 'scale(1.2)' : 'scale(1)',
                    }}
                  />
                ))}
                {/* Live preview */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ml-2 border-2 border-slate-700"
                  style={{ backgroundColor: form.avatar_color }}
                >
                  {preview}
                </div>
              </div>
            </div>

            {/* Companies */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Companies
              </label>
              <div className="grid grid-cols-2 gap-2">
                {companies.map(c => {
                  const checked = form.company_ids.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                        checked ? 'border-slate-500 bg-slate-800' : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => set('company_ids',
                          checked
                            ? form.company_ids.filter(id => id !== c.id)
                            : [...form.company_ids, c.id]
                        )}
                        className="sr-only"
                      />
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-xs text-slate-300 truncate">{c.name}</span>
                      {checked && <span className="ml-auto text-blue-400 text-xs">✓</span>}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Active toggle — edit only */}
            {person && (
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-slate-300">Active</span>
                <button
                  type="button"
                  onClick={() => set('is_active', !form.is_active)}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${form.is_active ? 'bg-blue-600' : 'bg-slate-700'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !form.name.trim()}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {saving ? 'Saving…' : person ? 'Save Changes' : 'Add Person'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ── Person Card ───────────────────────────────────────────────────────────────

function PersonCard({ person, companies, stats, companyIds, onEdit, onDeactivate, onReactivate, onViewTasks }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // Merge stored company_ids with task-derived ones
  const allCompanyIds = new Set([...(person.company_ids ?? []), ...companyIds]);
  const personCompanies = companies.filter(c => allCompanyIds.has(c.id));

  return (
    <div className={`bg-slate-900 border rounded-2xl p-5 flex flex-col gap-4 transition-colors ${person.is_active ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/50 opacity-60'}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ backgroundColor: person.avatar_color || '#334155' }}
          >
            {person.initials}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-100 text-sm truncate">{person.name}</p>
            {!person.is_active && (
              <span className="text-[10px] text-amber-500 font-medium">Inactive</span>
            )}
          </div>
        </div>

        {/* Three-dot menu */}
        <div ref={menuRef} className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="text-slate-600 hover:text-slate-300 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors text-lg"
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 bg-slate-800 border border-slate-700 rounded-xl shadow-xl w-36 py-1 overflow-hidden">
              <button
                onClick={() => { setMenuOpen(false); onEdit(); }}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Edit
              </button>
              {person.is_active ? (
                <button
                  onClick={() => { setMenuOpen(false); onDeactivate(); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                >
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => { setMenuOpen(false); onReactivate(); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-green-400 hover:bg-slate-700 transition-colors"
                >
                  Reactivate
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Company tags from task assignments */}
      {personCompanies.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {personCompanies.map(c => (
            <span
              key={c.id}
              className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border"
              style={{
                borderColor:     c.color + '60',
                color:           c.color,
                backgroundColor: c.color + '15',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
              {c.name}
            </span>
          ))}
        </div>
      )}

      {/* Task stats */}
      <div className="flex items-center gap-4 text-xs">
        <span className="text-slate-500">
          <span className="text-slate-200 font-semibold">{stats.open}</span> open
        </span>
        <span className="text-slate-500">
          <span className="text-green-400 font-semibold">{stats.doneToday}</span> done today
        </span>
      </div>

      {/* View Tasks */}
      <button
        onClick={onViewTasks}
        className="w-full text-xs font-medium text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 rounded-xl py-2 transition-all hover:bg-slate-800/60 mt-auto"
      >
        View Tasks →
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PeoplePage() {
  const navigate = useNavigate();
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);

  const { people, loading, createPerson, updatePerson } = usePeople({ includeInactive: showInactive });
  const { companies } = useCompanies();
  const { tasks }     = useTasks();

  const today = new Date().toISOString().split('T')[0];

  // Compute per-person stats and company associations from tasks
  const taskStats = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      const key = t.assigned_to;
      if (!key) return;
      if (!map[key]) map[key] = { open: 0, doneToday: 0, companyIds: new Set() };
      if (t.status !== 'done') map[key].open++;
      if (t.status === 'done' && t.updated_at?.split('T')[0] === today) map[key].doneToday++;
      if (t.company_id) map[key].companyIds.add(t.company_id);
    });
    return map;
  }, [tasks, today]);

  const handleSave = async (form) => {
    if (editingPerson) {
      await updatePerson(editingPerson.id, form);
    } else {
      await createPerson({ ...form, is_active: true });
    }
  };

  const handleDeactivate = async (person) => {
    if (!window.confirm(`Deactivate ${person.name}? They'll be hidden from task assignments.`)) return;
    await updatePerson(person.id, { is_active: false });
  };

  const handleReactivate = async (person) => {
    await updatePerson(person.id, { is_active: true });
  };

  const openAdd  = ()  => { setEditingPerson(null);   setModalOpen(true); };
  const openEdit = (p) => { setEditingPerson(p);      setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingPerson(null); };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Page header */}
      <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">People</h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={e => setShowInactive(e.target.checked)}
              className="accent-blue-500"
            />
            Show inactive
          </label>
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
          >
            + Add Person
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-600 gap-3">
            <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : people.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-700">
            <span className="text-5xl">👥</span>
            <p className="text-sm">No team members yet. Add your first person.</p>
            <button
              onClick={openAdd}
              className="mt-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              + Add Person
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {people.map(p => {
              const stats = taskStats[p.id] ?? { open: 0, doneToday: 0, companyIds: new Set() };
              return (
                <PersonCard
                  key={p.id}
                  person={p}
                  companies={companies}
                  stats={stats}
                  companyIds={stats.companyIds}
                  onEdit={() => openEdit(p)}
                  onDeactivate={() => handleDeactivate(p)}
                  onReactivate={() => handleReactivate(p)}
                  onViewTasks={() => navigate('/')}
                />
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <PersonModal
          person={editingPerson}
          companies={companies}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
