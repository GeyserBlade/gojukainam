# Conventions

Companion to [`../AGENTS.md`](../AGENTS.md). Copy these patterns; don't invent
parallel ones.

## Backend

### Adding a resource

1. **Schema** — add the model to `backend/prisma/schema.prisma`, then
   `npx prisma migrate dev --name <change>` from `backend/`.
2. **Validators** — add Zod schemas to `utils/validators.ts` (`CreateX`,
   `UpdateX`), reusing the shared enums (`GenderEnum`, `EntryTypeEnum`,
   `EntryStatusEnum`, `RoleEnum`, `EventStatusEnum`) and the `dateSchema`
   preprocessor for date fields.
3. **Service** — `services/x.service.ts` exporting a class of static methods.
   Parse input with the Zod schema inside the service, define a shared
   `xSelect` object for the Prisma `select`, and return plain data.
4. **Route** — `routes/x.ts` exporting `const router = Router()`. Every handler
   is `async (req, res, next)` wrapped in `try { … } catch (err) { next(err) }`.
5. **Mount** — import in `server.ts` as `import { router as x } from "./routes/x.js"`
   and `app.use("/api/x", authMiddleware, x)` alongside the others.

### Route handler shape

```ts
router.get("/:id", requireRoles("SUPERADMIN", "ADMIN", "CLUB_MANAGER"), async (req, res, next) => {
  try {
    const id = getParam(req.params.id);
    const club = await ClubService.getById(id);
    if (!club) return res.status(404).json({ error: "Not found" });

    const role = req.user?.role;
    if (role !== "SUPERADMIN" && role !== "ADMIN") {
      if (req.user?.clubId !== id) return res.status(403).json({ error: "Forbidden" });
    }

    res.json(club);
  } catch (err) { next(err); }
});
```

Rules baked into that shape:

- `requireRoles(...)` on **every** route — there is no default-deny fallback
  beyond authentication.
- Role check and **club-ownership check are separate**. `requireRoles` says
  "this kind of user may call this"; the body says "…for this club".
- 404 before 403 only when the resource is not club-scoped; otherwise check
  ownership before revealing existence.
- Errors go to `next(err)`; never `res.status(500)` by hand.
- Status codes: 201 on create, 200 with the updated entity on update, 204 or
  `{ ok: true }` on delete — match the neighbouring routes in the same file.

### Style

- ESM: relative imports **must** end in `.js` (`"../lib/prisma.js"`).
- Double quotes, semicolons, 2-space indent.
- `console.error` in the error handler is the logging story; no logger library.
- Comments explain *why* (see the CORS and rate-limit blocks in `server.ts`),
  not *what*.

## Frontend

### Data fetching

- One typed module per resource in `src/lib/` exporting plain async functions
  (`listClubs()`, `getClub(id)`, `createClub(payload)`) plus the exported TS type
  for the entity. Types are hand-written to mirror the service's `select` — keep
  them in sync when you change the backend shape.
- Pages consume those via TanStack Query. Query keys are **flat arrays of
  primitives**, resource name first, then the parameters that scope the result:

```ts
useQuery({ queryKey: ["athletes", filters.clubId, role, filters.showInactive], queryFn: … })
queryClient.invalidateQueries({ queryKey: ["athletes"] })
```

  Keep the prefix stable so a broad `invalidateQueries` still matches, and give
  **different result sets different keys** — `["events", "all"]` vs
  `["events", "active"]`, never the same key for both.
- Pass a lambda, not the API function itself: `queryFn: () => listEvents(true)`.
  `queryFn: listEvents` hands TanStack's context object to the function's first
  parameter, which silently produced wrong arguments here (see
  [`state.md`](state.md)).
- Mutations use `useMutation` + `invalidateQueries` on success. Bulk operations
  fire in parallel with `Promise.allSettled`, then invalidate **once**.

### UI

- Import primitives from `@/components/ui/*` (shadcn-style over Radix). Add new
  primitives with the shadcn CLI rather than writing them by hand.
- `@/` maps to `frontend/src/` (`tsconfig.json` paths). Use it instead of deep
  relative imports.
- Class names compose with `cn()` from `@/lib/utils`.
- Feedback comes from the app hooks, not `window.alert`/`confirm`:
  - `useToast()` and `useApiErrorToast()` from `@/components/Toast`
  - `useConfirm()` from `@/components/ConfirmDialog` — returns `Promise<boolean>`, so `await` it
  - loading/empty states from `@/components/UIState` and `ui/skeleton`
- Page chrome is `AppShell` from `@/components/layout`.
- Icons are `lucide-react`.
- Forms use `react-hook-form` + `@hookform/resolvers` with Zod schemas, and
  `FieldError` for messages.

### Styling and theme

Tailwind v4, configured entirely in `src/index.css` via `@theme inline` — there
is no meaningful `tailwind.config.js` to edit.

- **Dark is the default**; light mode is opt-in via `html.light`, and the
  `dark:` variant is defined as `&:where(.dark, .dark *)`. When adding styles,
  write the dark values as the base and layer light overrides in `html.light`.
- Use the semantic tokens (`bg-background`, `text-muted-foreground`,
  `border-border`, `bg-primary`, …). **Never hardcode hex colours** in
  components — add a token to `index.css` if a new colour is genuinely needed.
- Domain palettes already exist: the belt ramp (`--belt-white` …
  `--belt-black`, used by `BeltBadge`) and Namibian flag accents
  (`--flag-red`, `--flag-blue`, `--flag-green`). Primary is flag red.
- Fonts: `--font-sans` = Inter Variable, `--font-display` = Bebas Neue (headline
  accents). Both are self-hosted via `@fontsource`.

### Roles in the UI

`useAuth()` gives `role` and `clubId`. Admin roles (`SUPERADMIN`, `ADMIN`) get
club pickers and cross-club data; `CLUB_MANAGER` / `COACH` are locked to their
own `clubId` — pass it into the query key and the API call rather than
filtering client-side after fetching everything.

## Verification before you call something done

```bash
cd backend && npx tsc --noEmit && npm run build
cd frontend && npx tsc --noEmit && npm run build
```

Notes on those commands:

- **Both projects are currently type-clean — keep them that way.** Any error is
  a regression from your change, not background noise.
- TypeScript is 6.0.3 (installed transitively — neither project lists it as a
  direct dependency).
- `npm run build` on the frontend is Vite/esbuild and does **not** type-check,
  so a green build proves nothing about types. Run `tsc` separately.
- Don't reintroduce `baseUrl` in `frontend/tsconfig.json`. TS 6 treats it as a
  fatal deprecation (TS5101) and aborts the type-check before reading any file,
  so errors accumulate invisibly. The `@/*` mapping works without it, written as
  `["./src/*"]`.

There are no automated tests. If a change is user-visible, run the frontend dev
server and exercise the actual screen; say plainly what you verified and what
you didn't.
