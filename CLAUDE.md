# Agent Guidelines for this Repository

## Language Rules (Strict)

- **Code, comments, identifiers, variable names, function names, error messages,
  log messages, documentation strings — anything related to the codebase — MUST
  be in English, no exceptions.**
- Do not use any other language for anything that ends up in a source file,
  config file, or migration.
- **Chat / communication with the developer:** answer in the language the
  developer writes in. This applies only to the agent-to-human chat; it never
  overrides the code-is-English rule above.

## What this repository is

This is the **source of the `create-stack` scaffolder** — it is not an
application and it does not contain apps. Running the CLI generates a
standalone prototype monorepo anywhere on disk (or on any machine, via
`bunx` / `npx` / `pnpm dlx`).

```
bin/create-stack.mjs   Committed Node bundle — the published entry point
tooling/create-stack/    TypeScript source of the CLI (bundled into bin/)
templates/vite-hono/   App template 1 — becomes the generated project root
templates/next/        App template 2 — becomes the generated project root
templates/_shared/     Files every generated project gets (placeholders, dotfiles)
packages/              Shared packages copied into every generated project
biome.json             Shared Biome config — used here AND copied to projects
tsconfig.base.json     Shared TS base — used here AND copied to projects
docker-compose.yml     Postgres for developing this repo (projects get the
                       templated variant from templates/_shared/)
```

### The committed bundle is load-bearing

`bin/create-stack.mjs` is a **generated file that must stay committed**. It is
what `npx github:mantaray0/boilerplate` executes, and committing it means the
install needs no build step and no dev dependencies.

**After every change under `tooling/create-stack/src/`, run `bun run build` and
commit the regenerated bundle.** `bun run smoke` verifies the scaffolder still
produces working projects.

### The workspaces list starts with "."

`workspaces` in the root `package.json` is `[".", "packages/*", "tooling/*"]`.
The `"."` entry is load-bearing: the published package **is** the repository
root, and Changesets only versions workspace members. Remove it and
`changeset version` fails with *"not in the workspace"*, which silently breaks
releasing. Bun accepts the self-entry without creating a self-link.

### Releases go through Changesets

Never edit `version` in `package.json` or `CHANGELOG.md` by hand. Any change
that reaches a generated project needs a changeset in the same commit:

```bash
bun run changeset
```

Pushing to `main` opens a "Version Packages" pull request; merging it publishes
to npm. See the Releasing section in `README.md` for the full flow and the
one-time npm setup.

### Two audiences, two guideline files

- This file (and the identical `CLAUDE.md`) describes **working on the
  boilerplate**.
- `templates/_shared/AGENTS.md` is copied into every **generated project** as
  both `AGENTS.md` and `CLAUDE.md`. Rules that should reach generated projects
  belong there, not here.

## Commands

- Install: `bun install` (Bun only, no npm/pnpm/yarn)
- Node >= 20.12 is required to work on this repo (Changesets v3). The published
  CLI itself still runs on Node >= 18, which is what `engines` declares.
- Build the CLI bundle: `bun run build`
- Smoke-test the scaffolder: `bun run smoke`
- Deep-verify the templates: `bun run verify`
- Add release notes: `bun run changeset`
- Scaffold from source (dev loop): `bun run create /tmp/test-idea --template next -y`
- DB (for developing `packages/db`): `bun run db:up`, `bun run db:push`, `bun run db:generate`
- Lint/Format: `bun run lint`, `bun run format` (Biome, no ESLint/Prettier)
- Types: `bun run typecheck`

## Code Quality & Naming Conventions (Biome)

Naming conventions are **technically enforced by Biome via `biome.json`** —
agents do not need to keep them all in manual memory. Instead, after ANY code
changes, ALWAYS run:

1. `bun run format` (applies safe fixes including naming corrections)
2. `bun run lint` (verifies everything passes — must exit with code 0)

Concrete rules enforced (see `biome.json` for details):

- Component files in `components/` + `packages/ui/src/*.tsx`: `PascalCase.tsx`
- All other `.ts` modules: `kebab-case.ts`
- Component functions, types, interfaces, classes, enums: `PascalCase`
- Functions, variables, parameters, members: `camelCase`
- Global `const`: `camelCase`, `CONSTANT_CASE`, or `PascalCase`
- Framework route files (Next.js `app/`, Hono `server/routes/`) are exempt
  from the filename check

Run `bun run typecheck` before any larger commit as well.

## Git / Conventional Commits

All commits MUST follow **Conventional Commits**. Format:
`type(scope): description`

- **types:** `feat` (new feature), `fix` (bug fix), `refactor`, `perf`,
  `style` (format-only, no code logic change), `docs`, `test`, `chore`,
  `build`, `ci`, `revert`
- **scope (optional):** package or app area, e.g. `feat(ui)`, `fix(db)`,
  `chore(cli)`, `docs(readme)`
- **description:** imperative mood, lowercase, no trailing period
- Breaking changes: append `!` after type/scope, e.g. `feat(api)!: remove old endpoint`,
  and optionally add a `BREAKING CHANGE:` line in the body.
- Examples:
  - `feat(ui): add new Select component`
  - `fix(db): correct project table foreign key`
  - `chore(deps): update biome to latest`
  - `docs(readme): extend quickstart section`

## Conventions

- Files: Components use `PascalCase.tsx`, every other module uses `kebab-case.ts`.
- Functions/variables use `camelCase`; types/interfaces use `PascalCase`.
- Add comments only when explicitly requested.
- Shared code lives only in `packages/`: ui (React Aria + Tailwind v4), db (Drizzle),
  auth (Better Auth), validators (Zod v4).
- Tailwind v4 is configured CSS-first (`@theme` in `packages/ui/src/styles.css`) —
  do not create a `tailwind.config.js`.
- Use Zod v4 API (e.g., `z.uuid()` instead of `z.string().uuid()`).

## Architecture Rules

- vite-hono template: API routes in `server/routes/*.ts` as chained Hono instances
  (important for RPC types), validation via `zValidator` + schemas from `@repo/validators`.
- next template: data access in Server Components, mutations as Server Actions in
  `src/lib/actions/`; no separate API layer except `app/api/auth/*`.
- New tables: extend the schema in `packages/db/src/schema.ts`, then run `bun run db:push`.
- Do not rename Better-Auth tables (user, session, account, verification).
- The Postgres connection string is resolved once in
  `packages/db/src/connection.ts` and reused by the runtime client and
  drizzle-kit.

## Scaffolder rules

- The CLI must run on **plain Node** (>= 20.11), not just Bun: no Bun-only APIs
  in `tooling/create-stack/src/`, only `node:` built-ins, and zero runtime
  dependencies.
- npm strips `.gitignore` from published tarballs. Dotfiles that need to reach
  generated projects live in `templates/_shared/` **without** the leading dot and
  are mapped back via `dotfileTargets` in `constants.ts`.
- Anything that differs per project (container names, database names) must use
  the `{{APP_NAME}}` / `{{APP_TITLE}}` placeholders so two prototypes can run
  side by side on one machine.
