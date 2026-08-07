# Current state — read first, update before you hand off

This file is the handoff between coding agents. It describes what is in flight
right now, not the permanent architecture (that's
[`architecture.md`](architecture.md)).

**Last updated:** 2026-08-07 — by Claude Code: fixed the production "submit
drafts" failure (Railway `trust proxy` was never set, see "In flight" below).

Previously, same day: memoised DivisionBoard so the 48 boards stop
re-rendering on every keystroke and hover.

Previously, 2026-08-06: stopped the entries board reflowing under the pointer,
which made the remove-entry "×" unclickable.

Previously, 2026-08-05: kumite entries no longer require a weight class on
divisions that have none.

Previously, 2026-08-04: added the "Goju Kai Small No-weights" division template,
and per-event tournament coordinators.

Previously, 2026-08-01: shared agent docs, 18 type-error fixes, merge of 10
upstream PRs, local Postgres + seed repair, the athlete-pool endpoint, and the
Entry Management redesign port.

## Branch

`main`. Pushing to `main` deploys to Railway, so it is a release, not a save.

Local `main` is in sync with `origin/main` as of 2026-08-05. (This section
previously claimed several unpushed commits — the pool endpoint and the redesign
port; those have since been pushed.) Everything here is verified locally against
a database, never against production data.

## In flight (uncommitted)

**Production bug: Windhoek's 28-draft submit failed for every role
(2026-08-07).** Reported on Railway: club manager, tournament organizer *and*
the superadmin all got "Submitted 0 · 28 failed" trying to submit Windhoek's
drafts on `/hub/entries`, while Khomasdal's club manager (fewer drafts)
succeeded. All three roles failing ruled out a permissions bug — the admin
path in `EntryService.updateStatus` skips every club/registration check.

Root cause: `backend/src/server.ts` never called `app.set("trust proxy", ...)`.
Railway terminates the connection and proxies to this process, so without that
setting Express's `req.ip` is the proxy's own address for *every* request the
app receives — not the real client. The two `express-rate-limit` limiters key
on `req.ip` by default, so the 300-req/min `apiLimiter` was one shared budget
for the entire app's traffic (every club, every role), not 300/min per client.
Confirmed by reading the installed `express-rate-limit` v8 source directly
(`node_modules/express-rate-limit/dist/index.cjs`): it also silently
`console.error`s an `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` warning on *every*
request in this state, without failing the request — worth searching Railway's
existing logs for that string to confirm this was already happening in prod.

Two compounding factors made Windhoek trip it and Khomasdal not: (1) the
`/hub/entries` "submit all drafts" button fired one `PUT /:id/status` per
draft via `Promise.allSettled` — 28 parallel requests for Windhoek instead of
one — rather than using the `POST /entries/bulk-submit` route that already
existed (and that the older `EntriesView.tsx` screen already used); (2) the
budget being shared app-wide means unrelated concurrent traffic (75 athletes
had just been entered) could exhaust it too.

Four changes:

1. `backend/src/server.ts` — `app.set("trust proxy", 1)` in production, so
   `req.ip` reflects the real client via Railway's `X-Forwarded-For`.
2. `backend/src/server.ts` — `apiLimiter` now has an explicit `handler` that
   `console.warn`s the path/IP on a 429. Previously a rate-limit rejection left
   *no* log line at all.
