import { visionSize, visionTokens, VISION_MAX_TOKENS } from "./visionSize";

// Dieselben Erwartungswerte wie im Web-Test: Beide Seiten müssen Bilder
// identisch aufbereiten, sonst sieht Claude je nach Kanal etwas anderes.

describe("visionTokens", () => {
  it("zählt angefangene 28er-Blöcke", () => {
    expect(visionTokens(1075, 1520)).toBe(39 * 55);
    expect(visionTokens(29, 28)).toBe(2);
  });
});

describe("visionSize", () => {
  it("bringt einen A4-Scan auf dieselben Maße wie Claude", () => {
    expect(visionSize(1075, 1520)).toEqual({ width: 924, height: 1307 });
  });

  it("verkleinert Handyfotos quer und hochkant symmetrisch", () => {
    expect(visionSize(4032, 3024)).toEqual({ width: 1270, height: 952 });
    expect(visionSize(3024, 4032)).toEqual({ width: 952, height: 1270 });
  });

  it("trifft die Tabellenwerte der Doku", () => {
    expect(visionSize(1920, 1080)).toEqual({ width: 1456, height: 819 });
    expect(visionSize(2000, 1500)).toEqual({ width: 1270, height: 952 });
  });

  it("lässt passende Bilder unverändert", () => {
    expect(visionSize(1000, 800)).toEqual({ width: 1000, height: 800 });
  });

  it("bleibt bei großen Kamerasensoren im Budget", () => {
    // 12, 50 und 200 Megapixel, jeweils 4:3.
    for (const [w, h] of [[4000, 3000], [8160, 6120], [16320, 12240]]) {
      const size = visionSize(w, h);
      expect(visionTokens(size.width, size.height)).toBeLessThanOrEqual(VISION_MAX_TOKENS);
    }
  });

  it("gibt unbrauchbare Maße unverändert zurück", () => {
    expect(visionSize(0, 100)).toEqual({ width: 0, height: 100 });
  });
});
