import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(500).optional(),
});

export const projectIdSchema = z.object({
  id: z.uuid(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type ProjectIdInput = z.infer<typeof projectIdSchema>;
