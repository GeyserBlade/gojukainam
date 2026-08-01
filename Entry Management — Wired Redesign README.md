# Entry Management — Wired Redesign

Design note for `frontend/src/pages/EventManagement.tsx` and the
`frontend/src/pages/event-management/` folder of supporting components.

> **Status: shipped 2026-08-01.** This document was written before the screen
> was ported onto the event hub, so the "Dependencies", "API used" and
> "Migration" sections below describe the original drop-in and are kept for the
> rationale, not as current instructions. What actually changed on the way in:
>
> - It renders inside `EventHubLayout` and takes the event from
>   `useSelectedEvent()` — no `AppShell`, no event picker of its own.
> - It fetches `GET /api/events/:id/athlete-pool`, a **new endpoint added for
>   this screen**, not `listAllAthletes()`. The claim below that no backend
>   changes were required turned out to be wrong: the athlete-list endpoints are
>   SUPERADMIN-only for the all-clubs case and carry PII this screen has no
>   business loading.
> - Registration-window gating (`registrationState`) and `statusReason` display
>   were added; both postdate the original draft.
>
> See `docs/state.md` for the port's verification record.

## What changed vs. the previous screen

**Before:** "Pick one division → see eligible athletes for that division →
add them one by one. Switch division, repeat."

**After:** A single screen that shows **every division at once**:

- **Athlete pool** on the left, with search, club filter, belt filter, and
  entered/unentered toggle.
- **Division boards** on the right, grouped by age band (default) or category.
- **Live eligibility ghosting**: hover or select an athlete and ineligible
  boards dim, eligible ones glow. Partial selections show "N of M eligible."
- **Drag-and-drop** athletes onto any board. Multi-select drags them as a stack.
- **Bulk action bar** when athletes are multi-selected: enrol every selected
  athlete into every eligible Kata division, every eligible Kumite, or both —
  in one click. Live counts show how many entries each action will create.
- **Per-athlete expansion**: click the chevron on a row to see every division
  the athlete is eligible for as toggleable pills (with current entries
  highlighted).
- **Inline limit warnings** wired to `event-config.yaml`'s
  `maxIndividualEventsPerAthlete` via the event's `configJson`.
- **Live stats strip** in the header: athletes entered, total entries,
  pending, approved, fees (in event currency), over-limit count.
- **Submit-all-drafts** button at the top — fires `EntryService.updateStatus`
  in parallel for every DRAFT entry, with confirm.

## Files

```
frontend/src/pages/
  EventManagement.tsx                         ← replaces the old file
  event-management/
    AthletePool.tsx                           ← left pane (filters + list)
    AthleteRow.tsx                            ← row with expansion
    DivisionBoard.tsx                         ← droppable board card
    BulkActionBar.tsx                         ← floating bulk action bar
    eligibility.ts                            ← pure utility functions
    types.ts                                  ← shared TS types
```

## Dependencies

Uses only what's already in your `package.json`:

- `@dnd-kit/core` — `DndContext`, `useDraggable`, `useDroppable`, `DragOverlay`
- `@tanstack/react-query` — `useQuery`, `useMutation`, `useQueryClient`
- `lucide-react` — icons
- Your existing shadcn primitives (`Card`, `Badge`, `Button`, `Input`,
  `Tabs`, `DropdownMenu`, `Skeleton`)
- Your existing helpers (`AppShell`, `useAuth`, `useToast`, `useApiErrorToast`,
  `useConfirm`, `BeltBadge`, `cn`)

No new dependencies. No backend changes required.

## API used

All from your existing `frontend/src/lib/*`:

- `listEvents(activeOnly=true)`, `getEvent(id)`, `getDivisions(eventId)`
- `listAthletes(clubId)` / `listAllAthletes()`
- `listClubs()`
- `EntryService.list({eventId, clubId?})`
- `EntryService.create({eventId, clubId, divisionId, entryType, athleteId})`
- `EntryService.delete(id)`
- `EntryService.updateStatus(id, status)`

The eligibility check is performed **client-side** from `athlete.dob`,
`athlete.gender`, `division.minAge`, `division.maxAge`, `division.gender` — so
no extra endpoint is needed. (The old `/events/:id/divisions/:id/eligible-athletes`
endpoint is no longer called by this screen but remains available for other
uses.)

## Notes / decisions

- **Teams are not handled in this view.** The old screen had `TEAM_KATA` /
  `TEAM_KUMITE` controls that were largely click-throughs. The new pool/board
  model is built around individual athletes; team enrolment is a different
  flow (build a roster, then enrol the team) and probably wants its own page.
  Teams that *are* already entered will display correctly — they're just not
  creatable here.
- **Weight classes**: not auto-selected on Kumite individual creates. The old
  screen had a separate Weight class dropdown; I left this to a follow-up — a
  "Set weight class" affordance on Kumite entries that surfaces after creation
  is a better UX than gating the create.
- **Permission scoping**: SUPERADMIN/ADMIN can target any club via the admin
  club filter; CLUB_MANAGER/COACH is locked to `useAuth().clubId`. No backend
  change required — `EntryService.list` already accepts `clubId`.
- **Mutation strategy**: bulk operations fire `EntryService.create` in
  parallel via `Promise.allSettled`, then invalidate once. Partial failures
  are surfaced via toast.

## Migration

1. Copy `frontend/src/pages/EventManagement.tsx` into place (overwrites the
   existing file).
2. Copy the `frontend/src/pages/event-management/` folder into place (new).
3. Verify your `tsconfig.json` `paths` already maps `@/*` to `src/*` — yours
   does.
4. `npm run dev` — that's it.

If your linter complains about `confirm()` (the `useConfirm` hook returns
`Promise<boolean>` not `boolean`), the calls already `await` it correctly.

## Things you might want to tweak

- The `groupBy` toggle (Age / Category) is exposed as local state. If you want
  this to persist per-user, lift it to a settings store.
- The athlete pool currently fetches `listAllAthletes()` for admins viewing
  "All clubs". On a very large dataset (thousands of athletes), you may want
  to virtualize the list — `react-virtuoso` or `@tanstack/react-virtual` plug
  in cleanly to the `<AthletePool>` list section.
- The drag activation distance is 6px — tweak in the `PointerSensor` config
  if it conflicts with tap-to-select on mobile.
