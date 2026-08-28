"use server";

import { db, projects } from "@repo/db";
import { createProjectSchema, projectIdSchema } from "@repo/validators";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export interface ActionResult {
  success?: boolean;
  error?: string;
}

/**
 * Server Actions are publicly reachable HTTP endpoints. The session guard in
 * the dashboard layout only protects rendering, so every action has to check
 * for itself — otherwise anyone can call it directly.
 *
 * It returns the user id rather than a boolean because knowing *that* someone
 * is signed in is not enough: every statement below also has to scope to
 * *which* rows belong to them.
 */
async function getSessionUserId(): Promise<string | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

export async function createProject(input: unknown): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { error: "You need to be signed in." };
  }

  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await db.insert(projects).values({
    userId,
    name: parsed.data.name,
    description: parsed.data.description,
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteProject(input: unknown): Promise<ActionResult> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { error: "You need to be signed in." };
  }

  const parsed = projectIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid project id." };
  }

  // Matching on the owner as well is what makes a guessed id harmless. The
  // result stays the same either way so a caller cannot probe which ids exist.
  await db
    .delete(projects)
    .where(and(eq(projects.id, parsed.data.id), eq(projects.userId, userId)));

  revalidatePath("/dashboard");
  return { success: true };
}
