# create-stack

Scaffolder for prototype monorepos. **One command, anywhere on your machine** —
no need to clone this repository.

```bash
bunx @mantaray0/create-stack ~/projects/my-idea
```

You get a standalone project with a Vite+Hono or Next.js app at the root, a
shared UI/DB/auth/validation layer in `packages/`, Postgres via Docker Compose,
and Biome + TypeScript already wired up.

---

## Install & use

There is nothing to install — the scaffolder runs straight from the registry.

| Tool | Command |
|---|---|
| **Bun** (primary) | `bunx @mantaray0/create-stack ~/projects/my-idea` |
| npm | `npx @mantaray0/create-stack ~/projects/my-idea` |
| pnpm | `pnpm dlx @mantaray0/create-stack ~/projects/my-idea` |
| npm create | `npm create @mantaray0/stack ~/projects/my-idea` |

Prefer a permanent install? `bun add -g @mantaray0/create-stack`, then just
`create-stack ~/projects/my-idea`.

### Interactive

Run it without arguments and it asks for everything:

```bash
bunx @mantaray0/create-stack
```

```
Where should the project be created? (./my-prototype) ~/projects/acme
Which template do you want to use?
  1) vite-hono — Vite SPA + Hono API (Bun), end-to-end typed via Hono RPC
  2) next      — Next.js 16 App Router with Server Components and Server Actions
Select (1-2) [1] 1
Run 'bun install' now? (Y/n) y
Initialise a git repository? (Y/n) y
```

### Non-interactive

```bash
# Next.js, install dependencies and create the first commit, no questions asked
bunx @mantaray0/create-stack ~/projects/acme -t next --install --git -y

# Vite + Hono into a relative path
bunx @mantaray0/create-stack ./my-idea

# Overwrite an existing, non-empty folder
bunx @mantaray0/create-stack ./my-idea --force
```

### Options

| Option | Description |
|---|---|
| `target-dir` | Destination folder. Must be empty unless `--force` is passed. |
| `-t, --template` | `vite-hono` (default) or `next` |
| `-f, --force` | Overwrite the target directory if it is not empty |
| `--install` / `--no-install` | Run `bun install` in the new project |
| `--git` / `--no-git` | `git init` plus the first commit |
| `-y, --yes` | Accept all defaults, never prompt |
| `-h, --help` | Show the help |
| `-v, --version` | Print the scaffolder version |

### Requirements

- The **scaffolder** runs on plain Node >= 18 and has zero dependencies.
- The **generated project** requires [Bun](https://bun.sh) >= 1.3 and Docker (or
  your own Postgres).
- **Developing this repository** needs Node >= 20.12 on top, because Changesets
  v3 uses `node:util.styleText`. That floor is deliberately not in `engines`:
  it applies to contributors, not to people running the published CLI.

### Running from GitHub instead of npm

Works, but it is the slower fallback: npm clones the repo and prepares it
(~30 s) instead of unpacking a 94 KB tarball, and `bunx` cannot resolve git
specs at all.

```bash
npx github:mantaray0/create-stack ~/projects/my-idea
pnpm dlx github:mantaray0/create-stack ~/projects/my-idea
```

---

## After scaffolding

```bash
cd ~/projects/my-idea
cp .env.example .env
bun install
bun run db:up          # Postgres via Docker Compose
bun run db:push        # push schema + Better Auth tables
bun run dev
```

Compose service, database and volume are all named after the project, so several
prototypes can run side by side. If port 5432 is taken, set `POSTGRES_PORT` in
`.env` and keep `DATABASE_URL` in sync.

### What you get

```
my-idea/
  packages/
    ui/           React Aria + Tailwind v4 design system (tokens in src/styles.css)
    db/           Drizzle: schema.ts, client, connection resolver
    auth/         Better Auth — server + client entry points
    validators/   Shared Zod v4 schemas
  src/            Your app (Next.js src/ or Vite src/)
  server/         (vite-hono only) Hono API with RPC-typed routes
  package.json    Workspace root — every script runs from here
  biome.json  tsconfig.base.json  docker-compose.yml
  .env.example  .gitignore  LICENSE  README.md
  AGENTS.md  CLAUDE.md      Guidelines for AI agents
```

### Templates

| Template | Good for | Dev command |
|---|---|---|
| `vite-hono` | Fast SaaS-style prototype. Vite SPA + separate Hono Bun API, fully RPC-typed client. | `bun run dev` — web `:5173`, api `:3001` |
| `next` | SEO-heavy marketing site + app. Next.js 16 App Router, Server Components + Actions. | `bun run dev` — `:3000` |

### Scripts in a generated project

| Command | What it does |
|---|---|
| `bun run dev` | Template-specific dev server |
| `bun run build` | Production build |
| `bun run lint` / `format` | Biome check / auto-fix |
| `bun run typecheck` | `tsc` for the app **and** every shared package |
| `bun run db:up` / `db:down` | Start / stop Postgres |
| `bun run db:push` | Push schema to the dev database |
| `bun run db:generate` / `db:migrate` | Generate / apply SQL migrations |
| `bun run db:studio` | Drizzle Studio (`:4983`) |

---

## Developing this boilerplate

This repository is the *source of the scaffolder*. It contains no apps.

```bash
bun install
bun run create /tmp/test-idea -t next -y   # scaffold from source
bun run smoke                              # every template produces the right files
bun run verify                             # generated projects install, typecheck and lint
bun run lint && bun run typecheck
bun run build                              # rebuild bin/create-stack.mjs
```

### Layout

