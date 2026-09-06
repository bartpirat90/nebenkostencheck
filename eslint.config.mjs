import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Warum FlatCompat statt einer nativen Flat-Config: eslint-config-next@15.5
// exportiert (Stand jetzt) noch keine eigene Flat-Config, sondern nur die
// klassischen .eslintrc-Presets ("next/core-web-vitals", "next/typescript").
// FlatCompat uebersetzt diese Presets fuer ESLint 9. Sobald eslint-config-next
// eine native Flat-Config anbietet, kann FlatCompat entfernt werden.
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    // next-env.d.ts wird von Next.js bei jedem Start neu generiert (Kommentar
    // im File: "This file should not be edited") und nutzt bewusst
    // Triple-Slash-Referenzen, die @typescript-eslint/triple-slash-reference
    // sonst als Fehler meldet. Kein Projektcode, daher ausgeschlossen.
    ignores: [".next/**", "node_modules/**", "mobile/**", "out/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
