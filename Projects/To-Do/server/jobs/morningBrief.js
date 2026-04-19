import { supabase } from '../lib/supabase.js';
import { sendWhatsApp } from '../lib/whatsapp.js';

function getISTToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date()); // returns YYYY-MM-DD
}

function formatDateHeading(isoDate) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(isoDate + 'T00:00:00'));
}

function taskLine(task) {
  const company = task.company?.name ?? '';
  return `• ${task.title}${company ? ` — ${company}` : ''}`;
}

export async function sendMorningBrief() {
  const today = getISTToday();
  console.log(`[Morning Brief] Generating for ${today} (IST)…`);

  const [dueRes, overdueRes, doNowRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, company:companies(name)')
      .eq('due_date', today)
      .neq('status', 'done')
      .is('parent_task_id', null)
      .order('created_at', { ascending: false }),

    supabase
      .from('tasks')
      .select('id, title, company:companies(name)')
      .lt('due_date', today)
      .neq('status', 'done')
      .is('parent_task_id', null)
      .order('due_date', { ascending: true })
      .limit(3),

    supabase
      .from('tasks')
      .select('id, title, company:companies(name)')
      .eq('priority_quadrant', 1)
      .neq('status', 'done')
      .is('parent_task_id', null)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const dueToday = dueRes.data ?? [];
  const overdue  = overdueRes.data ?? [];
  const doNow    = doNowRes.data ?? [];

  const heading = formatDateHeading(today);

  const lines = [
    '🌅 *Good morning, Babaji!*',
    `📅 *${heading}*`,
    '',
  ];

  if (dueToday.length) {
    lines.push(`*Due Today (${dueToday.length})*`);
    dueToday.forEach(t => lines.push(taskLine(t)));
    lines.push('');
  } else {
    lines.push('*Due Today* — none 🎉');
    lines.push('');
  }

  if (overdue.length) {
    lines.push(`*Overdue (${overdue.length})*`);
    overdue.forEach(t => lines.push(`⚠️ ${t.title}${t.company?.name ? ` — ${t.company.name}` : ''}`));
    lines.push('');
  }

  if (doNow.length) {
    lines.push(`*Do Now (${doNow.length})*`);
    doNow.forEach(t => lines.push(`🔴 ${t.title}${t.company?.name ? ` — ${t.company.name}` : ''}`));
    lines.push('');
  }

  lines.push('_Reply anytime:_');
  lines.push('• *done [keyword]* — mark task done');
  lines.push('• *add [task title]* — create new task');
  lines.push('• *snooze [keyword] [days]* — postpone');
  lines.push('• *status* — see today\'s tasks');

  const message = lines.join('\n');

  console.log('[Morning Brief] Message:\n' + message);
  await sendWhatsApp(message);
  return message;
}
