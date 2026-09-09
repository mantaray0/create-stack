# @mantaray0/create-stack

## 0.3.0

### Minor Changes

- 6c44a66: Add the `next-hono` template and make it the new default.
  
  `next-hono` pairs a Next.js 16 app (Server Components and Server Actions,
  exactly like `next`) with a read-only Hono API mounted in a route handler at
  `src/app/api/[[...route]]/route.ts` — one process, one port. The route handlers
  hold no logic of their own: they resolve the caller and call the same
  `src/lib/queries/*` functions the Server Components use, so the API and the
  pages cannot drift. `ApiRoutes` is re-exported there for clients outside the
  app to call over Hono RPC. Better Auth keeps its own handler at
  `app/api/auth/*`.
  
  Run without `-t` you now get `next-hono`; `vite-hono` and `next` are unchanged
  and still selectable with `-t`.
- 91f6a36: Wire Vitest into every template.
  
  Each template now ships a Vitest setup: `test` and `test:watch` scripts, one
  config, `@testing-library/react` for component tests, and an example test —
  a component render for the Next templates, an API route test that drives the
  Hono instance with `route.request(...)` (no server, no database) for the Hono
  templates. `bun run verify` runs each generated template's test suite as a
  gate.

### Patch Changes

- 115b3b4: Warn on files longer than 500 lines.
  
  The shared `biome.json` now enables `style/noExcessiveLinesPerFile` at `warn`
  with `maxLines: 500`. It is a nudge to split a module up, not a build gate —
  `bun run lint` still exits 0. Raise `options.maxLines` in `biome.json` if the
  threshold does not suit a project.

## 0.2.1

### Patch Changes

- b00a311: Point the package metadata at the renamed `create-stack` repository.
  
  The repository, issues and homepage URLs — and the `npx github:…` fallback in
  the README — still referred to `mantaray0/boilerplate`. The repository is now
  named after what it publishes, so the GitHub slug, the npm package and the
  binary all read the same.

## 0.2.0

### Minor Changes

- 397cee0: Scope the example `projects` table to its owner.
  
  `projects` now carries a `userId` foreign key, and every read, insert and delete
  in both templates filters on the session user. Previously any signed-in user
  could list and delete every other user's rows: the session guard established who
  was calling, but nothing constrained which rows that caller could touch.
  
  `createProjectSchema` deliberately does not accept `userId` — the owner is taken
  from the session on the server, so a client cannot claim someone else's rows.
  
  Generated projects pick this up as the pattern to copy for their own user-owned
  tables; it is documented in the `AGENTS.md` they ship with.
