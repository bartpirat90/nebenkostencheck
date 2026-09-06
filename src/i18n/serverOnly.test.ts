import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { isServerOnlyNamespace, SERVER_ONLY_NAMESPACES } from "./serverOnly";

const MESSAGES_DIR = join(__dirname, "..", "..", "messages");
const COMPONENT_DIRS = [join(__dirname, "..", "components"), join(__dirname, "..", "app")];

function listFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

describe("SERVER_ONLY_NAMESPACES", () => {
  it("nennt nur Namespaces, die in messages/de.json existieren (Tippfehler-Schutz)", () => {
    const de = JSON.parse(readFileSync(join(MESSAGES_DIR, "de.json"), "utf8"));
    for (const ns of SERVER_ONLY_NAMESPACES) {
      expect(de, `Namespace "${ns}" fehlt in de.json`).toHaveProperty(ns);
    }
  });

  it("wird nirgends per useTranslations angefragt (Hook = potenziell Client)", () => {
    // Bewusst alle Dateien, nicht nur die mit eigener "use client"-Direktive:
    // Komponenten wie Footer oder Faq sind transitiv Client (importiert aus der
    // "use client"-Startseite) und würden bei useTranslations("legal") zur
    // Laufzeit MISSING_MESSAGE werfen. Server-Komponenten nutzen im Projekt
    // durchgängig getTranslations, deshalb ist der Hook das richtige Signal.
    // Das Regex fängt auch Unter-Namespaces wie "legal.impressum".
    const files = COMPONENT_DIRS.flatMap(listFiles).filter(
      (f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f),
    );
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      if (!src.includes("useTranslations(")) continue;
      for (const ns of SERVER_ONLY_NAMESPACES) {
        expect(src, `${file} nutzt useTranslations("${ns}")`).not.toMatch(
          new RegExp(`useTranslations\\(\\s*["']${ns}(\\.[^"']*)?["']`),
        );
      }
    }
  });

  it("isServerOnlyNamespace unterscheidet Server- und Client-Namespaces", () => {
    expect(isServerOnlyNamespace("legal")).toBe(true);
    expect(isServerOnlyNamespace("upload")).toBe(false);
  });
});
