# Current state — read first, update before you hand off

This file is the handoff between coding agents. It describes what is in flight
right now, not the permanent architecture (that's
[`architecture.md`](architecture.md)).

**Last updated:** 2026-08-09 — by Claude Code: a new **Plan** tab in the event
hub — drag-and-drop mat planning with an interactive, to-scale schedule,
ceremonies and breaks, and floor management that drives the tournament's mat
count. Replaces the Run page's old "Plan" sub-tab. Now also carries separate
kata timing (performance length, and whether the pair performs together or one
after the other) and a **Draft schedule** auto-scheduler. See "In flight" below.

Previously, same day: tournament timing config
captured per event (event hub → Overview) and per category (event hub →
Setup). Storage + UI only; the duration estimator is deliberately untouched.

Previously, 2026-08-08: clearer end-of-bout winner
announcement (bigger "AKA WINS"/"AO WINS", matched between the mat
scoreboard and the projector display) plus a four-medal WKF podium once the
tournament final's winner is known and both bronze bouts are already
decided.

Previously, 2026-08-08: Draws now shows a manual
refresh button + "last updated" timestamp, and an "In progress" chip on any
bout the mat scoreboard has started scoring — the score itself is honestly
*not* shown live, since the backend has zero visibility into a bout until
the final save.

Previously, same day: added ±1 second clock
adjustment buttons next to the existing ±10s, for fine correction when a
timekeeper lets the clock run a couple seconds long.

Previously, same day: added a standalone practice /
ad-hoc bout scoreboard (no persistence) under the event hub, reusing the real
live scoreboard's scoring engine via a new shared `BoutScoreboard` component.

Previously, same day: the live scoreboard now allows scoring for a short
window after the bout clock expires, instead of locking out scoring the
instant it hits zero.

Previously, 2026-08-07: fixed the Run → Plan tab, where assigning categories
to mats produced only order 0/1 and the mats showed nothing.

Previously, same day: the estimator now estimates WKF double-repechage bronze
bouts instead of leaving them out entirely — a user check on a real 9-entry
division (should be 10 bouts, was showing 8) turned out correct.

Previously, same day: the estimator's per-division breakdown now shows entry
count and an estimated duration alongside the bout count.

Previously, same day: in-browser verification of the kumite duration
estimator found and fixed a real undercounting bug in the "drawn" bout count.

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

**Tournament planning — the hub's new Plan tab (2026-08-09).**
Request: a separate "Plan" option alongside Run, with a good UI for managing
mats: drag categories from a list onto mats and between mats, reorder them,
add and remove mats (updating the master mats/floors config), custom floor
names, completed categories locked, category status shown, opening/closing
ceremonies and lunch breaks included, breaks that stretch across all floors
displayed as such, and an interactive schedule so timing is part of the plan.

**Where it lives.** `/hub/plan` (`pages/hub/Plan.tsx`), visible to every role —
the plan *is* the schedule, and a coach wants to know which floor their
athletes are on and roughly when. The board is read-only for anyone who can't
manage the event, with a one-line note rather than a hidden tab.

**The Run page's "Plan" sub-tab is gone**, and its `PlanTab` deleted. It did
the same job against no schedule; keeping both would have been two mat planners
disagreeing. `Run.tsx` is now day-of only (Run + Check-in) and its empty state
points at the new tab. The `/run/mats` and `/run/draws/:id/mat` endpoints stay —
Plan reuses mat CRUD, so both surfaces share one set of mats.

**Storage decisions.**
- `ScheduleBlock` (migration `20260809140000_add_schedule_blocks`) — one row per
  ceremony or break. Its own table rather than derived from `Event.timingJson`:
  the timing config holds *defaults* (is there a lunch, how long), the plan
  holds the concrete blocks the organizer placed. Deriving them would make
  "move lunch after the U14 pools on Mat 2" unrepresentable.
- `matId: null` = venue-wide (a band across every floor, pinned by `startTime`);
  `matId` set = the block sits in that floor's running order. `onDelete: Cascade`
  on the mat, deliberately not SetNull — deleting a mat must not silently
  promote that mat's coffee break into a venue-wide stoppage.
- **A block on a floor shares one `matOrder` index space with that floor's
  draws.** That is what lets a break sit *between* two categories, and it is
  why the ordering endpoint takes both kinds in one list.
- `EventTimingConfig` gains `dayStartTime` ("HH:MM", default "08:00"). A string,
  not a DateTime: it is a time of day in the venue with no timezone of its own.

**The completed-category rule, and where it is enforced.** A COMPLETED draw
keeps the floor it was fought on — `PlanService.setOrder` and
`RunService.assignDrawMat` both reject a floor change (409), and
`RunService.deleteMat` refuses to delete a floor with completed categories on
it (which would null their `matId` via SetNull and rewrite history as a side
effect of a planning action). Two deliberate narrowings, both found by writing
the tests:
- **Its index within the floor may shift.** Inserting anything above it
  necessarily renumbers everything below, so pinning the index would fail the
  whole write for an edit that never touched the completed category.
- **`matId: null` is exempt.** A category fought before anyone opened the plan
  has no floor recorded, so there is nothing to protect; refusing that first
  placement made it permanently *unplaceable* rather than merely unmovable.

The UI half: completed categories get no drag handle, and `normalizeLane` pulls
them to the front of their floor after every drag so a drop can never land above
one. That is interaction polish, not the guard — the board is a shared surface
and two planners can drag at once.

**Mat count and the timing config are now one fact.** `EventService.syncMatCount`
runs after mat create/delete and writes `timingJson.mats` to the real mat count,
and the Overview timing card's "Mats / floors" field is **read-only** with a
pointer to Plan. Before, the two were independent statements of the same thing
and only the estimator read the config one, so drift was invisible.

**The schedule engine** (`frontend/src/lib/schedule.ts`) is pure and unit-tested.
Every floor starts together once the opening ceremony is done, runs its own
order, and pauses for any venue-wide band; the day ends when the slowest floor
finishes, plus the closing ceremony. Specifics worth knowing:
- A category's minutes = bouts × (bout clock + transition) × (1 + buffer), plus
  one changeover — resolved per category through the *stored* timing config and
  its per-division overrides. This is the first thing to actually consume that
  config (see the timing entry below, which deliberately only captured it).
- Bout counts come from `estimatedRepechageBouts`, **imported** from
  `lib/estimator.ts` rather than re-derived, so the two can never disagree.
  `lib/estimator.ts` and `pages/hub/Estimator.tsx` are otherwise byte-for-byte
  untouched, as asked.
- Repechage is counted for **kata too**: the draw engine builds both disciplines
  from the same bracket with the same repechage, so scheduling kata without
  bronze bouts would under-book every kata floor.
- A category with fewer than two entries costs zero floor time — including no
  changeover, or every empty category would pad the day by five minutes.
- A venue-wide break is *absorbed*, not worked around: the item running when the
  venue stops keeps one bar whose span includes the break (`pausedMin`), and an
  item that would have *started* inside the window waits instead (`waitMin`).
  Splitting the card in two would have been the same information, drawn twice.
- Anchoring: an explicit `startTime` always wins; otherwise OPENING runs at the
  start and CLOSING at the end. Anything else venue-wide with no time is
  reported as unscheduled rather than guessed at.

**UI.** One `DndContext` over every lane (each floor plus the unassigned pool),
with a live `onDragOver` cross-lane preview — without it the columns only reflow
on release and the user is aiming at a gap that isn't there. Lane state is local
so the schedule below re-times *as you drag*, and server data is only allowed to
overwrite it when no drag and no write is in flight (`dragActive || isPending`),
with an explicit cancel path restoring the server order. One `PUT /plan/order`
per drop carries every lane the item passed through, so a cross-floor move is a
single transaction rather than a remove and an insert that can half-fail.

Venue-wide bands are drawn **in each floor's column** at the position that
floor's running order reaches, hatched and full-bleed with an "Every floor"
chip — plus as a strip across all columns on the timeline. Adding lunch reads
the config's `lunch.mode`: `ALL_MATS` creates one venue-wide band at a suggested
midpoint, `PER_FLOOR` creates one break on each floor.

