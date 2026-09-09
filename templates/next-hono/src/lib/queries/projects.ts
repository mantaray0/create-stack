import { db, projects } from "@repo/db";
import { and, desc, eq } from "drizzle-orm";

/**
 * Every query scopes to the owner: a session proves who is calling, not which
 * rows they may read. Shared by the dashboard Server Component and the Hono
 * API so the two cannot answer differently for the same user.
 */
export function listProjects(userId: string) {
  return db.query.projects.findMany({
    where: eq(projects.userId, userId),
    orderBy: desc(projects.createdAt),
  });
}

export function getProject(userId: string, id: string) {
  return db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.userId, userId)),
  });
}
