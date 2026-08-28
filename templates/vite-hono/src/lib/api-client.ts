import { hc } from "hono/client";
import type { ApiType } from "../../server/api";

/**
 * End-to-end typed API client via Hono RPC.
 * Changes in server/routes/*.ts reach the frontend without code generation.
 */
export const api = hc<ApiType>("/api");
