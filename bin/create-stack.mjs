#!/usr/bin/env node

// tooling/create-stack/src/index.ts
import { basename, isAbsolute, relative, resolve as resolve2 } from "node:path";

// tooling/create-stack/src/constants.ts
var templates = ["vite-hono", "next"];
var defaultTemplate = "vite-hono";
var templateDescriptions = {
  "vite-hono": "Vite SPA + Hono API (Bun), end-to-end typed via Hono RPC",
  next: "Next.js 16 App Router with Server Components and Server Actions"
};
var sharedPackages = ["ui", "db", "auth", "validators"];
var droppedDirectories = new Set(["node_modules", "drizzle"]);
var sharedTemplateDir = "_shared";
var dotfileTargets = {
  gitignore: ".gitignore"
};
var rootFilesToCopy = ["biome.json", "tsconfig.base.json"];
var bunVersion = "1.3.5";

// tooling/create-stack/src/args.ts
class CliError extends Error {
}
function parseTemplate(value) {
  if (value && templates.includes(value)) {
    return value;
  }
  throw new CliError(`Unknown template: ${value ?? "(missing)"} — available: ${templates.join(", ")}`);
}
function parseArgs(argv) {
  const options = {
    targetDir: null,
    template: null,
    force: false,
    install: null,
    git: null,
    yes: false,
    help: false,
    version: false
  };
  for (let index = 0;index < argv.length; index++) {
    const arg = argv[index];
    if (arg === undefined)
      continue;
    if (arg === "--template" || arg === "-t") {
      options.template = parseTemplate(argv[++index]);
    } else if (arg.startsWith("--template=")) {
      options.template = parseTemplate(arg.slice("--template=".length));
    } else if (arg === "--force" || arg === "-f") {
      options.force = true;
    } else if (arg === "--install") {
      options.install = true;
    } else if (arg === "--no-install") {
      options.install = false;
    } else if (arg === "--git") {
      options.git = true;
    } else if (arg === "--no-git") {
      options.git = false;
    } else if (arg === "--yes" || arg === "-y") {
      options.yes = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--version" || arg === "-v" || arg === "-V") {
      options.version = true;
    } else if (arg.startsWith("-")) {
      throw new CliError(`Unknown option: ${arg} — run with --help to see the usage.`);
    } else if (options.targetDir === null) {
      options.targetDir = arg;
    } else {
      throw new CliError(`Unexpected argument: ${arg} — only one target directory is supported.`);
    }
  }
  return options;
}
function usage(commandName) {
  const templateList = templates.map((name) => {
    const marker = name === defaultTemplate ? " (default)" : "";
    return `      ${name.padEnd(11)}${templateDescriptions[name]}${marker}`;
  }).join(`
`);
  return `
Usage: ${commandName} [target-dir] [options]

Creates a brand new, standalone prototype project. Run it anywhere — no need to
clone the boilerplate. Without a target directory the CLI asks interactively.

The generated project contains:
  - your app (vite-hono or next) at the project root
  - packages/ui          shared React Aria + Tailwind v4 design system
  - packages/db          Drizzle ORM schema, client, migrations
  - packages/auth        Better Auth (server + client)
  - packages/validators  shared Zod v4 schemas
  - biome.json, tsconfig.base.json, docker-compose.yml, .env.example,
    .gitignore, LICENSE, AGENTS.md, CLAUDE.md, README.md

Arguments:
  target-dir       Destination folder (created if missing). If it already
                   exists it must be empty unless you pass --force.

Options:
  -t, --template   Template to use:
${templateList}
  -f, --force      Overwrite the target directory if it is not empty (CAREFUL)
      --install    Run "bun install" in the new project
      --no-install Skip the install step
      --git        Run "git init" and create the first commit
      --no-git     Skip git setup
  -y, --yes        Accept all defaults and never prompt
  -h, --help       Show this help
  -v, --version    Print the scaffolder version

Examples:
  ${commandName}
  ${commandName} ~/projects/my-cool-startup
  ${commandName} ./my-idea --template next --install --git
  ${commandName} /tmp/scratch -t vite-hono -y
`;
}

