import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Next has no Vite config of its own, so Vitest gets a standalone one.
// `resolve.tsconfigPaths` (Vite 8, native) picks up the `@/*` alias from
// tsconfig.json.
export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