3. `backend/src/routes/entries.ts` — the five handlers that catch
   `{status, message}` errors and respond directly (never reaching
   `errorHandler`'s `console.error`) now log via `logExpectedError` first.
   Every expected 400/403/409 on this router was previously invisible in
   Railway's logs, which is why there was nothing to look at after the
   incident.
4. `frontend/src/pages/EventManagement.tsx` — `handleSubmitAllDrafts` now
   calls `EntryService.bulkSubmit(eventId, ids)` (one `updateMany`
   transaction) instead of one `PUT /:id/status` per draft.

### Verification (run 2026-08-07, against local Postgres)

`backend` / `frontend`: `npx tsc --noEmit` both clean. Exercised the real
`POST /entries/bulk-submit` route over HTTP against the seeded event's 11
actual DRAFT entries (not synthetic ids) as SUPERADMIN: `{"updatedCount":11}`,
matching. Reverted those 11 rows back to `DRAFT` afterward (direct `UPDATE`,
since `PUT /:id/status` needs `id` in the body too — tripped on that revert
before writing straight SQL) so the seed is unchanged.

**Not verified against production or under real concurrent load** — the
`trust proxy` fix only changes behavior when `NODE_ENV=production`, which
local dev never sets, so the fix's actual effect (correct `req.ip`, no more
shared rate-limit bucket) cannot be observed locally. What *is* verified
locally is that neither change broke the endpoints. If the bug recurs after
this deploys, the new logging (`[rate-limit] 429 ...` or `[entries:action]
...` in Railway's logs) should say why in one line.

**DivisionBoard is memoised (2026-08-07).** Follow-up to the reflow fix below,
which left every one of the 48 boards re-rendering on each keystroke, filter
toggle and hover.

Two things had to change before `React.memo` could do anything:

- `eligibility` was an object literal built per board per render. It is now
  three primitives (`eligibilityKind` / `eligibleCount` / `eligibleTotal`),
  resolved once per focus change into `eligibilityByDivision`. Primitives mean
  a board re-renders only when *its own* verdict changes.
- `hoveredAthleteId` was handed raw to all 48 boards, so every board re-rendered
  on every hover even though at most one could show a highlight. It is now
  `highlightAthleteId`, null unless that athlete has an entry on that board.

Plus the supporting stability work in the parent: `entriesByDivision` (a
memoised Map, so no fresh `entries.filter(...)` per board), `handleRemoveEntry`
wrapped in `useCallback`, and module-level `NO_ENTRIES` / `NEUTRAL_ELIGIBILITY`
constants so empty boards share one reference.

**The part worth knowing about, because it is not obvious:** `React.memo` alone
achieved *nothing* here. `useDroppable` subscribes each board to dnd-kit's
`DndContext`, and a context update re-renders consumers regardless of memo.
Measured directly — six keystrokes in the pool search, with the memo already in
place and the comparator confirming zero prop changes, still produced 48 board
renders; deleting the `useDroppable` call dropped that to 0.

So the board is split. `DivisionBoardImpl` is a thin droppable shell (one div,
one `cn()`) that takes the unavoidable context re-render, and everything
expensive lives in the memoised `DivisionBoardBody`, which the context update
cannot reach. `isOver` crosses that boundary as a plain boolean prop.

### Verification (run 2026-08-07)

Render counts measured with temporary counters in both halves, **StrictMode
disabled for the measurement** so the numbers are real renders rather than
React's dev-mode double-invoke. Instrumentation and the StrictMode change are
both reverted; `main.tsx` shows no diff.

| Interaction | Shell renders | Body renders | Before |
|---|---|---|---|
| 6 keystrokes in pool search | 48 | **0** | 48 full board renders |
| Hover an athlete (neutral → ghosted) | 48 | 48 | 48 — unavoidable, every board changes |
| Hover a second athlete, same age + gender | 48 | **0** | 48 full board renders |

Behaviour re-checked after the restructure: 48 boards render, uniform 198px (the
reflow fix still holds), hovering lights 2 boards green and ghosts 46, the chip
highlight still follows pool hover, enrolling via the eligible-divisions chip
returns `201`, the remove "×" returns `204`, and a pointer-driven dnd-kit drag
put the `isOver` ring on exactly one board — which is the specific thing the
split could have broken. `tsc --noEmit` clean, `npm run build` succeeds,
`scripts/test-draws.ts` passes, no error boundary after a hard reload.

Not verified: a drag that completes onto a chosen board. Synthetic pointer
drags are unreliable in this harness (they were in the previous session too);
the `isOver` result above covers the droppable registration that the split put
at risk, and the drop handler itself is unchanged.

## Recently shipped

**The entries board reflowed under the pointer (fixed 2026-08-06).** On
`/hub/entries` the remove-entry "×" was effectively unclickable: pointing at a
chip made the whole grid jump.

Measured cause, not a guess. The board footer holds the ghosting caption
("none eligible" / "all eligible"), and that caption only exists while
something has hover focus. Idle, the footer row collapsed to **0px**; on hover
it became **15px**, taking each board from 182.5px to 197.5px. All 48 boards do
this at once, so in the 2-column grid the shift accumulates ~15px per row down
the page. A chip three rows down moved **30px** the instant you pointed at it —
out from under the cursor, which killed the hover, which collapsed the footers,
which moved it back. A loop, and the "×" was `opacity-0 group-hover:opacity-100`
so it blinked in and out of visibility through all of it.

Three changes, all in `DivisionBoard.tsx`:

1. **The footer always reserves one line.** The caption falls back to a
   non-breaking space rather than rendering nothing. No magic pixel value —
   the line box is always there. This alone removes the reflow.
2. **An entered chip no longer sets the hovered athlete.** Pointing at an entry
   that is *already placed* re-ghosted all 48 boards for no benefit, and the
   churn is what made the "×" hard to reach. Highlighting still flows the other
   way: hovering a pool row lights up that athlete's chips (`isHovered` stays).
   `setHoveredAthleteId` is no longer a `DivisionBoard` prop.
3. **The "×" is always visible** at `opacity-50`, going full on hover/focus,
   plus a `focus-visible` ring. A control you can only see while hovering is a
   control you have to keep hovering to aim at.

### Verification (run 2026-08-06, in-browser against local Postgres)

| Check | Before | After |
|---|---|---|
| Board height, idle vs hovered | 182.5 → 197.5 | 197.5 → 197.5 |
| Footer row height, idle | 0px | 15px (reserved) |
| All 48 board heights during hover | — | uniform 198 |
| Entry chip Y position when pointed at | 450 → 480 | 450 → 450 |
| "×" opacity when not hovering | 0 | 0.5 |
| Clicking "×" | — | `DELETE /api/entries/… → 204` |
| Pool-row hover still highlights the chip | — | ✅ (`border-primary`) |
| Pool-row hover still lights eligible boards | — | ✅ 2 boards `border-belt-green` |

`frontend`: `tsc --noEmit` clean, `npm run build` succeeds, 48 boards render
with no error boundary.

The memoisation this section originally listed as "not done" is now done — see
"In flight" above.

**Kumite entries on no-weights divisions (fixed 2026-08-05).** Enrolling an
athlete into any kumite division from the event hub failed — the popup reported
"Created 0 entries · 1 failed" and drag-drop showed
"weightClassId required for Kumite". `EntryService.create` demanded a weight
class for *every* individual kumite entry, but the frontend has never had a
weight-class picker and sends none, and the `GK_SMALL_NO_WEIGHTS` template
creates 48 divisions that have no weight classes to pick from. Both symptoms
were the one 400.

The requirement is now conditional on the division actually having weight
classes. `findApplicableWeightClasses` in `utils/eligibility.ts` is the rule:
a class applies if its `divisionId` is that division, or is null and the gender
matches (event-wide classes, which the manual "add weight class" form can
create — every template sets `divisionId`). None applicable → the entry is
created with `weightClassId: null` and draws as one pool, which
`draw.service.ts` already handles. Some applicable and none supplied → still a
400, but one that says how many to choose from.

Also filled in a check that was stubbed: `validateWeightClass` took a
`divisionId` and never used it, so a supplied class only had to match the event
and gender — a U8 entry could carry the senior -75kg class. It now rejects a
class belonging to a different division.

**Still open, and now the only thing blocking weighted kumite from the hub:**
nothing in the UI lets you pick a weight class, so weighted divisions fail with
the new (clearer) 400. Auto-assigning from `Athlete.weightKg` is the obvious
next move — it needs a decision on what to do when the athlete has no weight
recorded or sits on a boundary, which is why it wasn't done here.

Files: `backend/src/utils/eligibility.ts`, `backend/src/services/entry.service.ts`.

### Verification (run 2026-08-05)

| Check | Result |
|---|---|
| `backend` / `frontend`: `npx tsc --noEmit` | ✅ both clean, exit 0 |
| Kumite entry on a no-weights division, no `weightClassId` | ✅ created, stored `weightClassId: null` |
| Kata on the same division | ✅ unaffected |
| Weighted division, no `weightClassId` | ✅ still 400, new message |
| Weighted division, valid class | ✅ created |
| Class belonging to another division | ✅ 400 "different division" |
| `scripts/test-draws.ts` | ✅ passes |
| `scripts/test-event-scope.ts` | ✅ 25/25 (needs the backend started with `ALLOW_DEV_AUTH=true` — without it all 25 fail on dev-auth, not on the guards) |

In-browser on `/hub/entries` against a `GK_SMALL_NO_WEIGHTS` event, as
SUPERADMIN: clicking a kumite chip in the athlete's eligible-divisions popup
returned `201` with `weightClassId: null`; bulk-enrolling 3 athletes into Kumite
toasted "Created 3 entries" (three `201`s) where it previously said
"Created 0 entries · 1 failed", and the stat tiles moved to 3 athletes /
3 entries. Console clean apart from the pre-login `/auth/me` 401s.

**Not verified: a real pointer drag-and-drop.** dnd-kit's keyboard sensor did
fire a genuine `handleDragEnd` in testing (the client-side "not eligible" toast
proved the drop wiring), but a synthetic drag onto a specific board could not be
aimed reliably. `handleDragEnd` calls the same `handleAddEntry` the chip click
does, and that is covered above.

**New division template: `GK_SMALL_NO_WEIGHTS` ("Goju Kai Small No-weights").**
Single-year age groups 5→16, boys & girls, kata & kumite, **no weight classes** —
48 divisions, 0 weight classes. Three files:

- `backend/src/data/wkf-template.ts` — the definitions, plus `TEMPLATES` and
  `TEMPLATE_META` entries. Unlike the other four templates the divisions are
  *generated* from an age list rather than written out as literals; 48 rows of
  purely mechanical variation are more reliable produced by a loop.
- `backend/src/utils/validators.ts` — added to the `ApplyTemplate` Zod enum.
  **Miss this and the route 400s** on the new id even though it lists fine.
- `frontend/src/lib/events.ts` — added to the `TemplateId` union.

Worth knowing for whoever adds the next template: templates are **compile-time
constants, not database rows**. Nothing appears in production until this code is
deployed; `POST /events/:id/apply-template` is what turns a template into
`Division` rows on one event. The three files above must move together.

**Tournament coordinators — per-event delegation.** An admin can hand one
`CLUB_MANAGER`/`COACH` management of a single event, so the host dojo runs the
day. Migration `20260804120000_add_event_coordinator`.

Why it is not a sixth `Role`: the Swakop instructor already *is* a
`CLUB_MANAGER` with a `clubId`. Changing their role would strip access to their
own dojo's athletes. So the grant **stacks on** the existing role and is scoped
to one event.

The guard is the substance, not the table. `requireRoles` is global and never
sees which event a request concerns, so `utils/event-scope.ts` adds
`requireEventManager(source)`, where `source` names where the event id lives:
a param, the body, the query, or a lookup through the row (`division`,
`weightClass`, `draw`, `mat`, `entry`, `bout` — `bout` is the only one that has
to hop, via its `Draw`). Admins short-circuit before any lookup, so the existing
admin path is byte-for-byte unchanged and costs no extra query.

**The trap, if you extend this:** the `source` must name whatever the *handler*
reads. `POST /events/:id/divisions` and `POST /events/:id/weights` ignore
`req.params.id` entirely and act on `req.body.eventId`. Guarding the path param
there would let a coordinator put their own event in the URL and someone else's
in the body. Both are guarded on the body; `scripts/test-event-scope.ts` asserts
that exact attack and that nothing is written.

Coordinator can: entries review/approve/return, divisions & weight classes,
apply templates, event config/status/public-token, draws & seeds, mats,
check-in, bout scoring. Coordinator cannot: delete the event, create events,
appoint or revoke coordinators (those stay `requireRoles("SUPERADMIN","ADMIN")`
by design — a coordinator must not widen their own circle), club billing, user
or club management. Approving their **own** club's entries is deliberately
allowed — decided by the product owner; every action is audit-logged.

Grants are resolved **live** in `/auth/me`, never carried in the JWT: a token
minted before a revocation would otherwise keep asserting it until expiry.
Client-side, `useAuth().canManageEvent(eventId)` mirrors the server guard and
only decides what to *show*.

Files: `prisma/schema.prisma` + migration, `utils/event-scope.ts` (new),
`routes/{events,review,draws,run,entries,auth}.ts`, `services/event.service.ts`,
`utils/validators.ts`, `scripts/test-event-scope.ts` (new), and on the frontend
`contexts/AuthContext.tsx`, `lib/events.ts`,
`components/events/EventCoordinators.tsx` (new),
`components/layout/EventHubLayout.tsx`, `pages/hub/Setup.tsx`.

The Entry Management redesign that used to sit here is committed and live — see
"Entry Management redesign" below.

### Verification (run 2026-08-04)

| Check | Result |
|---|---|
| `backend` / `frontend`: `npx tsc --noEmit` | ✅ both clean, exit 0 |
| Template shape | ✅ 48 divisions, 0 weight classes, ages 5-16 all single-year, no duplicate `key:gender` |
| `GET /api/events/templates` over HTTP | ✅ returns the new entry, `divisionCount: 48`, `weightClassCount: 0` |
| `applyTemplate` against local Postgres | ✅ 48 `Division` rows, 0 `WeightClass` rows written |
| Re-applying to the same event | ✅ dedupe skips all 48, no duplicates |

Not verified: the "Apply division template" modal rendering the new row. The
modal maps straight over the `/events/templates` response, which is confirmed
correct — but nobody has looked at that specific rendered row.

### Coordinator verification (run 2026-08-04)

`scripts/test-event-scope.ts` — 25 checks, all passing, over real HTTP against
the local database:

| Group | Covered |
|---|---|
| No grant held | review, apply-template, config, create-mat all 403 |
| Granted on event A | the same four succeed (200/201) |
| **Cross-event** | grant on A gives 403 on every equivalent B route |
| **body-vs-param** | URL=A + body=B → 403, and 0 rows written to B |
| Excluded powers | delete event, create event, appoint/revoke coordinator, candidate picker, list users all 403; another club's billing not 200 |
| Admin unchanged | admin still reaches every event and can delete |
| Revocation | access gone on the next request, no stale claim |

Also: `scripts/test-draws.ts` still passes (draws/run route guards were
rewritten, so this was a real regression risk). Both projects `tsc --noEmit`
clean and `npm run build` succeeds.

In-browser, as ADMIN on `/hub/setup`: the Coordinators card renders its empty
state, the picker lists only `CLUB_MANAGER`/`COACH` users (admins correctly
absent), appointing "Swakop Manager" showed the confirmation toast and the
roster row, the row landed in `EventCoordinator` with `grantedById` set, revoke
prompted and removed it, and `GRANT`/`REVOKE` both hit the audit log. Console
clean throughout.

**Not verified in-browser: the coordinator's own view.** Confirming that a
CLUB_MANAGER coordinator sees the Setup/Entries/Review tabs needs a real cookie
session for that user — `/auth/me` is cookie-only by design and ignores the
`x-role` dev header, and the dev-fallback path in `AuthContext` never populates
`coordinatorEventIds`. The server-side half of that is fully covered by the
suite above; the tab-visibility half is type-checked and reasoned, not seen.
Worth a look on staging with a real coordinator login before you rely on it.

Still carried as known gaps of that screen (from its README at the repo root):

- Team entries (`TEAM_KATA` / `TEAM_KUMITE`) are *displayed* but not creatable
  here — team enrolment wants its own flow.
- Weight classes are not auto-assigned on individual kumite creates.
- The athlete pool renders every athlete for admins on "All clubs"; virtualise
  the list if the dataset grows into the thousands.

## Verification (run 2026-08-01, TypeScript 6.0.3)

| Check | Result |
|-------|--------|
| `backend`: `npx tsc --noEmit` | **clean**, exit 0 |
| `backend`: `npm run build` | **succeeds**, exit 0 |
| `frontend`: `npx tsc --noEmit` | **clean**, exit 0 |
| `frontend`: `npm run build` | **succeeds**, exit 0 (Vite/esbuild does not type-check) |
| Frontend boots, `/signin` renders, console clean | **yes** (dev server on 5180) |
| Any screen exercised against a live API | **no** — see below |

**Superseded 2026-08-01 — a local database now exists**, see "Local development
database" below. At the time of the type-fix work the only `DATABASE_URL` was
the Railway production instance, so nothing was run against a database; the app
has since been verified end to end locally.

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

## Entry Management redesign — ported and live (2026-08-01)

The redesign (athlete pool + all division boards at once + bulk enrol +
live eligibility ghosting) has **replaced** the old one-division-at-a-time
screen at `/hub/entries`. All three steps are done:

1. ✅ **Event-wide athlete pool endpoint** — `GET /api/events/:id/athlete-pool`.
   The redesign originally fetched `listAllAthletes()` / `listAthletes()` and
   computed eligibility client-side, which was wrong twice over: `/athletes/all`
   is SUPERADMIN-only so the ADMIN path 403'd, and those endpoints return full
   athlete rows including `idNumber`, `medicalNotes`, and guardian contacts —
   re-opening the exposure that commit `0276ffb` closed on the eligibility
   endpoint. The new endpoint returns the same narrow projection as
   `getEligibleAthletes` (no PII), forces non-admin roles to their own club, and
   answers the whole event in one request instead of one per division (32 in the
   seeded event). Client: `getAthletePool()` / `PoolAthlete` in `lib/events.ts`.
2. ✅ **Rewired to the hub** — dropped its own `AppShell` and event picker
   (`EventHubLayout` owns both), reads the event from `useSelectedEvent()`, and
   fetches via `getAthletePool`. Two queries disappeared: `listEvents` is the
   hub's, and `getEvent` was unnecessary because `/events` already returns
   `configJson`. `EnrichedAthlete` is now just `PoolAthlete` — the server
   resolves age, so the client-side enrichment pass is gone, and `isEligible`
   takes a structural `{dob, gender}` so nothing in this screen depends on the
   PII-carrying `Athlete` type.
3. ✅ **Guards ported** — `registrationState`/`addBlocked` now gates all four
   mutation paths (single add, drag-drop, bulk add, submit-all-drafts), shows
   the closed-registration banner, and disables the submit button, the bulk
   action bar and the per-athlete division toggles. `entry.statusReason` renders
   on RETURNED entries in `DivisionBoard`.

**A note for whoever touches this next:** the guard belongs on *every* create
path, not just the visible button. The bulk bar creates many entries per click,
and drag-drop bypasses the row controls entirely — both are gated at the handler
as well as in the UI.

### Verification (against the local database, in the browser)

| Check | Result |
|---|---|
| Pool response contains no PII field | ✅ id, clubId, firstName, lastName, dob, gender, nationality, weightKg, age, club, belt, isEntered |
| CLUB_MANAGER passing another club's `?clubId=` | ✅ forced to own club, param ignored |
| ADMIN filtering by `?clubId=` | ✅ works (intended admin capability) |
| Unauthenticated / unknown event | ✅ 401 / 404 |
| Requests to render the screen | ✅ 1 pool call, not 32 per-division calls; no `/athletes/all` |
| Screen renders in hub with no duplicate chrome | ✅ |
| Eligibility ghosting + bulk counts | ✅ selecting an already-entered 14yo gave `KATA +0 · KUMITE +0` |
| CLUB_MANAGER on a closed event | ✅ banner shown, submit disabled, division toggles `disabled` with "Registration is closed" |
| ADMIN on the same closed event | ✅ no banner, controls enabled (admins bypass) |
| Club scoping visible in UI | ✅ club manager sees 2 athletes, admin sees 28 |
| Creating an entry through the new path | ✅ 20→21 entries; stats, pool count and board all updated |
| Draw-engine suite after the service change | ✅ still passes |

Not exercised: actual pointer drag-and-drop (the handler is shared with the
click path, which is covered) and team entries, which this screen still does not
create — see the redesign README at the repo root.

## Local development database (set up 2026-08-01)

Postgres 16.13 via Homebrew, already running on 5432. Role `gojukainam`,
database `karate`. `backend/.env` `DATABASE_URL` now points there; the Railway
production URL is preserved on a commented `# PROD_DATABASE_URL=` line in the
same file. Other databases on that server (`cctv_alerts`, `ryansrecipes`) belong
to unrelated projects.

Verified working end to end: migrations applied (`migrate deploy`, 24
migrations), `migrate diff` reports no drift between schema and migration
history, seed populates, backend serves on 4000, frontend on 5173, login
succeeds, and the entries hub renders real seeded data. The draw-engine suite
(`ALLOW_DEV_AUTH=true npx tsx scripts/test-draws.ts`) — the same one CI runs and
the only real tests in the repo — **passes locally**, which was impossible
before.

Local login: `dev@localhost.test` / `devpassword123` (SUPERADMIN, local only).

### Two seed bugs fixed to get here

`npm run prisma:seed` had been broken for a long time — CI never runs the seed,
so nothing caught it:

1. **Wrong config path.** It read `config/event-config.yaml` relative to the
   working directory, but npm scripts run with cwd `backend/` while the config
   lives at the repo root, so the documented command always threw ENOENT. Now
   resolved relative to the script file via `import.meta.url`.
2. **Stale against the schema.** It set `Athlete.beltRank` and
   `emergencyName`/`emergencyPhone` (all removed), omitted the now-required
   `Division.category`, and referenced `Gender.Open` which no longer exists. It
   also never seeded any `Belt` rows even though `Athlete.beltId` is a required
   FK — and the docs claimed it seeded belts.

The rewritten seed creates 8 belts, 1 event, 32 divisions (age band × gender ×
category), 6 clubs, 10 athletes spread across clubs and age bands, and 20
entries. It guards against double-seeding rather than duplicating data, and
leaves the SUPERADMIN to `npm run create-superuser` (which needs a password
hash).

### Port alignment

`frontend/.env.development.local` pointed `VITE_API_BASE` at 4000 → **4001**
mismatch with `backend/.env` (`PORT=4000`) and the tracked `launch.json`. Set to
4000 to match both. If another project needs 4000 (ryansrecipes has used it),
change the backend `PORT` and this file together. Previous value backed up in
the session scratchpad.

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
