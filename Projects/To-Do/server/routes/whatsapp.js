import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { sendWhatsApp } from '../lib/whatsapp.js';
import { suggestTaskFields } from '../lib/groq.js';
import { sendMorningBrief } from '../jobs/morningBrief.js';
import { sendEveningSummary } from '../jobs/eveningSummary.js';

const router = Router();

const HELP_TEXT = `I didn't understand that 🤔

Try:
• *done [keyword]* — mark task done
• *add [task title]* — create new task
• *snooze [keyword] [days]* — postpone
• *status* — see today's tasks`;

function getISTToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function addDays(isoDate, days) {
  const d = new Date(isoDate + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ── Command handlers ──────────────────────────────────────────────────────────

async function handleDone(text) {
  // "done hdfc" | "completed credit policy"
  const keyword = text.replace(/^(done|completed)\s+/i, '').trim();
  if (!keyword) { await sendWhatsApp('Please include a keyword. E.g. *done hdfc*'); return; }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title')
    .ilike('title', `%${keyword}%`)
    .neq('status', 'done')
    .is('parent_task_id', null)
    .limit(1);

  if (!tasks?.length) {
    await sendWhatsApp(`❌ No open task found matching *"${keyword}"*`);
    return;
  }

  const task = tasks[0];
  await supabase.from('tasks').update({ status: 'done', updated_at: new Date().toISOString() }).eq('id', task.id);
  await sendWhatsApp(`✅ Marked done: *${task.title}*`);
}

async function handleAdd(text) {
  // "add Follow up with Ravi on LOS testing"
  const title = text.replace(/^add\s+/i, '').trim();
  if (!title) { await sendWhatsApp('Please include a task title. E.g. *add follow up with Ravi*'); return; }

  let companyId = null;
  let fields = { category: 'operations', priority_quadrant: 2, estimated_hours: 1.0 };

  try {
    const suggestion = await suggestTaskFields(title);
    const { data: companies } = await supabase.from('companies').select('id, name');
    const matched = companies?.find(c => c.name.toLowerCase() === suggestion.company?.toLowerCase());
    companyId = matched?.id ?? null;
    // Exclude the string `company` field — tasks table uses `company_id` (UUID)
    const { company: _name, ...rest } = suggestion;
    fields = { ...rest, company_id: companyId };
  } catch {
    // AI failed — create with defaults
  }

  const { data: task } = await supabase
    .from('tasks')
    .insert({ title, ...fields, status: 'todo', ai_suggested: true })
    .select('id, title, company:companies(name), category, priority_quadrant, estimated_hours')
    .single();

  if (!task) { await sendWhatsApp('❌ Failed to create task. Try again.'); return; }

  const QUADRANT = { 1: 'Do Now', 2: 'Schedule', 3: 'Delegate', 4: 'Eliminate' };
  const reply = [
    `✅ Added: *${task.title}*`,
    `📌 ${task.company?.name ?? 'Personal'} · ${task.category} · ${QUADRANT[task.priority_quadrant] ?? 'Schedule'} · Est: ${task.estimated_hours}h`,
  ].join('\n');

  await sendWhatsApp(reply);
}

async function handleSnooze(text) {
  // "snooze hdfc 2"
  const parts = text.replace(/^snooze\s+/i, '').trim().split(/\s+/);
  const days = parseInt(parts[parts.length - 1]);
  const keyword = isNaN(days) ? parts.join(' ') : parts.slice(0, -1).join(' ');
  const snoozedays = isNaN(days) ? 1 : days;

  if (!keyword) { await sendWhatsApp('Please include a keyword. E.g. *snooze hdfc 2*'); return; }

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, due_date')
    .ilike('title', `%${keyword}%`)
    .neq('status', 'done')
    .is('parent_task_id', null)
    .limit(1);

  if (!tasks?.length) {
    await sendWhatsApp(`❌ No open task found matching *"${keyword}"*`);
    return;
  }

  const task = tasks[0];
  const base = task.due_date ?? getISTToday();
  const newDate = addDays(base, snoozedays);

  await supabase.from('tasks').update({ due_date: newDate, updated_at: new Date().toISOString() }).eq('id', task.id);

  const formatted = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(newDate + 'T00:00:00'));

  await sendWhatsApp(`⏰ Snoozed: *${task.title}* → due ${formatted}`);
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Incoming webhook from Whapi
router.post('/incoming', async (req, res) => {
  // Log the raw payload so we can see exactly what Whapi sends
  console.log('[WhatsApp] Raw webhook payload:', JSON.stringify(req.body, null, 2));

  res.status(200).json({ status: 'ok' }); // Ack immediately

  // Whapi can nest messages under different keys depending on version
  const messages = req.body?.messages ?? req.body?.data?.messages ?? [];
  const msg = messages[0];
  if (!msg) {
    console.log('[WhatsApp] No message found in payload — keys:', Object.keys(req.body ?? {}));
    return;
  }

  // Ignore echoes of our own sent messages
  if (msg.from_me === true || msg.fromMe === true) {
    console.log('[WhatsApp] Ignoring outbound echo');
    return;
  }

  // Only process messages from Babaji's number
  const from = msg.from ?? msg.chatId ?? '';
  const babajiNumber = (process.env.BABAJI_WHATSAPP_NUMBER ?? '').replace(/\D/g, '');
  if (babajiNumber && !from.includes(babajiNumber)) {
    console.log(`[WhatsApp] Ignoring message from ${from}`);
    return;
  }

  // Extract text — handle Whapi v1 and v2 formats
  const text = (msg.text?.body ?? msg.body ?? msg.content ?? '').trim();
  if (!text) {
    console.log('[WhatsApp] No text body found. Message type:', msg.type, '| keys:', Object.keys(msg));
    return;
  }

  const lower = text.toLowerCase();
  console.log(`[WhatsApp] Incoming from ${from}: "${text}"`);

  try {
    if (/^(done|completed)\s+/i.test(lower)) {
      await handleDone(text);
    } else if (/^add\s+/i.test(lower)) {
      await handleAdd(text);
    } else if (/^snooze\s+/i.test(lower)) {
      await handleSnooze(text);
    } else if (/^(status|today|tasks)$/i.test(lower)) {
      await sendMorningBrief();
    } else {
      await sendWhatsApp(HELP_TEXT);
    }
  } catch (e) {
    console.error('[WhatsApp] Handler error:', e);
  }
});

// Dev test endpoints
router.get('/test-morning', async (req, res) => {
  try {
    const message = await sendMorningBrief();
    res.json({ ok: true, message });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/test-evening', async (req, res) => {
  try {
    const message = await sendEveningSummary();
    res.json({ ok: true, message });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
