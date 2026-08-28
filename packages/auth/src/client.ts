import { createAuthClient } from "better-auth/react";

/**
 * Browser client. baseURL is relative to the current origin, so the auth
 * handler must be mounted at /api/auth.
 */
export const authClient = createAuthClient({
  baseURL: "/api/auth",
});

export const { signIn, signUp, signOut, useSession } = authClient;
