import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api.js';
import { supabase } from '../lib/supabase.js';

export function useTasks(params = {}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const paramsKey = JSON.stringify(params);

  const fetchAll = useCallback(async () => {
    try {
      const data = await api.tasks.list(JSON.parse(paramsKey));
      setTasks(data ?? []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel('tasks-realtime-' + Math.random())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchAll)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchAll]);

  const createTask = useCallback(async (data) => {
    const task = await api.tasks.create(data);
    setTasks((prev) => [task, ...prev]);
    return task;
  }, []);

  const updateTask = useCallback(async (id, data) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    const updated = await api.tasks.update(id, data);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  }, []);

  const deleteTask = useCallback(async (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await api.tasks.delete(id);
  }, []);

  return { tasks, loading, error, refetch: fetchAll, createTask, updateTask, deleteTask };
}
