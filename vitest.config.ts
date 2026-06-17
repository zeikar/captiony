import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Provides an in-memory `localStorage` the persisted subtitle store touches on load.
    setupFiles: ["./vitest.setup.ts"],
  },
});
