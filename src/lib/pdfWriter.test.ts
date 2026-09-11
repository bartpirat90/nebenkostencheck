import { describe, expect, it } from "vitest";
import { buildPdf, type JpegPage } from "@/lib/pdfWriter";

/** 8×8-JPEG (rotes Quadrat mit weißer Mitte) – echte DCTDecode-Daten für den Rundlauf. */
const JPEG_B64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAAIAAgDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAT/xAAdEAABAgcAAAAAAAAAAAAAAAAAERYmMlNmg5Lw/8QAFQEBAQAAAAAAAAAAAAAAAAAABQf/xAAeEQABAwQDAAAAAAAAAAAAAAABAAIRAxIhYRMiQf/aAAwDAQACEQMRAD8AghJh3Dlq6ScoABXOmMKm0qXHd2JkznzQ0v/Z";

const JPEG = Uint8Array.from(Buffer.from(JPEG_B64, "base64"));

function page(overrides: Partial<JpegPage> = {}): JpegPage {
  return {
    data: JPEG,
    pixelWidth: 8,
    pixelHeight: 8,
    // A4 hochkant in PDF-Punkten
    pageWidth: 595.28,
    pageHeight: 841.89,
    ...overrides,
  };
}

function text(pdf: Uint8Array): string {
  return Buffer.from(pdf).toString("latin1");
}

describe("buildPdf", () => {
  it("schreibt einen gültigen Kopf und Abschluss", () => {
    const s = text(buildPdf([page()]));
    expect(s.startsWith("%PDF-1.4")).toBe(true);
    expect(s.trimEnd().endsWith("%%EOF")).toBe(true);
  });

  it("legt pro Seite drei Objekte an", () => {
    const s = text(buildPdf([page(), page(), page()]));
    // 2 feste Objekte (Catalog, Pages) + 3 je Seite = Objekte 1..11; /Size zählt
    // den freien Eintrag 0 mit, ist also um eins größer als die höchste Nummer.
    expect(s).toContain("/Count 3");
    expect(s).toContain("xref");
    expect(s).toContain("/Size 12");
  });

  it("verweist jede Seite auf ihr eigenes Bild", () => {
    const s = text(buildPdf([page(), page()]));
    expect(s).toContain("/Kids [3 0 R 6 0 R]");
    expect(s).toContain("/XObject << /Im0 4 0 R >>");
    expect(s).toContain("/XObject << /Im0 7 0 R >>");
  });

  it("bettet die JPEG-Daten unverändert als DCTDecode ein", () => {
    const pdf = buildPdf([page()]);
    expect(text(pdf)).toContain(`/Filter /DCTDecode /Length ${JPEG.length}`);
    // Die Bytes müssen Byte für Byte im Stream stehen – sonst ist das Bild kaputt.
    expect(text(pdf).includes(Buffer.from(JPEG).toString("latin1"))).toBe(true);
  });

  it("schreibt Byte-Offsets, die wirklich auf die Objekte zeigen", () => {
    // Ein falscher xref-Offset ist der klassische Fehler beim PDF-Schreiben:
    // nachsichtige Leser reparieren ihn still, strengere brechen ab.
    const s = text(buildPdf([page(), page()]));
    const xrefAt = Number(s.slice(s.lastIndexOf("startxref") + 9).trim().split("\n")[0]);
    expect(s.slice(xrefAt, xrefAt + 4)).toBe("xref");

    // Kopfzeile („xref"), Bereichszeile („0 8") und der freie Eintrag stehen vorn.
    const rows = s.slice(xrefAt).split("\n").slice(3, 11);
    rows.forEach((row, i) => {
      const at = Number(row.slice(0, 10));
      expect(s.slice(at, at + 7)).toBe(`${i + 1} 0 obj`);
    });
  });

  it("übernimmt die Seitengröße der Vorlage", () => {
    const s = text(buildPdf([page({ pageWidth: 841.89, pageHeight: 595.28 })]));
    expect(s).toContain("/MediaBox [0 0 841.89 595.28]");
    expect(s).toContain("q 841.89 0 0 595.28 0 0 cm /Im0 Do Q");
  });

  it("weist ein PDF ohne Seiten ab", () => {
    expect(() => buildPdf([])).toThrow();
  });
});

describe("buildPdf – von pdf.js gegengelesen", () => {
  it("liefert ein PDF, das pdf.js mit Seitenzahl und Maßen öffnet", async () => {
    const pdf = buildPdf([page(), page({ pageWidth: 400, pageHeight: 300 })]);

    // Legacy-Build: die Node-taugliche Variante ohne DOM-Abhängigkeiten.
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const task = pdfjs.getDocument({ data: pdf, useWorkerFetch: false });
    const doc = await task.promise;

    expect(doc.numPages).toBe(2);
    expect((await doc.getPage(1)).view).toEqual([0, 0, 595.28, 841.89]);
    expect((await doc.getPage(2)).view).toEqual([0, 0, 400, 300]);

    // Das eingebettete Bild muss als Zeichenoperation auftauchen.
    const ops = await (await doc.getPage(1)).getOperatorList();
    expect(ops.fnArray.length).toBeGreaterThan(0);
    // Aufräumen hängt am LoadingTask, nicht am Dokument – sonst bleibt der Worker offen.
    await task.destroy();
  });
});
