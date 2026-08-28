import { zValidator } from "@hono/zod-validator";
import { db, projects } from "@repo/db";
import { createProjectSchema, projectIdSchema } from "@repo/validators";
import { desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireSession, type SessionVariables } from "../middleware/require-session";

const routes = new Hono<{ Variables: SessionVariables }>()
  .use("*", requireSession)
  .get("/", async (c) => {
    const items = await db.query.projects.findMany({
      orderBy: desc(projects.createdAt),
    });
    return c.json({ items });
  })
  .post("/", zValidator("json", createProjectSchema), async (c) => {
    const input = c.req.valid("json");
    const [project] = await db.insert(projects).values(input).returning();
    return c.json({ project }, 201);
  })
  .delete("/:id", zValidator("param", projectIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    await db.delete(projects).where(eq(projects.id, id));
    return c.json({ success: true });
  });

export type ProjectRoutes = typeof routes;

export default routes;
