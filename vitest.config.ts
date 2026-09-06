import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfig.json setzt "jsx": "preserve" (fuer Next.js) - Vite 8/oxc
  // uebernimmt das sonst 1:1 und kann .tsx-Dateien dann nicht transformieren.
  oxc: {
    jsx: { runtime: "automatic" },
  },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: { "@": path.resolve(process.cwd(), "src") },
  },
});
