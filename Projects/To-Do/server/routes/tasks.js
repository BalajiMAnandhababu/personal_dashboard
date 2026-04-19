import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

const TASK_SELECT = `
  *,
  company:companies(id, name, color),
  assignee:people(id, name, initials, avatar_color)
`;

router.get('/', async (req, res) => {
  const { company_id, status, priority_quadrant, assigned_to } = req.query;
  let q = supabase.from('tasks').select(TASK_SELECT);

  if (company_id) q = q.eq('company_id', company_id);
  if (status) q = q.eq('status', status);
  if (priority_quadrant) q = q.eq('priority_quadrant', parseInt(priority_quadrant));
  if (assigned_to === 'me') q = q.is('assigned_to', null);
  else if (assigned_to) q = q.eq('assigned_to', assigned_to);

  const { data, error } = await q
    .is('parent_task_id', null)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

router.patch('/bulk', async (req, res) => {
  const { ids, updates } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids required' });
  const { data, error } = await supabase
    .from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .or(ids.map(id => `id.eq.${id}`).join(','))
    .select(TASK_SELECT);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data ?? []);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

router.get('/:id/subtasks', async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('parent_task_id', req.params.id)
    .order('created_at');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

router.get('/:id/history', async (req, res) => {
  const { data, error } = await supabase
    .from('task_history')
    .select('*')
    .eq('task_id', req.params.id)
    .order('changed_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

router.post('/', async (req, res) => {
  const { data, error } = await supabase
    .from('tasks')
    .insert(req.body)
    .select(TASK_SELECT)
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json(data);
});

router.patch('/:id', async (req, res) => {
  const { _changed_by, ...fields } = req.body;

  const { data: current } = await supabase
    .from('tasks').select('*').eq('id', req.params.id).single();

  const { data, error } = await supabase
    .from('tasks')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .select(TASK_SELECT)
    .single();
  if (error) return res.status(400).json({ error: error.message });

  if (current) {
    const historyRows = Object.keys(fields)
      .filter((k) => current[k] !== fields[k])
      .map((k) => ({
        task_id: req.params.id,
        changed_by: _changed_by ?? 'Babaji',
        field_changed: k,
        old_value: current[k] != null ? String(current[k]) : '',
        new_value: fields[k] != null ? String(fields[k]) : '',
      }));
    if (historyRows.length) await supabase.from('task_history').insert(historyRows);
  }

  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase.from('tasks').delete().eq('id', req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.status(204).send();
});

export default router;