// tooling/create-stack/src/fs-utils.ts
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from "node:fs";
import { join } from "node:path";
var textExtensions = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".jsonc",
  ".md",
  ".yml",
  ".yaml",
  ".css",
  ".html",
  ".sql",
  ".txt",
  ".example"
]);
var textFileNames = new Set([".gitignore", "gitignore", "LICENSE", "Dockerfile"]);
function isTextFile(entryName) {
  if (textFileNames.has(entryName))
    return true;
  for (const extension of textExtensions) {
    if (entryName.endsWith(extension))
      return true;
  }
  return false;
}
function replacePlaceholders(content, placeholders) {
  return content.replaceAll(/\{\{\s*APP_NAME\s*\}\}/g, placeholders.appName).replaceAll(/\{\{\s*APP_TITLE\s*\}\}/g, placeholders.appTitle);
}
function listDirSafe(dir) {
  return existsSync(dir) ? readdirSync(dir) : [];
}
function isDirEmpty(path) {
  return listDirSafe(path).length === 0;
}
function copyTextFile(sourcePath, targetPath, placeholders) {
  const content = replacePlaceholders(readFileSync(sourcePath, "utf-8"), placeholders);
  writeFileSync(targetPath, content);
}
function copyTree(sourceDir, targetDir, options) {
  mkdirSync(targetDir, { recursive: true });
  for (const entry of readdirSync(sourceDir)) {
    if (options.skipEntries?.has(entry))
      continue;
    const sourcePath = join(sourceDir, entry);
    const stats = statSync(sourcePath);
    if (stats.isDirectory()) {
      if (options.skipDirectories?.has(entry))
        continue;
      copyTree(sourcePath, join(targetDir, entry), options);
      continue;
    }
    const targetPath = join(targetDir, options.renames?.[entry] ?? entry);
    if (isTextFile(entry)) {
      copyTextFile(sourcePath, targetPath, options.placeholders);
    } else {
      copyFileSync(sourcePath, targetPath);
    }
  }
}
function toKebabCase(value) {
  return value.trim().replaceAll(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-+|-+$/g, "");
}
function toTitleCase(value) {
  return value.split("-").filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

// tooling/create-stack/src/paths.ts
import { existsSync as existsSync2, readFileSync as readFileSync2 } from "node:fs";
import { dirname, join as join2, resolve } from "node:path";
import { fileURLToPath } from "node:url";
function moduleDir() {
  if (typeof import.meta.dirname === "string")
    return import.meta.dirname;
  return dirname(fileURLToPath(import.meta.url));
}
function isBoilerplateRoot(candidate) {
  return existsSync2(join2(candidate, "templates", "vite-hono")) && existsSync2(join2(candidate, "packages", "ui")) && existsSync2(join2(candidate, "package.json"));
}
function findBoilerplateRoot() {
  let current = moduleDir();
  for (let depth = 0;depth < 10; depth++) {
    if (isBoilerplateRoot(current))
      return current;
    const parent = resolve(current, "..");
    if (parent === current)
      break;
    current = parent;
  }
  throw new Error("Could not locate the boilerplate payload (templates/ and packages/) relative to " + `${moduleDir()}. The package looks incomplete — please reinstall it.`);
}
function readPackageJson(boilerplateRoot) {
  try {
    return JSON.parse(readFileSync2(join2(boilerplateRoot, "package.json"), "utf-8"));
  } catch {
    return {};
  }
}
function readVersion(boilerplateRoot) {
  return readPackageJson(boilerplateRoot).version ?? "0.0.0";
}
function readToolingVersions(boilerplateRoot) {
  const devDependencies = readPackageJson(boilerplateRoot).devDependencies ?? {};
  return {
    biome: devDependencies["@biomejs/biome"] ?? "2.5.10",
    typescript: devDependencies.typescript ?? "^5.9.3"
  };
}

// tooling/create-stack/src/post-create.ts
import { spawnSync } from "node:child_process";
function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.error) {
    const code = result.error.code;
    if (code === "ENOENT")
      return { ok: false, reason: `"${command}" is not installed` };
    return { ok: false, reason: result.error.message };
  }
  if (result.status !== 0) {
    return {
      ok: false,
      reason: `"${command} ${args.join(" ")}" exited with code ${result.status}`
    };
  }
  return { ok: true };
}
function commandExists(command) {
  const result = spawnSync(command, ["--version"], { stdio: "ignore" });
  return !result.error && result.status === 0;
}
function installDependencies(targetDir) {
  return run("bun", ["install"], targetDir);
}
function initGitRepository(targetDir) {
  const init = run("git", ["init", "-b", "main"], targetDir);
  if (!init.ok)
    return init;
  const add = run("git", ["add", "-A"], targetDir);
  if (!add.ok)
    return add;
  const commit = run("git", ["commit", "-m", "chore: scaffold project from the create-stack boilerplate"], targetDir);
  if (!commit.ok) {
    return {
      ok: false,
      reason: `${commit.reason} — the repository exists, only the first commit is missing (check your git user.name / user.email)`
    };
  }
  return { ok: true };
}

