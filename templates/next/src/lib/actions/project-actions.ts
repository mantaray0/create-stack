"use server";

import { db, projects } from "@repo/db";
import { createProjectSchema, projectIdSchema } from "@repo/validators";
import { eq } from "drizzle-orm";
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
 */
async function hasSession(): Promise<boolean> {
  const session = await auth.api.getSession({ headers: await headers() });
  return session !== null;
}

export async function createProject(input: unknown): Promise<ActionResult> {
  if (!(await hasSession())) {
    return { error: "You need to be signed in." };
  }

  const parsed = createProjectSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  await db.insert(projects).values({
    name: parsed.data.name,
    description: parsed.data.description,
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteProject(input: unknown): Promise<ActionResult> {
  if (!(await hasSession())) {
    return { error: "You need to be signed in." };
  }

  const parsed = projectIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid project id." };
  }

  await db.delete(projects).where(eq(projects.id, parsed.data.id));

  revalidatePath("/dashboard");
  return { success: true };
}
