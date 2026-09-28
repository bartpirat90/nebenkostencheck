"use client";

import { MAX_FILE_BYTES, MAX_PDF_PAGES, PDF_JPEG_QUALITIES } from "./limits";
import { buildPdf, type JpegPage } from "./pdfWriter";
import { canUsePdfjs, openPdf, renderPage, type PdfDocument } from "./pdfjs";
import { visionSize } from "./visionSize";

/**
 * Bringt ein PDF auf die Seiten, die geprüft werden sollen, und in die
 * Upload-Grenze.
 *
 * Zwei Werkzeuge, in dieser Reihenfolge:
 *  1. Seiten herauslösen (pdf.js extractPages). Das neue PDF enthält nur die
 *     gewählten Seiten, die Textebene bleibt erhalten – für ein digitales PDF
 *     ändert sich an der Analyse nichts, außer dass Beiwerk wegfällt.
 *  2. Neu rastern. Nur wenn die Datei danach immer noch zu groß ist, also
 *     praktisch bei Farbscans: Jede Seite wird genau in der Auflösung als JPEG
 *     abgelegt, in der Claude sie ansieht (visionSize). Was darüber liegt,
 *     hätte Claude selbst verworfen.
 *
 * Ein PDF mit allen Seiten und unter der Grenze bleibt unangetastet.
 */

/**
 * Wie viele Bytes eine einzelne Seite kosten darf. Die 8 % Abzug decken das
 * PDF-Gerüst und die Streuung zwischen den Seiten ab – eine dicht bedruckte
 * Tabellenseite wiegt mehr als das Deckblatt.
 */
export function pageBudget(pages: number): number {
  return Math.floor((MAX_FILE_BYTES * 0.92) / Math.max(1, pages));
}

/**
 * Pixelmaße, in denen eine Seite gerastert wird. PDF-Seiten messen in Punkten
 * (A4 = 595×842) – für die Rechnung hochgerechnet, damit visionSize von einer
 * großen Vorlage aus verkleinert und genau Claudes Zielmaß trifft.
 */
export function rasterSize(pointsWidth: number, pointsHeight: number): { width: number; height: number } {
  return visionSize(pointsWidth * 4, pointsHeight * 4);
}

/**
 * Gewählte Seiten (1-basiert) bereinigt: sortiert, ohne Doppelte, nur
 * vorhandene. Ohne Auswahl oder bei leerer Auswahl gelten alle Seiten.
 */
export function normalizeSelection(pages: readonly number[] | undefined, total: number): number[] {
  const all = Array.from({ length: Math.max(0, total) }, (_, i) => i + 1);
  if (!pages) return all;
  const picked = [...new Set(pages)]
    .filter((p) => Number.isInteger(p) && p >= 1 && p <= total)
    .sort((a, b) => a - b);
  return picked.length > 0 ? picked : all;
}

/**
 * Muss pdf.js überhaupt ran? Nicht, wenn alle Seiten bleiben und die Datei in
 * die Grenze passt – dann würde nur ein sauberes PDF ohne Not umgebaut.
 */
export function needsPdfWork(file: { type: string; size: number }, pages?: readonly number[]): boolean {
  if (file.type !== "application/pdf") return false;
  return pages !== undefined || file.size > MAX_FILE_BYTES;
}

function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

/**
 * Kodiert das Seitenbild und senkt dabei die Qualität, bis es ins Budget
 * passt. Reicht keine Stufe, kommt die kleinste zurück – dann ist das PDF am
 * Ende zwar immer noch zu groß, aber der Nutzer bekommt den Hinweis, welche
 * Seiten er weglassen kann, statt auf eine unlesbare Kopie zu warten.
 */
async function encodePage(canvas: HTMLCanvasElement, budget: number): Promise<Blob | null> {
  let best: Blob | null = null;
  for (const quality of PDF_JPEG_QUALITIES) {
    const blob = await toJpeg(canvas, quality);
    if (!blob) break;
    if (!best || blob.size < best.size) best = blob;
    if (blob.size <= budget) break;
  }
  return best;
}

async function rasterize(doc: PdfDocument, pages: number[]): Promise<Uint8Array<ArrayBuffer> | null> {
  const budget = pageBudget(pages.length);
  const out: JpegPage[] = [];
  for (const number of pages) {
    const page = await doc.getPage(number);
    // scale 1 liefert die Seitenmaße in PDF-Punkten – die übernimmt das neue
    // Dokument, damit die Seite exakt so groß bleibt wie vorher.
    const base = page.getViewport({ scale: 1 });
    const size = rasterSize(base.width, base.height);
    const canvas = await renderPage(page, size.width, size.height);
    if (!canvas) return null;
    const blob = await encodePage(canvas, budget);
    if (!blob) return null;
    out.push({
      data: new Uint8Array(await blob.arrayBuffer()),
      pixelWidth: size.width,
      pixelHeight: size.height,
      pageWidth: base.width,
      pageHeight: base.height,
    });
  }
  return buildPdf(out);
}

/** Löst die Seiten heraus; null, wenn pdf.js das Dokument nicht umbauen kann. */
async function extract(doc: PdfDocument, pages: number[]): Promise<Uint8Array<ArrayBuffer> | null> {
  const data = await doc.extractPages([{ document: null, includePages: pages.map((p) => p - 1) }]);
  // Kopie, damit der Puffer sicher ein ArrayBuffer ist – nur den nimmt File.
  return data ? new Uint8Array(data) : null;
}

function asPdf(data: Uint8Array<ArrayBuffer>, like: File): File {
  return new File([data], like.name, { type: "application/pdf", lastModified: like.lastModified });
}

/**
 * Bereitet das PDF vor. `pages` sind die gewählten Seiten (1-basiert), ohne
 * Angabe alle. Gibt im Zweifel – fehlende Browser-API, Fehler, kein Gewinn –
 * das Beste bis dahin zurück, mindestens das Original; die Größenprüfung im
 * Aufrufer greift dann wie bisher.
 */
export async function preparePdf(file: File, pages?: readonly number[]): Promise<File> {
  if (!canUsePdfjs()) return file;

  let best = file;
  let close: (() => Promise<void>) | null = null;
  try {
    const opened = await openPdf(file);
    close = opened.close;
    const { doc } = opened;
    const selection = normalizeSelection(pages, doc.numPages);
    const complete = selection.length === doc.numPages;

    if (complete && file.size <= MAX_FILE_BYTES) return file;

    if (!complete) {
      // Das Teil-PDF gilt auch dann, wenn es kaum kleiner ist: Die abgewählten
      // Seiten sollen nicht mitgeprüft werden, ganz gleich, was sie wiegen.
      const part = await extract(doc, selection).catch(() => null);
      if (part) best = asPdf(part, file);
      if (part && best.size <= MAX_FILE_BYTES) return best;
    }

    // Mehr Seiten, als eine Prüfung verträgt: Rastern würde den Browser lange
    // beschäftigen und am Ende doch am Token-Gate der Route scheitern.
    if (selection.length > MAX_PDF_PAGES) return best;

    const raster = await rasterize(doc, selection);
    if (raster && raster.length < best.size) best = asPdf(raster, file);
    return best;
  } catch {
    return best;
  } finally {
    await close?.();
  }
}
