import { defineConfig } from "drizzle-kit";
import { resolveDatabaseUrl } from "./src/connection";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: resolveDatabaseUrl(),
  },
});
