# Current state — read first, update before you hand off

This file is the handoff between coding agents. It describes what is in flight
right now, not the permanent architecture (that's
[`architecture.md`](architecture.md)).

**Last updated:** 2026-08-07 — by Claude Code: in-browser verification of the
kumite duration estimator found and fixed a real undercounting bug in the
"drawn" bout count — see "In flight" below, this supersedes the estimator
entry beneath it.

Previously, same day: added a Withdraw action so a coordinator can pull an
already-approved entry out of a bracket.

Previously, same day: a club-manager coordinator couldn't see Approve or
Draws controls — two frontend pages checked `role` only and never the
coordinator grant.

Previously, same day: fixed the Railway build failing `tsc` with
`TS2591: Cannot find name 'crypto'/'process'`.

Previously, same day: fixed the production "submit drafts" failure (Railway
`trust proxy` was never set).

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

**Kumite duration estimator, v1 (2026-08-07).** New "Estimator" tab in the
event hub (`/hub/estimator`, admin or coordinator only — same `roles: ADMIN,
coordinator: true` gate as Setup). Gives one tuneable total-time number for a
kumite day: user adjusts mats, minutes/bout, buffer%, changeover, lunch,
ceremonies; bout counts are auto-derived from the event's real entries and
draws. Not a timetable/running order — that's the natural v2 once this shape
has been used for real. Kata is out of scope for v1 entirely.

**Split into two pure functions on purpose** (`frontend/src/lib/estimator.ts`),
both unit-tested (`frontend/scripts/test-estimator.ts`, `npx tsx
scripts/test-estimator.ts` — no test framework on the frontend, this mirrors
the backend's `scripts/test-*.ts` convention exactly, since none existed
here either):

- `deriveKumiteBoutBreakdown(divisions, categories)` — raw division/category
  data in, a bout count per division out. Pure, no network calls, so it can be
  tested with plain fixture objects instead of faking an event.
- `estimateKumiteDuration(breakdown, inputs)` — the actual time math, named
  explicitly in the request. Also pure, also fixture-tested.

The page component (`frontend/src/pages/hub/Estimator.tsx`) is just data
fetching (via the *existing* `getDivisions`/`listDrawCategories`/`getDraw`
calls — no new backend endpoint) plus the form; it does none of the
calculation itself.

**The bout-count decision that mattered most: multi-weight-class divisions
and repechage.** The brief's formula (`entries - 1` when no draw exists yet)
is correct per-*category* (division × weight class), not per-*division* — a
division with two weight classes runs as two independent brackets, so bouts
must be summed per (division, weightClass) pair or a multi-weight-class
division under- or over-counts. `deriveKumiteBoutBreakdown` does this
grouping (matching exactly how `DrawService.list` already groups things
server-side) and only aggregates up to the division level for display.

Second, more consequential finding from actually verifying against
`DrawService` as asked: **`entries - 1` undercounts once a draw exists**,
because this app's `computeDrawState` (`backend/src/services/draw.service.ts`)
generates a WKF double-repechage ladder for two bronze medals — real,
fightable bouts among people already eliminated from the main bracket, not
captured by the "every real bout eliminates one entrant" argument that makes
`entries - 1` exact for the main bracket alone. Concretely: an 8-entry
division has 7 main-bracket bouts but 9 total real bouts once its two
repechage bronze-bouts are counted. There's no clean closed-form for the
no-draw case without bye-aware bracket simulation (repechage bout count
depends on *where* byes land, not just entry count), so v1 does the
honest, low-risk thing instead of guessing: **use the real bout count
(main + repechage, byes excluded — `bouts.filter(b => b.aka && b.ao).length`)
for any category that already has a draw**, via a fan-out `getDraw` fetch
over exactly the kumite categories with an existing draw (bounded by how many
draws actually exist, often zero early in planning — no bulk endpoint
needed). Categories without a draw still use `entries - 1`, now clearly
labeled "estimated" (vs. "drawn"/"mixed") in the UI with a caveat that it's a
floor, not a ceiling. This is disclosed, not silently absorbed — flagged
here and directly in the breakdown table's caption.

