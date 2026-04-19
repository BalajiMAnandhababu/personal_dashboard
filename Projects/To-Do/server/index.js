import express from 'express';
import cors from 'cors';
import tasksRouter from './routes/tasks.js';
import peopleRouter from './routes/people.js';
import companiesRouter from './routes/companies.js';
import aiRouter from './routes/ai.js';
import timeLogsRouter from './routes/time-logs.js';
import whatsappRouter from './routes/whatsapp.js';
import { startScheduler } from './jobs/scheduler.js';

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env vars: ${missing.join(', ')}`);
  console.error('Copy server/.env.example to server/.env and fill in the values.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  const groqKey   = process.env.GROQ_API_KEY?.trim();
  const whapiKey  = process.env.WHAPI_TOKEN?.trim();
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    groq:      groqKey  ? `configured (${groqKey.slice(0, 8)}…${groqKey.slice(-4)})`  : 'NOT SET',
    whatsapp:  whapiKey ? `configured (${whapiKey.slice(0, 8)}…${whapiKey.slice(-4)})` : 'NOT SET',
  });
});

app.use('/api/tasks',     tasksRouter);
app.use('/api/people',    peopleRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/ai',        aiRouter);
app.use('/api/time-logs', timeLogsRouter);
app.use('/api/whatsapp',  whatsappRouter);

app.listen(PORT, () => {
  const groqKey  = process.env.GROQ_API_KEY?.trim();
  const whapiKey = process.env.WHAPI_TOKEN?.trim();
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Groq AI:   ${groqKey  ? `✓ key loaded (${groqKey.slice(0, 8)}…${groqKey.slice(-4)})`  : '✗ GROQ_API_KEY not set'}`);
  console.log(`WhatsApp:  ${whapiKey ? `✓ key loaded (${whapiKey.slice(0, 8)}…${whapiKey.slice(-4)})` : '✗ WHAPI_TOKEN not set (messages will log to console only)'}`);
  startScheduler();
});
