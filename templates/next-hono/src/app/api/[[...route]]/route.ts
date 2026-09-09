import { Hono } from "hono";
import { handle } from "hono/vercel";
import api from "@/server/api";

// Hono mounted in a Route Handler: one Next process, one port. Better Auth
// keeps its own handler at `app/api/auth/*` and is not routed through here.
const app = new Hono().route("/api", api);

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

/** RPC type for external clients that call this API directly. */
export type ApiRoutes = typeof app;