**One input added beyond the brief, off by default:** athlete check-in /
warm-up buffer before the first bout. Real tournaments budget for it and the
brief's list didn't include it — added as a toggle defaulting to *off* so it
never silently inflates anyone's estimate; per the "flag it clearly" ask,
it's labeled in the UI as an addition, not presented as if it were always
part of the spec.

**Other v1 decisions:**

- "Divisions per mat" (for the changeover addition) counts *divisions*, not
  weight-class categories, matching the brief's literal wording — only
  divisions that actually produce a bout (excludes 0/1-entry divisions,
  which have nothing to run).
- The segmented bar's "bouts" and "buffer" slices are an exact integer
  partition of `perMatBoutMinutes` (not two independently-rounded numbers),
  so segments always sum to exactly `totalMinutes` — asserted directly in the
  unit tests across several mat/buffer combinations, not just eyeballed.
- Inputs are `useState`, not persisted — exactly as scoped. Reset-to-defaults
  button included since there's nothing else to fall back on mid-session.
- Answered the "no backend endpoint" constraint by reusing three already-
  fetched query shapes rather than inventing a bundled summary route:
  `["divisions", eventId]`, `["draw-categories", eventId]` (cache-shared with
  `Draws.tsx`/`EntriesView.tsx`), and a small local
  `["estimator-draw-bouts", eventId, drawIds]` query for the real-bout-count
  fan-out.

Files: `frontend/src/lib/estimator.ts` (new),
`frontend/scripts/test-estimator.ts` (new),
`frontend/src/pages/hub/Estimator.tsx` (new), `frontend/src/App.tsx`,
`frontend/src/components/layout/EventHubLayout.tsx`.

### Verification (run 2026-08-07)

`backend` / `frontend`: `npx tsc --noEmit` both clean (the test script itself
also checked in isolation with the same compiler flags, since `scripts/` sits
outside both projects' `tsconfig.json` `include` — same as backend's
`scripts/test-*.ts`). `npx tsx scripts/test-estimator.ts` — 34 checks, all
passing: the worked example from the brief (10 bouts / 4min / 10% buffer / 2
mats / 3 divisions → 92min, `1h 32min`), segment-sum-equals-total across six
mat/buffer/toggle combinations, buffer=0% produces no buffer segment,
mats ≤ 0 clamps to 1 rather than dividing by zero, ceiling actually rounds up,
0-bout divisions excluded from the changeover count, `formatDuration` edge
cases, and the `deriveKumiteBoutBreakdown` cases above (KATA exclusion,
multi-weight-class summing, drawn-vs-estimated-vs-mixed sourcing, an
untouched division still appearing at 0 bouts).

### In-browser verification (run 2026-08-07) — found a real bug

Isolated backend (port 4099, `ALLOW_DEV_AUTH=true`) + isolated frontend (port
5174 — 5173 was the other session's; port had to be one of `server.ts`'s
hardcoded dev CORS origins, `5190` 500'd on preflight) against local Postgres,
so as not to disturb another session's dev servers.

**The "drawn" bout count was wrong — badly undercounting the normal case.**
Loaded a real event with 7 APPROVED entries and a freshly-generated,
*unplayed* draw for one kumite division: the page showed **3 bouts**, not the
correct **6** (7 entries − 1). Root cause: `drawBoutCounts` counted
`bouts.filter(b => b.aka && b.ao).length` from `getDraw()` — but
`computeDrawState` (`backend/src/services/draw.service.ts`) only populates a
later round's `aka`/`ao` once the earlier round it depends on has an actual
*stored result*. For a fresh, not-yet-run bracket only round 1 (plus any
bye-cascades) is populated — this app's own dogfooded confirmation that a
draw is normally generated and sits unplayed for a while before the tournament
runs, which is exactly when this tool is meant to be used, so this was not an
edge case, it was the common one. Repechage rows don't get computed *at all*
until a finalist is determined, so the "drawn categories already include
repechage" claim in the original write-up (below) was flatly wrong — checked
directly: an unplayed draw's `bouts` array had zero repechage entries.

Fixed by using `slots.length - 1` instead (`DrawDetail.slots` holds only real,
bye-excluded entries, unaffected by how much has been played) — mathematically
identical to `entries - 1`, correct regardless of play progress. This also
honestly repositions what "pull from the actual bracket" is *for*: not
repechage inclusion (not reliably knowable pre-tournament, left out
uniformly for both drawn and undrawn categories now — the docs above and the
UI copy both said otherwise; corrected), but **sync drift** — an entry
withdrawn or added after the draw was made means the draw's real entry count
and today's live `entryCount` can genuinely differ, and the drawn bracket is
the one that will actually run. Updated: `lib/estimator.ts`'s doc comments,
`Estimator.tsx`'s query + the breakdown badge tooltip + the caveat paragraph,
and `scripts/test-estimator.ts`'s drawn/mixed fixtures (now `drawBoutCount: 6`
motivated by drift, not a repechage-inclusive `9` that never reflected reality).

