---
"@mantaray0/create-stack": minor
---

Wire Vitest into every template.

Each template now ships a Vitest setup: `test` and `test:watch` scripts, one
config, `@testing-library/react` for component tests, and an example test —
a component render for the Next templates, an API route test that drives the
Hono instance with `route.request(...)` (no server, no database) for the Hono
templates. `bun run verify` runs each generated template's test suite as a
gate.
