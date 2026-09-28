import { describe, expect, it } from "vitest";
import { inkShare, looksBlank } from "@/lib/pageInk";

// Vorschaubild im Format der Seitenauswahl: 360 px breit, A4-Verhältnis.
const W = 360;
const H = 509;

function page(fill: number): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = rgba[i + 1] = rgba[i + 2] = fill;
    rgba[i + 3] = 255;
  }
  return rgba;
}

function paint(rgba: Uint8ClampedArray, x: number, y: number, w: number, h: number, value: number) {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      const i = (yy * W + xx) * 4;
      rgba[i] = rgba[i + 1] = rgba[i + 2] = value;
    }
  }
}

describe("inkShare / looksBlank", () => {
  it("erkennt ein weißes Blatt als leer", () => {
    expect(looksBlank(inkShare(page(255), W, H))).toBe(true);
  });

  it("erkennt eine gescannte Rückseite mit durchscheinender Schrift als leer", () => {
    const rgba = page(242);
    // Spiegelverkehrt durchscheinender Text: großflächig, aber hell.
    paint(rgba, 40, 60, 280, 300, 225);
    expect(looksBlank(inkShare(rgba, W, H))).toBe(true);
  });

  it("übersieht keine Seite mit nur einer Textzeile", () => {
    // Letzte Seite einer Abrechnung, auf der nur noch das Guthaben steht:
    // eine Zeile von rund 200 px Länge und 2 px Strichstärke.
    const rgba = page(255);
    paint(rgba, 60, 250, 200, 2, 90);
    expect(looksBlank(inkShare(rgba, W, H))).toBe(false);
  });

  it("zählt den Scannerschatten am Rand nicht als Inhalt", () => {
    const rgba = page(250);
    paint(rgba, 0, 0, W, 8, 30);
    paint(rgba, 0, 0, 6, H, 30);
    expect(looksBlank(inkShare(rgba, W, H))).toBe(true);
  });

  it("lässt eine alleinstehende Seitenzahl als leer durchgehen", () => {
    const rgba = page(255);
    paint(rgba, 170, 470, 20, 3, 60);
    expect(looksBlank(inkShare(rgba, W, H))).toBe(true);
  });

  it("hält einen durchgehend dunklen Scan nicht für leer", () => {
    // Unterbelichtet: lieber einmal zu wenig abwählen als eine Seite verlieren.
    expect(looksBlank(inkShare(page(180), W, H))).toBe(false);
  });
});
