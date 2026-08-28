import { createMiddleware } from "hono/factory";
import { auth } from "../auth";

type SessionResult = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export type SessionVariables = {
  user: SessionResult["user"];
  session: SessionResult["session"];
};

/**
 * Rejects requests without a valid session before any handler runs.
 *
 * Guarding the UI is not enough: every route below is a plain HTTP endpoint
 * that anyone can call directly, so the check has to live on the server.
 */
export const requireSession = createMiddleware<{ Variables: SessionVariables }>(async (c, next) => {
  const result = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!result) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("user", result.user);
  c.set("session", result.session);
  await next();
});
