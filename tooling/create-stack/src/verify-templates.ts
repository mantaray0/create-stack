/**
 * Deep verification: scaffold every template into a throwaway directory and run
 * the generated project's own quality gates inside it.
 *
 * `bun run smoke` only checks that the right files appear. This script proves
 * the result actually installs, type checks and lints — which is the only way
 * to hold `templates/` to the same standard as the rest of this repository,
 * since template dependencies are not installed here.
 *
 * Run with `bun run verify`. Needs network access for `bun install`.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type Template, templates } from "./constants.js";
import { findBoilerplateRoot, readToolingVersions } from "./paths.js";
import { scaffold } from "./scaffold.js";

const gates = ["install", "typecheck", "lint"] as const;

type Gate = (typeof gates)[number];

const gateCommands: Record<Gate, string[]> = {
  install: ["install"],
  typecheck: ["run", "typecheck"],
  lint: ["run", "lint"],
};

function runGate(gate: Gate, cwd: string): boolean {
  const result = spawnSync("bun", gateCommands[gate], { cwd, stdio: "inherit" });
  return !result.error && result.status === 0;
}

const boilerplateRoot = findBoilerplateRoot();
const failed: string[] = [];

for (const template of templates as readonly Template[]) {
  const targetDir = mkdtempSync(join(tmpdir(), `stack-verify-${template}-`));
  console.log(`\n=== ${template} → ${targetDir} ===`);

  try {
    scaffold({
      boilerplateRoot,
      targetDir,
      template,
      force: true,
      placeholders: { appName: `verify-${template}`, appTitle: `Verify ${template}` },
      year: new Date().getFullYear(),
      toolingVersions: readToolingVersions(boilerplateRoot),
    });

    for (const gate of gates) {
      if (runGate(gate, targetDir)) continue;
      failed.push(`${template}: ${gate}`);
      // Later gates depend on the earlier ones, so stop at the first failure.
      break;
    }
  } finally {
    rmSync(targetDir, { recursive: true, force: true });
  }
}

if (failed.length > 0) {
  console.error(`\nFailed gates:\n${failed.map((entry) => `  ${entry}`).join("\n")}`);
  process.exit(1);
}

console.log(`\nAll templates install, type check and lint cleanly.`);
