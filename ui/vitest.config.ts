import fs from "node:fs";
import path from "path";
import { defineConfig } from "vitest/config";

/**
 * Resolves the Lexical ESM entry from either the package-local install or the
 * workspace root install so tests match the runtime resolver.
 */
function resolveLexicalEntry() {
  const packageLocalEntry = path.resolve(__dirname, "./node_modules/lexical/Lexical.mjs");
  if (fs.existsSync(packageLocalEntry)) {
    return packageLocalEntry;
  }

  return path.resolve(__dirname, "../node_modules/lexical/Lexical.mjs");
}

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      lexical: resolveLexicalEntry(),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
  },
});
