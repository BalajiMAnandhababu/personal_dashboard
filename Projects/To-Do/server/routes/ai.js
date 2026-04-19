import { Router } from 'express';
import { suggestTaskFields } from '../lib/groq.js';
import { supabase } from '../lib/supabase.js';

const router = Router();

router.post('/suggest', async (req, res) => {
  const { title, description } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: 'GROQ_API_KEY not configured' });
  }

  try {
    const suggestion = await suggestTaskFields(title, description ?? '');

    // Resolve company name → company_id from DB
    const { data: companies } = await supabase.from('companies').select('id, name');
    const matched = companies?.find(
      (c) => c.name.toLowerCase() === suggestion.company?.toLowerCase()
    );
    suggestion.company_id = matched?.id ?? null;

    res.json(suggestion);
  } catch (err) {
    console.error('Groq suggest error:', err.message);
    res.status(500).json({ error: 'AI suggestion failed', detail: err.message });
  }
});

export default router;