// tooling/create-stack/src/project-files.ts
import { writeFileSync as writeFileSync2 } from "node:fs";
import { join as join3 } from "node:path";
function buildScripts(templateScripts) {
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
    "db:studio": "bun run --cwd packages/db db:studio"
  };
}
function writePackageJson(targetDir, templatePackageJson, placeholders, toolingVersions) {
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
      ...templatePackageJson.devDependencies ?? {},
      "@biomejs/biome": toolingVersions.biome,
      typescript: toolingVersions.typescript
    }
  };
  writeFileSync2(join3(targetDir, "package.json"), `${JSON.stringify(packageJson, null, 2)}
`);
}
function writeLicense(targetDir, placeholders, year) {
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
  writeFileSync2(join3(targetDir, "LICENSE"), content);
}
function devCommandHint(template) {
  return template === "vite-hono" ? "bun run dev          # web: http://localhost:5173, api: http://localhost:3001" : "bun run dev          # http://localhost:3000";
}
function writeReadme(targetDir, template, placeholders) {
  const templateBlurb = template === "vite-hono" ? "Vite SPA + Hono API (Bun), fully end-to-end typed via Hono RPC." : "Next.js 16 (App Router, Server Components, Server Actions).";
  const appLayout = template === "vite-hono" ? `src/             Vite SPA
server/          Hono API server (RPC typed routes)` : `src/app/         Next.js App Router
src/lib/actions/ Server Actions`;
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
  writeFileSync2(join3(targetDir, "README.md"), content);
}

// tooling/create-stack/src/prompts.ts
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
function isInteractive() {
  return Boolean(stdin.isTTY && stdout.isTTY);
}

class Prompter {
  rl;
  constructor() {
    this.rl = createInterface({ input: stdin, output: stdout });
    this.rl.on("SIGINT", () => {
      stdout.write(`
Aborted.
`);
      process.exit(130);
    });
  }
  close() {
    this.rl.close();
  }
  async text(question, defaultValue) {
    const answer = await this.rl.question(`${question} (${defaultValue}) `);
    return answer.trim() || defaultValue;
  }
  async confirm(question, defaultValue) {
    const hint = defaultValue ? "Y/n" : "y/N";
    const answer = (await this.rl.question(`${question} (${hint}) `)).trim().toLowerCase();
    if (!answer)
      return defaultValue;
    return answer === "y" || answer === "yes";
  }
  async select(question, choices, defaultIndex = 0) {
    stdout.write(`${question}
`);
    for (const [index, choice] of choices.entries()) {
      const hint = choice.hint ? ` — ${choice.hint}` : "";
      stdout.write(`  ${index + 1}) ${choice.label}${hint}
`);
    }
    while (true) {
      const answer = (await this.rl.question(`Select (1-${choices.length}) [${defaultIndex + 1}] `)).trim();
      const index = answer ? Number.parseInt(answer, 10) - 1 : defaultIndex;
      const choice = choices[index];
      if (choice)
        return choice.value;
      stdout.write(`Please enter a number between 1 and ${choices.length}.
`);
    }
  }
}

