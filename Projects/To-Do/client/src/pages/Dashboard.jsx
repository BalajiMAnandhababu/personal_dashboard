import { useState, useMemo, useRef } from 'react';
import { useTasks } from '../hooks/useTasks.js';
import { useCompanies } from '../hooks/useCompanies.js';
import { usePeople } from '../hooks/usePeople.js';
import { usePWAInstall } from '../hooks/usePWAInstall.js';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts.js';
import CompanyFilterTabs from '../components/dashboard/CompanyFilterTabs.jsx';
import MetricsBar from '../components/dashboard/MetricsBar.jsx';
import PeoplePanel from '../components/dashboard/PeoplePanel.jsx';
import QuadrantBoard from '../components/tasks/QuadrantBoard.jsx';
import QuickAddBar from '../components/tasks/QuickAddBar.jsx';
import TaskDetailPanel from '../components/tasks/TaskDetailPanel.jsx';
import BottomNav from '../components/layout/BottomNav.jsx';

export default function Dashboard() {
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedPerson, setSelectedPerson]   = useState(undefined);
  const [selectedTaskId, setSelectedTaskId]   = useState(null);
  const [showPeople, setShowPeople]           = useState(true);
  const { canInstall, install } = usePWAInstall();
  const quickAddRef = useRef(null);

  useKeyboardShortcuts({
    'n': () => quickAddRef.current?.focus(),
  });

  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks();
  const { companies } = useCompanies();
  const { people }    = usePeople();

  const today = new Date().toISOString().split('T')[0];

  const filteredTasks = useMemo(() => tasks.filter(t => {
    if (selectedCompany && t.company_id !== selectedCompany) return false;
    if (selectedPerson === null && t.assigned_to !== null)   return false;
    if (selectedPerson && t.assigned_to !== selectedPerson)  return false;
    return true;
  }), [tasks, selectedCompany, selectedPerson]);

  const metrics = useMemo(() => ({
    today:   filteredTasks.filter(t => t.due_date === today && t.status !== 'done').length,
    done:    filteredTasks.filter(t => t.status === 'done' && t.updated_at?.split('T')[0] === today).length,
    overdue: filteredTasks.filter(t => t.due_date && t.due_date < today && t.status !== 'done').length,
    backlog: filteredTasks.filter(t => !t.due_date && t.status !== 'done').length,
  }), [filteredTasks, today]);

  return (
    <div className="flex flex-col h-screen bg-slate-950 overflow-hidden pb-14 md:pb-0">
      {/* PWA install banner */}
      {canInstall && (
        <div className="md:hidden flex items-center justify-between px-4 py-2 bg-indigo-900 border-b border-indigo-700 text-sm">
          <span className="text-indigo-200">Add to Home Screen for quick access</span>
          <button
            onClick={install}
            className="ml-3 px-3 py-1 rounded bg-indigo-500 text-white text-xs font-medium shrink-0"
          >
            Install
          </button>
        </div>
      )}

      {/* Company filter tabs */}
      <CompanyFilterTabs
        companies={companies}
        selected={selectedCompany}
        onSelect={setSelectedCompany}
      />

      {/* Metrics */}
      <MetricsBar metrics={metrics} />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-3 text-slate-600">
              <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-400 rounded-full animate-spin" />
              <span className="text-sm">Loading tasks…</span>
            </div>
          </div>
        ) : (
          <QuadrantBoard
            tasks={filteredTasks}
            onTaskClick={id => setSelectedTaskId(id)}
            onTaskUpdate={updateTask}
            onTaskDelete={deleteTask}
          />
        )}

        {/* People panel */}
        <div className={`${showPeople ? 'flex' : 'hidden'} md:flex shrink-0`}>
          <PeoplePanel
            people={people}
            tasks={tasks}
            selectedPerson={selectedPerson}
            onSelectPerson={setSelectedPerson}
          />
        </div>

        {/* Mobile people toggle */}
        <button
          onClick={() => setShowPeople(v => !v)}
          className="md:hidden fixed bottom-20 right-4 z-30 w-10 h-10 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center shadow-lg text-base"
          title="Toggle people panel"
        >
          👥
        </button>
      </div>

      {/* Quick add bar — people passed for "Assigned to" dropdown */}
      <QuickAddBar
        ref={quickAddRef}
        companies={companies}
        people={people}
        onTaskCreate={createTask}
      />

      {/* Task detail panel */}
      {selectedTaskId && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          companies={companies}
          people={people}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={updateTask}
        />
      )}

      <BottomNav />
    </div>
  );
}
