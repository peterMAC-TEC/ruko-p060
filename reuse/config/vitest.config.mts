import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      // Next.js guards server modules with this import; tests run in plain Node.
      "server-only": path.resolve(import.meta.dirname, "src/test/empty.ts"),
    },
  },
  test: {
    // Live AI checks only run on demand: `npm run test:live`.
    exclude: ["**/node_modules/**", process.env.npm_lifecycle_event === "test:live" ? "" : "**/*.live.test.ts"].filter(Boolean),
  },
});
