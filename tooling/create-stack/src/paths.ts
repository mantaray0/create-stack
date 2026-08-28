import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ToolingVersions } from "./project-files.js";

/**
 * Directory of the running module. Works both for the TypeScript sources
 * (executed via `bun tooling/create-stack/src/index.ts`) and for the bundled
 * Node build in `bin/`.
 */
function moduleDir(): string {
  if (typeof import.meta.dirname === "string") return import.meta.dirname;
  return dirname(fileURLToPath(import.meta.url));
}

/**
 * A directory qualifies as the boilerplate root when it carries the payload
 * the scaffolder copies from. Probing for content instead of hardcoding
 * "../../.." keeps the lookup correct no matter how deep the entry point sits.
 */
function isBoilerplateRoot(candidate: string): boolean {
  return (
    existsSync(join(candidate, "templates", "vite-hono")) &&
    existsSync(join(candidate, "packages", "ui")) &&
    existsSync(join(candidate, "package.json"))
  );
}

/**
 * Walk up from the running module until the boilerplate payload is found.
 * Throws instead of guessing, because a wrong root silently produces a
 * half-empty project.
 */
export function findBoilerplateRoot(): string {
  let current = moduleDir();

  for (let depth = 0; depth < 10; depth++) {
    if (isBoilerplateRoot(current)) return current;
    const parent = resolve(current, "..");
    if (parent === current) break;
    current = parent;
  }

  throw new Error(
    "Could not locate the boilerplate payload (templates/ and packages/) relative to " +
      `${moduleDir()}. The package looks incomplete — please reinstall it.`,
  );
}

type BoilerplatePackageJson = {
  version?: string;
  devDependencies?: Record<string, string>;
};

function readPackageJson(boilerplateRoot: string): BoilerplatePackageJson {
  try {
    return JSON.parse(
      readFileSync(join(boilerplateRoot, "package.json"), "utf-8"),
    ) as BoilerplatePackageJson;
  } catch {
    return {};
  }
}

/** Version of the scaffolder itself, read from the boilerplate package.json. */
export function readVersion(boilerplateRoot: string): string {
  return readPackageJson(boilerplateRoot).version ?? "0.0.0";
}

/**
 * Biome and TypeScript versions the boilerplate uses. Generated projects pin the
 * same ones so their formatting and type checking match this repository exactly.
 */
export function readToolingVersions(boilerplateRoot: string): ToolingVersions {
  const devDependencies = readPackageJson(boilerplateRoot).devDependencies ?? {};
  return {
    biome: devDependencies["@biomejs/biome"] ?? "2.5.10",
    typescript: devDependencies.typescript ?? "^5.9.3",
  };
}
