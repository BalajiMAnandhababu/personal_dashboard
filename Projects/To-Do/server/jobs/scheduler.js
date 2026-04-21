import cron from 'node-cron';
import { sendMorningBrief } from './morningBrief.js';
import { sendEveningSummary } from './eveningSummary.js';
import { sendDueReminders } from './dueReminder.js';

export function startScheduler() {
  // 8:00 AM IST = 2:30 AM UTC
  cron.schedule('30 2 * * *', async () => {
    console.log('[Scheduler] Firing morning brief…');
    try { await sendMorningBrief(); } catch (e) { console.error('[Scheduler] Morning brief error:', e); }
  }, { timezone: 'UTC' });

  // 8:00 PM IST = 2:30 PM UTC
  cron.schedule('30 14 * * *', async () => {
    console.log('[Scheduler] Firing evening summary…');
    try { await sendEveningSummary(); } catch (e) { console.error('[Scheduler] Evening summary error:', e); }
  }, { timezone: 'UTC' });

  // Every hour — due-date reminders (tasks due within next 60 min IST)
  cron.schedule('0 * * * *', async () => {
    console.log('[Scheduler] Checking due reminders…');
    try { await sendDueReminders(); } catch (e) { console.error('[Scheduler] Due reminder error:', e); }
  }, { timezone: 'UTC' });

  console.log('[Scheduler] Started — morning (02:30 UTC), evening (14:30 UTC), reminders (every hour)');
}
