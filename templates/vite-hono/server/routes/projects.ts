import { zValidator } from "@hono/zod-validator";
import { db, projects } from "@repo/db";
import { createProjectSchema, projectIdSchema } from "@repo/validators";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireSession, type SessionVariables } from "../middleware/require-session";

/**
 * `requireSession` only establishes who is calling. Every handler below also
 * has to say which rows that caller may touch — the owner always comes from
 * the session, never from the request body or the URL.
 */
const routes = new Hono<{ Variables: SessionVariables }>()
  .use("*", requireSession)
  .get("/", async (c) => {
    const items = await db.query.projects.findMany({
      where: eq(projects.userId, c.get("user").id),
      orderBy: desc(projects.createdAt),
    });
    return c.json({ items });
  })
  .post("/", zValidator("json", createProjectSchema), async (c) => {
    const input = c.req.valid("json");
    const [project] = await db
      .insert(projects)
      .values({ ...input, userId: c.get("user").id })
      .returning();
    return c.json({ project }, 201);
  })
  .delete("/:id", zValidator("param", projectIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    // Matching on the owner as well is what makes a guessed id harmless. The
    // response stays the same either way so a caller cannot probe which ids
    // exist.
    await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, c.get("user").id)));
    return c.json({ success: true });
  });

export type ProjectRoutes = typeof routes;

export default routes;
