import { describe, expect, it } from "vitest";
import {
  base64ByteSize,
  decodeFileNameHeader,
  FILE_NAME_HEADER,
  isUploadError,
  parseContentType,
  readUpload,
  sanitizeFileName,
} from "@/lib/uploadRequest";

/** Kleines, gültiges PDF-Fragment – die Magic Bytes reichen für diese Tests. */
const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);
const PDF_BASE64 = Buffer.from(PDF_BYTES).toString("base64");

function rawRequest(body: BodyInit | null, headers: Record<string, string> = {}) {
  return new Request("https://example.test/api/analyze", { method: "POST", body, headers });
}

describe("parseContentType", () => {
  it("schneidet Parameter ab und vereinheitlicht die Schreibweise", () => {
    expect(parseContentType("Image/JPEG; charset=utf-8")).toBe("image/jpeg");
    expect(parseContentType("application/pdf")).toBe("application/pdf");
  });

  it("liefert einen leeren String, wenn der Header fehlt", () => {
    expect(parseContentType(null)).toBe("");
  });
});

describe("sanitizeFileName", () => {
  it("entfernt Steuerzeichen, die sonst im Prompt und in Logs landen", () => {
    expect(sanitizeFileName("abrech\nnung[31m.pdf")).toBe("abrechnung[31m.pdf");
  });

  it("begrenzt die Länge", () => {
    expect(sanitizeFileName("a".repeat(500))).toHaveLength(200);
  });

  it("fällt auf einen Platzhalter zurück", () => {
    expect(sanitizeFileName(undefined)).toBe("upload");
    expect(sanitizeFileName("\n\n")).toBe("upload");
  });
});

describe("decodeFileNameHeader", () => {
  it("dekodiert Umlaute, die im Header nur kodiert reisen können", () => {
    expect(decodeFileNameHeader(encodeURIComponent("Nebenkosten Größe 2024.pdf"))).toBe(
      "Nebenkosten Größe 2024.pdf",
    );
  });

  it("nimmt eine kaputte Kodierung hin, statt den Upload scheitern zu lassen", () => {
    expect(decodeFileNameHeader("100%-scan.pdf")).toBe("100%-scan.pdf");
  });

  it("fällt ohne Header auf den Platzhalter zurück", () => {
    expect(decodeFileNameHeader(null)).toBe("upload");
  });
});

describe("base64ByteSize", () => {
  it("rechnet die Bytegröße aus der base64-Länge zurück", () => {
    expect(base64ByteSize(PDF_BASE64)).toBe(PDF_BYTES.length);
    expect(base64ByteSize(Buffer.from("abc").toString("base64"))).toBe(3);
    expect(base64ByteSize(Buffer.from("ab").toString("base64"))).toBe(2);
  });
});

describe("readUpload – Rohbytes (Website)", () => {
  it("liest Datei, Typ und Namen", async () => {
    const res = await readUpload(
      rawRequest(PDF_BYTES, {
        "content-type": "application/pdf",
        [FILE_NAME_HEADER]: encodeURIComponent("Abrechnung Müller.pdf"),
      }),
    );
    expect(isUploadError(res)).toBe(false);
    if (isUploadError(res)) return;
    expect(res.base64).toBe(PDF_BASE64);
    expect(res.mediaType).toBe("application/pdf");
    expect(res.fileName).toBe("Abrechnung Müller.pdf");
    expect(res.byteSize).toBe(PDF_BYTES.length);
  });

  it("meldet einen leeren Body als fehlende Datei", async () => {
    const res = await readUpload(rawRequest(null, { "content-type": "application/pdf" }));
    expect(res).toEqual({ code: "NO_FILE" });
  });

  it("behält einen fehlenden Content-Type als unbrauchbaren Typ – die Route weist ihn ab", async () => {
    const res = await readUpload(new Request("https://example.test/x", { method: "POST", body: PDF_BYTES }));
    expect(isUploadError(res)).toBe(false);
    if (isUploadError(res)) return;
    // fetch setzt bei einem Uint8Array keinen Content-Type; der Magic-Byte-Abgleich
    // in der Route schlägt dann fehl und antwortet UNSUPPORTED_TYPE.
    expect(res.mediaType).not.toBe("application/pdf");
  });
});

describe("readUpload – JSON (Android-App)", () => {
  it("liest den bisherigen base64-Body unverändert", async () => {
    const res = await readUpload(
      rawRequest(
        JSON.stringify({ base64: PDF_BASE64, mediaType: "application/pdf", fileName: "app.pdf" }),
        { "content-type": "application/json" },
      ),
    );
    expect(isUploadError(res)).toBe(false);
    if (isUploadError(res)) return;
    expect(res.base64).toBe(PDF_BASE64);
    expect(res.mediaType).toBe("application/pdf");
    expect(res.fileName).toBe("app.pdf");
    expect(res.byteSize).toBe(PDF_BYTES.length);
  });

  it("unterscheidet fehlende Datei von kaputtem Client", async () => {
    const noFile = await readUpload(
      rawRequest(JSON.stringify({ base64: "", mediaType: "" }), {
        "content-type": "application/json",
      }),
    );
    expect(noFile).toEqual({ code: "NO_FILE" });

    const wrongType = await readUpload(
      rawRequest(JSON.stringify({ base64: 42, mediaType: "application/pdf" }), {
        "content-type": "application/json",
      }),
    );
    expect(wrongType).toEqual({ code: "INVALID_REQUEST" });

    const broken = await readUpload(
      rawRequest("{kein json", { "content-type": "application/json" }),
    );
    expect(broken).toEqual({ code: "INVALID_REQUEST" });

    const array = await readUpload(
      rawRequest("[1,2,3]", { "content-type": "application/json" }),
    );
    expect(array).toEqual({ code: "INVALID_REQUEST" });
  });

  it("bereinigt den Dateinamen aus dem JSON", async () => {
    const res = await readUpload(
      rawRequest(
        JSON.stringify({ base64: PDF_BASE64, mediaType: "application/pdf", fileName: "a\nb.pdf" }),
        { "content-type": "application/json" },
      ),
    );
    expect(isUploadError(res)).toBe(false);
    if (isUploadError(res)) return;
    expect(res.fileName).toBe("ab.pdf");
  });
});
