# Command Dashboard

Personal task management dashboard for 6 companies: Unified Paygate, Thangapanam Gold, Iraivi, Digitus360, Infinex, Personal.

## Tech Stack

| Layer    | Technology                  |
|----------|-----------------------------|
| Frontend | React 19 + Vite 6 + PWA     |
| Styling  | Tailwind CSS v3             |
| Backend  | Node.js + Express           |
| Database | Supabase (Postgres)         |
| AI       | Claude API (auto-tagging)   |
| Deploy   | Vercel (client) + Railway (server) |

## Project Structure

```
/
├── client/          React Vite PWA
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── lib/
├── server/          Express API
│   ├── routes/
│   └── db/migrations/
└── shared/          Shared constants & types
```

## Setup

### 1. Database

Run `server/db/migrations/001_initial_schema.sql` in your Supabase SQL Editor.
This creates all tables, indexes, RLS policies, and seeds the 6 companies.

### 2. Environment Variables

```bash
# Server
cp server/.env.example server/.env
# Fill in: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, CLAUDE_API_KEY

# Client
cp client/.env.example client/.env
# Fill in: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

### 3. Install & Run

```bash
npm install            # installs all workspaces
npm run dev:server     # Express on http://localhost:3001
npm run dev:client     # Vite on http://localhost:5173
# or run both together:
npm run dev
```

### 4. Verify

- Health check: `GET http://localhost:3001/health`
- Client: `http://localhost:5173`

## API Endpoints

| Method | Path                  | Description          |
|--------|-----------------------|----------------------|
| GET    | /health               | Health check         |
| GET    | /api/tasks            | List tasks (filterable by company_id, status, priority_quadrant) |
| POST   | /api/tasks            | Create task          |
| PATCH  | /api/tasks/:id        | Update task          |
| DELETE | /api/tasks/:id        | Delete task          |
| GET    | /api/companies        | List companies       |
| GET    | /api/companies/:id    | Company + tasks      |
| GET    | /api/people           | List active people   |
| POST   | /api/people           | Create person        |
| PATCH  | /api/people/:id       | Update person        |

## Priority Quadrants (Eisenhower Matrix)

| Q  | Label                    | Action    |
|----|--------------------------|-----------|
| 1  | Urgent + Important       | Do Now    |
| 2  | Important, Not Urgent    | Schedule  |
| 3  | Urgent, Not Important    | Delegate  |
| 4  | Low Priority             | Eliminate |

## Deployment

- **Frontend → Vercel**: set `VITE_*` env vars in Vercel dashboard, point root to `/client`
- **Backend → Railway**: set server env vars, deploy `/server` folder
