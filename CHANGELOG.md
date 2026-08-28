# @mantaray0/create-stack

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
