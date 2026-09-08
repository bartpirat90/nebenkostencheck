import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

// tailwind.config.js ist CommonJS und liegt außerhalb von src/ – createRequire
// lädt sie unverändert, damit der Test genau die Werte prüft, die auch
// Tailwind beim Build sieht (und nicht eine Kopie, die auseinanderlaufen kann).
const requireCjs = createRequire(import.meta.url);
const tailwind = requireCjs("../../../tailwind.config.js") as {
  theme: { extend: { colors: Record<string, unknown> } };
};
const colors = tailwind.theme.extend.colors;

/** Löst "ink.fg" oder "accent" gegen die Token-Struktur auf. */
function token(path: string): string {
  const value = path.split(".").reduce<unknown>((node, key) => {
    if (node && typeof node === "object") return (node as Record<string, unknown>)[key];
    return undefined;
  }, colors);
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof (value as Record<string, unknown>).DEFAULT === "string") {
    return (value as Record<string, string>).DEFAULT;
  }
  throw new Error(`Token "${path}" fehlt in tailwind.config.js`);
}

/**
 * Relative Leuchtdichte nach WCAG 2.1:
 *   c  = Kanal / 255
 *   c' = c <= 0,03928 ? c / 12,92 : ((c + 0,055) / 1,055)^2,4
 *   L  = 0,2126 * R' + 0,7152 * G' + 0,0722 * B'
 */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/** Kontrastverhältnis nach WCAG 2.1: (heller + 0,05) / (dunkler + 0,05). */
function ratio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Die Paare aus Spec-Abschnitt 2.4: Name, Vordergrund-Token, Hintergrund-Token.
const PAIRS: Array<[string, string, string]> = [
  ["fg auf paper", "fg", "paper"],
  ["muted auf paper", "muted", "paper"],
  ["faint auf paper", "faint", "paper"],
  ["accent auf paper", "accent", "paper"],
  ["accent auf doc", "accent", "doc"],
  ["ink.fg auf ink", "ink.fg", "ink"],
  ["ink.muted auf ink", "ink.muted", "ink"],
  ["ink.faint auf ink", "ink.faint", "ink"],
  ["faint auf paper.2", "faint", "paper.2"],
  ["paper auf fg (Primaerbutton)", "paper", "fg"],
  ["accent.bright auf ink (Links im Rahmen)", "accent.bright", "ink"],
  ["status.ok auf status.okBg", "status.ok", "status.okBg"],
  ["status.warn auf status.warnBg", "status.warn", "status.warnBg"],
  ["status.neutral auf status.neutralBg", "status.neutral", "status.neutralBg"],
  ["status.danger auf status.dangerBg", "status.danger", "status.dangerBg"],
];

describe("Farbkontraste des Design-Systems", () => {
  it.each(PAIRS)("%s erreicht WCAG AA (mindestens 4,5:1)", (_name, fg, bg) => {
    expect(ratio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
  });

  // Weißer Text auf dem Akzentbutton der Berichtskarte ist der einzige Fall,
  // in dem #FFFFFF als Textfarbe vorkommt – deshalb hart mitgeprüft.
  it("weißer Text auf accent erreicht WCAG AA", () => {
    expect(ratio("#FFFFFF", token("accent"))).toBeGreaterThanOrEqual(4.5);
  });

  it("kennt die entfernten Tokens nicht mehr", () => {
    expect(colors).not.toHaveProperty("surface");
    const accent = colors.accent as Record<string, unknown>;
    expect(accent).not.toHaveProperty("bg");
    const status = colors.status as Record<string, unknown>;
    for (const gone of ["okSurface", "warnSurface", "warnBgHover", "okSoft", "warnSoft"]) {
      expect(status).not.toHaveProperty(gone);
    }
  });
});
