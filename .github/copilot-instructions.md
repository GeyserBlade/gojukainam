# Copilot instructions

Instructions for this repo are shared across all coding agents and live in
[`AGENTS.md`](../AGENTS.md). Read it, plus `docs/state.md` (work in flight),
`docs/architecture.md`, and `docs/conventions.md`.

Highlights that matter most when suggesting code here:

- Backend is ESM TypeScript — relative imports end in `.js`.
- Every Express route gets `requireRoles(...)`, and club-scoped routes also
  check `req.user.clubId`. Errors go to `next(err)`.
- Validation is Zod, from `backend/src/utils/validators.ts`.
- Frontend uses TanStack Query with flat array query keys, shadcn primitives from
  `@/components/ui`, and Tailwind v4 semantic tokens — never hardcoded hex colours.