**Test data.** `backend/scripts/seed-test-tournament.ts` builds a full
tournament to exercise this against: 8 clubs, 190 athletes, 414 entries, 52
categories (kata, kumite with weight classes, and team events) from the
`NKF_FULL_2026` template, 46 real brackets, 4 categories fought to a podium and
3 mid-way, on 3 floors. Everything goes through the service layer, so statuses
are *derived* — seeded data that lies about its own shape is worse than none.
Deterministic (fixed PRNG seed), re-runnable, and `--clean` removes exactly its
own rows. Two UI bugs surfaced the moment it was used and are fixed: the weight
class was the first thing the title's ellipsis ate, leaving five identical
"Cadet Boys Kumite (14/15…" cards, so it is now a chip that never shrinks; and
a category in the unassigned pool claimed "no bouts" because it had no
*schedule* — it now shows the bout count computed from its own entries, which
is what you need to decide which floor to put it on.

**Kata timing, and the auto-drafter (2026-08-09, same session).**

*Two kata settings.* `kataBoutDurationSec` (default 90) and `kataMode`
(`SEQUENTIAL` | `TOGETHER`, default SEQUENTIAL) on `EventTimingConfig`, edited
in their own block on the Overview timing card. `schedule.ts` grew
`boutSecondsFor`, which is now the single place that decides what a bout costs
a mat:

- kumite → match clock + transition;
- kata → performance × **performances-per-bout** + transition, where SEQUENTIAL
  (AKA performs, then AO, then flags — the WKF format) is 2 and TOGETHER (both
  on the floor at once) is 1.

That factor of two is the whole point: on a 9-bout kata category with the
default numbers it is 36 minutes against 23. A per-category `boutDurationSec`
override on a kata division now means "this category's performance length", with
the doubling still applied on top. `ScheduleCategoryInput` carries `isKata`
rather than inferring it, because it decides which of the two event defaults
applies.

*The drafter* — `frontend/src/lib/autoschedule.ts`, pure and unit-tested,
surfaced as a "Draft schedule" button on Plan. It proposes; nothing is written
until the planner reads the summary and applies it.

- **Order**: `compareCategories` = minAge, maxAge, kata-before-kumite, gender,
  title. Sorting on minAge *and* maxAge keeps genuinely different bands apart
  (Junior 16-17 ahead of Senior 16-99) instead of lumping everything starting at
  the same age.
- **Two strategies.** `BALANCE_FLOORS` places each category on whichever floor
  frees up soonest. `AGE_GROUP_PER_FLOOR` keeps an (age range, gender) group's
  kata and kumite on one floor so nobody is called to two floors at once.
- **Only what actually clashes is bound together.** Two weight classes of one
  division never share an athlete, so a group that is all kumite (or all kata)
  spreads freely; only a group holding *both* disciplines is pinned to one
  floor. Without this, six senior kumite weight classes piled onto one floor —
  measured on the seeded event, floors went 10/18/18 categories.
- **Groups are assigned largest-first**, then each floor is sorted back into age
  order. Assigning in age order reads nicer but balances badly: the biggest
  groups land last with no room left to even them out. Same measurement after
  both fixes: **14/17/15 categories, floors finishing within 4 minutes**, and
  clashes down from 10 to 3.
- **An age group joins a floor it already has a foothold on.** A category that
  has been fought cannot move, so the rest of its group goes to *its* floor
  rather than the least-loaded one — otherwise the strategy's one promise was
  broken by exactly the category that is hardest to fix by hand. This was a real
  bug found by dumping the applied order: the pinned Junior Male Kata sat on
  Tatami A while its five kumite weight classes went to The Blue Hall.
- **Residual clashes are reported, not hidden.** A kata and a kumite category
  with overlapping age ranges and the same gender, running at the same time on
  different floors, is listed in the dialog with times and floor names. It
  cannot be fully eliminated by floor assignment — "Senior 16+" overlaps every
  band above it — so the honest answer is to show the planner what is left.
- **Blocks**: opening and closing anchored to the day, lunch at the midpoint of
  the *drafted* competition rounded to the half hour, honouring `lunch.mode`
  (one venue-wide band, or one break per floor spliced between two categories
  at the position nearest that time). A kind already in the plan is never
  proposed again, so re-drafting cannot stack a second opening ceremony.
- **Applying** creates the blocks first (they need real ids), splices per-floor
  ones into their lanes with `applyBlockIndexes`, then writes every lane —
  including the pool — in one `PUT /plan/order`.

Check-in is deliberately *not* auto-placed: the config has a `checkin` block but
no block kind means "check-in", and inventing one was outside what was asked.

*Files*: `backend/src/utils/validators.ts`,
`backend/scripts/test-event-timing.ts`, `backend/scripts/seed-test-tournament.ts`,
`frontend/src/lib/timing.ts`, `frontend/src/lib/schedule.ts`,
`frontend/src/lib/autoschedule.ts` (new),
`frontend/src/components/events/EventTimingCard.tsx`,
`frontend/src/components/plan/DraftScheduleDialog.tsx` (new),
`frontend/src/components/plan/PlanCards.tsx`, `frontend/src/pages/hub/Plan.tsx`,
`frontend/scripts/test-schedule.ts`, `frontend/scripts/test-autoschedule.ts` (new).

*Verification*: `npx tsx scripts/test-autoschedule.ts` — 47 checks covering the
ordering rule, both strategies, the pinned-sibling rule, balance-with-age-order,
clash detection (and the three cases that are *not* clashes: same discipline,
different genders, single-discipline groups), block proposal including the
per-floor lunch and the no-duplicates rule, and `applyBlockIndexes`.
`test-schedule.ts` grew to 72 checks with the kata timing. `test-event-timing.ts`
covers the two new fields round-tripping and an unknown kata format being
rejected without disturbing the stored config. Applied end to end in the browser
against the 52-category seeded tournament; the resulting order was dumped from
the database and checked category by category.

**Not done / next.** The estimator still runs on its own session inputs; now
that the plan computes a real schedule from the stored config, folding the
Estimator tab into it (or retiring it) is the obvious follow-up, but it was
out of scope here. Kata categories still inherit the event's default bout
duration because `DivisionTiming` on Setup only lists kumite — cheap to change
(one filter) if kata should carry its own performance length.

Files: `backend/prisma/schema.prisma`,
`backend/prisma/migrations/20260809140000_add_schedule_blocks/`,
`backend/src/utils/validators.ts`, `backend/src/utils/event-scope.ts`,
`backend/src/services/plan.service.ts` (new),
`backend/src/services/event.service.ts`, `backend/src/services/run.service.ts`,
`backend/src/routes/plan.ts` (new), `backend/src/server.ts`,
`backend/scripts/test-plan.ts` (new), `frontend/src/lib/schedule.ts` (new),
`frontend/src/lib/plan.ts` (new), `frontend/src/lib/timing.ts`,
`frontend/src/components/plan/` (new: `PlanBoard`, `PlanCards`,
`ScheduleTimeline`, `BlockDialog`, `plan-visuals`),
`frontend/src/pages/hub/Plan.tsx` (new), `frontend/src/pages/Run.tsx`,
`frontend/src/components/events/EventTimingCard.tsx`,
`frontend/src/components/layout/EventHubLayout.tsx`, `frontend/src/App.tsx`,
`frontend/scripts/test-schedule.ts` (new),
`backend/scripts/seed-test-tournament.ts` (new), `AGENTS.md`.

### Verification (run 2026-08-09)

`backend` / `frontend`: `npx tsc --noEmit` and `npm run build` both clean.
Migration applied to local Postgres via `prisma migrate diff` + `migrate deploy`
(the local role still lacks CREATEDB).

`npx tsx scripts/test-schedule.ts` (frontend, pure) — 63 checks: clock parsing
and formatting including the past-midnight case, bout counts and the
draw-vs-live entry count, duration resolution including `bufferPct: 0` as a real
override, a plain parallel day, a venue break absorbed by the running item, an
item pushed past a break it would start inside, a per-floor break costing only
its own floor, every anchoring case, all six warning codes, and the shared
`matOrder` index space.

