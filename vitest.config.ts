import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfig.json setzt "jsx": "preserve" (fuer Next.js) - Vite 8/oxc
  // uebernimmt das sonst 1:1 und kann .tsx-Dateien dann nicht transformieren.
  oxc: {
    jsx: { runtime: "automatic" },
  },
  test: {
    // .tsx zusätzlich, damit Komponententests (Illustrationen) laufen. Das
    // node-Environment bleibt: gerendert wird per react-dom/server, ein DOM
    // braucht das Projekt bisher nicht (kein @testing-library/react installiert).
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
  },
  resolve: {
    alias: { "@": path.resolve(process.cwd(), "src") },
  },
});
