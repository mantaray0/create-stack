/**
 * End-to-end check for the scaffolder: generate every template into a throwaway
 * directory and assert the result is a project you could actually run.
 *
 * Run with `bun run smoke`. Exits non-zero on the first failing expectation.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Template, templates } from "./constants.js";
import { findBoilerplateRoot, readToolingVersions } from "./paths.js";
import { scaffold } from "./scaffold.js";

type Failure = { template: Template; message: string };

const failures: Failure[] = [];

function expect(template: Template, condition: boolean, message: string): void {
  if (!condition) failures.push({ template, message });
}

/** Files a generated project must always have, whatever the template. */
const requiredFiles = [
  "package.json",
  "README.md",
  "LICENSE",
  "AGENTS.md",
  "CLAUDE.md",
  ".gitignore",
  ".env.example",
  "biome.json",
  "tsconfig.base.json",
  "docker-compose.yml",
  "packages/ui/package.json",
  "packages/db/src/schema.ts",
  "packages/auth/src/server.ts",
  "packages/validators/src/index.ts",
];

const templateEntryPoints: Record<Template, string[]> = {
  "vite-hono": ["vite.config.ts", "server/index.ts", "src/App.tsx"],
  next: ["next.config.ts", "src/app/page.tsx"],
};

function checkTemplate(boilerplateRoot: string, template: Template, appName: string): void {
  const targetDir = mkdtempSync(join(tmpdir(), `stack-smoke-${template}-`));

  try {
    scaffold({
      boilerplateRoot,
      targetDir,
      template,
      force: true,
      placeholders: { appName, appTitle: "Smoke Test" },
      year: 2026,
      toolingVersions: readToolingVersions(boilerplateRoot),
    });

    for (const file of [...requiredFiles, ...templateEntryPoints[template]]) {
      expect(template, existsSync(join(targetDir, file)), `missing file: ${file}`);
    }

    // Migrations and dependencies must never be carried over from the boilerplate.
    expect(template, !existsSync(join(targetDir, "packages/db/drizzle")), "drizzle/ leaked");
    expect(template, !existsSync(join(targetDir, "node_modules")), "node_modules leaked");

    const packageJson = JSON.parse(readFileSync(join(targetDir, "package.json"), "utf-8")) as {
      name?: string;
      scripts?: Record<string, string>;
    };
    expect(template, packageJson.name === appName, `package.json name is ${packageJson.name}`);
    expect(template, Boolean(packageJson.scripts?.dev), "package.json has no dev script");
    expect(
      template,
      Boolean(packageJson.scripts?.["db:push"]),
      "package.json has no db:push script",
    );

    // A tsconfig that cannot resolve its base silently degrades to TypeScript's
    // defaults, which breaks every path-based import in the app.
    const tsconfig = readFileSync(join(targetDir, "tsconfig.json"), "utf-8");
    expect(template, tsconfig.includes('"./tsconfig.base.json"'), "tsconfig extends not rewritten");

    // Placeholders must be fully resolved — a leftover marker means a file was
    // copied as binary or a new placeholder was never wired up.
    for (const file of ["docker-compose.yml", ".env.example", "AGENTS.md", "README.md"]) {
      const content = readFileSync(join(targetDir, file), "utf-8");
      expect(template, !content.includes("{{"), `unresolved placeholder in ${file}`);
      if (file === "docker-compose.yml" || file === ".env.example") {
        expect(template, content.includes(appName), `${file} does not mention the app name`);
      }
    }
  } finally {
    rmSync(targetDir, { recursive: true, force: true });
  }
}

const boilerplateRoot = findBoilerplateRoot();
const appName = "smoke-test";

for (const template of templates) {
  checkTemplate(boilerplateRoot, template, appName);
  const templateFailures = failures.filter((failure) => failure.template === template);
  const status = templateFailures.length === 0 ? "PASS" : `FAIL (${templateFailures.length})`;
  console.log(`${template.padEnd(10)} ${status}`);
}

if (failures.length > 0) {
  console.error("\nFailures:");
  for (const failure of failures) console.error(`  [${failure.template}] ${failure.message}`);
  process.exit(1);
}

console.log("\nAll templates scaffold cleanly.");
