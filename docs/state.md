# Current state — read first, update before you hand off

This file is the handoff between coding agents. It describes what is in flight
right now, not the permanent architecture (that's
[`architecture.md`](architecture.md)).

**Last updated:** 2026-08-01 — by Claude Code: shared agent docs created, then
both projects type-checked and built (results under "Verification" below).

## Branch

`main`. Pushing to `main` deploys to Railway, so it is a release, not a save.

Last commit: `fca040b — Full frontend redesign with shadcn/ui and karate-themed identity`.

## In flight (uncommitted)

**Entry Management "wired redesign"** — a rewrite of the entry-management screen:

- `frontend/src/pages/EventManagement.tsx` — rewritten (~686 lines changed)
- `frontend/src/pages/event-management/` — new: `AthletePool.tsx`,
  `AthleteRow.tsx`, `DivisionBoard.tsx`, `BulkActionBar.tsx`, `eligibility.ts`,
  `types.ts`
- `Entry Management — Wired Redesign README.md` (repo root) — the design note
  for this change; read it before touching these files

What it changes: instead of "pick a division → see eligible athletes → add one
at a time", the screen shows an athlete pool on the left and every division
board on the right, with drag-and-drop enrolment (`@dnd-kit`), live eligibility
ghosting, multi-select bulk enrol into all eligible kata/kumite divisions, and a
submit-all-drafts action. Eligibility is computed **client-side** from
`athlete.dob` / `athlete.gender` vs `division.minAge` / `maxAge` / `gender`; the
`/events/:id/divisions/:id/eligible-athletes` endpoint is no longer called from
this screen (it still exists). No backend changes and no new dependencies.

Status: **type-clean and builds; not yet exercised in a browser.** See
"Verification" below — `EventManagement.tsx` and every file in
`event-management/` produce zero type errors, and `npm run build` succeeds.
Nobody has driven the actual screen (drag-and-drop, bulk enrol, submit-all) yet.
Do that before committing.

Known gaps carried by this change, called out in its README:

- Team entries (`TEAM_KATA` / `TEAM_KUMITE`) can be *displayed* but not created
  from this screen — team enrolment wants its own flow.
- Weight classes are not auto-assigned on individual kumite creates.
- The athlete pool fetches all athletes for admins on "All clubs"; virtualise
  it if the dataset grows into the thousands.

## Verification (run 2026-08-01, TypeScript 6.0.3)

| Check | Result |
|-------|--------|
| `backend`: `npx tsc --noEmit` | **clean**, exit 0 |
| `backend`: `npm run build` | **succeeds**, exit 0 |
| `frontend`: `npx tsc --noEmit` | **clean**, exit 0 |
| `frontend`: `npm run build` | **succeeds**, exit 0 (Vite/esbuild does not type-check) |
| Frontend boots, `/signin` renders, console clean | **yes** (dev server on 5180) |
| Any screen exercised against a live API | **no** — see below |

**Nothing has been run against a database.** The only `DATABASE_URL` configured
in `backend/.env` points at the Railway *production* instance
(`interchange.proxy.rlwy.net`), so the backend was deliberately not started —
the changed pages contain mutations, and a stray click would write to
production. There is no local Postgres set up. So: types and build are proven,
runtime behaviour on real data is not.

## Type errors fixed (2026-08-01)

The frontend previously had 18 type errors, all in files the entry-management
redesign does not touch. All are now fixed; the checks above run clean with no
flags. What changed, and why it matters beyond the type-check:

- **`src/lib/entries.ts`** — deleted the duplicate `Division` / `WeightClass`
  interfaces and re-exported the canonical ones from `lib/events`. The entries
  API returns the full division row (`division: true` in `entry.service.ts`), so
  the narrow local copy was simply missing `eventId` and made the two types
  mutually unassignable. Nothing imported them from `lib/entries`, so this was
  contained.
- **`src/pages/Events.tsx`, `src/pages/EntriesView.tsx`** — `queryFn: listEvents`
  passed `listEvents` (signature `(activeOnly = false)`) straight to TanStack
  Query, which called it with the query *context object*. Being truthy, that
  object meant **every caller was silently fetching `activeOnly=true`**, i.e.
  DRAFT + ACTIVE only. On the event admin page that was a live bug: CLOSED and
  ARCHIVED events were invisible even though the page renders status badges for
  them. Now `Events.tsx` calls `listEvents()` (all events) and `EntriesView.tsx`
  calls `listEvents(true)` (unchanged behaviour, explicit).
- **Query keys split as a consequence.** Those two pages now return different
  result sets, so they can no longer share the key `["events"]`:
  `Events.tsx` uses `["events", "all"]`, `EntriesView.tsx` uses
  `["events", "active"]` (matching what `EventManagement.tsx` already did).
  Existing `invalidateQueries({ queryKey: ["events"] })` calls still match both
  by prefix. **`Dashboard.tsx` still uses the bare `["events"]` key** with its
  own inline `api.get("/events")` — harmless (its own cache entry, still
  invalidated by prefix), but it's the last one out of step.
- **`src/pages/AthleteForm.tsx`** — the submit payload was typed
  `Partial<Athlete> & { weightKg?: number }`, which conflicts with the API's
  `number | null`. Dropped the intersection and removed a dead
  `typeof weightKg === "string"` branch: the weight input already coerces with
  `Number(...) || undefined` on change, so no string ever reaches submit.
- **`src/vite-env.d.ts`** — added `declare module "@fontsource-variable/inter"`.
  The package ships CSS with no typings and TS 6 (TS2882) requires a declaration
  even for a side-effect import.
- **`frontend/tsconfig.json`** — removed the deprecated `baseUrl` (TS 6 reports
  it as TS5101 and **aborts the whole type-check before reading a single
  file** — which is why these 18 errors could sit unnoticed) and rewrote the
  path mapping as `"@/*": ["./src/*"]`, which TS requires once `baseUrl` is
  gone. `npx tsc --noEmit` now works with no flags.

Behavioural changes to sanity-check when someone next runs the app against real
data: the event admin list should now include CLOSED and ARCHIVED events.

## Other untracked, non-code files

`.agents/`, `.claude/` (agent config: `launch.json` dev-server entry on port
5180, local permissions), `skills-lock.json`. Local tooling, not app code.

## Open items / follow-ups

- Root `README.md` is a UTF-16 stub with no real content.
- `filestructure.txt` is a stale 3.6 MB generated dump; it should probably be
  deleted or gitignored rather than maintained.
- `frontend/src/lib/api.ts` still sends `x-role` / `x-club-id` dev headers from
  `localStorage`; the backend only honours them when `ALLOW_DEV_AUTH=true`.
  Removing this path once real auth is fully trusted would tighten things up.
- No test suite exists. `npx tsc --noEmit` + `npm run build` is the only gate.

## How to update this file

When you finish a session, rewrite the sections above so the next agent (or the
next model) starts where you stopped:

- move anything you committed out of "In flight"
- record what you actually verified, in those words — not "should work"
- add anything you discovered that isn't obvious from the code
