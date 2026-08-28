import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  dotfileTargets,
  droppedDirectories,
  rootFilesToCopy,
  sharedPackages,
  sharedTemplateDir,
  type Template,
} from "./constants.js";
import { copyTextFile, copyTree, isDirEmpty, type Placeholders } from "./fs-utils.js";
import {
  type ToolingVersions,
  writeLicense,
  writePackageJson,
  writeReadme,
} from "./project-files.js";

export class ScaffoldError extends Error {}

export type ScaffoldInput = {
  boilerplateRoot: string;
  targetDir: string;
  template: Template;
  force: boolean;
  placeholders: Placeholders;
  year: number;
  toolingVersions: ToolingVersions;
};

/**
 * Refuse to write into a non-empty directory unless --force was passed.
 * With --force the directory is emptied rather than merged, so a generated
 * project never mixes with leftovers from a previous run.
 */
function prepareTargetDir(targetDir: string, force: boolean): void {
  if (existsSync(targetDir) && !isDirEmpty(targetDir)) {
    if (!force) {
      throw new ScaffoldError(
        `Target directory "${targetDir}" already exists and is not empty.\n` +
          "Pick a different path, remove the folder, or re-run with --force (CAREFUL: overwrites).",
      );
    }
    for (const entry of readdirSync(targetDir)) {
      rmSync(join(targetDir, entry), { recursive: true, force: true });
    }
  }

  mkdirSync(targetDir, { recursive: true });
}

/**
 * Inside this repository a template lives two levels below `tsconfig.base.json`;
 * in a generated project it *is* the root and the base config sits next to it.
 * Rewriting the extends path here keeps the template usable in both places.
 * A missing needle means the template drifted, so fail loudly instead of
 * shipping a project whose type checking silently falls back to defaults.
 */
function fixTsconfigExtends(targetDir: string): void {
  const tsconfigPath = join(targetDir, "tsconfig.json");
  const content = readFileSync(tsconfigPath, "utf-8");
  const needle = '"extends": "../../tsconfig.base.json"';

  if (!content.includes(needle)) {
    throw new ScaffoldError(
      `Expected ${needle} in the template tsconfig.json. ` +
        "Update fixTsconfigExtends() in scaffold.ts after changing a template.",
    );
  }

  writeFileSync(tsconfigPath, content.replace(needle, '"extends": "./tsconfig.base.json"'));
}

/** The app template becomes the project root, so src/ and configs sit top-level. */
function copyTemplate(input: ScaffoldInput): void {
  const templateDir = join(input.boilerplateRoot, "templates", input.template);
  if (!existsSync(templateDir)) {
    throw new ScaffoldError(`Template not found: ${templateDir}`);
  }

  copyTree(templateDir, input.targetDir, {
    placeholders: input.placeholders,
    skipDirectories: droppedDirectories,
    renames: dotfileTargets,
  });

  fixTsconfigExtends(input.targetDir);
}

/**
 * Shared packages are copied as sources, not as published artifacts — the
 * generated project owns and edits them. Drizzle migrations are dropped so the
 * project regenerates them from its own schema.
 */
function copyPackages(input: ScaffoldInput): void {
  for (const packageName of sharedPackages) {
    copyTree(
      join(input.boilerplateRoot, "packages", packageName),
      join(input.targetDir, "packages", packageName),
      {
        placeholders: input.placeholders,
        skipDirectories: droppedDirectories,
        renames: dotfileTargets,
      },
    );
  }
}

/**
 * Files shared by every generated project. `templates/_shared` holds the
 * project-facing variants (placeholders, dotless dotfiles); the boilerplate
 * root only contributes the tool configs it uses itself.
 */
function copySharedFiles(input: ScaffoldInput): void {
  copyTree(join(input.boilerplateRoot, "templates", sharedTemplateDir), input.targetDir, {
    placeholders: input.placeholders,
    renames: dotfileTargets,
  });

  for (const fileName of rootFilesToCopy) {
    const sourcePath = join(input.boilerplateRoot, fileName);
    if (!existsSync(sourcePath)) continue;
    copyTextFile(sourcePath, join(input.targetDir, fileName), input.placeholders);
  }

  // Agent guidelines are one source of truth written under both names, because
  // different agents look for different files.
  const agentsSource = join(input.boilerplateRoot, "templates", sharedTemplateDir, "AGENTS.md");
  if (existsSync(agentsSource)) {
    copyTextFile(agentsSource, join(input.targetDir, "CLAUDE.md"), input.placeholders);
  }
}

export function scaffold(input: ScaffoldInput): void {
  prepareTargetDir(input.targetDir, input.force);

  copyTemplate(input);
  copyPackages(input);
  copySharedFiles(input);

  const templatePackageJson = JSON.parse(
    readFileSync(join(input.boilerplateRoot, "templates", input.template, "package.json"), "utf-8"),
  ) as Parameters<typeof writePackageJson>[1];

  writePackageJson(input.targetDir, templatePackageJson, input.placeholders, input.toolingVersions);
  writeReadme(input.targetDir, input.template, input.placeholders);
  writeLicense(input.targetDir, input.placeholders, input.year);
}
