import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// ── Summary — hours by person per period ─────────────────────────────────────

router.get('/summary', async (req, res) => {
  const { period = 'weekly' } = req.query;
  const now = new Date();

  // Build bucket list
  let buckets = [];
  if (period === 'daily') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i);
      buckets.push(d.toISOString().split('T')[0]);
    }
  } else if (period === 'weekly') {
    // Start from Monday of 7 weeks ago
    const dayOfWeek = (now.getDay() + 6) % 7; // Mon=0
    const thisMonday = new Date(now); thisMonday.setDate(now.getDate() - dayOfWeek);
    for (let i = 7; i >= 0; i--) {
      const d = new Date(thisMonday); d.setDate(thisMonday.getDate() - i * 7);
      buckets.push(d.toISOString().split('T')[0]); // week-start date
    }
  } else {
    // Monthly — last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
  }

  const startDate = period === 'monthly'
    ? new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()
    : new Date(buckets[0] + 'T00:00:00Z').toISOString();

  const { data: logs, error } = await supabase
    .from('time_logs')
    .select('duration_minutes, started_at, task:tasks(assigned_to, assignee:people(id, name, avatar_color))')
    .gte('started_at', startDate)
    .not('duration_minutes', 'is', null);

  if (error) return res.status(500).json({ error: error.message });

  // Build person map and bucket totals
  const personMap = new Map(); // id → { id, name, color, buckets: Map }

  const getBucket = (startedAt) => {
    const d = new Date(startedAt);
    if (period === 'daily') return d.toISOString().split('T')[0];
    if (period === 'monthly') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    // weekly — find which week bucket
    const dayOfWeek = (d.getDay() + 6) % 7;
    const monday = new Date(d); monday.setDate(d.getDate() - dayOfWeek);
    return monday.toISOString().split('T')[0];
  };

  for (const log of logs ?? []) {
    const person = log.task?.assignee;
    const personId = person?.id ?? 'babaji';
    const personName = person?.name ?? 'Babaji';
    const personColor = person?.avatar_color ?? '#6366f1';

    if (!personMap.has(personId)) {
      personMap.set(personId, { id: personId, name: personName, color: personColor, data: new Map() });
    }

    const bucket = getBucket(log.started_at);
    const entry = personMap.get(personId);
    entry.data.set(bucket, (entry.data.get(bucket) ?? 0) + (log.duration_minutes / 60));
  }

  const people = Array.from(personMap.values()).map(p => ({
    id: p.id,
    name: p.name,
    color: p.color,
    data: buckets.map(b => Math.round((p.data.get(b) ?? 0) * 10) / 10),
  }));

  const labels = buckets.map(b => {
    if (period === 'daily') return b.slice(5).replace('-', '/');
    if (period === 'monthly') {
      const [y, m] = b.split('-');
      return new Date(+y, +m - 1).toLocaleDateString('en-IN', { month: 'short' });
    }
    return new Date(b + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  });

  res.json({ period, labels, buckets, people });
});

router.get('/', async (req, res) => {
  const { task_id } = req.query;
  let q = supabase.from('time_logs').select('*').order('started_at', { ascending: false });
  if (task_id) q = q.eq('task_id', task_id);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

router.post('/', async (req, res) => {
  const { task_id } = req.body;
  if (!task_id) return res.status(400).json({ error: 'task_id is required' });
  const { data, error } = await supabase
    .from('time_logs')
    .insert({ task_id, started_at: new Date().toISOString() })
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id/stop', async (req, res) => {
  const endedAt = new Date().toISOString();
  const { data: log, error: fetchErr } = await supabase
    .from('time_logs').select('started_at').eq('id', req.params.id).single();
  if (fetchErr) return res.status(404).json({ error: fetchErr.message });

  const durationMinutes = Math.round((new Date(endedAt) - new Date(log.started_at)) / 60000);
  const { data, error } = await supabase
    .from('time_logs')
    .update({ ended_at: endedAt, duration_minutes: durationMinutes, notes: req.body.notes ?? null })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;
