const BASE = '';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  tasks: {
    list: (params = {}) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
      ).toString();
      return request(`/api/tasks${qs ? '?' + qs : ''}`);
    },
    get: (id) => request(`/api/tasks/${id}`),
    getSubtasks: (id) => request(`/api/tasks/${id}/subtasks`),
    getHistory: (id) => request(`/api/tasks/${id}/history`),
    bulkUpdate: (ids, updates) => request('/api/tasks/bulk', { method: 'PATCH', body: { ids, updates } }),
    create: (body) => request('/api/tasks', { method: 'POST', body }),
    update: (id, body) => request(`/api/tasks/${id}`, { method: 'PATCH', body }),
    delete: (id) => request(`/api/tasks/${id}`, { method: 'DELETE' }),
  },
  people: {
    list: (params = {}) => {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== false))
      ).toString();
      return request(`/api/people${qs ? '?' + qs : ''}`);
    },
    create: (body) => request('/api/people', { method: 'POST', body }),
    update: (id, body) => request(`/api/people/${id}`, { method: 'PATCH', body }),
  },
  companies: {
    list: () => request('/api/companies'),
    get: (id) => request(`/api/companies/${id}`),
  },
  ai: {
    suggest: (title) => request('/api/ai/suggest', { method: 'POST', body: { title } }),
  },
  timeLogs: {
    list: (task_id) => request(`/api/time-logs?task_id=${task_id}`),
    start: (task_id) => request('/api/time-logs', { method: 'POST', body: { task_id } }),
    stop: (id, notes) => request(`/api/time-logs/${id}/stop`, { method: 'PATCH', body: { notes } }),
  },
};
