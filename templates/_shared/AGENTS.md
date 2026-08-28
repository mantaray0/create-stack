# Agent Guidelines for {{APP_TITLE}}

Generated with create-stack. This file and `CLAUDE.md` are
identical — different agents look for different file names.

## Language Rules (Strict)

- **Code, comments, identifiers, variable names, function names, error messages,
  log messages, documentation strings — anything that ends up in a source file,
  config file or migration MUST be in English, no exceptions.**
- **Chat / communication with the developer:** always answer in the language the
  developer writes in. This applies only to agent-to-human chat; it never
  overrides the code-is-English rule above.

## Project

Bun workspace monorepo. The app lives at the repository root, shared code lives
in `packages/*`.

## Commands

- Install: `bun install` (Bun only, no npm/pnpm/yarn)
- Dev: `bun run dev`
- Build: `bun run build`
- DB: `bun run db:up`, `bun run db:push`, `bun run db:generate`, `bun run db:studio`
- Lint/Format: `bun run lint`, `bun run format` (Biome, no ESLint/Prettier)
- Types: `bun run typecheck`

## Code Quality & Naming Conventions (Biome)

Naming conventions are **technically enforced by Biome via `biome.json`** —
you do not need to keep them all in manual memory. After ANY code change, ALWAYS
run:

1. `bun run format` (applies safe fixes including naming corrections)
2. `bun run lint` (must exit with code 0)

Concrete rules enforced (see `biome.json`):

- Component files in `components/` and `packages/ui/src/*.tsx`: `PascalCase.tsx`
- All other `.ts` modules: `kebab-case.ts`
- Component functions, types, interfaces, classes, enums: `PascalCase`
- Functions, variables, parameters, members: `camelCase`
- Global `const`: `camelCase`, `CONSTANT_CASE` or `PascalCase`
- Framework route files (Next.js `app/`, Hono `server/routes/`) are exempt from
  the filename check

Run `bun run typecheck` before any larger commit as well.

## Git / Conventional Commits

All commits MUST follow **Conventional Commits**: `type(scope): description`

- **types:** `feat`, `fix`, `refactor`, `perf`, `style`, `docs`, `test`, `chore`,
  `build`, `ci`, `revert`
- **scope (optional):** package or app area, e.g. `feat(ui)`, `fix(db)`
- **description:** imperative mood, lowercase, no trailing period
- Breaking changes: append `!`, e.g. `feat(api)!: remove old endpoint`

## Conventions

- Files: components use `PascalCase.tsx`, every other module uses `kebab-case.ts`.
- Functions/variables use `camelCase`; types/interfaces use `PascalCase`.
- Add comments only when explicitly requested.
- Shared code lives only in `packages/`: ui (React Aria + Tailwind v4),
  db (Drizzle), auth (Better Auth), validators (Zod v4).
- Tailwind v4 is configured CSS-first (`@theme` in `packages/ui/src/styles.css`) —
  do not create a `tailwind.config.js`.
- Use the Zod v4 API (e.g. `z.uuid()` instead of `z.string().uuid()`).

## Architecture Rules

- **vite-hono:** API routes in `server/routes/*.ts` as chained Hono instances
  (important for RPC types), validation via `zValidator` + schemas from
  `@repo/validators`.
- **next:** data access in Server Components, mutations as Server Actions in
  `src/lib/actions/`; no separate API layer except `app/api/auth/*`.
- New tables: extend `packages/db/src/schema.ts`, then run `bun run db:push`.
- Do not rename the Better Auth tables (`user`, `session`, `account`,
  `verification`).
- The connection string is resolved in `packages/db/src/connection.ts`:
  `DATABASE_URL` wins, otherwise it is derived from the `POSTGRES_*` variables
  that `docker-compose.yml` uses.
