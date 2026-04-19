import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { TASK_STATUSES } from '../lib/constants.js';

const STATUS_COLORS = {
  todo: 'bg-slate-700 text-slate-300',
  inprogress: 'bg-blue-900 text-blue-300',
  done: 'bg-green-900 text-green-300',
  blocked: 'bg-red-900 text-red-300',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.tasks.list(filter ? { status: filter } : {})
      .then(setTasks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-100">All Tasks</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('')}
            className={`px-3 py-1.5 rounded text-xs font-medium ${!filter ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
          >
            All
          </button>
          {TASK_STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`px-3 py-1.5 rounded text-xs font-medium ${filter === s.value ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500">Loading...</div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-100 truncate">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {task.company && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: task.company.color }}
                    >
                      {task.company.name}
                    </span>
                  )}
                  {task.due_date && (
                    <span className="text-xs text-slate-500">{task.due_date}</span>
                  )}
                </div>
              </div>
              <span className={`shrink-0 text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>
                {TASK_STATUSES.find((s) => s.value === task.status)?.label}
              </span>
            </div>
          ))}
          {tasks.length === 0 && (
            <p className="text-slate-600 text-sm">No tasks found.</p>
          )}
        </div>
      )}
    </div>
  );
}