```
bin/create-stack.mjs   Committed Node bundle — the published entry point
tooling/create-stack/    TypeScript source of the CLI (bundled into bin/)
templates/vite-hono/   App template 1 — becomes the generated project root
templates/next/        App template 2 — becomes the generated project root
templates/_shared/     Files every generated project gets (placeholders, dotfiles)
packages/              Shared packages copied into every generated project
biome.json             Shared Biome config — used here AND copied to projects
tsconfig.base.json     Shared TS base — used here AND copied to projects
docker-compose.yml     Postgres for developing this repo
```

### Three rules that are easy to get wrong

1. **`bin/create-stack.mjs` is generated but committed.** It is what gets
   published and what a GitHub install executes, and committing it means the
   install needs no build step and no dev dependencies. After every change under
   `tooling/create-stack/src/`, run `bun run build` and commit the result — CI
   fails if the bundle is stale.
2. **npm strips `.gitignore` from tarballs.** Dotfiles that must reach generated
   projects live in `templates/_shared/` *without* the leading dot and are mapped
   back by `dotfileTargets` in `constants.ts`.
3. **`workspaces` starts with `"."` on purpose.** The published package *is* the
   repository root, and Changesets only versions workspace members — without the
   `"."` entry it refuses with *"not in the workspace"* and releases break. Bun
   handles the self-entry fine.

Biome, TypeScript and the Conventional Commits rule apply to this repository
itself, not only to the templates — `bun run lint` covers `templates/`,
`packages/` and `tooling/` alike. Template *dependencies* are not installed
here, so `bun run verify` is what holds template code to the same standard.

### Releasing

Versions and changelogs are managed with
[Changesets](https://github.com/changesets/changesets). You never bump a version
by hand.

**1. Describe your change** — in the same commit as the change itself:

```bash
bun run changeset
```

Pick `patch` / `minor` / `major` and write the note for someone scaffolding a
project, not as a commit subject. That text lands in `CHANGELOG.md` and in the
GitHub release. Commit the generated `.changeset/*.md` file.

**2. Push to `main`.** The `Release` workflow collects every pending changeset
into a "Version Packages" pull request that bumps `package.json` and rewrites
`CHANGELOG.md`.

**3. Merge that pull request.** The same workflow then runs `changeset publish`,
which publishes to npm, pushes the git tag and creates the GitHub release. A few
minutes later `bunx @mantaray0/create-stack` resolves the new version. The
workflow then verifies that the published version actually has a git tag and
fails loudly if not — a version on npm without a tag means a publish bypassed
Changesets (see the manual-publish note below).

Useful locally:

```bash
bun run changeset            # add a changeset
bunx changeset status        # what would be released
bun run changeset:version    # preview the bump and changelog (do not commit blindly)
```

#### One-time npm setup

Releases authenticate with **npm trusted publishing** (OIDC). No token is stored
in this repository. npm is retiring 2FA-bypassing access tokens — they lose
account management rights in August 2026 and direct publish rights around
January 2027 — so a token-based release would stop working.

Because a trusted publisher is configured *on the package*, the package has to
exist first. That makes the very first release a manual one:

**1. Publish 0.1.0 by hand**, from a machine where you can answer the 2FA
prompt:

```bash
npm login
npm publish --access public   # prepack rebuilds bin/create-stack.mjs
```

`--access public` is required once for a scoped package; afterwards
`.changeset/config.json` (`"access": "public"`) keeps it that way. This also
confirms the `@mantaray0` scope belongs to your account — the scope of a scoped
package must match your npm username or an organisation you belong to.

A manual `npm publish` bypasses Changesets, so it creates **no git tag and no
GitHub release**. Close that gap immediately afterwards, otherwise npm and
GitHub drift apart (this happened for 0.1.0):

```bash
bunx changeset tag    # tags the current version as <name>@<version>
git push --tags
gh release create "$(node -p 'const p=require("./package.json");`${p.name}@${p.version}`')" --generate-notes
```

**2. Register this workflow as a trusted publisher.** On npmjs.com open the
package → *Settings* → *Trusted publisher* → GitHub Actions, and enter:

| Field | Value |
|---|---|
| Organization or user | `mantaray0` |
| Repository | `create-stack` |
| Workflow filename | `release.yml` — the file name only, not a path |
| Environment | leave empty |

**3. That is it.** Every later release runs unattended. Provenance is generated
automatically in this mode, so no `--provenance` flag and no
`NPM_CONFIG_PROVENANCE` are needed. If an `NPM_TOKEN` secret still exists in the
repository, delete it — `changesets/action` prefers a token when it finds one
and would fall back to the path that is being retired.

Requirements the workflow already satisfies: `id-token: write`, a cloud-hosted
runner, Node >= 22.14.0 and npm >= 11.5.1. Renaming `release.yml` breaks
publishing until the trusted publisher entry is updated to match.

---

## Conventions

- **Everything inside source files is English** — code, comments, identifiers,
  error messages, log lines, migration names. No exceptions.
- Files: components `PascalCase.tsx`, every other module `kebab-case.ts`.
- Functions / variables `camelCase`; components / types / interfaces `PascalCase`.
- Shared code lives only in `packages/*`.
- Tailwind v4 is CSS-first: edit `@theme` in `packages/ui/src/styles.css`, never
  create a `tailwind.config.js`.
- Zod v4 API (`z.uuid()`, not `z.string().uuid()`).
- New tables: extend `packages/db/src/schema.ts`, then `bun run db:push`. Never
  rename the Better Auth tables (`user`, `session`, `account`, `verification`).
- Commits follow **Conventional Commits**.

Full agent guidelines: [AGENTS.md](./AGENTS.md) / [CLAUDE.md](./CLAUDE.md).
Guidelines shipped *into* generated projects live in
[`templates/_shared/AGENTS.md`](./templates/_shared/AGENTS.md).

---

## License

MIT — [LICENSE](./LICENSE) — © 2026 mantaray0
