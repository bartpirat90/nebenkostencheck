import { describe, expect, it } from "vitest";
import { sniffMediaType, isAllowedUpload } from "@/lib/fileType";

// Testdaten per Buffer.from([...]).toString("base64") erzeugen — keine
// geratenen/hartkodierten Base64-Strings, damit die Signatur-Bytes nachvollziehbar bleiben.
const toB64 = (bytes: number[]) => Buffer.from(bytes).toString("base64");

const PDF_HEADER = toB64([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
const JPEG_HEADER = toB64([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PNG_HEADER = toB64([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP_HEADER = toB64([
  0x52, 0x49, 0x46, 0x46, // RIFF
  0x00, 0x00, 0x00, 0x00, // Groesse (fuer den Sniff irrelevant)
  0x57, 0x45, 0x42, 0x50, // WEBP
]);
const UNKNOWN_TEXT = Buffer.from("Hallo Welt", "utf8").toString("base64");

describe("sniffMediaType", () => {
  it("erkennt %PDF als application/pdf", () => {
    expect(sniffMediaType(PDF_HEADER)).toBe("application/pdf");
  });

  it("erkennt FF D8 FF als image/jpeg", () => {
    expect(sniffMediaType(JPEG_HEADER)).toBe("image/jpeg");
  });

  it("erkennt die PNG-Signatur als image/png", () => {
    expect(sniffMediaType(PNG_HEADER)).toBe("image/png");
  });

  it("erkennt RIFF....WEBP als image/webp", () => {
    expect(sniffMediaType(WEBP_HEADER)).toBe("image/webp");
  });

  it("gibt null fuer unbekannte Signaturen zurueck", () => {
    expect(sniffMediaType(UNKNOWN_TEXT)).toBeNull();
  });

  it("gibt null fuer einen leeren String zurueck", () => {
    expect(sniffMediaType("")).toBeNull();
  });

  it("gibt null fuer ungueltiges Base64 zurueck", () => {
    expect(sniffMediaType("!!!invalid-b64!!")).toBeNull();
  });
});

describe("isAllowedUpload", () => {
  it("ist true, wenn deklarierter und gesniffter Typ uebereinstimmen", () => {
    expect(isAllowedUpload("application/pdf", "application/pdf")).toBe(true);
    expect(isAllowedUpload("image/png", "image/png")).toBe(true);
  });

  it("normalisiert image/jpg zu image/jpeg", () => {
    expect(isAllowedUpload("image/jpg", "image/jpeg")).toBe(true);
    expect(isAllowedUpload("IMAGE/JPG", "image/jpeg")).toBe(true);
  });

  it("ignoriert Gross-/Kleinschreibung beim deklarierten Typ", () => {
    expect(isAllowedUpload("Application/PDF", "application/pdf")).toBe(true);
  });

  it("ist false bei Typ-Mismatch (deklariert != gesnifft)", () => {
    expect(isAllowedUpload("image/png", "application/pdf")).toBe(false);
  });

  it("ist false, wenn nichts gesnifft werden konnte", () => {
    expect(isAllowedUpload("application/pdf", null)).toBe(false);
  });
});
