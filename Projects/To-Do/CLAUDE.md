# Command Dashboard

Personal task management dashboard for 6 companies.

## Tech Stack

- **Frontend:** React 19 + Vite 6 PWA + Tailwind CSS v3
- **Backend:** Node.js + Express (ES modules)
- **Database:** Supabase (Postgres) with real-time subscriptions
- **AI:** Groq API (llama-3.1-8b-instant) — free tier, open source. @anthropic-ai/sdk removed. Only Groq is used for AI tagging.
- **WhatsApp:** Whapi.Cloud (HTTP REST API, QR-linked personal number). Morning brief 8 AM IST, evening summary 8 PM IST. Webhook at POST /api/whatsapp/incoming handles: done/add/snooze/status commands.
- **Deploy:** Hostinger VPS (Ubuntu 24.04) — Docker + Traefik. Domain: pdb.infinexcorp.io. IP: 195.179.193.43. Two containers: `dashboard-frontend` (nginx:alpine serving React build, proxying `/api/` to server) and `dashboard-server` (node:20-alpine on port 3001). Traefik handles SSL + routing on `n8n_default` network.

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
- **WhatsApp integration** — morning brief 8 AM IST, evening summary 8 PM IST via node-cron; incoming webhook handles `done`, `add`, `snooze`, `status` commands; Groq AI classifies added tasks; echo-loop guard (`from_me: true` filter); sender whitelist via `BABAJI_WHATSAPP_NUMBER`; webhook live at `https://pdb.infinexcorp.io/api/whatsapp/incoming`
- **Mobile polish** — bottom nav (Dashboard/Backlog/People), sidebar hidden on mobile, PWA install banner via `beforeinstallprompt`
- **Keyboard shortcuts** — `n` focuses QuickAdd (Dashboard + Backlog), `/` focuses search (Backlog), `Esc` closes panels

### Known issues

- npm install in `/server` or `/client` on VPS needs `--no-workspaces` flag (root package.json has workspaces, causes hoisting)
- Client `.env.production` must be present on VPS before `npm run build` (Supabase anon key baked into bundle)

### Next session TODO (in order)

1. Task recurrence — mark a task as repeating daily/weekly, auto-recreate on completion
2. Due-date reminders — WhatsApp nudge 1 hour before a task's due time
3. Time log chart — weekly hours-logged bar chart on dashboard

### Environment variables

**VPS — `/var/www/personal_dashboard/Projects/To-Do/server/.env`**
```
SUPABASE_URL=https://swxussgwqnsjzlabvctw.supabase.co
SUPABASE_SERVICE_KEY=...
GROQ_API_KEY=gsk_0pLL...
WHAPI_TOKEN=...
WHAPI_API_URL=https://gate.whapi.cloud
BABAJI_WHATSAPP_NUMBER=919884719390
CLIENT_URL=https://pdb.infinexcorp.io
PORT=3001
```

**VPS — `/var/www/personal_dashboard/Projects/To-Do/client/.env.production`**
```
VITE_SUPABASE_URL=https://swxussgwqnsjzlabvctw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_API_URL=
```

### Deployment steps

**Re-deploy after code changes**
```bash
git push origin main
ssh root@195.179.193.43
cd /var/www/personal_dashboard && git pull origin main
cd Projects/To-Do/client && npm install --no-workspaces && npm run build
docker compose -f /docker/command-dashboard/docker-compose.yml restart dashboard-frontend
# If server code changed:
docker compose -f /docker/command-dashboard/docker-compose.yml restart dashboard-server
```

**Key paths on VPS**
- App root: `/var/www/personal_dashboard/Projects/To-Do/`
- Docker compose: `/docker/command-dashboard/docker-compose.yml`
- Nginx frontend config: `/docker/command-dashboard/nginx-frontend.conf`
- Server .env: `.../server/.env`
- Client .env.production: `.../client/.env.production`
- React build output: `.../client/dist/`
- Traefik cert resolver: `mytlschallenge`
- PM2: not used — Docker manages the process
