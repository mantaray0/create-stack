import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const textExtensions = new Set([
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
  ".example",
]);

const textFileNames = new Set([".gitignore", "gitignore", "LICENSE", "Dockerfile"]);

/**
 * Placeholders are only substituted in text files; binary assets (fonts,
 * images) are copied byte for byte.
 */
export function isTextFile(entryName: string): boolean {
  if (textFileNames.has(entryName)) return true;
  for (const extension of textExtensions) {
    if (entryName.endsWith(extension)) return true;
  }
  return false;
}

export type Placeholders = {
  appName: string;
  appTitle: string;
};

export function replacePlaceholders(content: string, placeholders: Placeholders): string {
  return content
    .replaceAll(/\{\{\s*APP_NAME\s*\}\}/g, placeholders.appName)
    .replaceAll(/\{\{\s*APP_TITLE\s*\}\}/g, placeholders.appTitle);
}

export function listDirSafe(dir: string): string[] {
  return existsSync(dir) ? readdirSync(dir) : [];
}

export function isDirEmpty(path: string): boolean {
  return listDirSafe(path).length === 0;
}

export function copyTextFile(
  sourcePath: string,
  targetPath: string,
  placeholders: Placeholders,
): void {
  const content = replacePlaceholders(readFileSync(sourcePath, "utf-8"), placeholders);
  writeFileSync(targetPath, content);
}

export type CopyTreeOptions = {
  placeholders: Placeholders;
  /** Directory names that are skipped entirely. */
  skipDirectories?: ReadonlySet<string>;
  /** Entry names that are skipped entirely (files and directories). */
  skipEntries?: ReadonlySet<string>;
  /** Renames applied to file names, e.g. `gitignore` -> `.gitignore`. */
  renames?: Record<string, string>;
};

/**
 * Recursively copy a directory, substituting placeholders in text files and
 * applying the dotfile renames npm forces on us.
 */
export function copyTree(sourceDir: string, targetDir: string, options: CopyTreeOptions): void {
  mkdirSync(targetDir, { recursive: true });

  for (const entry of readdirSync(sourceDir)) {
    if (options.skipEntries?.has(entry)) continue;

    const sourcePath = join(sourceDir, entry);
    const stats = statSync(sourcePath);

    if (stats.isDirectory()) {
      if (options.skipDirectories?.has(entry)) continue;
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

export function toKebabCase(value: string): string {
  return value
    .trim()
    .replaceAll(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

export function toTitleCase(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
