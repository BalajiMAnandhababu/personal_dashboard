import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('companies').select('*').order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('companies').select('*, tasks(*)').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

export default router;
