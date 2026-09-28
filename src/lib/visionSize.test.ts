import { describe, expect, it } from "vitest";
import { visionSize, visionTokens } from "@/lib/visionSize";
import { VISION_MAX_TOKENS } from "@/lib/limits";

// Die Erwartungswerte stammen aus Anthropics Doku (Vision, „Resolution and
// token cost“, und vision-coordinates). Weicht die Rechnung ab, schicken wir
// entweder Pixel, die Claude verwirft, oder weniger, als es sehen könnte.

describe("visionTokens", () => {
  it("zählt angefangene 28er-Blöcke", () => {
    expect(visionTokens(1075, 1520)).toBe(39 * 55);
    expect(visionTokens(28, 28)).toBe(1);
    expect(visionTokens(29, 28)).toBe(2);
  });
});

describe("visionSize", () => {
  it("bringt einen A4-Scan auf dieselben Maße wie Claude", () => {
    // Das Beispiel aus der Doku: 130-dpi-Scan, beide Kanten unter 1568 px,
    // aber über dem Token-Budget.
    expect(visionSize(1075, 1520)).toEqual({ width: 924, height: 1307 });
  });

  it("trifft die Tabellenwerte der Doku", () => {
    expect(visionSize(1920, 1080)).toEqual({ width: 1456, height: 819 });
    // Die Tabelle der Doku nennt 1269, ihre eigene Referenzimplementierung
    // liefert 1270 – und 1270×952 bleibt mit 46×34 = 1564 Token im Budget.
    // Maßgeblich ist die Implementierung.
    expect(visionSize(2000, 1500)).toEqual({ width: 1270, height: 952 });
    expect(visionSize(3840, 2160)).toEqual({ width: 1456, height: 819 });
  });

  it("lässt Bilder in Ordnung unverändert", () => {
    expect(visionSize(1000, 1000)).toEqual({ width: 1000, height: 1000 });
    expect(visionSize(200, 200)).toEqual({ width: 200, height: 200 });
  });

  it("rechnet hochkant wie quer", () => {
    expect(visionSize(1080, 1920)).toEqual({ width: 819, height: 1456 });
  });

  it("bleibt bei jedem Ergebnis im Token-Budget", () => {
    // Handyfoto 4:3, A4 aus PDF-Punkten hochgerechnet, US-Letter, Querformat.
    for (const [w, h] of [[4032, 3024], [2381, 3368], [2448, 3168], [3368, 2381]]) {
      const size = visionSize(w, h);
      expect(visionTokens(size.width, size.height)).toBeLessThanOrEqual(VISION_MAX_TOKENS);
    }
  });

  it("lässt die lange Kante bei extremen Formaten nicht über das Maximum", () => {
    const size = visionSize(20000, 5);
    expect(size.width).toBeLessThanOrEqual(1568);
    expect(size.height).toBeGreaterThanOrEqual(1);
  });

  it("gibt unbrauchbare Maße unverändert zurück", () => {
    expect(visionSize(0, 100)).toEqual({ width: 0, height: 100 });
  });
});
