# Architecture

Companion to [`../AGENTS.md`](../AGENTS.md). Describes how the system is wired.

## Request flow

```
React page  →  frontend/src/lib/<resource>.ts  →  axios (lib/api.ts, withCredentials)
            →  Express  →  helmet + rate limit + CORS + authMiddleware
            →  routes/<resource>.ts  (requireRoles + ownership check)
            →  services/<resource>.service.ts  (Zod parse + Prisma)
            →  Postgres
```

Errors thrown anywhere in a route are passed to `next(err)` and normalised by
`backend/src/utils/error-handler.ts`:

| Thrown | Response |
|--------|----------|
| `ZodError` | 400 `{ error: "Validation failed", issues }` |
| Prisma `P2002` | 409 `{ error: "Unique constraint failed", meta }` |
| object with `.status` | that status, `{ error: message }` |
| anything else | 500 `{ error: "Internal Server Error" }` |

## Backend layout — `backend/src/`

| Path | Role |
|------|------|
| `server.ts` | Express bootstrap: helmet, rate limits, CORS allow-list, cookie parser, route mounting at `/api/*`, `errorHandler` last. Listens on `PORT` (4000). |
| `routes/` | HTTP layer only: role checks, ownership checks, status codes. One file per resource: `auth`, `athletes`, `clubs`, `events`, `entries`, `teams`, `belts`, `users`, `documents`, `reports`, `review`. Three are built for machine callers rather than the frontend — `billing`, `competition`, `federation` — with computed fields, no writes outside `billing`, and one gate per file. |
| `services/` | Business logic + Prisma access. `*.service.ts` exported as a static-method class (`ClubService.getAll()`). |
| `lib/prisma.ts` | Singleton Prisma client. |
| `lib/storage.ts` | Supabase Storage via `@supabase/storage-js` (avoids the realtime/WS dependency). Builds keys as `<entityType>/<entityId>/<docType>/<uuid>.<ext>` and issues signed upload/download URLs with a TTL. |
| `utils/auth.ts` | `authMiddleware` (cookie JWT, optional dev headers) and `requireRoles(...)`. Augments `Express.Request` with `user: { id, role, clubId }`. |
| `utils/agent-auth.ts` | Service-account keys: `verifyApiKey`, `agentRouteGuard`, `requireAgent(OrRoles)`, and the two club assertions — `assertAgentClub` (writes, home club, ignores scopes) and `assertAgentClubRead` (reads, widened by `federation:read`). Augments `Express.Request` with `agent`. |
| `utils/validators.ts` | All Zod schemas and shared enums. |
| `utils/eligibility.ts` | Server-side age/gender eligibility for divisions. |
| `utils/params.ts` | `getParam()` for typed route params. |
| `utils/error-handler.ts`, `utils/password.ts` | As named. |
| `data/wkf-template.ts` | WKF division template data. |
| `middleware/validate.ts` | Zod request-validation middleware. |

ESM is on (`"type": "module"`), so **relative imports must carry the `.js`
extension** even in TypeScript source: `import { prisma } from "./lib/prisma.js"`.

## Auth

1. Login (`POST /api/auth/login`), magic link (`/auth/magic-link` →
   `/auth/magic-login`), or password reset (`/auth/password-reset-request` →
   `/auth/reset-password`).
2. The server sets an httpOnly `auth_token` JWT cookie; the frontend axios client
   sends it via `withCredentials: true`.
3. `authMiddleware` verifies the cookie and populates `req.user`. If
   `ALLOW_DEV_AUTH=true`, it falls back to `x-role` / `x-club-id` headers — a
   development-only escape hatch.
4. `requireRoles(...)` gates the route; **club ownership is checked separately
   inside the handler** for `CLUB_MANAGER` / `COACH` / `ATHLETE`.
5. Auth endpoints are rate-limited to 10 requests / 15 min; the rest of `/api`
   to 300 / min.

### Machine callers (`utils/agent-auth.ts`)

A service-account `ApiKey` — today, the sensai agent stack — takes a third
branch. It populates `req.agent` and **never** `req.user`, so `requireRoles`
default-denies it everywhere; `agentRouteGuard` additionally allowlists the
only path prefixes a key may reach at all (`/api/billing`, `/api/competition`,
`/api/federation`), so an unguarded handler elsewhere cannot become
agent-reachable by accident.

The key's `clubId` means two different things by direction, and the split is
the whole model:

| | Without `federation:read` | With `federation:read` |
|---|---|---|
| Reads | home club only (`assertAgentClubRead`) | any club, plus `/api/federation` |
| Writes | home club only (`assertAgentClub`) | **home club only — unchanged** |

`assertAgentClub` does not consult scopes, so no scope widens a write. Routes
say which promise they are making by which function they call: `grep
assertAgentClub(` lists every path a key can change.

