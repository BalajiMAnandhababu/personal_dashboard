import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

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
