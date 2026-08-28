import { createAuth } from "@repo/auth";

export const auth = createAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:5173",
});
