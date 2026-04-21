import { supabase } from '../lib/supabase.js';
import { sendWhatsApp } from '../lib/whatsapp.js';

function getIST() {
  const fmt = (opts) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', ...opts }).format(new Date());
  const date = fmt({ year: 'numeric', month: '2-digit', day: '2-digit' });
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date());
  return { date, time };
}

function addMinutes(hhmm, minutes) {
  const [h, m] = hhmm.split(':').map(Number);
  const total = (h * 60 + m + minutes) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export async function sendDueReminders() {
  const { date, time } = getIST();
  const windowEnd = addMinutes(time, 60);

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, due_time, company:companies(name)')
    .eq('due_date', date)
    .eq('reminder_sent', false)
    .neq('status', 'done')
    .not('due_time', 'is', null)
    .gte('due_time', time)
    .lte('due_time', windowEnd)
    .is('parent_task_id', null);

  if (!tasks?.length) {
    console.log('[Due Reminder] No tasks due in next hour');
    return;
  }

  for (const task of tasks) {
    const timeLabel = task.due_time.slice(0, 5);
    const company = task.company?.name ? ` — ${task.company.name}` : '';
    await sendWhatsApp(`⏰ *Due in ~1 hour:* ${task.title}${company}\n🕐 ${timeLabel} IST`);
    await supabase.from('tasks').update({ reminder_sent: true }).eq('id', task.id);
  }

  console.log(`[Due Reminder] Sent ${tasks.length} reminder(s)`);
}