Frontend side: `contexts/AuthContext.tsx` exposes `useAuth()` with
`{ user, loading, login, requestMagicLink, verifyMagicLink, logout, clubId, role }`
and hydrates from `GET /api/auth/me`. `<Protected>` in `App.tsx` guards routes.

## Data model — `backend/prisma/schema.prisma`

Prisma 7: the `datasource` block names the provider only. The connection URL
lives in `backend/prisma.config.ts` for Migrate/Studio and is passed to the
client at runtime as a `@prisma/adapter-pg` driver adapter (`src/lib/prisma.ts`,
the single `PrismaClient` constructor in the codebase).

Enums: `Role`, `Gender`, `EntryType`, `EntryStatus`, `TeamStatus`,
`InvoiceStatus`, `EventStatus`, `DocumentType`, `CategoryType`.

Registration and billing: `User`, `MagicLink`, `PasswordReset`, `Club`, `Event`,
`Division`, `WeightClass`, `Belt`, `Athlete`, `Entry`, `Team`, `TeamMember`,
`Invoice`, `AuditLog`, `Document`, `EventCoordinator`.

Competition day: `Draw`, `DrawSlot`, `Bout`, `Mat`, `ScheduleBlock`. These carry
both the plan and the run — `Draw.matId`/`Draw.matOrder` say which floor a
category runs on and in what order, and `ScheduleBlock` holds the ceremonies and
breaks placed between them. Read `schema.prisma` itself before changing any of
them; the doc names them but the reasoning lives in the schema comments.

Key relationships:

- `Club` 1—* `Athlete`, `Club` 1—* `User`
- `Event` 1—* `Division` 1—* `WeightClass`
- `Entry` joins `Athlete` (or `Team`) to `Division` within an `Event`, typed by
  `EntryType` and tracked by `EntryStatus`
- `Team` 1—* `TeamMember` (athletes)
- `Invoice` per `Club` per `Event`
- `Document` polymorphically attaches to athlete / event / club

Event rules come from `config/event-config.yaml` (currency, fees, limits such as
`maxIndividualEventsPerAthlete`, and the division catalogue). They are snapshotted
into `Event.configJson` at creation, so **changing the YAML does not retroactively
change existing events**.

## Frontend layout — `frontend/src/`

| Path | Role |
|------|------|
| `App.tsx` | Router + providers (`AuthProvider`, `ThemeContext`, QueryClient, ErrorBoundary, Toaster). |
| `pages/` | One component per route (see route table below). |
| `pages/event-management/` | Sub-components of the entry-management screen: `AthletePool`, `AthleteRow`, `DivisionBoard`, `BulkActionBar`, `eligibility.ts`, `types.ts`. |
| `components/ui/` | shadcn-style primitives over Radix — do not hand-roll replacements. |
| `components/` | App-level shared: `AppShell` (in `layout/`), `DocumentSection`, `ConfirmDialog`, `Toast`, `UIState`, `ErrorBoundary`, `FieldError`, plus `athletes/` and `dashboard/` groups. |
| `lib/` | API clients: `api.ts` (axios instance) and one module per resource (`athletes`, `clubs`, `events`, `entries`, `belts`, `users`, `documents`), plus `prefetch.ts` and `utils.ts` (`cn`). |
| `contexts/` | `AuthContext`, `ThemeContext`. |
| `hooks/` | `useMediaQuery`. |
| `index.css` | Tailwind v4 `@theme` design tokens — see `conventions.md`. |

Routes: `/signin`, `/magic-login`, `/forgot-password`, `/reset-password`,
`/dashboard`, `/users`, `/clubs`, `/belts`, `/athletes` (+ `/new`, `/:id/edit`,
`/import`, `/extract`), `/events/manage` (event CRUD), `/events` (entry
management), `/entries/view`. Everything except the auth pages is wrapped in
`<Protected>`.

## Documents / file upload

Uploads never pass through the API body. The flow is:

1. Client asks the backend for a signed upload URL (`/api/documents/...`).
2. `lib/storage.ts` generates the storage key and a signed Supabase URL.
3. Client PUTs the file straight to Supabase Storage.
4. Client confirms, and a `Document` row is created linking the key to the
   athlete/event/club.
5. Downloads are served as short-lived signed URLs (`PRESIGNED_URL_TTL_SECONDS`).

Allowed MIME types are whitelisted in `lib/storage.ts` (`pdf`, `jpeg`, `png`,
`webp`).

## Deployment

Railway, three services: Postgres, backend (`npm run build` → `npm run start`),
frontend (`npm run build` → `npm run start`, which is `serve -s dist`). Pushing
to `main` triggers deploys. See [`../DEPLOYMENT.md`](../DEPLOYMENT.md) and
[`../PRODUCTION-CHECKLIST.md`](../PRODUCTION-CHECKLIST.md).
