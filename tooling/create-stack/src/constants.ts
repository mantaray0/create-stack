export const templates = ["vite-hono", "next"] as const;

export type Template = (typeof templates)[number];

export const defaultTemplate: Template = "vite-hono";

/** Human readable one-liners used in the interactive template picker. */
export const templateDescriptions: Record<Template, string> = {
  "vite-hono": "Vite SPA + Hono API (Bun), end-to-end typed via Hono RPC",
  next: "Next.js 16 App Router with Server Components and Server Actions",
};

/** Shared packages copied into every generated project. */
export const sharedPackages = ["ui", "db", "auth", "validators"] as const;

/**
 * Directories that must never end up in a generated project:
 * node_modules is reinstalled, drizzle migrations are regenerated per project.
 */
export const droppedDirectories = new Set(["node_modules", "drizzle"]);

/**
 * Directory holding files that are copied into every generated project.
 * Dotfiles live here without their leading dot because npm strips `.gitignore`
 * from published tarballs; `dotfileTargets` maps them back on scaffold.
 */
export const sharedTemplateDir = "_shared";

/** Source file name -> name written into the generated project. */
export const dotfileTargets: Record<string, string> = {
  gitignore: ".gitignore",
};

/**
 * Files copied verbatim from the boilerplate root, because the boilerplate and
 * every generated project share the exact same tooling config.
 * Anything that needs placeholders lives in `templates/_shared` instead.
 */
export const rootFilesToCopy = ["biome.json", "tsconfig.base.json"];

export const bunVersion = "1.3.5";
