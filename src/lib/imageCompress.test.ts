import { describe, expect, it } from "vitest";
import { compressImage, prepareUpload, targetSize, toJpegName } from "@/lib/imageCompress";
import { IMAGE_MAX_EDGE_PX } from "@/lib/limits";

describe("targetSize", () => {
  it("verkleinert die lange Kante auf das Maximum und hält das Seitenverhältnis", () => {
    // 4032x3024 ist das Standardformat eines Handyfotos (4:3, 12 MP).
    expect(targetSize(4032, 3024)).toEqual({ width: 1568, height: 1176 });
  });

  it("verkleinert auch hochkant korrekt", () => {
    expect(targetSize(3024, 4032)).toEqual({ width: 1176, height: 1568 });
  });

  it("lässt Bilder in Zielgröße unangetastet", () => {
    expect(targetSize(IMAGE_MAX_EDGE_PX, 900)).toBeNull();
    expect(targetSize(1200, 800)).toBeNull();
  });

  it("behält bei extremen Seitenverhältnissen mindestens 1 px", () => {
    // Ein sehr breites Panorama würde sonst auf Höhe 0 gerundet – der Canvas
    // wäre leer und das Bild verloren.
    const size = targetSize(20000, 5);
    expect(size).toEqual({ width: 1568, height: 1 });
  });

  it("ignoriert unbrauchbare Maße", () => {
    expect(targetSize(0, 100)).toBeNull();
    expect(targetSize(100, Number.NaN)).toBeNull();
  });
});

describe("toJpegName", () => {
  it("ersetzt die Endung", () => {
    expect(toJpegName("abrechnung.png")).toBe("abrechnung.jpg");
    expect(toJpegName("Nebenkosten 2024.HEIC")).toBe("Nebenkosten 2024.jpg");
  });

  it("hängt die Endung an, wenn keine da ist", () => {
    expect(toJpegName("scan")).toBe("scan.jpg");
  });

  it("erfindet einen Namen, wenn nur eine Endung da ist", () => {
    expect(toJpegName(".png")).toBe("foto.jpg");
  });
});

describe("prepareUpload", () => {
  it("reicht PDFs unverändert durch", async () => {
    const pdf = new File(["%PDF-1.4"], "abrechnung.pdf", { type: "application/pdf" });
    expect(await prepareUpload(pdf)).toBe(pdf);
  });

  it("gibt das Original zurück, wenn die Browser-APIs fehlen", async () => {
    // Im Testlauf (node-Environment) gibt es weder document noch createImageBitmap.
    // Genau dieser Pfad schützt ältere Browser vor einem harten Fehler.
    const jpg = new File(["binaer"], "foto.jpg", { type: "image/jpeg" });
    expect(await compressImage(jpg)).toBe(jpg);
    expect(await prepareUpload(jpg)).toBe(jpg);
  });
});
