/**
 * Baut aus JPEG-Seiten ein neues PDF.
 *
 * Gegenstück zu pdfCompress: dort werden die Seiten eines zu großen Scans
 * verkleinert gerendert, hier werden sie wieder zu einer Datei zusammengesetzt.
 * Bewusst von Hand statt mit einer PDF-Bibliothek – ein PDF, das nichts als
 * JPEGs enthält, braucht nur fünf Objekttypen, und eine weitere Abhängigkeit
 * im Bundle wäre teurer als diese Datei.
 *
 * Aufbau (PDF 1.4, unkomprimierte Objekte, klassische xref-Tabelle):
 *   1        Catalog
 *   2        Pages
 *   3n+0..2  je Seite: Page, Bild-XObject (DCTDecode), Content-Stream
 */

export interface JpegPage {
  /** JPEG-Daten der Seite. */
  data: Uint8Array;
  /** Pixelbreite des JPEG. */
  pixelWidth: number;
  /** Pixelhöhe des JPEG. */
  pixelHeight: number;
  /** Seitenbreite in PDF-Punkten (1/72 Zoll) – aus der Originalseite übernommen. */
  pageWidth: number;
  /** Seitenhöhe in PDF-Punkten. */
  pageHeight: number;
}

const encoder = new TextEncoder();

/** PDF-Zahlen: höchstens zwei Nachkommastellen, kein Exponent, kein „-0". */
function num(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

/** Byte-Offsets im xref müssen zehnstellig mit führenden Nullen stehen. */
function offset10(value: number): string {
  return String(value).padStart(10, "0");
}

// Rückgabetyp bewusst mit ArrayBuffer festgenagelt: nur so nimmt der
// File-/Blob-Konstruktor das Ergebnis ohne Umweg entgegen.
export function buildPdf(pages: JpegPage[]): Uint8Array<ArrayBuffer> {
  if (pages.length === 0) throw new Error("PDF ohne Seiten");

  const parts: Uint8Array[] = [];
  let length = 0;
  const push = (chunk: string | Uint8Array) => {
    const bytes = typeof chunk === "string" ? encoder.encode(chunk) : chunk;
    parts.push(bytes);
    length += bytes.length;
  };

  // Objektnummer i steht an offsets[i]; Index 0 bleibt der freie Kopf-Eintrag.
  const offsets: number[] = [0];
  const startObject = (id: number) => {
    offsets[id] = length;
    push(`${id} 0 obj\n`);
  };

  const pageId = (i: number) => 3 + i * 3;
  const imageId = (i: number) => 4 + i * 3;
  const contentId = (i: number) => 5 + i * 3;

  push("%PDF-1.4\n");
  // Binär-Kommentar: kennzeichnet die Datei für Werkzeuge als nicht-textuell.
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

  startObject(1);
  push("<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  startObject(2);
  const kids = pages.map((_, i) => `${pageId(i)} 0 R`).join(" ");
  push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>\nendobj\n`);

  pages.forEach((page, i) => {
    const w = num(page.pageWidth);
    const h = num(page.pageHeight);

    startObject(pageId(i));
    push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${w} ${h}] ` +
        `/Resources << /XObject << /Im0 ${imageId(i)} 0 R >> >> ` +
        `/Contents ${contentId(i)} 0 R >>\nendobj\n`,
    );

    startObject(imageId(i));
    push(
      `<< /Type /XObject /Subtype /Image /Width ${page.pixelWidth} ` +
        `/Height ${page.pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 ` +
        `/Filter /DCTDecode /Length ${page.data.length} >>\nstream\n`,
    );
    push(page.data);
    push("\nendstream\nendobj\n");

    // „cm" skaliert das Einheitsquadrat des Bildes auf die volle Seite.
    const content = `q ${w} 0 0 ${h} 0 0 cm /Im0 Do Q\n`;
    startObject(contentId(i));
    push(`<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`);
  });

  const objectCount = 3 + pages.length * 3;
  const xrefStart = length;
  push(`xref\n0 ${objectCount}\n`);
  push("0000000000 65535 f \n");
  for (let id = 1; id < objectCount; id++) {
    push(`${offset10(offsets[id])} 00000 n \n`);
  }
  push(`trailer\n<< /Size ${objectCount} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);

  const out = new Uint8Array(length);
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}
