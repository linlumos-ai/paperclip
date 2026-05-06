import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createUiDevWatchOptions } from "./src/lib/vite-watch";

/**
 * Resolves the Lexical ESM entry from either the package-local install or the
 * workspace root install so dev works across different pnpm linking layouts.
 */
function resolveLexicalEntry() {
  const packageLocalEntry = path.resolve(__dirname, "./node_modules/lexical/Lexical.mjs");
  if (fs.existsSync(packageLocalEntry)) {
    return packageLocalEntry;
  }

  return path.resolve(__dirname, "../node_modules/lexical/Lexical.mjs");
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  build: {
    minify: "esbuild",
  },
  esbuild:
    mode === "production"
      ? {
          drop: ["console", "debugger"],
          legalComments: "none",
        }
      : undefined,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      lexical: resolveLexicalEntry(),
    },
  },
  server: {
    port: 5173,
    watch: createUiDevWatchOptions(process.cwd()),
    proxy: {
      "/api": {
        target: "http://localhost:3107",
        ws: true,
      },
    },
  },
}));
