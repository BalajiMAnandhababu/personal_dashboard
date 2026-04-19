# Command Dashboard

Personal task management dashboard for 6 companies.

## Tech Stack

- **Frontend:** React 19 + Vite 6 PWA + Tailwind CSS v3
- **Backend:** Node.js + Express (ES modules)
- **Database:** Supabase (Postgres) with real-time subscriptions
- **AI:** Groq API (llama-3.1-8b-instant) — free tier, open source. @anthropic-ai/sdk removed. Only Groq is used for AI tagging.
- **WhatsApp:** Whapi.Cloud (HTTP REST API, QR-linked personal number). Morning brief 8 AM IST, evening summary 8 PM IST. Webhook at POST /api/whatsapp/incoming handles: done/add/snooze/status commands.
- **Deploy:** Vercel (client) + Railway (server)

## Project Structure

```
/client   React Vite PWA (port 5173)
/server   Express API (port 3001)
/shared   Shared constants and JSDoc types
```

## Dev Commands

```bash
npm run dev:server   # start Express
npm run dev:client   # start Vite
npm run dev          # both concurrently
```

## Key Conventions

- `assigned_to = null` means the task is assigned to Babaji (the owner)
- Priority quadrants follow Eisenhower matrix (1=Do Now, 2=Schedule, 3=Delegate, 4=Eliminate)
- Server uses service role key for Supabase (full access); client uses anon key
- All routes are under `/api/*`; Vite proxies `/api` → `http://localhost:3001`

## Current status (as of 20 Apr 2026)

### Fully built and working

- **Quadrant dashboard** — Eisenhower board with drag-and-drop, real-time Supabase updates
- **AI tagging** — Groq llama-3.1-8b-instant auto-classifies category, priority, company, estimated hours on task add
- **Quick add bar** — bottom sheet with AI suggestion spinner, keyboard shortcut
- **Task cards** — three-dot menu (assign today / this week / move priority / edit / delete) visible on hover
- **Task detail panel** — full edit form, subtask list (separate `/subtasks` endpoint — self-referential join workaround), time logs
- **Company filter** — pill tabs across top of dashboard
- **Metrics bar** — done today, hours logged, overdue count
- **People management** (`/people`) — card grid, add/edit modal (name, initials, 8-color avatar, company multi-select, active toggle), deactivate/reactivate, "Show inactive" toggle, assigned-to dropdowns wired
- **Backlog page** (`/backlog`) — sortable table, filter bar (company, category, assignee, status, search), bulk select + bulk action bar, per-row three-dot menu, empty state SVG
- **Real-time** — Supabase `on('postgres_changes')` subscription refreshes dashboard on any task change
- **WhatsApp integration** — morning brief 8 AM IST, evening summary 8 PM IST via node-cron; incoming webhook handles `done`, `add`, `snooze`, `status` commands; Groq AI classifies added tasks; echo-loop guard (`from_me: true` filter); sender whitelist via `BABAJI_WHATSAPP_NUMBER`

### Known issues

- ngrok URL resets on every `ngrok http` restart — must update Whapi webhook URL in dashboard each time
- Server is local-only (Railway not deployed yet); WhatsApp scheduled jobs only run while dev server is up

### Next session TODO (in order)

1. Deploy backend to Railway (set env vars, push, get public URL)
2. Update Whapi webhook to Railway URL (permanent — no more ngrok)
3. Deploy frontend to Vercel (set `VITE_API_URL` to Railway URL)
4. Mobile polish — bottom nav, touch targets, PWA install prompt
5. Search / keyboard shortcuts (`/` to focus search, `n` for new task)

### Environment variables

**Railway (backend)**
```
SUPABASE_URL
SUPABASE_SERVICE_KEY
GROQ_API_KEY
WHAPI_TOKEN
WHAPI_API_URL          # https://gate.whapi.cloud
BABAJI_WHATSAPP_NUMBER # 91XXXXXXXXXX@s.whatsapp.net
CLIENT_URL             # https://your-app.vercel.app
PORT                   # Railway sets this automatically
```

**Vercel (frontend)**
```
VITE_API_URL   # https://your-server.railway.app
```

### Deployment steps

**Backend → Railway**
1. `railway login` then `railway link` in `/server`
2. Set all env vars in Railway dashboard
3. Add `Procfile`: `web: node --env-file=.env index.js` (or set start command)
4. `railway up` — get the public URL

**Frontend → Vercel**
1. `vercel` in `/client`
2. Set `VITE_API_URL=https://your-server.railway.app`
3. Vercel auto-deploys on push to main
