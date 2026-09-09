import { zValidator } from "@hono/zod-validator";
import { projectIdSchema } from "@repo/validators";
import { Hono } from "hono";
import { getProject, listProjects } from "@/lib/queries/projects";
import { requireSession, type SessionVariables } from "../middleware/require-session";

/**
 * Read-only on purpose: mutations stay Server Actions in `src/lib/actions/`,
 * so write logic lives in one place. The handlers hold no logic of their own —
 * they resolve the caller and call the same functions the Server Components
 * use.
 *
 * Chained on purpose too: breaking the chain into statements loses the RPC
 * type that `src/app/api/[[...route]]/route.ts` re-exports for external
 * clients.
 */
const routes = new Hono<{ Variables: SessionVariables }>()
  .use("*", requireSession)
  .get("/", async (c) => {
    return c.json({ items: await listProjects(c.get("user").id) });
  })
  .get("/:id", zValidator("param", projectIdSchema), async (c) => {
    const project = await getProject(c.get("user").id, c.req.valid("param").id);
    if (!project) return c.json({ error: "Not found" }, 404);
    return c.json({ project });
  });

export type ProjectRoutes = typeof routes;

export default routes;
