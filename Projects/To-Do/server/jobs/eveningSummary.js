import { supabase } from '../lib/supabase.js';
import { sendWhatsApp } from '../lib/whatsapp.js';

function getISTToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function formatDateHeading(isoDate) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(isoDate + 'T00:00:00'));
}

export async function sendEveningSummary() {
  const today = getISTToday();
  console.log(`[Evening Summary] Generating for ${today} (IST)…`);

  // updated_at is ISO timestamp — filter where date part = today in UTC
  // Tasks use updated_at for done detection; we check due_date for pending/overdue
  const [completedRes, pendingRes, newOverdueRes] = await Promise.all([
    // Completed today: status=done AND updated_at starts with today (UTC ~= IST for daily purposes)
    supabase
      .from('tasks')
      .select('id, title, company:companies(name)')
      .eq('status', 'done')
      .gte('updated_at', today + 'T00:00:00.000Z')
      .is('parent_task_id', null)
      .order('updated_at', { ascending: false }),

    // Still pending: due today but not done
    supabase
      .from('tasks')
      .select('id, title, company:companies(name)')
      .eq('due_date', today)
      .neq('status', 'done')
      .is('parent_task_id', null)
      .order('created_at', { ascending: false }),

    // Newly overdue: due_date = today but not done (same as pending — overdue starts tomorrow)
    // For evening: show tasks due TODAY that are still not done as "at risk"
    supabase
      .from('tasks')
      .select('id, title, company:companies(name)')
      .lt('due_date', today)
      .neq('status', 'done')
      .is('parent_task_id', null)
      .order('due_date', { ascending: true })
      .limit(5),
  ]);

  const completed  = completedRes.data  ?? [];
  const pending    = pendingRes.data    ?? [];
  const newOverdue = newOverdueRes.data ?? [];

  const heading = formatDateHeading(today);

  const lines = [
    '🌙 *Evening Summary — Babaji*',
    `📅 *${heading}*`,
    '',
  ];

  if (completed.length) {
    lines.push(`*Completed today (${completed.length})* ✨`);
    completed.forEach(t => lines.push(`✅ ${t.title}`));
    lines.push('');
  } else {
    lines.push('*Completed today* — none yet');
    lines.push('');
  }

  if (pending.length) {
    lines.push(`*Still pending (${pending.length})*`);
    pending.forEach(t => lines.push(`⏳ ${t.title}${t.company?.name ? ` — ${t.company.name}` : ''}`));
    lines.push('');
  }

  if (newOverdue.length) {
    lines.push(`*Overdue (${newOverdue.length})*`);
    newOverdue.forEach(t => lines.push(`⚠️ ${t.title}${t.company?.name ? ` — ${t.company.name}` : ''}`));
    lines.push('');
  }

  lines.push('_Great work today! 💪_');

  const message = lines.join('\n');

  console.log('[Evening Summary] Message:\n' + message);
  await sendWhatsApp(message);
  return message;
}