// tooling/create-stack/src/scaffold.ts
import { existsSync as existsSync3, mkdirSync as mkdirSync2, readdirSync as readdirSync2, readFileSync as readFileSync3, rmSync, writeFileSync as writeFileSync3 } from "node:fs";
import { join as join4 } from "node:path";
class ScaffoldError extends Error {
}
function prepareTargetDir(targetDir, force) {
  if (existsSync3(targetDir) && !isDirEmpty(targetDir)) {
    if (!force) {
      throw new ScaffoldError(`Target directory "${targetDir}" already exists and is not empty.
` + "Pick a different path, remove the folder, or re-run with --force (CAREFUL: overwrites).");
    }
    for (const entry of readdirSync2(targetDir)) {
      rmSync(join4(targetDir, entry), { recursive: true, force: true });
    }
  }
  mkdirSync2(targetDir, { recursive: true });
}
function fixTsconfigExtends(targetDir) {
  const tsconfigPath = join4(targetDir, "tsconfig.json");
  const content = readFileSync3(tsconfigPath, "utf-8");
  const needle = '"extends": "../../tsconfig.base.json"';
  if (!content.includes(needle)) {
    throw new ScaffoldError(`Expected ${needle} in the template tsconfig.json. ` + "Update fixTsconfigExtends() in scaffold.ts after changing a template.");
  }
  writeFileSync3(tsconfigPath, content.replace(needle, '"extends": "./tsconfig.base.json"'));
}
function copyTemplate(input) {
  const templateDir = join4(input.boilerplateRoot, "templates", input.template);
  if (!existsSync3(templateDir)) {
    throw new ScaffoldError(`Template not found: ${templateDir}`);
  }
  copyTree(templateDir, input.targetDir, {
    placeholders: input.placeholders,
    skipDirectories: droppedDirectories,
    renames: dotfileTargets
  });
  fixTsconfigExtends(input.targetDir);
}
function copyPackages(input) {
  for (const packageName of sharedPackages) {
    copyTree(join4(input.boilerplateRoot, "packages", packageName), join4(input.targetDir, "packages", packageName), {
      placeholders: input.placeholders,
      skipDirectories: droppedDirectories,
      renames: dotfileTargets
    });
  }
}
function copySharedFiles(input) {
  copyTree(join4(input.boilerplateRoot, "templates", sharedTemplateDir), input.targetDir, {
    placeholders: input.placeholders,
    renames: dotfileTargets
  });
  for (const fileName of rootFilesToCopy) {
    const sourcePath = join4(input.boilerplateRoot, fileName);
    if (!existsSync3(sourcePath))
      continue;
    copyTextFile(sourcePath, join4(input.targetDir, fileName), input.placeholders);
  }
  const agentsSource = join4(input.boilerplateRoot, "templates", sharedTemplateDir, "AGENTS.md");
  if (existsSync3(agentsSource)) {
    copyTextFile(agentsSource, join4(input.targetDir, "CLAUDE.md"), input.placeholders);
  }
}
function scaffold(input) {
  prepareTargetDir(input.targetDir, input.force);
  copyTemplate(input);
  copyPackages(input);
  copySharedFiles(input);
  const templatePackageJson = JSON.parse(readFileSync3(join4(input.boilerplateRoot, "templates", input.template, "package.json"), "utf-8"));
  writePackageJson(input.targetDir, templatePackageJson, input.placeholders, input.toolingVersions);
  writeReadme(input.targetDir, input.template, input.placeholders);
  writeLicense(input.targetDir, input.placeholders, input.year);
}

