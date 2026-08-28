import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { bunVersion, type Template } from "./constants.js";
import type { Placeholders } from "./fs-utils.js";

type TemplatePackageJson = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

/**
 * Biome and TypeScript are pinned to whatever the boilerplate itself uses, so a
 * generated project formats and type checks exactly like this repository does.
 * Reading them here keeps a single source of truth in the root package.json.
 */
export type ToolingVersions = {
  biome: string;
  typescript: string;
};

/**
 * Scripts every generated project gets, on top of whatever the template
 * defines. Template scripts win for `dev`/`build`/`start`, tooling scripts are
 * owned by the boilerplate.
 */
function buildScripts(templateScripts: Record<string, string>): Record<string, string> {
  // The template owns the app's own type check; the root script has to run it
  // as well as the shared packages, otherwise the app source is never checked.
  const appTypecheck = templateScripts.typecheck ?? "tsc --noEmit";

  return {
    ...templateScripts,
    lint: "biome check .",
    format: "biome check --write .",
    typecheck: `${appTypecheck} && bun run --filter '@repo/*' typecheck`,
    "db:up": "docker compose up -d",
    "db:down": "docker compose down",
    "db:push": "bun run --cwd packages/db db:push",
    "db:generate": "bun run --cwd packages/db db:generate",
    "db:migrate": "bun run --cwd packages/db db:migrate",
    "db:studio": "bun run --cwd packages/db db:studio",
  };
}

export function writePackageJson(
  targetDir: string,
  templatePackageJson: TemplatePackageJson,
  placeholders: Placeholders,
  toolingVersions: ToolingVersions,
): void {
  const packageJson = {
    name: placeholders.appName,
    version: "0.1.0",
    private: true,
    type: "module",
    packageManager: `bun@${bunVersion}`,
    workspaces: ["packages/*"],
    scripts: buildScripts(templatePackageJson.scripts ?? {}),
    dependencies: templatePackageJson.dependencies ?? {},
    devDependencies: {
      ...(templatePackageJson.devDependencies ?? {}),
      "@biomejs/biome": toolingVersions.biome,
      typescript: toolingVersions.typescript,
    },
  };

  writeFileSync(join(targetDir, "package.json"), `${JSON.stringify(packageJson, null, 2)}\n`);
}

export function writeLicense(targetDir: string, placeholders: Placeholders, year: number): void {
  const content = `MIT License

Copyright (c) ${year} The ${placeholders.appTitle} authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
  writeFileSync(join(targetDir, "LICENSE"), content);
}

export function devCommandHint(template: Template): string {
  return template === "vite-hono"
    ? "bun run dev          # web: http://localhost:5173, api: http://localhost:3001"
    : "bun run dev          # http://localhost:3000";
}

export function writeReadme(
  targetDir: string,
  template: Template,
  placeholders: Placeholders,
): void {
  const templateBlurb =
    template === "vite-hono"
      ? "Vite SPA + Hono API (Bun), fully end-to-end typed via Hono RPC."
      : "Next.js 16 (App Router, Server Components, Server Actions).";

  const appLayout =
    template === "vite-hono"
      ? "src/             Vite SPA\nserver/          Hono API server (RPC typed routes)"
      : "src/app/         Next.js App Router\nsrc/lib/actions/ Server Actions";

  const content = `# ${placeholders.appTitle}

Generated with create-stack — ${templateBlurb}

## Stack

- UI: React Aria Components + Tailwind CSS v4 (design system in \`packages/ui\`)
- DB: PostgreSQL + Drizzle ORM (\`packages/db\`)
- Auth: Better Auth, email/password and ready for social logins (\`packages/auth\`)
- Validation: Zod v4, shared schemas in \`packages/validators\`
- Lint / format: Biome
- Package manager: Bun workspaces

## Quickstart

\`\`\`bash
cp .env.example .env
bun install
bun run db:up          # start Postgres via Docker Compose
bun run db:push        # push schema + Better Auth tables into the database
${devCommandHint(template)}
\`\`\`

The Compose service, database and volume are all named \`${placeholders.appName}\`,
so this project can run next to other prototypes. If port 5432 is already
taken, set \`POSTGRES_PORT\` in \`.env\` and keep \`DATABASE_URL\` in sync.

## Structure

\`\`\`
packages/
  ui/            Design system (React Aria + Tailwind v4 tokens)
  db/            Drizzle schema, client, migrations
  auth/          Better Auth config (server + client)
  validators/    Shared Zod schemas
${appLayout}
docker-compose.yml  Local Postgres
biome.json          Lint + format rules
tsconfig.base.json  Shared TypeScript base
\`\`\`

## Commands

| Command | Description |
|---|---|
| \`bun run dev\` | Start the dev server |
| \`bun run build\` | Production build |
| \`bun run lint\` / \`format\` | Biome check / auto-fix |
| \`bun run typecheck\` | TypeScript check across all workspaces |
| \`bun run db:up\` / \`db:down\` | Start / stop Postgres |
| \`bun run db:push\` | Push schema to the dev database |
| \`bun run db:generate\` | Generate SQL migrations |
| \`bun run db:migrate\` | Apply migrations |
| \`bun run db:studio\` | Drizzle Studio (database GUI) |

## Conventions

Everything inside source files is English. Component files use
\`PascalCase.tsx\`, all other modules use \`kebab-case.ts\`. Naming is enforced by
Biome — run \`bun run format && bun run lint\` after every change.

The full guidelines for AI agents live in [AGENTS.md](./AGENTS.md) and
[CLAUDE.md](./CLAUDE.md).
`;

  writeFileSync(join(targetDir, "README.md"), content);
}
