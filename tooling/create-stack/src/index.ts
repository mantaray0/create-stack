#!/usr/bin/env node
import { basename, isAbsolute, relative, resolve } from "node:path";
import { CliError, type CliOptions, parseArgs, usage } from "./args.js";
import { defaultTemplate, type Template, templateDescriptions, templates } from "./constants.js";
import { toKebabCase, toTitleCase } from "./fs-utils.js";
import { findBoilerplateRoot, readToolingVersions, readVersion } from "./paths.js";
import { commandExists, initGitRepository, installDependencies } from "./post-create.js";
import { devCommandHint } from "./project-files.js";
import { isInteractive, Prompter } from "./prompts.js";
import { ScaffoldError, scaffold } from "./scaffold.js";

const commandName = "create-stack";
const defaultTargetDir = "my-prototype";

type Answers = {
  targetDir: string;
  template: Template;
  install: boolean;
  git: boolean;
};

/**
 * Resolve everything the scaffolder needs. Flags always win; missing values are
 * asked for on a TTY and fall back to defaults everywhere else, so the CLI is
 * equally usable by a human and by a script.
 */
async function collectAnswers(options: CliOptions): Promise<Answers> {
  const interactive = isInteractive() && !options.yes;

  if (!interactive) {
    if (!options.targetDir) {
      throw new CliError(
        "No target directory given. Pass one as the first argument, " +
          `for example: ${commandName} ./${defaultTargetDir}`,
      );
    }
    return {
      targetDir: options.targetDir,
      template: options.template ?? defaultTemplate,
      install: options.install ?? false,
      git: options.git ?? false,
    };
  }

  const prompter = new Prompter();
  try {
    const targetDir =
      options.targetDir ??
      (await prompter.text("Where should the project be created?", `./${defaultTargetDir}`));

    const template =
      options.template ??
      (await prompter.select(
        "Which template do you want to use?",
        (templates as readonly Template[]).map((name) => ({
          value: name,
          label: name,
          hint: templateDescriptions[name],
        })),
        templates.indexOf(defaultTemplate),
      ));

    const install = options.install ?? (await prompter.confirm("Run 'bun install' now?", true));
    const git = options.git ?? (await prompter.confirm("Initialise a git repository?", true));

    return { targetDir, template, install, git };
  } finally {
    prompter.close();
  }
}

/**
 * Paths are printed so the user can copy them straight into a shell. A relative
 * path is friendlier, but only while it stays short — a target outside the
 * current tree would otherwise turn into a wall of "../".
 */
function displayPathFor(targetDir: string): string {
  const relativePath = relative(process.cwd(), targetDir);
  if (!relativePath) return ".";
  if (relativePath.startsWith("..")) return targetDir;
  return relativePath.length <= targetDir.length ? relativePath : targetDir;
}

function reportStep(label: string, result: { ok: boolean; reason?: string }): void {
  if (result.ok) {
    console.log(`  ${label}: done`);
  } else {
    console.warn(`  ${label}: skipped — ${result.reason}`);
  }
}

async function main(): Promise<void> {
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

  const targetDir = isAbsolute(answers.targetDir)
    ? answers.targetDir
    : resolve(process.cwd(), answers.targetDir);

  const appName = toKebabCase(basename(targetDir)) || defaultTargetDir;
  const appTitle = toTitleCase(appName);

  scaffold({
    boilerplateRoot,
    targetDir,
    template: answers.template,
    force: options.force,
    placeholders: { appName, appTitle },
    year: new Date().getFullYear(),
    toolingVersions: readToolingVersions(boilerplateRoot),
  });

  const displayPath = displayPathFor(targetDir);
  console.log(`\n${appTitle} created at ${displayPath} (template: ${answers.template}).\n`);

  if (answers.install || answers.git) {
    console.log("Post-setup:");
    if (answers.install) reportStep("bun install", installDependencies(targetDir));
    if (answers.git) reportStep("git init", initGitRepository(targetDir));
    console.log("");
  }

  if (!commandExists("bun")) {
    console.warn(
      "Warning: bun was not found on this machine. The generated project requires Bun — https://bun.sh\n",
    );
  }

  const steps = [
    `cd ${displayPath}`,
    "cp .env.example .env",
    ...(answers.install ? [] : ["bun install"]),
    "bun run db:up          # Postgres via Docker Compose",
    "bun run db:push        # push schema + Better Auth tables",
    devCommandHint(answers.template),
  ];

  console.log(`Next steps:\n${steps.map((step) => `  ${step}`).join("\n")}\n`);
}

main().catch((error: unknown) => {
  if (error instanceof CliError || error instanceof ScaffoldError) {
    console.error(`\n${error.message}\n`);
    process.exit(1);
  }
  throw error;
});