Also verified live and correct: the worked-example math end-to-end against
real data (8 total bouts → `1h 23min`, matching the formula shown), every
input reacting correctly (mats 2→1 recomputed `1h 23min`→`1h 16min`; unchecking
lunch removed its segment and dropped the bar's grey slice), the segment bar's
proportions and legend, "Reset to defaults", the Estimator/Setup tabs
correctly *absent* for a plain `CLUB_MANAGER` with no coordinator grant, and
zero console errors throughout.

**Still not verified: real coordinator tab visibility.** Blocked by a
pre-existing, already-documented harness limitation, not anything wrong with
this feature — `/auth/me` is cookie-only by design and the local dev-auth
header shortcut never populates `coordinatorEventIds` (see "Tournament
coordinators" below), so a granted `EventCoordinator` row has no way to show
up in a locally-driven browser session. The tab's gating is `roles: ADMIN,
coordinator: true`, byte-for-byte the same object shape as the already-shipped
Setup tab (verified visible for admins, hidden for plain club managers here);
that pattern was separately confirmed correct against a real coordinator
session in production by the "Fix coordinator not seeing Approve/Draws" work
earlier this same day. Confirming this specific tab needs a real cookie-based
coordinator login (staging, or a minted session token), not this harness.

**Withdraw an approved entry (2026-08-07).** Follows directly from a codebase
audit of "how do you fix an athlete entered in the wrong division after
approval" (wrong DOB, withdrawal, illness — same underlying gap either way):
`EntryService.delete` only ever allowed DRAFT, there was no APPROVED->DRAFT
transition, and no division-edit endpoint exists at all. So an approved entry
could never be removed through the app — the frontend's remove control even
pretended it could (a confirm dialog for non-DRAFT entries claiming "removing
it will also clear that state"), when the backend has always hard-rejected
it with a 409.

The fix is additive, not a deletion path: `POST /review/bulk-status`
(`backend/src/routes/review.ts`) already existed and was already correctly
permissioned (`requireEventManager` — admin or this event's coordinator), and
already allowed any current status -> APPROVED/RETURNED with no "must be
SUBMITTED" restriction (unlike `/review/bulk`, which is SUBMITTED-only and
backs the normal Approve/Return buttons). It just had zero UI callers, and one
real bug: `statusReason` was accepted into the audit log but never written to
`Entry.statusReason`, so a reason given through this route would never
actually reach the club. Fixed that, and normalized its response to
`{ updatedCount }` to match every sibling bulk route (`/review/bulk`,
`/entries/bulk-submit`) — it previously returned Prisma's raw `{ count }`,
harmless while nothing consumed it, not once `EntryService.withdraw`
(`frontend/src/lib/entries.ts`) became the first real caller.

**UI, `EntriesView.tsx` (`/hub/review`):** a "Withdraw" button next to
Approve/Return, shown only on `APPROVED` entries for `canReviewEvent` (admin
or coordinator of the selected event) — SUBMITTED still uses the existing
Return flow, DRAFT still uses delete, RETURNED already means withdrawn so
gets nothing further. Opens a dialog with an *optional* reason (deliberately
not required like Return's — "please fix and resubmit" doesn't fit "the
athlete is sick," a reason here is context, not an instruction). Does not
delete the entry; flips it to RETURNED, which is exactly what already meant
"out of the draw-eligible pool" (`ELIGIBLE_STATUSES = ["APPROVED"]` in
`draw.service.ts`) and keeps the audit trail.

**The regenerate handoff, and why it's a link rather than inlined:** the
dialog fetches `listDrawCategories(eventId)` (the same query `Draws.tsx`
already uses, so its cache is warm if the coordinator follows the link) to
tell whether a draw already exists for the entry's division/weight-class. If
one does, it warns that withdrawing alone does not touch the bracket and
links straight to `/hub/draws`. Chose *link over inline regenerate*
deliberately: regenerate has its own state machine — locked-check,
force-confirm when bouts already have results, minimum-2-remaining-entries —
that already lives correctly in `Draws.tsx`/`DrawService`, and re-implementing
or importing a chunk of it into the review page would couple two screens that
don't otherwise share logic, for a save of one navigation click. The
post-withdraw success toast repeats the reminder either way, so the coordinator
isn't left to guess after the dialog closes.

**Also fixed, not just wired around:** `EventManagement.tsx`'s `handleRemoveEntry`
had the misleading non-DRAFT confirm dialog described above. Removed the
control at the source instead — `DivisionBoard.tsx`'s remove "×" now only
renders for `DRAFT` entries — so there's nothing left to click that the
backend was always going to refuse. Withdrawing a submitted/approved entry is
the Review page's job now, which is also the more correct home for it (that's
where Approve/Return/seed already live, all under the same
`canReviewEvent` gate).

Files: `backend/src/routes/review.ts`, `frontend/src/lib/entries.ts`,
`frontend/src/pages/EntriesView.tsx`, `frontend/src/pages/EventManagement.tsx`,
`frontend/src/pages/event-management/DivisionBoard.tsx`,
`backend/scripts/test-event-scope.ts`.

### Verification (run 2026-08-07)

`backend` / `frontend`: `npx tsc --noEmit` both clean. Extended
`scripts/test-event-scope.ts` with a coordinator-withdraws-and-regenerates
section, run over real HTTP against local Postgres on an isolated instance
(port 4099): 3 approved entries in one division, coordinator withdraws one via
`/review/bulk-status`, regenerates the draw, asserts the withdrawn athlete is
gone from the new bracket and the other two remain — 6 new checks, 31/31
total passing. Confirmed the new checks are real regression coverage, not
just green by construction: reverted `review.ts` alone (`git stash push --
backend/src/routes/review.ts`), reran against a freshly-restarted isolated
instance — `withdraw reason recorded on the entry` failed with
`statusReason: null`, exactly the bug being fixed — then restored and reran
clean. `scripts/test-draws.ts` still passes, unaffected.

**Not verified in-browser.** The dialog, the conditional draw-exists warning,
and the DivisionBoard "×" now hiding past DRAFT are all new UI surface with no
in-browser pass yet. Worth clicking through as a coordinator before trusting
the copy and the `hasDrawFor` lookup render correctly, and worth confirming
the "Go to Draws" link and toast reminder actually read well in context.

**Answered alongside this, no code change:** *can an athlete still be added to
a division whose draws are not yet complete/generated?* Yes, unconditionally.
`EntryService.create` never queries `Draw` at all — it only checks the
registration window, athlete age/gender eligibility, weight class, and
duplicate-entry — so a fresh entry can be added regardless of whether a draw
exists, is unlocked, or already has results. This holds in both sub-cases:
*no draw yet* (create is obviously unaffected) and *draw exists but unlocked
with no results* (still unaffected — draw *locking* only blocks
regenerate/delete of the draw itself in `draw.service.ts`, never blocks
creating new entries in that division). Adding the entry does not update an
existing draw automatically; `DrawService.list`'s `sync` computation
(`added`/`removed`/`seedsChanged`) is how the Draws page surfaces that the
bracket is now stale, and regenerate is the only way to fold the change in —
same mechanism the withdraw feature above now also depends on.

**Coordinator grant didn't reach Approve or Draws (2026-08-07).** Reported
from production: the Windhoek club manager was appointed tournament
coordinator for the event, but the UI showed no Approve control on `/hub/review`
and no draw-management controls on `/hub/draws`. Correct as a plain club
manager (that's the point of the grant model); wrong once the coordinator row
existed.

Checked the data first, since the fix branches completely differently
depending on the answer: roles are **not** an array. `User.role` is a single
`Role` enum column (`prisma/schema.prisma`), and a coordinator grant is a
separate `EventCoordinator` row (`eventId`, `userId`) — it stacks on top of the
base role rather than replacing anything. Confirmed `EventService.addCoordinator`
/ `removeCoordinator` (`backend/src/services/event.service.ts`) only ever touch
that join table, never `user.role` — so there was no bad data to repair and no
one-off script needed. Once this fix deploys, the existing grant (assuming the
"Coordinators" panel on `/hub/setup` shows the row — worth a quick look) takes
effect immediately: `canManageEvent` is resolved live from `/auth/me` on every
load, not cached in a JWT.

The actual bug: the backend already had the right shape.
`utils/event-scope.ts`'s `requireEventManager` (admin role OR coordinator grant
on *this* event) already guarded every draw-mutating route and the
`/review/bulk` approve/return route correctly — a coordinator could already do
both by calling the API directly. Two places checked the wrong thing:

- `frontend/src/pages/EntriesView.tsx` (`/hub/review`) computed
  `isAdmin = role === "SUPERADMIN" || role === "ADMIN"` and gated Approve,
  Return, the seed control, and entry selection on that — never on
  `useAuth().canManageEvent(eventId)`, which already exists and already mirrors
  the server guard (built for this exact purpose in the original coordinator
  feature, see "Tournament coordinators" below — just not wired into this page).
- `frontend/src/pages/Draws.tsx` had the identical pattern:
  `canManage = role === "ADMIN" || role === "SUPERADMIN"`.
- One real backend gap, not just a frontend one: `GET /api/entries`
  (`backend/src/routes/entries.ts`) forced `clubId` to the caller's own club
  for anyone who wasn't `isAdmin` by role, with no coordinator check at all —
  so even after fixing the frontend, a coordinator's review queue would have
  silently shown only their own club's entries instead of the whole event's.
  This one wasn't behind `requireEventManager` (a 404-vs-403 guard is overkill
  for a list endpoint's row-scoping), so it got its own inline
  `isEventCoordinator` check.

Fix: added `canReviewEvent = canManageEvent(selectedEventId)` in
`EntriesView.tsx` (this already covers admins too — `canManageEvent` returns
true for them regardless of event) and replaced every `isAdmin` that meant
"can review" with it — Approve/Return buttons, the seed control, entry
selectability, the one-click "Approve all", the bulk-action bar, the intro
copy. Left `isAdmin` alone on the two things that are genuinely admin-only:
the club-filter dropdown and its `listClubs()` query, because `GET /clubs` is
itself `requireRoles("SUPERADMIN", "ADMIN")` — widening that is a separate
authorization decision this bug didn't ask for. A coordinator instead always
sees every club's entries with no filter UI (`filters.clubId` is `undefined`
for them, not forced to their own club) — correct, since coordinating *is*
seeing the whole event. Same `canManage = canManageEvent(eventId)` swap in
`Draws.tsx`. Backend: `GET /entries` now only forces `effectiveClubId` to the
caller's own club when they are neither admin nor a coordinator of the
requested `eventId`.

**Regression test, not just a manual check:** extended
`scripts/test-event-scope.ts` (real HTTP against local Postgres) with a
section that creates two clubs, one division, one entry per club on the
already-granted test event, then as the coordinator (still base role
`CLUB_MANAGER`, `x-club-id` set to only one of the two clubs): asserts
`GET /entries` returns both clubs' entries, `POST /review/bulk` approves both,
and `POST /draws` creates a draw from them. Verified this actually catches the
bug, not just passes trivially: reverted `entries.ts` alone (`git stash push --
src/routes/entries.ts`), re-ran against an isolated local instance —
`entries list sees both clubs` failed with `seenIds` containing only one id —
then restored the fix and re-ran clean.

### Verification (run 2026-08-07)

`backend` / `frontend`: `npx tsc --noEmit` both clean. Ran both integration
scripts over real HTTP against local Postgres on an isolated instance (port
4099, so as not to disturb another session's dev server on 4000):
`scripts/test-event-scope.ts` — 29 checks, all passing (25 pre-existing + 4
new); `scripts/test-draws.ts` — all passing, unaffected. Confirmed the new
checks are a real regression test (see above), not just green by construction.

**Not verified in-browser.** The fix is small and the same
`canManageEvent`/`role` values are already exercised in-browser for the Entry
Management page and `EventHubLayout`'s tab visibility (see "Tournament
coordinators" below) — but nobody has clicked Approve or Generate Draw as a
real coordinator session in a browser. Worth a look on staging with the
Windhoek account, or any coordinator login, before fully trusting this.

**Railway build broken: `tsc` failing with `TS2591` on Node globals
(2026-08-07).** Reported from a Railway deploy: `backend/src/lib/storage.ts`
failed `tsc` with `TS2591: Cannot find name 'crypto'` and `'process'`. Locally
`npx tsc --noEmit` was clean, and `storage.ts` is not new — tracked since
`5e7f67b`, always covered by `tsconfig.json`'s `include: ["src"]` — so this was
an environment difference, not a scoping bug.

Reproduced exactly (not guessed): copied `backend/` to a scratch dir, deleted
`node_modules/@types/node`, ran `tsc --noEmit` — identical error codes, same
message text, `storage.ts` first (matching what a truncated build log would
show). Root cause confirmed by testing `npm ci --omit=dev`: `@types/node` (a
devDependency) is stripped, but `tsc` itself survives only by accident — it's
a transitive dependency of `@prisma/client`, a *production* dependency. That
is the exact shape of the failure: the build reaches `tsc`, but every file
touching a bare Node global (`process`, `crypto`, `Buffer`, `fs`, `path`,
`url` — dozens of files, `storage.ts` is just the first alphabetically) fails.
Re-running the same `--omit=dev` build after moving only `@types/node` still
failed, on the *other* `@types/*` packages (`express`, `cors`, `jsonwebtoken`,
etc.) for the identical reason — TS7016/TS7006 instead of TS2591.

Whatever the exact Railway/Nixpacks setting driving the dev-omitting install
(not visible from the repo — worth checking the service's `NODE_ENV` variable
in the dashboard if this recurs), the fix that works regardless of that detail
is: types needed to compile can't live somewhere a production-only install
skips.

Also found and fixed while reproducing, independent of the above:
`backend/package-lock.json` was stale (missing several `esbuild`/`fsevents`
optional-platform entries), which made plain `npm ci` — the install most
deploy platforms use — fail outright with "Missing: X from lock file" on a
clean checkout, regardless of `NODE_ENV`. And `typescript` itself was not a
declared dependency anywhere; it only existed in `node_modules` because
`@prisma/client`/`ts-node-dev` happen to depend on it.

Changes, all in `backend/package.json` + regenerated `backend/package-lock.json`:

- Moved every `@types/*` package and `typescript` from `devDependencies` to
  `dependencies`, so they install under `npm ci --omit=dev` too.
- Added `typescript` explicitly (was previously only present transitively).
- `prisma`, `ts-node-dev`, `tsx` stay in `devDependencies` — confirmed `prisma`
  (the CLI, needed by the start command's `npx prisma migrate deploy`) still
  installs under `--omit=dev` via `@prisma/client`'s own dependency on it;
  `ts-node-dev`/`tsx` are dev-only and correctly absent from that build.
- Regenerated the lockfile (`npm install`), which also fixed the stale
  `esbuild`/`fsevents` entries.

### Verification (run 2026-08-07)

All three from a scratch copy (`rsync --exclude node_modules`), not the
working tree:

| Scenario | Before | After |
|---|---|---|
| `npm ci` (plain) | fails: "Missing: ... from lock file" | succeeds |
| `npm ci --omit=dev` then `npm run build` | `TS2591` on `crypto`/`process` in `storage.ts`, then `TS7016`/`TS7006` across `server.ts`, `routes/*`, `services/*` | clean, `dist/server.js` written, `node --check` passes |
| `npm ci` (full) then `npm run build` | clean | clean |

`backend`: `npx tsc --noEmit` in the actual working tree — clean.

**Not verified: the actual Railway build.** This reproduces the reported error
byte-for-byte from a devDependency-omitting install and fixes it, but the repo
has no visibility into Railway's real install command or service-level env
vars — if a *different* mechanism is stripping types on Railway, this won't
be the whole story. Confirm on the next deploy.

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
