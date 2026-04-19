import { useState, useRef, useEffect } from 'react';
import Avatar from '../ui/Avatar.jsx';
import { CategoryBadge } from '../ui/Badge.jsx';

const PRIORITY_LABELS = { 1: 'Do Now', 2: 'Schedule', 3: 'Delegate', 4: 'Eliminate' };
const PRIORITY_CLS    = { 1: 'text-red-400', 2: 'text-blue-400', 3: 'text-amber-400', 4: 'text-slate-500' };

function getToday() { return new Date().toISOString().split('T')[0]; }

function thisFriday() {
  const d = new Date();
  const day = d.getDay();
  const offset = day === 6 ? 6 : (5 - day + 7) % 7;
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

function DueDate({ date }) {
  const today = getToday();
  if (!date) return null;
  const isOverdue = date < today;
  const isToday   = date === today;
  const label = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return (
    <span className={`text-[10px] font-medium ${isOverdue ? 'text-red-400' : isToday ? 'text-amber-400' : 'text-slate-500'}`}>
      {isOverdue ? `⚠ ${label}` : isToday ? 'Today' : label}
    </span>
  );
}

function CardMenu({ task, onMenuAction }) {
  const [open, setOpen]            = useState(false);
  const [showPriority, setShowPri] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) { setShowPri(false); return; }
    const h = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const act = (type, value) => {
    setOpen(false);
    onMenuAction({ type, task, value });
  };

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-5 h-5 flex items-center justify-center text-slate-700 hover:text-slate-300 rounded transition-colors text-sm leading-none opacity-0 group-hover:opacity-100"
        title="Actions"
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-30 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-44 py-1 overflow-hidden">
          <button onClick={() => act('assign_today')}
            className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors">
            Assign to Today
          </button>
          <button onClick={() => act('assign_week')}
            className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors">
            This Week
          </button>
          <button
            onClick={() => setShowPri(v => !v)}
            className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors flex items-center justify-between"
          >
            Move to Quadrant
            <span className="text-slate-600 text-[10px]">{showPriority ? '▲' : '▼'}</span>
          </button>
          {showPriority && (
            <div className="bg-slate-900/80 border-t border-slate-700">
              {[1, 2, 3, 4].map(q => (
                <button key={q} onClick={() => act('move_priority', q)}
                  className={`w-full text-left px-5 py-1.5 text-[11px] hover:bg-slate-700 transition-colors ${PRIORITY_CLS[q]}`}>
                  {PRIORITY_LABELS[q]}
                </button>
              ))}
            </div>
          )}
          <div className="border-t border-slate-700 mt-1 pt-1">
            <button onClick={() => act('edit')}
              className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors">
              Edit
            </button>
            <button
              onClick={() => act('delete')}
              className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-slate-700 transition-colors">
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TaskCard({ task, onClick, onToggleDone, onMenuAction }) {
  const isDone = task.status === 'done';

  const handleCheck = (e) => {
    e.stopPropagation();
    onToggleDone(task);
  };

  return (
    <div
      onClick={() => onClick(task.id)}
      className={`
        group bg-slate-800/50 border rounded-lg p-3 cursor-pointer
        transition-all duration-150
        hover:bg-slate-800 hover:border-slate-600 hover:shadow-md hover:shadow-black/20
        ${isDone ? 'border-slate-700/40 opacity-55' : 'border-slate-700'}
      `}
    >
      <div className="flex items-start gap-2.5">
        {/* Checkbox */}
        <button
          onClick={handleCheck}
          className={`
            mt-0.5 w-4 h-4 rounded shrink-0 border-2 flex items-center justify-center
            transition-colors duration-150
            ${isDone ? 'bg-green-500 border-green-500' : 'border-slate-600 bg-transparent hover:border-green-400'}
          `}
        >
          {isDone && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Body */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className={`text-sm leading-snug ${isDone ? 'line-through text-slate-500' : 'text-slate-100 font-normal'}`}>
            {task.title}
          </p>

          {/* Company + category */}
          <div className="flex items-center flex-wrap gap-2 mt-1.5">
            {task.company && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: task.company.color }} />
                {task.company.name}
              </span>
            )}
            {task.category && <CategoryBadge category={task.category} />}
          </div>
        </div>

        {/* Right column: menu + avatar + due date */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {onMenuAction && <CardMenu task={task} onMenuAction={onMenuAction} />}
          <Avatar person={task.assignee} size="xs" />
          <DueDate date={task.due_date} />
        </div>
      </div>
    </div>
  );
}
