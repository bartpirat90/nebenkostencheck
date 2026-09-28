import { describe, expect, it } from "vitest";
import { compressImage, prepareUpload, targetSize, toJpegName } from "@/lib/imageCompress";

describe("targetSize", () => {
  it("verkleinert ein Handyfoto auf das Maß, das Claude ansieht", () => {
    // 4032x3024 ist das Standardformat eines Handyfotos (4:3, 12 MP). Grenze ist
    // hier nicht die Kante, sondern das Budget von 1568 Bild-Token.
    expect(targetSize(4032, 3024)).toEqual({ width: 1270, height: 952 });
  });

  it("verkleinert auch hochkant korrekt", () => {
    expect(targetSize(3024, 4032)).toEqual({ width: 952, height: 1270 });
  });

  it("verkleinert einen Scan, dessen Kanten schon unter 1568 px liegen", () => {
    // Das Token-Budget greift auch ohne übergroße Kante.
    expect(targetSize(1075, 1520)).toEqual({ width: 924, height: 1307 });
  });

  it("lässt Bilder in Zielgröße unangetastet", () => {
    expect(targetSize(924, 1307)).toBeNull();
    expect(targetSize(1000, 800)).toBeNull();
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
