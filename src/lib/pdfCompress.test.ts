import { describe, expect, it } from "vitest";
import { pageBudget, pixelSize, renderScale, shouldCompressPdf } from "@/lib/pdfCompress";
import { MAX_FILE_BYTES } from "@/lib/limits";

// Canvas und Worker gibt es in der Node-Umgebung der Tests nicht; geprüft wird
// deshalb die Rechnerei, die über Auflösung und Auslösen entscheidet.

describe("renderScale", () => {
  it("rastert A4 auf die gewünschte lange Kante hoch", () => {
    // 842 Punkte hoch → Faktor knapp 1,9, damit 1568 px daraus werden.
    expect(renderScale(595.28, 841.89, 1568)).toBeCloseTo(1.8625, 3);
  });

  it("richtet sich an der längeren Kante aus, auch quer", () => {
    expect(renderScale(841.89, 595.28, 1568)).toBeCloseTo(1.8625, 3);
  });

  it("verkleinert ein übergroßes Poster", () => {
    expect(renderScale(3200, 1600, 1568)).toBeCloseTo(0.49, 2);
  });

  it("bleibt bei unbrauchbaren Maßen bei 1", () => {
    expect(renderScale(0, 0, 1568)).toBe(1);
    expect(renderScale(595, 842, 0)).toBe(1);
  });
});

describe("pixelSize", () => {
  it("rundet auf ganze Pixel", () => {
    expect(pixelSize(595.28, 841.89, 1.8625)).toEqual({ width: 1109, height: 1568 });
  });

  it("lässt nie eine Kante auf 0 fallen", () => {
    expect(pixelSize(2, 800, 0.01)).toEqual({ width: 1, height: 8 });
  });
});

describe("shouldCompressPdf", () => {
  it("greift nur bei PDFs über der Upload-Grenze", () => {
    expect(shouldCompressPdf({ type: "application/pdf", size: MAX_FILE_BYTES + 1 })).toBe(true);
  });

  it("lässt ein PDF in Ordnung in Ruhe – die Textebene bleibt so erhalten", () => {
    expect(shouldCompressPdf({ type: "application/pdf", size: MAX_FILE_BYTES })).toBe(false);
    expect(shouldCompressPdf({ type: "application/pdf", size: 400_000 })).toBe(false);
  });

  it("fasst Bilder nicht an – die laufen über compressImage", () => {
    expect(shouldCompressPdf({ type: "image/jpeg", size: MAX_FILE_BYTES * 3 })).toBe(false);
  });
});

describe("pageBudget", () => {
  it("teilt die Upload-Grenze mit Reserve auf die Seiten auf", () => {
    // Eine Seite darf fast alles kosten, zehn Seiten je ein Zehntel davon.
    expect(pageBudget(1)).toBe(Math.floor(MAX_FILE_BYTES * 0.92));
    expect(pageBudget(10) * 10).toBeLessThan(MAX_FILE_BYTES);
  });

  it("bleibt auch bei unsinniger Seitenzahl brauchbar", () => {
    expect(pageBudget(0)).toBe(pageBudget(1));
  });
});