// tooling/create-stack/src/index.ts
var commandName = "create-stack";
var defaultTargetDir = "my-prototype";
async function collectAnswers(options) {
  const interactive = isInteractive() && !options.yes;
  if (!interactive) {
    if (!options.targetDir) {
      throw new CliError("No target directory given. Pass one as the first argument, " + `for example: ${commandName} ./${defaultTargetDir}`);
    }
    return {
      targetDir: options.targetDir,
      template: options.template ?? defaultTemplate,
      install: options.install ?? false,
      git: options.git ?? false
    };
  }
  const prompter = new Prompter;
  try {
    const targetDir = options.targetDir ?? await prompter.text("Where should the project be created?", `./${defaultTargetDir}`);
    const template = options.template ?? await prompter.select("Which template do you want to use?", templates.map((name) => ({
      value: name,
      label: name,
      hint: templateDescriptions[name]
    })), templates.indexOf(defaultTemplate));
    const install = options.install ?? await prompter.confirm("Run 'bun install' now?", true);
    const git = options.git ?? await prompter.confirm("Initialise a git repository?", true);
    return { targetDir, template, install, git };
  } finally {
    prompter.close();
  }
}
function displayPathFor(targetDir) {
  const relativePath = relative(process.cwd(), targetDir);
  if (!relativePath)
    return ".";
  if (relativePath.startsWith(".."))
    return targetDir;
  return relativePath.length <= targetDir.length ? relativePath : targetDir;
}
function reportStep(label, result) {
  if (result.ok) {
    console.log(`  ${label}: done`);
  } else {
    console.warn(`  ${label}: skipped — ${result.reason}`);
  }
}
async function main() {
  const options = parseArgs(process.argv.slice(2));
  const boilerplateRoot = findBoilerplateRoot();
  if (options.help) {
    console.log(usage(commandName));
    return;
  }
  if (options.version) {
    console.log(readVersion(boilerplateRoot));
    return;
  }
  const answers = await collectAnswers(options);
  const targetDir = isAbsolute(answers.targetDir) ? answers.targetDir : resolve2(process.cwd(), answers.targetDir);
  const appName = toKebabCase(basename(targetDir)) || defaultTargetDir;
  const appTitle = toTitleCase(appName);
  scaffold({
    boilerplateRoot,
    targetDir,
    template: answers.template,
    force: options.force,
    placeholders: { appName, appTitle },
    year: new Date().getFullYear(),
    toolingVersions: readToolingVersions(boilerplateRoot)
  });
  const displayPath = displayPathFor(targetDir);
  console.log(`
${appTitle} created at ${displayPath} (template: ${answers.template}).
`);
  if (answers.install || answers.git) {
    console.log("Post-setup:");
    if (answers.install)
      reportStep("bun install", installDependencies(targetDir));
    if (answers.git)
      reportStep("git init", initGitRepository(targetDir));
    console.log("");
  }
  if (!commandExists("bun")) {
    console.warn(`Warning: bun was not found on this machine. The generated project requires Bun — https://bun.sh
`);
  }
  const steps = [
    `cd ${displayPath}`,
    "cp .env.example .env",
    ...answers.install ? [] : ["bun install"],
    "bun run db:up          # Postgres via Docker Compose",
    "bun run db:push        # push schema + Better Auth tables",
    devCommandHint(answers.template)
  ];
  console.log(`Next steps:
${steps.map((step) => `  ${step}`).join(`
`)}
`);
}
main().catch((error) => {
  if (error instanceof CliError || error instanceof ScaffoldError) {
    console.error(`
${error.message}
`);
    process.exit(1);
  }
  throw error;
});
