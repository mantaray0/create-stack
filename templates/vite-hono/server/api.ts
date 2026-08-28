import { Hono } from "hono";
import projectRoutes from "./routes/projects";

/**
 * Typed API. The client uses Hono RPC (hc) and therefore gets full
 * end-to-end types without any code generation.
 */
const api = new Hono()
  .get("/health", (c) => c.json({ ok: true as const }))
  .route("/projects", projectRoutes);

export type ApiType = typeof api;

export default api;
