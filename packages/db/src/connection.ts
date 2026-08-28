/**
 * Single source of truth for the Postgres connection string, shared by the
 * runtime client and drizzle-kit.
 *
 * DATABASE_URL always wins. Without it the URL is derived from the same
 * variables docker-compose.yml uses, so a fresh checkout works after `db:up`
 * even when no .env exists yet.
 */
export function resolveDatabaseUrl(): string {
  const fromEnv = process.env.DATABASE_URL;
  if (fromEnv) return fromEnv;

  const port = process.env.POSTGRES_PORT ?? "5432";
  const user = process.env.POSTGRES_USER ?? "postgres";
  const password = process.env.POSTGRES_PASSWORD ?? "postgres";
  const database = process.env.POSTGRES_DB ?? "postgres";

  return `postgres://${user}:${password}@localhost:${port}/${database}`;
}
