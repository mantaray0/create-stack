import { account, db, session, user, verification } from "@repo/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export interface CreateAuthOptions {
  /** Origin of the app, e.g. http://localhost:3000 */
  baseURL?: string;
}

/**
 * The development fallback keeps a fresh checkout running without any setup,
 * but it is a publicly known value: every project generated from this
 * boilerplate ships the same string. Shipping it to production would make
 * session tokens forgeable, so refuse to start instead.
 */
function resolveSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "BETTER_AUTH_SECRET is not set. Generate one (for example with " +
        "`openssl rand -base64 32`) and set it before starting in production.",
    );
  }

  return "dev-secret-change-me";
}

export function createAuth(options?: CreateAuthOptions) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: { user, session, account, verification },
    }),
    baseURL: options?.baseURL ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    secret: resolveSecret(),
    emailAndPassword: {
      enabled: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
