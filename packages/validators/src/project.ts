import { z } from "zod";

/**
 * No `userId` here on purpose: the owner is taken from the session on the
 * server. Accepting it as input would let a client claim someone else's rows.
 */
export const createProjectSchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(500).optional(),
});

export const projectIdSchema = z.object({
  id: z.uuid(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type ProjectIdInput = z.infer<typeof projectIdSchema>;
