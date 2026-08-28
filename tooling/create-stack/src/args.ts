import { defaultTemplate, type Template, templateDescriptions, templates } from "./constants.js";

export type CliOptions = {
  targetDir: string | null;
  /** null means "not specified" — the interactive prompt decides. */
  template: Template | null;
  force: boolean;
  /** null means "not specified" — the interactive prompt decides. */
  install: boolean | null;
  /** null means "not specified" — the interactive prompt decides. */
  git: boolean | null;
  /** Skip every prompt and take the defaults. */
  yes: boolean;
  help: boolean;
  version: boolean;
};

export class CliError extends Error {}

function parseTemplate(value: string | undefined): Template {
  if (value && (templates as readonly string[]).includes(value)) {
    return value as Template;
  }
  throw new CliError(
    `Unknown template: ${value ?? "(missing)"} — available: ${templates.join(", ")}`,
  );
}

export function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    targetDir: null,
    template: null,
    force: false,
    install: null,
    git: null,
    yes: false,
    help: false,
    version: false,
  };

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === undefined) continue;

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

export function usage(commandName: string): string {
  const templateList = (templates as readonly Template[])
    .map((name) => {
      const marker = name === defaultTemplate ? " (default)" : "";
      return `      ${name.padEnd(11)}${templateDescriptions[name]}${marker}`;
    })
    .join("\n");

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
