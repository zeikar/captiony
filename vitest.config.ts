import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Mirror the tsconfig `@/*` -> repo-root path alias for tests.
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    // jsdom provides both a DOM (for React component tests) and a native
    // localStorage, which the persisted subtitle store touches on load.
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: false,
  },
});
