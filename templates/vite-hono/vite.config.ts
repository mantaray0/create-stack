/// <reference types="vitest/config" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": "http://localhost:3001",
    },
  },
  build: {
    outDir: "dist/client",
  },
  test: {
    // jsdom so component tests can render; API route tests ignore it and drive
    // the Hono instance directly with `route.request(...)`.
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