`npx tsx scripts/test-plan.ts` (backend, real HTTP against local Postgres) — 51
checks: mat count sync up and down, custom floor names, the one-call board, dense
0-based reordering, atomic cross-floor moves, unassign clearing the position
rather than writing 0, all four completed-category cases, a per-floor break
having its clock time dropped and appended past the categories, breaks
interleaved with categories, a break refused in the pool, another event's
category refused, duplicate ids refused, edit/delete, read-open/write-guarded
authorization with the coordinator grant, and `configJson` untouched throughout.

Exercised live in the browser against a seeded 9-category, 3-floor event:
floors added and named, categories dragged from the pool onto a floor (the pool
emptied, the timeline re-timed from 76 to 93 bouts live, and the order
persisted), a per-floor break added and appended, the venue-wide lunch band
rendered inside every floor column and across the timeline, and the completed
category confirmed to have no drag handle. Three visual fixes came out of that
pass: the clipped first hour label, the cramped venue-band text in a narrow
column, and the wrapping time line on a card.

Regressions all clean: `test-draws.ts`, `test-event-scope.ts`,
`test-bout-scoring.ts`, `test-event-timing.ts`, `test-estimator.ts` (46),
`test-scoreboard.ts` (30), `test-timing.ts` (44).

---

**Tournament timing config, captured per event and per category (2026-08-09).**
Request: lift the estimator's timing variables into the event's own
configuration — tournament defaults under the hub's Overview tab, per-category
bout duration / injury-stoppage buffer / win-by-points gap under Setup, with
opening and closing ceremonies specified and the lunch break stating whether
all mats close together or each floor breaks on its own.

**Explicitly scoped to capture and storage.** The user asked for the
estimator itself to be left alone ("i have another plan with this"), so
`lib/estimator.ts` and `pages/hub/Estimator.tsx` are byte-for-byte
unchanged: the Estimator tab still runs on its own session-only inputs and
does not read the stored config. That wiring is the obvious next step and is
deliberately not done here.

**Storage decisions.**
- `Event.timingJson String?` — a validated JSON blob (`EventTimingConfig` in
  `backend/src/utils/validators.ts`), *not* a key inside the existing
  `configJson`. `configJson` is the unvalidated YAML-rules snapshot and
  `PUT /events/:id/config` replaces it wholesale, so timing stored there
  would be silently clobbered by an unrelated config write. A test asserts
  `configJson` is untouched by timing writes.
- `Division.boutDurationSec Int?` / `bufferPct Float?` / `winByGap Int?`
  (migration `20260809101500_add_event_and_division_timing`). All three
  nullable, and **null means "inherit", never "zero"** — that's why they have
  no numeric default in the Zod schema, and why an explicit `bufferPct: 0` is
  stored as a real override (covered by a test on each side).
- Every field on `EventTimingConfig` has a Zod default, so an event that was
  never configured — or one whose stored blob predates a field — reads back a
  *complete* config rather than a half-empty object the UI would have to
  guess at. `EventService.parseTiming` also degrades a corrupt or wrong-shaped
  blob to the defaults instead of throwing: a bad blob must not make the
  Overview tab unreadable, and the next save overwrites it.

**The win-gap default is derived, not copied.** `defaultWinByGap` (in
`frontend/src/lib/timing.ts`) returns 6 for categories aged 13 and below and 8
above. Keyed on `maxAge`, not `minAge` — a category is only "13 and below" if
nobody in it can be older than 13, so a division spanning 12–14 takes the
senior gap. Deriving it rather than writing it onto the division at creation
time means editing a category's age range keeps its default honest, and it
never has to be backfilled onto the 32 divisions that already exist.

**Routes.** `GET /events/:id/timing` is open to any logged-in user (a coach
wants to know when lunch and the ceremonies fall); `PUT /events/:id/timing` is
`requireEventManager` like every other event-config route. Per-category timing
rides on the *existing* `PUT /events/divisions/:divisionId` — no new endpoint,
so it inherits that route's `requireEventManager({ in: "lookup" })` guard
unchanged.

