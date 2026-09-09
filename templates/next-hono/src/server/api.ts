import { Hono } from "hono";
import projectRoutes from "./routes/projects";

/**
 * Typed API surface. External clients (a native app, a script) import
 * `ApiType` and call it through Hono RPC (`hc`) with no code generation:
 *
 *   import { hc } from "hono/client";
 *   import type { ApiType } from "<this project>/src/server/api";
 *   const api = hc<ApiType>("https://your-app.example/api");
 */
const api = new Hono()
  .get("/health", (c) => c.json({ ok: true as const }))
  .route("/projects", projectRoutes);

export type ApiType = typeof api;

export default api;
