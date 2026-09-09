import { expect, test } from "vitest";
import api from "../api";
import routes from "./projects";

/**
 * A chained Hono instance is testable on its own: `request()` runs it in
 * memory, no server and no port. These cases stop before any query, so they
 * need no database either.
 */
test("the API answers its health check", async () => {
  const response = await api.request("/health");

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ ok: true });
});

test("listing projects without a session is rejected", async () => {
  const response = await routes.request("/");

  expect(response.status).toBe(401);
});