**UI.**
- `components/events/EventTimingCard.tsx` on Overview: mats, default bout
  duration (sec, with a live "Match clock — 1:30" hint), transition between
  bouts, injury/stoppage buffer %, changeover per category, then opening
  ceremony / closing ceremony / lunch / check-in as toggle+minutes blocks.
  Lunch adds the mode picker ("All mats close together" vs "Each floor breaks
  on its own"), disabled when lunch is off. Explicit Save (not save-on-change)
  with dirty tracking, Discard, and Reset to defaults. A non-manager sees the
  same card with every control disabled and a one-line note, rather than the
  card being hidden — the read route is open, so hiding it would withhold
  information the server is happy to give.
- `components/events/DivisionTiming.tsx` on Setup: one row per **kumite**
  category with the three fields. An empty box means inherited and shows the
  inherited value as its *placeholder*, so a blank box always reads as the
  value that will actually be used; an overridden box gets a primary-coloured
  border and a per-row reset that clears all three. Edits commit on blur, not
  per keystroke — the controlled-input-clobbered-by-refetch trap that bit the
  Run → Plan mat order (see below) — and values are clamped to the Zod ranges
  client-side so a typo can't 400.
- **Kata categories are deliberately not listed**, and the UI says so: a bout
  clock and a points gap have no meaning for kata, and the estimator these
  feed is kumite-only. Cheap to reverse if kata should carry a performance
  duration — it's one filter.
- Timing shares one query key (`["event-timing", eventId]`) across both tabs,
  so Setup's inherited placeholders update the moment Overview's defaults are
  saved (verified live: changing the default 120 → 90 moved every inherited
  placeholder to 90).

Files: `backend/prisma/schema.prisma`,
`backend/prisma/migrations/20260809101500_add_event_and_division_timing/`,
`backend/src/utils/validators.ts`, `backend/src/services/event.service.ts`,
`backend/src/routes/events.ts`, `backend/scripts/test-event-timing.ts` (new),
`frontend/src/lib/timing.ts` (new), `frontend/src/lib/events.ts`,
`frontend/src/components/events/EventTimingCard.tsx` (new),
`frontend/src/components/events/DivisionTiming.tsx` (new),
`frontend/src/pages/hub/Overview.tsx`, `frontend/src/pages/hub/Setup.tsx`,
`frontend/scripts/test-timing.ts` (new).

### Verification (run 2026-08-09)

`backend` / `frontend`: `npx tsc --noEmit` and `npm run build` both clean.
Migration applied to local Postgres via `prisma migrate diff` + `migrate
deploy` (the local role still lacks CREATEDB).

`npx tsx scripts/test-timing.ts` (frontend, pure) — 44 checks: normalization
and clamping, the win-gap age rule including the 13/14 boundary and the
maxAge-not-minAge choice, inherit-vs-override resolution per field, the
explicit-0-is-not-absent case, and `formatBoutDuration`.

`npx tsx scripts/test-event-timing.ts` (backend, real HTTP against local
Postgres on an isolated port) — 42 checks: unconfigured event reads complete
defaults without writing anything, partial write normalized and round-tripped,
ceremonies/lunch off round-trip as off, out-of-range values rejected (mats 0,
buffer 500%, unknown lunch mode) with the stored config left untouched,
corrupt and wrong-shaped blobs degrade to defaults, read open to a plain club
manager but write 403 until the coordinator grant exists, per-category
overrides round-trip through the division list, null clears one field without
disturbing the others, `bufferPct: 0` stores as 0, and a timing-only update
leaves the category's name/ages/gender and the event's `configJson` alone.

Regressions all clean: `test-draws.ts`, `test-event-scope.ts`,
`test-bout-scoring.ts` (32), `test-estimator.ts` (46), `test-scoreboard.ts`
(30).

**In-browser (dev servers on 4000/5173, local Postgres, ADMIN then COACH via
the dev-auth localStorage shortcut).** On the seeded "Namibia Goju Kai
Nationals 2025" (32 divisions): saved mats 4 / bout 90s / opening ceremony off
/ lunch PER_FLOOR, confirmed the "Tournament timing saved" toast, that the
Save button returns to disabled, that a full reload replays every value, and
that the row in Postgres holds exactly the normalized JSON. On Setup, the 16
kumite categories rendered with win-gap placeholders 6/6/6/6 for U8–U14 and
8/8/8/8 for Cadet/Junior/Senior/Veteran — the age rule, live, against real
data — and bout placeholders of 90 inherited from the default just saved.
Overrode one bout duration (highlight + tooltip appear, reset clears it),
then set a buffer of 20 on U14 Male and a win gap of 6 on Cadet Male and
confirmed both in the database with the other two fields still null. As a
COACH: the card renders read-only with every input disabled, no Save/Reset,
the explanatory note, and no Setup tab at all. Console clean apart from the
already-documented benign pre-login `/auth/me` 401s. All test data reverted
afterwards (`timingJson` back to null, all 32 divisions' overrides cleared).

**Not verified: screenshots.** The browser pane in this session would not
composite — every screenshot came back blank or with a stale overlay — so all
of the above was verified through the DOM, the network log and the database
rather than visually. The layout of both new sections (the timing card's
three-column grid, the Setup rows' alignment at narrow widths) has been read,
not seen.

**Clearer winner announcement + end-of-final podium (2026-08-08).**
Two visual asks for the scoreboard's end-of-bout screen: make the winner
announcement readable at a glance ("competition-day readability from across
the room"), and show a WKF-style four-medal podium once the tournament
final is decided.

**Winner announcement — matched between the two screens that show one.**
Re-read both before touching anything: the mat scoreboard's resolution
dialog already had an "AKA WINS"/"AO WINS" banner (`text-3xl`, side-colored
text, added during the practice-mode work) with no background treatment;
the projector (`ScoreboardDisplay.tsx`) had a *different*, smaller design —
a modest yellow box captioned "Winner · outcome" over the winner's name at
`text-[3.6vmin]`, plus a separate `ring-8 ring-inset ring-yellow-400`
around the whole winning side's panel. Read "the current yellow-screen
winner display isn't clear enough" as pointing at that projector yellow
box specifically, and "match the operator screen's big winner banner" as
pointing back at the dialog's own "AKA WINS" style — so the fix unifies
both toward the clearer version rather than picking one as the sole
target:
- Projector: the yellow box's caption+name is now a `text-[6vmin]` "AKA
  WINS"/"AO WINS" headline, with name + outcome as a smaller secondary
  line underneath. The `ring-8` yellow ring around the winning side panel
  is untouched — kept exactly as it was, per the explicit ask.
- Dialog: bumped `text-3xl` → `text-4xl sm:text-5xl`, and wrapped the
  whole banner in a `ring-4 ring-yellow-400` bordered box tinted with the
  winning side's own color, so the same "yellow ring = winner" signal
  reads on both screens instead of being projector-only. The "Draw"
  variant (practice-only) got the same size bump, no yellow ring — there's
  no winner to ring.

**Podium — detection is pure, reuses backend data instead of new backend
logic.** `DrawService.computeDrawState` (in `draw.service.ts`, unchanged)
already derives `draw.placements.{first,second,thirds}` from bracket
structure — `thirds` only gets an entry once that repechage half is fully
resolved, so "podium complete" was already representable, just not
surfaced as a single check anywhere. Added two pure functions to
`frontend/src/lib/draws.ts` rather than touching the backend:
- `isFinalBout(draw, bout)` — `bout.phase === "MAIN" && bout.round ===
  Math.log2(draw.size)`. No hardcoded round numbers; works for any
  bracket size.
- `finalBronzeMedalists(draw)` — `draw.placements.thirds` sliced to
  exactly 2, or `null` if either repechage side isn't resolved yet. This
  is the "podium is incomplete, don't render" gate from the brief.

**Why gold/silver are computed live, not from `draw.placements`.** The
operator scoring the final sees the "AKA WINS" banner (and the podium
below it) the *instant* the local resolution is known — before "Save
result" is even clicked. `draw.placements.first`/`second` only reflect
what's been saved to the backend, so sourcing gold/silver from there would
mean the podium doesn't appear until *after* a save-and-reload, which
misses the whole point ("once the final's winner is displayed"). Bronze is
different: those bouts are (in the normal running order) already decided
and saved by the time the final is being scored, so `draw.placements`
already has them. Net design: `BoutScoreboard.tsx` takes an optional
`finalBronzeMedalists?: [PodiumMedalist, PodiumMedalist] | null` prop
(bronze only), and builds the full four-medal `podium` object itself by
combining that prop with its own already-live `winnerSide`/`aka`/`ao` —
gold = winner, silver = loser, bronze = the prop, verbatim. `lib/draws.ts`
and `lib/scoreboard.ts`/`BoutScoreboard.tsx` stay decoupled exactly as the
practice-mode extraction left them: the wrapper (`pages/Scoreboard.tsx`)
is the only place that imports both and does the `isFinalBout` +
`finalBronzeMedalists` lookup, structurally passing `DrawEntrySummary`
objects into a prop typed for the smaller `PodiumMedalist` shape (`{name,
clubName}`) — no reshaping needed, just a superset satisfying a subset.

**New shared component:** `components/scoreboard/PodiumBanner.tsx` — one
component, two size variants (`"dialog"` rem-scaled, `"display"`
viewport-scaled to match `ScoreboardDisplay.tsx`'s existing `vmin`
convention), same layout both times: silver, gold (tallest, centred),
bronze, bronze — left to right, matching how WKF venues typically lay out
a 1-2-3-3 podium. Rendered in two places:
- Mat scoreboard's resolution dialog, below the winner banner, only once
  `finalBronzeMedalists` is non-null (dialog also widens `sm:max-w-md` →
  `sm:max-w-2xl` so four blocks have room).
- Projector display, as a new full-width strip below the boards row
  (`shrink-0`, not squeezed into the narrow centre clock column) — added
  below rather than replacing anything, matching the brief's "transition
  (or add below)" with the simpler, lower-risk of the two options.
  `DisplayPayload` gained a `podium: PodiumPlacements | null` field,
  computed identically to the dialog's version inside `BoutScoreboard.tsx`'s
  existing broadcast effect.

**Practice mode:** never passes `finalBronzeMedalists`, so `podium` is
always `null` there — no bracket, no final, no podium. No changes needed
in `pages/hub/Practice.tsx`.

Files: `frontend/src/lib/draws.ts`, `frontend/src/lib/scoreboard.ts`,
`frontend/src/components/scoreboard/BoutScoreboard.tsx`,
`frontend/src/components/scoreboard/PodiumBanner.tsx` (new),
`frontend/src/pages/Scoreboard.tsx`, `frontend/src/pages/ScoreboardDisplay.tsx`,
`frontend/scripts/test-draws.ts` (new). No backend changes.

### Verification (run 2026-08-08)

`backend` / `frontend`: `npx tsc --noEmit` both clean (backend untouched,
checked anyway). New `frontend/scripts/test-draws.ts` — 12 checks covering
`isFinalBout` (round 1/2/3 of a size-8 bracket, a REPECHAGE bout at the same
round number never counts, size-16 and size-2 edge cases) and
`finalBronzeMedalists` (null with 0 or 1 bronze decided, both returned
verbatim with no re-sorting once both are decided). `frontend/scripts/
test-scoreboard.ts` — all 30 existing checks still pass unchanged (this
feature didn't touch the pure timer/scoring logic in `lib/scoreboard.ts`,
only its types and the component consuming it).

**Not verified in-browser** — the user explicitly asked for this to be
called out. Unverified: the enlarged winner banners actually read clearly
at a glance on both screens; the podium's four-block layout at `sm:max-w-2xl`
in the dialog and as a `vmin`-scaled strip on the projector actually looks
like a podium rather than a cramped row; and — the real end-to-end
scenario this exists for — that scoring a real final (with both bronzes
already decided) actually produces a complete four-medal podium rather than
an edge case in `isFinalBout`/`finalBronzeMedalists` that wasn't caught by
the unit tests above.

**Live-status awareness on Draws (2026-08-08).**
Request: while one machine scores a bout on the mat, other machines watching
the Draws page for that division should be able to tell a bout is being
scored, without navigating in and taking over. Two pieces: a manual refresh
button + timestamp on the draw view, and an "in progress" indicator on
individual bout tiles.

**Source-of-truth finding, reported as asked:** `Bout` had no way to
represent "in progress" before this. `akaScore`/`aoScore`/`outcome`/
`scoreJson`/`postTime` are written *only* by `setBoutScore`, always
atomically together with `winnerEntryId` — there is no code path that ever
writes a partial score with no winner. Scoring itself is 100% client-side
(the whole point of the `BoutScoreboard` engine — see the two prior entries
above): the operator's machine holds the live score in React state, mirrors
it to `localStorage` for its own crash/refresh resume, and the backend
learns nothing until Save. `Bout` also had no timestamp fields at all
(`createdAt`/`updatedAt`), so there wasn't even an implicit staleness
signal to lean on. **Conclusion: "current score" cannot be shown live on
Draws without a genuinely new sync mechanism, and building a live score
relay was out of scope for this request** — so the in-progress indicator
shows status only ("someone has this open and running"), never a score.
Also worth naming: the existing mat → projector `BroadcastChannel` link
(`CHANNEL_NAME` in `lib/scoreboard.ts`) can't help here even in principle —
it's same-browser-profile, cross-tab only, and this is explicitly a
cross-*machine* scenario (coordinator laptop, coaches' devices).

**Minimum field added, per the brief's explicit allowance:** `Bout.startedAt
DateTime?` (migration `20260808083208_add_bout_started_at`), set once by a
new best-effort ping — `POST /draws/:id/bouts/:boutId/start`
(`DrawService.startBout`, same `requireEventManager` guard as the score
routes) — fired by `BoutScoreboard.tsx` the first time the clock starts
(`Hajime`), never by any other path. Idempotent (no-ops if already set),
deliberately **not** audit-logged — this is a status ping for other
viewers, not a state change worth an audit trail, unlike every other Bout
mutation in this file. Reset to `null` in the two places score detail
already gets invalidated for the same reason (a stale flag pointing at the
wrong matchup is worse than none): `recompute`'s upstream-correction branch,
and `setBoutWinner`'s clearing branch (`winnerEntryId: null`). Exposed on
`DrawBout.startedAt` (ISO string or null) through the existing `getDraw`
response — no new query.

**Frontend wiring:** `BoutScoreboard.tsx` gained an optional
`onBoutStarted?: () => void` prop, called once via a new `toggleRunning`
wrapper around the Hajime/Yame button (guarded by a `startedFiredRef`, same
pattern as the atoshi/end/award fired-refs already in the file). Practice
mode never passes this prop — there's no real bout to ping. The real-bout
wrapper (`pages/Scoreboard.tsx`) implements it as a fire-and-forget
`startBout(drawId, boutId)` with a swallowed `.catch()` — scoring must never
block or error out over a status ping failing.

**Draws page (`pages/Draws.tsx`):** a small ghost refresh button + "Last
updated HH:MM:SS" sits right next to the division name/status badges (not
inside the `canManage`-gated management-button cluster on the right — any
viewer with hub access should be able to refresh, not just coordinators/
admins). Reuses React Query's own `dataUpdatedAt`/`refetch`/`isFetching`
rather than hand-rolling timestamp state; clicking it refetches both the
`draw` and `draw-categories` queries so the category list's status badges
stay in sync too.

**Bout tiles (`components/draws/BracketView.tsx`):** `BoutCard` gained an
`inProgress = !decided && !!bout.startedAt` strip at the top of the card
(amber `Timer` icon, pulsing, "In progress", `title` showing the exact
start time) plus a matching amber card border, mirroring how `decided`
already gets a green border. **Finished bouts were already correct** — the
existing `hasScore` block already shows the final score + outcome once
`akaScore`/`aoScore` are set, verified by reading `BoutCard` before
touching it; no changes needed there. **Not-started bouts are unchanged**
— `inProgress` is `false` whenever `startedAt` is `null`.

**Auto-refresh — deliberately not built, flagging per the brief's ask:**
adding a 30s poll toggle would be trivial (`refetchInterval` is a single
prop on the existing `useQuery` calls, or a `setInterval` calling the same
`handleRefresh`). Not added because the brief explicitly asked for manual
only. If this is worth adding, my inclination would be a toggle next to
the refresh button defaulting to off, since a busy tournament floor with
several machines all polling constantly is a real (if small) cost for a
view that's mostly glanced at.

Files: `backend/prisma/schema.prisma`,
`backend/prisma/migrations/20260808083208_add_bout_started_at/`,
`backend/src/services/draw.service.ts`, `backend/src/routes/draws.ts`,
`backend/scripts/test-bout-scoring.ts`, `frontend/src/lib/draws.ts`,
`frontend/src/components/scoreboard/BoutScoreboard.tsx`,
`frontend/src/pages/Scoreboard.tsx`, `frontend/src/pages/Draws.tsx`,
`frontend/src/components/draws/BracketView.tsx`.

### Verification (run 2026-08-08)

`backend` / `frontend`: `npx tsc --noEmit` both clean. Migration applied
against local Postgres (same temporary superuser `ALTER ROLE ...
CREATEDB`/`NOCREATEDB` workaround as before).

`npx tsx scripts/test-bout-scoring.ts`, extended with 12 new checks for
`startBout` (round-trips, idempotent — a second ping doesn't move the
timestamp, cleared alongside score detail on a winner-only override,
coordinator parity, non-coordinator 403) — 32 checks total, all pass, run
live against a local dev server on an isolated port. `test-draws.ts` and
`test-event-scope.ts` re-run clean (0 failures) as regression checks — the
`recompute` change (clearing `startedAt` on fighter/winner changes) sits
inside a path both scripts exercise heavily. `frontend/scripts/
test-scoreboard.ts` — all 30 existing checks still pass (this feature
didn't touch `lib/scoreboard.ts`).

**Not verified in-browser** — the user explicitly asked for this to be
called out. Unverified: the refresh button and timestamp actually render
where intended and update on click; the "In progress" chip appears at the
right moment and disappears once a result is captured; that pressing Hajime
on a real mat-side Scoreboard genuinely reaches a second machine's Draws
view after a manual refresh, machine-to-machine, which is the actual
end-to-end scenario this feature exists for and hasn't been exercised
outside the HTTP-level test above.

**±1 second clock adjustment (2026-08-08).**
Real-world case: the timekeeper forgets to stop the clock or lets it run a
couple seconds too long and needs a fine correction — the existing ±10s step
is too coarse for that. Added `-1s`/`+1s` buttons next to the existing
`-10s`/`+10s` in `components/scoreboard/BoutScoreboard.tsx`, calling the same
`adjustClock(deltaMs)` closure with `±1_000` instead of `±10_000` — no new
logic, `adjustClock` already generically clamps to `[0, durationMs]` and
re-arms the atoshi-baraku/end signals for any delta. Same gating as the
existing ±10s buttons (`saving || state.ended !== null || clockMs === 0` —
notably *not* gated on `running`, matching the pre-existing behavior that
these buttons work whether the clock is ticking or stopped). Visually
grouped the four buttons (plus Hajime/Yame) under a small "Adjust clock"
label and a two-row layout (±10s flanking Hajime/Yame as before, ±1s as a
smaller row beneath) instead of leaving four disconnected buttons. Since
this feature applies to `BoutScoreboard.tsx` directly, it's automatically
live on both the real-bout Scoreboard and the Practice tab — nothing forked.

No backend change (clock adjustments are ephemeral client state, same as
before). `adjustClock` is a component-internal closure, not an exported pure
function in `lib/scoreboard.ts`, so the pre-existing ±10s behavior was never
covered by `test-scoreboard.ts`; nothing to mirror for ±1s either.

Files: `frontend/src/components/scoreboard/BoutScoreboard.tsx`.

### Verification (run 2026-08-08)

`frontend`: `npx tsc --noEmit` clean. `npx tsx scripts/test-scoreboard.ts` —
all 30 existing checks still pass (this change touches only component JSX/
button wiring, not `lib/scoreboard.ts`).

**Not verified in-browser** — not exercised in a running dev server this
round. In particular unverified: the new buttons' visual grouping/spacing
in the centre column, and that ±1s actually nudges the displayed clock and
re-arms the atoshi/end signals correctly at the boundary.

**Standalone practice / ad-hoc bout scoreboard (2026-08-08).**
Request: a blank AKA vs AO bout under the event hub for practice/exhibition/
teaching, with no database involvement, reusing the real scoreboard's
scoring/timer/awarding-window logic rather than rebuilding it.

**Extraction: `frontend/src/pages/Scoreboard.tsx` was tightly coupled** to a
real `bout`/`draw` (route params, `useQuery(getDraw)`, `canManageEvent`,
`setBoutScore`/`setBoutWinner`, `boutId`-keyed `localStorage` persistence,
navigation to `/draws`) interleaved with a large amount of logic that was
already generic (the clock/action-log/awarding-window state machine,
`resolveOutcome`, `SidePanel`, nearly the whole render tree). Split it: moved
the stateful component wholesale into a new
`frontend/src/components/scoreboard/BoutScoreboard.tsx`, parameterized by
props instead of a `DrawBout`:

- `aka`/`ao: { name, clubName }` — display identity only, no `entryId`.
- `persistKey: string | null` — real bouts pass `boutId` (unchanged
  crash/refresh resume behavior); `null` disables the resume-on-mount and
  persist-on-change effects entirely, so practice mode never touches
  `localStorage` and a refresh genuinely loses the bout.
- `onSaveResult?` / `onSaveWinnerOnly?` — when present, the resolution
  dialog's primary action calls back with a computed result (winner side,
  outcome, scores, `postTime`, `scoreJson`); the component itself does no
  network I/O. When absent (practice mode), the dialog shows **New bout**
  instead of **Save result**, and the "skip scoring, record winner only"
  block in Settings is hidden outright rather than a disabled no-op, per the
  brief ("or the save button hidden").
- `allowDrawDeclaration?` — practice-only; adds a "Call it a draw" option
  next to the hantei picker (real bouts never get this — WKF rules require a
  decisive winner for bracket progression, but a practice bout has no
  bracket).

`frontend/src/pages/Scoreboard.tsx` is now a thin wrapper: fetches the draw,
runs the same permission/not-found guards as before, and adapts
`setBoutScore`/`setBoutWinner` into `onSaveResult`/`onSaveWinnerOnly`
callbacks (still doing its own toast/navigate/error handling — the shared
component only clears its own persisted-bout cache on a successful save,
via a rethrow-on-failure contract). Net: no behavior change for real bouts,
same files doing the same network calls, just relocated.

New page: `frontend/src/pages/hub/Practice.tsx` — owns two `Input`s for
editable AKA/AO names (default "AKA"/"AO", trimmed and falling back to the
default if blank) above the shared `<BoutScoreboard persistKey={null}
allowDrawDeclaration />`, with no `onSaveResult`/`onSaveWinnerOnly` at all.

**One deliberate behavior change to the shared dialog, applied to *both*
modes:** the resolution dialog now shows a large "AKA WINS" / "AO WINS"
banner (colored per side) once a winner is known — including once a hantei
pick is made — instead of the old small "Winner: {name} (outcome)" line that
stayed under the still-visible hantei picker. This was the brief's explicit
ask ("big clear... banner using the existing resolve-outcome logic") and
felt reasonable to apply uniformly rather than forking the dialog's whole
layout by mode. Because this removes the old "pick again from the same
screen" affordance, added a small "Change hantei pick" / "Change" link back
to the picker/draw state — the one deviation from a pure lines-for-lines
port, called out here rather than left silent.

**Permissioning:** `roles: ALL` (`SUPERADMIN, ADMIN, CLUB_MANAGER, COACH,
ATHLETE`) in `EventHubLayout.tsx`'s `TABS` — the same, least-privileged set
already used by Overview/Draws/Run/Results, matching the brief's "match
whatever the least-privileged existing hub route uses" literally. No
additional in-page permission check, consistent with those other tabs.
Tab placed between Estimator and Run; route `/hub/practice` →
`pages/hub/Practice.tsx`.

**Layout tradeoff, called out rather than fixed:** the real Scoreboard is a
full-screen route with no `AppShell` chrome. Embedding the same
`min-h-screen`-styled component inside a hub tab (which lives inside
`AppShell`'s `max-w-7xl` padded container, per the brief's explicit "new tab
in the event hub" placement) means the Practice tab renders as a very tall,
width-constrained panel rather than a true edge-to-edge takeover. Chose not
to special-case the hub layout to break out of that container — a real fix
would mean either a "chromeless" hub-tab escape hatch or duplicating
`AppShell`'s container math with negative margins guessed at rather than
verified; neither felt like the "small refactor" the brief asked for.
Flagging this as the one place the practice experience visibly diverges from
"identical to a real match."

Files: `frontend/src/components/scoreboard/BoutScoreboard.tsx` (new),
`frontend/src/pages/Scoreboard.tsx` (rewritten as a thin wrapper),
`frontend/src/pages/hub/Practice.tsx` (new),
`frontend/src/components/layout/EventHubLayout.tsx`, `frontend/src/App.tsx`.
No backend changes — this feature is entirely client-side by design.

### Verification (run 2026-08-08)

`backend` / `frontend`: `npx tsc --noEmit` both clean (backend untouched,
checked anyway per the standard). `npx tsx scripts/test-scoreboard.ts` — all
30 existing checks still pass unchanged, confirming the pure logic in
`lib/scoreboard.ts` was not touched by this extraction (only the React
component that consumes it moved/split). No new pure-function tests added:
the new practice-mode behavior (draw declaration, the winner banner, hiding
the save flow) lives entirely in `BoutScoreboard.tsx`'s component logic, not
in a new pure function worth a `test-*.ts` script.

**Not verified in-browser** — not exercised in a running dev server this
round, per the same standard as the prior entry. In particular unverified:
the Practice tab actually renders and scores a full bout end-to-end, the
editable name inputs feed through to both side panels and the projected
display broadcast, the "Call it a draw" / "Change" affordances behave as
designed, and the tall/width-constrained layout described above looks
acceptable rather than broken.

**Score after the buzzer: a post-time awarding window (2026-08-08).**
Real-world case: judges saw a valid technique land just before the buzzer and
need to award it, but the scoreboard locked out scoring the instant the clock
hit zero.

Root of the diagnosis: the block was **100% client-side, in
`frontend/src/pages/Scoreboard.tsx`** — `boutOver = state.ended !== null ||
clockMs === 0`, and `controlsDisabled = boutOver || saving` gets passed down
to disable every score/penalty/senshu/kiken button. The backend
(`PUT /draws/:id/bouts/:boutId(/score)`, `DrawService.setBoutWinner`/
`setBoutScore`) has **no time, lock, or status gate at all** — it already
freely accepts a score write at any point, before or long after a bout, draw
locked or not. So there was no server-side enforcement to relax; this is
entirely a frontend UX fix. Also found in passing: the existing ±10-second
clock buttons were only disabled by `state.ended !== null`, not by
`clockMs === 0` — meaning "bump the clock back up to reopen scoring" already
worked as an undocumented workaround. This feature replaces that improvised
trick with an explicit, correct mechanism and disables the ±10s buttons once
the main clock is spent (see below).

**Design shipped: the recommended "awarding window" shape**, not the smaller
fallback (always-open-until-Finalize) — nothing in the code argued against
the richer version, since there's a real, live, ticking client clock
(`clockMs`/`running`, already built for the atoshi-baraku warning and end
buzzer) to key a genuine short window off. Model, in
`frontend/src/lib/scoreboard.ts`:

- `awardMs: number | null` — `null` = not in a window, a number = counting
  down (`0` = spent). Deliberately not a named state-machine type: the rest
  of this page is already written in a reactive/derived style (`boutOver`,
  `resolution` etc. are plain computed values, not stored transitions), so
  this follows the same shape rather than introducing a second style.
- `startAwardingWindow(ended, awardMs, awardWindowMs)` — starts the window
  when the main clock hits zero, *unless* the bout already ended decisively
  (gap/hansoku/kiken at the same instant — no window needed, nothing left to
  award). Idempotent, so it's safe to call from an effect that might re-fire.
- `tickAward` — same `Math.max(0, ms - delta)` shape as the existing main
  clock ticker, ticks independently (the award window isn't pausable —
  once started it just runs, since it's meant to be a short, unambiguous
  grace period, not something the operator manages mid-score).
- `finalizeAwardingWindow()` — the new "Finalize result" button; always
  closes the window to exactly `0` immediately, same end-state as it running
  out naturally.
- `isBoutOver({ ended, clockMs, awardMs })` — the single source of truth
  `controlsDisabled` now derives from: locked once decisively ended
  (regardless of the window), or once the clock is at zero *and* no window
  is actively counting down. This is the one-line summary of the whole
  feature: during an active window, `clockMs === 0` no longer means locked.
- `anyPostTime(log)` — every dispatched action (`SCORE`/`PENALTY`/`SENSHU`/
  `KIKEN`) already carried `at: number`; added an optional `postTime?:
  boolean`, tagged `true` at dispatch time whenever `awardMs` is actively
  counting down. `anyPostTime` folds the log to one flag for the save
  payload — this is the audit-trail request from the brief, done at the
  action level (which action was late) not just a single "was this bout
  late" bit, and it rides along for free inside the existing `scoreJson`
  blob too since that already serializes the whole log.

**Backend, additive only — no gate added.** `Bout.postTime Boolean @default(false)`
(migration `20260808062535_add_bout_post_time`). `SetBoutScore` validator
gained an optional `postTime`; `DrawService.setBoutScore` persists it and
includes it in the `SCORE` audit log's `diffJson`. Reset to `false` in the
two places the other score fields already get nulled out for the same
reason (stale detail): `setBoutWinner`'s winner-only override, and
`recompute`'s upstream-correction branch. Deliberately did **not** add a
lock/status check to the score routes — that would be a scope-creep gate the
brief didn't ask for, and (as found above) the routes never had one; adding
one now would be a behavior change unrelated to this feature.

**Other UI decisions:**

- ±10s clock buttons, and Hajime/Yame, are now also disabled once
  `clockMs === 0` (previously only gated on `state.ended`/`saving`) — the
  awarding window is the one correct path for "more time after the buzzer"
  now, not the old clock-bump workaround.
- The awarding window's remaining time and length are persisted alongside
  the rest of the in-progress bout (`localStorage`, crash/refresh resume),
  so a refresh mid-window resumes where it left off instead of granting a
  fresh window.
- Window length (`awardWindowMs`, default 30s) lives in `ScoreboardSettings`
  next to `durationMs`/`winByGap`, with a matching settings-dialog input.
  The brief said "configurable later" — made it configurable now instead,
  since it's the exact same settings mechanism already in the file; there
  was no real reason to hardcode it and revisit this component again later.
- No new visual indicator for `postTime` on `BracketView`/results — storage
  + the live scoreboard experience satisfies "the audit trail distinguishes
  normal from post-buzzer awards" as asked; a badge elsewhere is a natural,
  separate follow-up, not implemented here.
- Permissioning untouched: still `requireEventManager` (admin or this
  event's coordinator) server-side, still `canManageEvent` client-side —
  scoring *when* changed, scoring *who* did not.

Files: `backend/prisma/schema.prisma`, `backend/prisma/migrations/20260808062535_add_bout_post_time/`,
`backend/src/utils/validators.ts`, `backend/src/services/draw.service.ts`,
`backend/scripts/test-bout-scoring.ts` (new), `frontend/src/lib/scoreboard.ts`,
`frontend/src/lib/draws.ts`, `frontend/src/pages/Scoreboard.tsx`,
`frontend/scripts/test-scoreboard.ts` (new).

### Verification (run 2026-08-08)

`backend` / `frontend`: `npx tsc --noEmit` both clean. Migration applied
against local Postgres (shadow-db permission needed a temporary local
superuser `ALTER ROLE ... CREATEDB`, reverted immediately after).

`npx tsx scripts/test-scoreboard.ts` (frontend, pure functions) — 30 checks,
including the exact lifecycle named in the brief: clock reaches 0 → window
opens → a late score is tagged `postTime` → window ticks to 0 → bout locks;
plus "Finalize clicked early" and "a decisive ending pre-empts an active
window" as separate scenarios.

`npx tsx scripts/test-bout-scoring.ts` (backend, real HTTP against local
Postgres, isolated port so as not to disturb another session's dev server)
— 15 checks: `postTime` round-trips through both the write response and a
fresh `GET`; defaults to `false` when omitted; resets on a winner-only
override; the audit log's `diffJson` reflects `postTime` on the write
immediately after it (checked per-write, not just "the latest row", after
catching a mistake doing exactly that while writing this test); a
coordinator (not just an admin) can set it; a plain club manager with the
grant revoked still gets 403 — confirming permissioning is unchanged.
`scripts/test-draws.ts` and `scripts/test-event-scope.ts` re-run clean
(0 failures) as regression checks.

**Not verified in-browser** — the user explicitly asked for this to be
called out rather than exercised this round. The actual timer ticking,
the amber banner's appearance/timing against the real 100ms interval, the
Finalize button's placement, and the settings-dialog input have only been
read, not clicked through.

**Run → Plan tab: mat assignment actually works now (2026-08-07).**
User report: "as i add categories to mats or floors, it shows either 1 or 0 as
the order, and nothing shows under the specific mat." Both halves were real,
and independent:

- *Order was always 0.* `PlanTab` sent `matOrder: row.draw.matOrder ?? 0` on
  assign, and `assignDrawMat` stored `data.matOrder ?? 0` — so every category
  newly put on a mat landed on order 0 and nothing was ordered relative to
  anything. The only way to change it was a `type="number"` input that fired a
  mutation on **every keystroke** while being controlled off server state, so
  the refetch clobbered the field mid-typing and you could never get past a
  single digit. `assignDrawMat` now appends to the end of the mat
  (`max(matOrder)+1`, self excluded, `nulls: "last"`), keeps the slot a draw
  already has on that mat, and the number input is gone.
- *Nothing showed under the mat.* The mats column rendered only the mat name
  and its up/down/delete buttons — the assigned categories were never rendered
  anywhere. Each mat card now lists its categories in running order (numbered,
  with entry count and a lock marker) and they reorder by drag, matching the
  dnd-kit pattern the Run tab already uses for bouts.

New backend endpoint `PUT /api/run/mats/:matId/category-order` with
`{ drawIds }` (`RunService.reorderMatDraws`) writes `matOrder = index`
transactionally, mirroring the existing `reorderMatQueue` for bouts.

Also fixed while in there: `createMat` picked `order = count(mats)`, so
deleting a mat from the middle handed the next new mat an order that already
existed, and the up/down swap between the two colliding mats did nothing. It
now uses `max(order)+1`.

Verified in the browser against the local DB with three seeded categories
across two mats: assigning gave orders 0/1/2 (not 0/0/0), re-assigning to the
same mat kept the slot, moving to another mat started at 0 there, and a drag
reorder persisted through the new endpoint. Both projects `tsc --noEmit`
clean. The seeded fixtures were deleted afterwards.

**Run page honours the coordinator grant (2026-08-07).** The third and fourth
pages with the `role`-only check that `state.md` records being fixed on
Entries and Draws — `RunPage` and `ScoreboardPage` both computed
`canManage = role === "ADMIN" || "SUPERADMIN"`, so a club-manager coordinator
got a read-only Run/Check-in/Plan tab and "Only admins can operate the
scoreboard", even though every mutating route behind them
(`/api/run/*`, `/api/draws/:id/bouts/*`) already uses `requireEventManager`
and would have accepted them. Both now use `canManageEvent(eventId)`.

`ScoreboardPage` is reached by `drawId`, not through the hub's event
selection, so it scores the grant against `draw.eventId` — which means the
permission guard now has to wait for the draw query. Its guard order changed
to loading → permission → bout-not-found, otherwise a coordinator got a flash
of the denial screen on first render while `draw` was still undefined.

Verified in the browser with a throwaway CLUB_MANAGER + `EventCoordinator`
grant: on the granted event the Score/AKA/AO/Kiken/Move controls, the mat
editor and the scoreboard console all appear, and a mat assignment PATCH came
back 200. On an event without the grant the Plan tab stays read-only. Fixtures
deleted afterwards.

**Swept the rest of the frontend for the same bug (2026-08-07).** One more
found and fixed: `hub/Overview.tsx` hid `PublicBoardShare` behind an `isAdmin`
check, but `POST /events/:id/public-token` is `requireEventManager` — so a
coordinator could not turn on the spectator board for their own event. Now
`canManageEvent(eventId)`; verified 200 on the granted event and 403 on
another, matching the new gate exactly.

The remaining `role ===` checks were each checked against the route they
front, and are **correct as they stand — do not "fix" them**:

- `hub/Setup.tsx` `canAppoint` — coordinator appointment
  (`POST/DELETE /events/:id/coordinators`) is deliberately
  `requireRoles("SUPERADMIN","ADMIN")`; a coordinator appointing coordinators
  would be an escalation. `GET /:id/coordinators` is `requireEventManager`, so
  they correctly see the roster read-only.
- `EventManagement.tsx` (entries board) — the entry routes are club-scoped,
  not event-scoped: `POST/DELETE /entries` and `EntryService.updateStatus`
  check `req.user.clubId`, and `assertRegistrationOpen` bypasses only for
  ADMIN/SUPERADMIN. So `addBlocked = !isAdmin && !reg.open` and the admin-only
  club switcher both mirror the server. Giving coordinators cross-club entry
  creation is a **backend authorization decision**, not a frontend fix.
- `Belts`, `Clubs`, `Users`, `Athlete*`, `Dashboard`, `Events` — global or
  club-scoped, never event-scoped. Role is the right question there.

Known rough edge, **not** a permission bug and left alone: in
`EntriesView.tsx` a coordinator correctly receives every club's entries
(`GET /entries` has an explicit coordinator branch) but the club filter is
`isAdmin`-only, so they cannot narrow the list. Fixing it needs a backend
change too — `GET /clubs` is `requireRoles("SUPERADMIN","ADMIN")`, so a
coordinator cannot even fetch the club list.

Previously, same day:

**Estimator now estimates WKF double-repechage bronze bouts (2026-08-07).**
User report: "for the boys 8-9 for instance there are 9 entries. this should
have 10 bouts including repechage. i think your bout numbers are not right."
The app was showing 8 (`entries - 1`, the "v1 doesn't count repechage at all"
limitation flagged in the previous entry below). Checked the claim rather
than taking either side on faith:

- Wrote a 20,000-trial Monte Carlo simulation of this app's own
  `computeDrawState` bracket algorithm (random winner at every real match,
  since we don't know results in advance) for N=2..24. Result: **the true
  bout count is not deterministic for non-power-of-2 entry counts** — a
  9-entry bracket comes out to 10 total bouts ~75% of the time and 11 the
  rest, because *who* reaches the final (and therefore how many real
  opponents they beat) depends on match outcomes, not just entry count.
  Power-of-2 sizes (4, 8, 16, ...) have zero variance — deterministic, not
  approximate. This means neither "8" (the old number) nor a single "correct"
  10 exists in the platonic sense — but 8 was flatly wrong (it's the *main
  bracket only*, missing repechage entirely), while 10 is the correct
  **expected value**, and the right statistic for a duration estimate is
  exactly that: an expectation, not a guess at the single most likely integer.
- Derived and implemented an exact closed-form expectation: ported
  `bracketPositions` (`backend/src/services/draw.service.ts`) to the frontend
  — deterministic given `size` alone, so bye placement is computable from
  entry count without an actual draw or even real entry identities existing
  yet — then a recursive `expectedOpponents(occupied, lo, hi)` that computes,
  by symmetry (every real entrant in a sub-range is equally likely to emerge
  as that range's winner under a fair coin-flip), the exact expected number of
  real opponents the eventual winner of any bracket range will have beaten.
  `estimatedRepechageBouts(n)` combines this per bracket half, rounded to the
  nearest whole bout. Cross-checked this closed form against the Monte Carlo
  simulation's mean across the same N range before trusting it.
- Note honestly recorded in the code and the tests: rounding the expectation
  does not always land on the *mode* (N=5 rounds to 1 repechage bout, but the
  more common single outcome is actually 0) — expectation and mode are
  different statistics and can diverge for skewed discrete distributions.
  Expectation is what's implemented, deliberately, because it's the
  statistically correct quantity for "how long will this take on average."
- `deriveKumiteBoutBreakdown` now adds `estimatedRepechageBouts(effectiveN)`
  on top of the exact main-bracket count (`effectiveN - 1`) for every
  category, drawn or not — `KumiteCategoryData.drawBoutCount` was renamed to
  `drawEntryCount` (now an entry count feeding both parts of the calculation,
  not a pre-computed bout count) and `Estimator.tsx`'s draw-detail query
  updated to match (`slots.length`, not `slots.length - 1`).
- UI copy (badge tooltip, caveat paragraph) rewritten to stop saying
  repechage is excluded and instead explain it's an expectation that can land
  a bout or two off once the bracket is actually fought.

Files: `frontend/src/lib/estimator.ts`, `frontend/scripts/test-estimator.ts`,
`frontend/src/pages/hub/Estimator.tsx`.

### Verification (run 2026-08-07)

`npx tsc --noEmit` clean. `npx tsx scripts/test-estimator.ts` — 46/46
passing, including a new `estimatedRepechageBouts` table (N=4→0, N=5→1,
N=7→2, N=8→2, N=9→2, N=16→4 repechage bouts) verified against both the
Monte Carlo simulation and the closed-form recursion before being written
down, plus updated `deriveKumiteBoutBreakdown` fixtures reflecting the new
totals.

In-browser (isolated backend 4099 + frontend 5174 against local Postgres):
created a real 9-entry "Boys 8-9" kumite division (no draw) on the same
event used in prior estimator verification sessions. Rendered exactly:
**"Boys 8-9 · 9 entries · estimated · 10 bouts · ≈49min"** — matching the
user's report precisely. Also re-checked F04 - Girls 10 (7 entries, drawn),
which now correctly shows 8 bouts (was 6 before this change: 6 main +
repechage(7)=2). Total-time math re-verified by hand against the displayed
formula (18 bouts → `1h 45min`). Console clean apart from the
already-documented benign pre-login 401s. Test fixtures (division, athletes,
entries) deleted after verification.

**Estimator breakdown now shows entries and a per-division duration
(2026-08-07).** Follow-up ask: the breakdown table only showed bout count per
division; added entry count and an estimated duration alongside it.

- `DivisionBoutBreakdown` (`frontend/src/lib/estimator.ts`) gained an
  `entries` field — summed across weight classes the same way `bouts` already
  is, in `deriveKumiteBoutBreakdown`. It reflects today's live entry count
  regardless of `source` (drawn categories still report their real entry
  count for `entries`, same as before for `bouts`).
- New pure function `minutesForDivision(bouts, inputs)`: that division's own
  bout time with the buffer applied, plus one changeover — deliberately
  **not** divided across mats, since mat allocation is a shared, event-wide
  resource (`estimateKumiteDuration`'s job), not a per-division one. Kept
  separate from `estimateKumiteDuration` rather than folded into its return
  value, so that function's existing signature/tests didn't need to change.
- `Estimator.tsx`'s breakdown row now reads: division name → entries →
  source badge → bouts → `≈ Xmin` (via `formatDuration(minutesForDivision(...))`),
  with a tooltip on the duration explaining it isn't mat-divided.

Files: `frontend/src/lib/estimator.ts`, `frontend/scripts/test-estimator.ts`,
`frontend/src/pages/hub/Estimator.tsx`.

### Verification (run 2026-08-07)

`npx tsc --noEmit` clean. `npx tsx scripts/test-estimator.ts` — 6 new checks
(`minutesForDivision`: buffer+changeover math, 0/negative bouts → 0, mat
count doesn't affect a single division's duration, per-division minutes
don't undershoot the pooled total; plus two `entries`-summation checks on the
existing `deriveKumiteBoutBreakdown` fixtures), 40/40 total passing.

In-browser: isolated backend (4099) + frontend (5174) against local
Postgres, same real "Draw Engine Demo Event" data as the previous session's
verification. F04 - Girls 10 (7 approved entries, a drawn bracket) rendered
"7 entries · drawn · 6 bouts · ≈32min" — checked ≈32min by hand:
`6 × 4 × 1.10 = 26.4`, `+ 5min changeover = 31.4`, `ceil = 32`. Matches
exactly. Console clean apart from the already-documented benign pre-login
`/auth/me` 401s. Did not re-verify the multi-row (drawn + estimated) layout
in-browser this pass — the previous session's screenshot already confirmed
that layout works, and this change only adds two columns to it, not new
row-branching logic.

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
