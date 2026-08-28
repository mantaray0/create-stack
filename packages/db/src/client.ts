import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { resolveDatabaseUrl } from "./connection";
import * as schema from "./schema";

const client = postgres(resolveDatabaseUrl());

export const db = drizzle(client, { schema });

export type Database = typeof db;
