# AGENTS.md — gojukainam

**This is the canonical instruction file for every coding agent on this repo**
(Claude Code, Gemini CLI, Codex, Cursor, Copilot, …). `CLAUDE.md` and
`GEMINI.md` are thin pointers to this file. Keep this file — not the pointers —
up to date.

Deeper detail lives in:

- [`docs/architecture.md`](docs/architecture.md) — data model, request flow, auth, storage
- [`docs/conventions.md`](docs/conventions.md) — the code patterns to copy when adding features
- [`docs/state.md`](docs/state.md) — **current work in progress; read first, update before you hand off**

---

## What this app is

**gojukainam** is a karate championships management system for Goju Kai Namibia:
clubs register athletes, athletes are entered into event divisions (kata/kumite,
individual and team), admins review and approve entries, and the system produces
invoices and reports.

Production site: `https://www.gojukainam.com` (Railway).

## Stack

| Layer    | Tech |
|----------|------|
| Backend  | Node 20+ / Express 5 / TypeScript (ESM) / Prisma 6 / PostgreSQL / Zod 4 |
| Frontend | React 19 / Vite / TypeScript / Tailwind v4 / shadcn-style UI on Radix / TanStack Query + Table / React Router 7 |
| Auth     | JWT in an httpOnly cookie, plus magic links and password reset |
| Storage  | Supabase Storage (documents), accessed via pre-signed URLs |
| Deploy   | Railway (Nixpacks), separate backend + frontend services, Postgres service |

Monorepo layout: `backend/` and `frontend/` are independent npm projects (no
workspace root). Run npm commands **inside** the respective directory.

## Commands

```bash
# backend (from backend/)
npm install
npm run dev                  # tsx watch src/server.ts -> http://localhost:4000
npm run build                # tsc -> dist/
npm run start                # node dist/server.js
npm run prisma:migrate       # prisma migrate deploy
npm run prisma:seed          # superuser + belts + reference data
npm run prisma:studio
npm run create-superuser
npm run check-user
npm run superuser-recovery <email>   # prints a password-reset link

# frontend (from frontend/)
npm install
npm run dev                  # vite -> http://localhost:5173
npm run build                # vite build -> dist/
npm run preview
npm run start                # serve -s dist -l 3000
```

There is **no test suite and no linter configured**. The de-facto check is
`npx tsc --noEmit` in each project plus a successful `npm run build`. Run those
before declaring work done; do not claim tests pass.

Both projects type-check clean as of 2026-08-01 — treat any error as a
regression from your own change. Note that the frontend `npm run build` is
Vite/esbuild and does **not** type-check, so run `tsc` separately.

Schema changes during development use `npx prisma migrate dev --name <change>`
inside `backend/`; `prisma:migrate` (deploy) is what runs in production. Never
edit an already-applied migration — add a new one.

## Environment

`backend/.env` (see `backend/.env.example`):
`DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`, `PORT` (default 4000), `FRONTEND_URL`
(CORS allow-list in production), `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET_NAME`, `PRESIGNED_URL_TTL_SECONDS`,
and optionally `ALLOW_DEV_AUTH=true` to enable header-based dev auth.

`frontend/.env.development.local` / `.env.production`:
`VITE_API_BASE` — the API origin **without** the `/api` suffix (the axios client
appends it). Note: this is `VITE_API_BASE`, not `VITE_API_URL`.

Never commit `.env` files or print secret values into the transcript.

## Local database

A local Postgres 16 (Homebrew, already running on 5432) backs development —
**never develop against the Railway production database.** The setup, verified
2026-08-01:

- Role `gojukainam` / database `karate`, created specifically for this project.
  Other databases on that server (`cctv_alerts`, `ryansrecipes`) belong to
  unrelated projects — leave them alone.
- `backend/.env` has `DATABASE_URL` pointed at localhost; the production URL is
  preserved on a commented `# PROD_DATABASE_URL=` line in the same file.
- Before running any destructive Prisma command, confirm `DATABASE_URL` resolves
  to `localhost`. `migrate reset` against the production URL would be
  unrecoverable.

Bootstrap from scratch:

```bash
cd backend && npx prisma migrate deploy && npm run prisma:seed && npm run create-superuser <email> <password>
```

Then run backend (port 4000) and frontend (5173); `frontend/.env.development.local`
must point `VITE_API_BASE` at the backend's port. `npx tsx scripts/test-draws.ts`
with `ALLOW_DEV_AUTH=true` runs the draw-engine suite against the local database —
it is the only real test suite in the repo and it needs Postgres.

## Ground rules for agents

1. **Read [`docs/state.md`](docs/state.md) first.** Another agent may have left
   work half-finished; the repo's uncommitted changes are described there.
2. **Update [`docs/state.md`](docs/state.md) at the end of a work session** —
   what you changed, what is verified, what is still open. That file is the
   handoff between agents.
3. **Match the existing patterns** in `docs/conventions.md` rather than
   introducing new libraries or architectural styles. No new dependencies
   without saying so explicitly.
4. **Authorization is per-route and non-negotiable.** Every new backend route
   gets `requireRoles(...)`, and any route that reads or writes club-scoped data
   must also check `req.user.clubId` for non-admin roles. See
   `backend/src/routes/clubs.ts` for the reference shape.
5. **Validate input with Zod** from `backend/src/utils/validators.ts`; extend
   that file rather than inlining schemas in routes.
6. **Don't run dev servers in the background and leave them.** Use one dev
   server, on the ports above; the frontend preview config is
   `.claude/launch.json` (port 5180) for agents with a browser preview.
7. **Migrations, seeds and production data**: never run destructive Prisma
   commands (`migrate reset`, `db push --force-reset`) against a database whose
   `DATABASE_URL` you did not personally confirm is local.
8. **Git**: commit only when the user asks. `main` is the working branch and
   deploys to Railway on push — treat pushes as production releases.

## Domain glossary

- **Event** — a tournament. Its rules snapshot from `config/event-config.yaml`
  is stored on the event as `configJson` (fees, currency, per-athlete entry
  limits, division definitions).
- **Division** — an age/gender category inside an event (`U8`, `U10`, … plus
  `CategoryType` and optional `WeightClass`).
- **Club** — a dojo; owns athletes and users. Non-admin users are scoped to one club.
- **Athlete** — a competitor, has `dob`, `gender`, `beltId`, optional `weightKg`.
- **Entry** — one athlete (or team) in one division, with an `EntryStatus`
  (`DRAFT → SUBMITTED → APPROVED`, or `RETURNED`).
- **Team / TeamMember** — roster for `TEAM_KATA` / `TEAM_KUMITE` entries.
- **Belt** — rank reference data, seeded; drives the belt colour ramp in the UI.
- **Invoice** — per-club billing for an event's entries.
- **Document** — an uploaded file attached to an athlete, event, or club.
- **Roles** — `SUPERADMIN`, `ADMIN`, `CLUB_MANAGER`, `COACH`, `ATHLETE`.
  Admin roles see everything; the rest see only their own club.

## Known rough edges

- `frontend/src/lib/api.ts` still attaches `x-role` / `x-club-id` dev headers
  from `localStorage`; the backend only honours them when `ALLOW_DEV_AUTH=true`.
  Don't rely on them for real auth work.
- `README.md` at the repo root is a UTF-16 stub with no content.
- `filestructure.txt` (3.6 MB) is a stale generated dump — don't read it, and
  don't regenerate it into a diff.
- Weight classes are not auto-assigned on individual kumite entries; it's a
  known follow-up.
