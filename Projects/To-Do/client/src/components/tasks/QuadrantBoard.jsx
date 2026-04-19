import TaskCard from './TaskCard.jsx';

const QUADRANTS = [
  { id: 1, label: 'Do Now',    sub: 'Urgent + Important',    border: 'border-red-500/20',    header: 'text-red-400',    dot: 'bg-red-400' },
  { id: 2, label: 'Schedule',  sub: 'Important, Not Urgent', border: 'border-blue-500/20',   header: 'text-blue-400',   dot: 'bg-blue-400' },
  { id: 3, label: 'Delegate',  sub: 'Urgent, Not Important', border: 'border-amber-500/20',  header: 'text-amber-400',  dot: 'bg-amber-400' },
  { id: 4, label: 'Eliminate', sub: 'Low Priority',          border: 'border-slate-600/30',  header: 'text-slate-500',  dot: 'bg-slate-500' },
];

function getToday() { return new Date().toISOString().split('T')[0]; }

function thisFriday() {
  const d = new Date();
  const day = d.getDay();
  const offset = day === 6 ? 6 : (5 - day + 7) % 7;
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

export default function QuadrantBoard({ tasks, onTaskClick, onTaskUpdate, onTaskDelete }) {
  const today = getToday();

  const tasksForQuadrant = (qId) =>
    tasks
      .filter((t) => t.priority_quadrant === qId && t.status !== 'done')
      .concat(tasks.filter((t) => t.priority_quadrant === qId && t.status === 'done').slice(0, 2));

  const handleToggleDone = async (task) => {
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await onTaskUpdate(task.id, { status: newStatus });
  };

  const handleMenuAction = async ({ type, task, value }) => {
    switch (type) {
      case 'assign_today':
        await onTaskUpdate(task.id, { due_date: getToday() });
        break;
      case 'assign_week':
        await onTaskUpdate(task.id, { due_date: thisFriday() });
        break;
      case 'move_priority':
        await onTaskUpdate(task.id, { priority_quadrant: value });
        break;
      case 'edit':
        onTaskClick(task.id);
        break;
      case 'delete':
        if (window.confirm(`Delete "${task.title}"?`)) {
          await onTaskDelete?.(task.id);
        }
        break;
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full" style={{ gridTemplateRows: '1fr 1fr' }}>
        {QUADRANTS.map((q) => {
          const qTasks = tasksForQuadrant(q.id);
          const overdue = qTasks.filter(
            (t) => t.due_date && t.due_date < today && t.status !== 'done'
          ).length;

          return (
            <div
              key={q.id}
              className={`flex flex-col bg-slate-900/60 border ${q.border} rounded-xl overflow-hidden min-h-[200px]`}
            >
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${q.dot}`} />
                  <span className={`text-sm font-semibold ${q.header}`}>{q.label}</span>
                  <span className="text-xs text-slate-600">{q.sub}</span>
                </div>
                <div className="flex items-center gap-2">
                  {overdue > 0 && (
                    <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                      {overdue} overdue
                    </span>
                  )}
                  <span className="text-xs font-medium text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">
                    {qTasks.filter((t) => t.status !== 'done').length}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {qTasks.length === 0 ? (
                  <div className="flex items-center justify-center h-16 text-xs text-slate-700 italic">
                    No tasks
                  </div>
                ) : (
                  qTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={onTaskClick}
                      onToggleDone={handleToggleDone}
                      onMenuAction={handleMenuAction}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
