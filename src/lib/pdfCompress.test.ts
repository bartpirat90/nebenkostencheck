import { describe, expect, it } from "vitest";
import { needsPdfWork, normalizeSelection, pageBudget, rasterSize } from "@/lib/pdfCompress";
import { MAX_FILE_BYTES, VISION_MAX_TOKENS } from "@/lib/limits";
import { visionTokens } from "@/lib/visionSize";

// Canvas und Worker gibt es in der Node-Umgebung der Tests nicht; geprüft wird
// deshalb die Rechnerei, die über Auflösung, Seiten und Auslösen entscheidet.

describe("rasterSize", () => {
  it("rastert A4 auf genau das Maß, das Claude ansieht", () => {
    expect(rasterSize(595.28, 841.89)).toEqual({ width: 924, height: 1307 });
  });

  it("rechnet Querformat gespiegelt", () => {
    expect(rasterSize(841.89, 595.28)).toEqual({ width: 1307, height: 924 });
  });

  it("bleibt auch bei US-Letter im Token-Budget", () => {
    const size = rasterSize(612, 792);
    expect(visionTokens(size.width, size.height)).toBeLessThanOrEqual(VISION_MAX_TOKENS);
  });
});

describe("normalizeSelection", () => {
  it("nimmt ohne Auswahl alle Seiten", () => {
    expect(normalizeSelection(undefined, 4)).toEqual([1, 2, 3, 4]);
  });

  it("sortiert und entfernt Doppelte", () => {
    expect(normalizeSelection([3, 1, 3], 5)).toEqual([1, 3]);
  });

  it("verwirft Seiten, die es nicht gibt", () => {
    expect(normalizeSelection([0, 2, 9, 1.5], 4)).toEqual([2]);
  });

  it("fällt bei leerer Auswahl auf alle Seiten zurück statt ein leeres PDF zu bauen", () => {
    expect(normalizeSelection([], 3)).toEqual([1, 2, 3]);
  });
});

describe("needsPdfWork", () => {
  it("lässt ein vollständiges PDF in der Grenze in Ruhe – die Textebene bleibt so erhalten", () => {
    expect(needsPdfWork({ type: "application/pdf", size: MAX_FILE_BYTES })).toBe(false);
    expect(needsPdfWork({ type: "application/pdf", size: 400_000 })).toBe(false);
  });

  it("greift bei PDFs über der Upload-Grenze", () => {
    expect(needsPdfWork({ type: "application/pdf", size: MAX_FILE_BYTES + 1 })).toBe(true);
  });

  it("greift bei einer Seitenauswahl, auch wenn die Datei klein ist", () => {
    expect(needsPdfWork({ type: "application/pdf", size: 400_000 }, [1, 2])).toBe(true);
  });

  it("fasst Bilder nicht an – die laufen über compressImage", () => {
    expect(needsPdfWork({ type: "image/jpeg", size: MAX_FILE_BYTES * 3 })).toBe(false);
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
