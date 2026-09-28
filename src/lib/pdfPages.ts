"use client";

import { canUsePdfjs, openPdf, renderPage } from "./pdfjs";
import { inkShare, looksBlank } from "./pageInk";

/**
 * Seitenzählung und Vorschaubilder für die Seitenauswahl. Nur per import()
 * geladen – zieht pdf.js nach sich.
 */

/** Breite der Vorschaubilder in Pixeln – doppelt so fein wie angezeigt, für scharfe Retina-Kacheln. */
const THUMB_WIDTH = 360;

/** Seitenzahl des PDFs, oder null, wenn pdf.js es nicht öffnen kann. */
export async function countPdfPages(file: File): Promise<number | null> {
  if (!canUsePdfjs()) return null;
  try {
    const { doc, close } = await openPdf(file);
    const count = doc.numPages;
    await close();
    return count;
  } catch {
    return null;
  }
}

export interface PageThumb {
  /** Blob-URL des Vorschaubilds – der Empfänger gibt sie mit URL.revokeObjectURL frei. */
  url: string;
  width: number;
  height: number;
  /** Sieht nach leerer Seite aus (z. B. Rückseite eines Duplex-Scans). */
  blank: boolean;
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
}

/**
 * Rendert die Vorschaubilder der Reihe nach und meldet jedes, sobald es fertig
 * ist – so füllt sich die Auswahl sichtbar, statt erst nach allen Seiten zu
 * erscheinen. Bricht ab, sobald `signal` feuert (Nutzer wählt andere Datei).
 */
export async function renderThumbnails(
  file: File,
  handlers: { onCount: (count: number) => void; onThumb: (page: number, thumb: PageThumb) => void },
  signal: AbortSignal,
): Promise<void> {
  const { doc, close } = await openPdf(file);
  try {
    handlers.onCount(doc.numPages);
    for (let number = 1; number <= doc.numPages; number++) {
      if (signal.aborted) return;
      const page = await doc.getPage(number);
      const base = page.getViewport({ scale: 1 });
      const width = THUMB_WIDTH;
      const height = Math.max(1, Math.round((base.height / base.width) * width));
      const canvas = await renderPage(page, width, height);
      if (!canvas || signal.aborted) continue;

      const pixels = canvas.getContext("2d")?.getImageData(0, 0, width, height);
      const blank = pixels ? looksBlank(inkShare(pixels.data, width, height)) : false;
      const blob = await toBlob(canvas);
      if (!blob || signal.aborted) continue;
      handlers.onThumb(number, { url: URL.createObjectURL(blob), width, height, blank });
    }
  } finally {
    await close();
  }
}
