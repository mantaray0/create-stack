import { createMiddleware } from "hono/factory";
import { auth } from "@/lib/auth";

type SessionResult = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export type SessionVariables = {
  user: SessionResult["user"];
  session: SessionResult["session"];
};

/**
 * Rejects requests without a valid session before any handler runs. The Route
 * Handler hands Hono the raw Request, so `c.req.raw.headers` carries the
 * session cookie exactly as a standalone server would see it.
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
