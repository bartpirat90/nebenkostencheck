"use client";

import { MAX_FILE_BYTES, MAX_PDF_COMPRESS_PAGES, PDF_ENCODE_STEPS } from "./limits";
import { buildPdf, type JpegPage } from "./pdfWriter";

/**
 * Rendert ein zu großes PDF im Browser neu und verpackt es kleiner.
 *
 * Gedacht für Farbscans: ein Kopierer legt jede Seite als 300-dpi-Bild ab, eine
 * zehnseitige Abrechnung wiegt dann schnell 15 MB und käme gar nicht erst durch
 * Vercels 4,5-MB-Grenze. Claude verkleinert Seitenbilder ohnehin auf
 * IMAGE_MAX_EDGE_PX, bevor es sie ansieht – am Ergebnis der Analyse ändert das
 * Neurendern also nichts, es fallen nur Bytes weg, die nie jemand gesehen hätte.
 *
 * Angeworfen wird es nur, wenn die Datei sonst abgelehnt würde: ein digitales
 * PDF mit echter Textebene bleibt unangetastet.
 */

type PdfjsModule = typeof import("pdfjs-dist");
type PdfDocument = Awaited<ReturnType<PdfjsModule["getDocument"]>["promise"]>;
type PdfPage = Awaited<ReturnType<PdfDocument["getPage"]>>;

/**
 * Faktor, mit dem eine PDF-Seite gerastert wird. Anders als beim Foto geht es
 * hier meist hinauf: eine A4-Seite misst 595×842 Punkte, für 1568 px lange
 * Kante muss also knapp doppelt so fein gerechnet werden. Die Auflösung der
 * eingebetteten Scans spielt dabei keine Rolle – zählt nur, was am Ende
 * angesehen wird.
 */
export function renderScale(width: number, height: number, maxEdge: number): number {
  const longest = Math.max(width, height);
  if (!(longest > 0) || !(maxEdge > 0)) return 1;
  return maxEdge / longest;
}

/** Canvas-Maße zum Skalierungsfaktor – ganze Pixel, nie 0. */
export function pixelSize(
  width: number,
  height: number,
  scale: number,
): { width: number; height: number } {
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Wie viele Bytes eine einzelne Seite kosten darf. Die 8 % Abzug decken das
 * PDF-Gerüst und die Streuung zwischen den Seiten ab – eine dicht bedruckte
 * Tabellenseite wiegt mehr als das Deckblatt.
 */
export function pageBudget(pages: number): number {
  return Math.floor((MAX_FILE_BYTES * 0.92) / Math.max(1, pages));
}

/**
 * Lohnt sich das Neurendern überhaupt? Nur oberhalb der Upload-Grenze, sonst
 * würde ein sauberes Text-PDF ohne Not zu Bildern plattgerechnet.
 */
export function shouldCompressPdf(file: { type: string; size: number }): boolean {
  return file.type === "application/pdf" && file.size > MAX_FILE_BYTES;
}

let workerStarted = false;

/**
 * pdf.js rechnet in einem Worker. Der Bundler legt ihn als eigenes Asset neben
 * das Bundle, also gleiche Herkunft – die CSP deckt ihn über script-src 'self'.
 * Bewusst workerPort statt workerSrc: so setzen wir „type: module" selbst und
 * pdf.js muss die URL nicht erraten.
 */
function ensureWorker(pdfjs: PdfjsModule): void {
  if (workerStarted) return;
  pdfjs.GlobalWorkerOptions.workerPort = new Worker(
    new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
    { type: "module" },
  );
  workerStarted = true;
}

function toJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

function newCanvas(width: number, height: number): HTMLCanvasElement | null {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  // PDF-Seiten haben keinen Hintergrund, JPEG kennt keine Transparenz: ohne
  // weiße Füllung stünde schwarze Schrift am Ende auf schwarzem Grund.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  return canvas;
}

/** Zeichnet ein fertiges Seitenbild kleiner – viel billiger als neu zu rastern. */
function downscale(source: HTMLCanvasElement, maxEdge: number): HTMLCanvasElement {
  const scale = renderScale(source.width, source.height, maxEdge);
  const size = pixelSize(source.width, source.height, scale);
  const target = newCanvas(size.width, size.height);
  if (!target) return source;
  target.getContext("2d")?.drawImage(source, 0, 0, size.width, size.height);
  return target;
}

/**
 * Kodiert das Seitenbild und geht dabei die Stufen durch, bis es ins Budget
 * passt. Reicht keine Stufe, kommt die kleinste zurück – dann ist das PDF am
 * Ende zwar immer noch zu groß, aber der Nutzer bekommt den Hinweis, welche
 * Seiten er weglassen kann, statt auf eine unlesbare Kopie zu warten.
 */
async function encodePage(
  rendered: HTMLCanvasElement,
  budget: number,
): Promise<{ blob: Blob; width: number; height: number } | null> {
  let canvas = rendered;
  let best: { blob: Blob; width: number; height: number } | null = null;

  for (const step of PDF_ENCODE_STEPS) {
    if (step.maxEdge < Math.max(canvas.width, canvas.height)) {
      canvas = downscale(canvas, step.maxEdge);
    }
    const blob = await toJpeg(canvas, step.quality);
    if (!blob) break;
    if (!best || blob.size < best.blob.size) {
      best = { blob, width: canvas.width, height: canvas.height };
    }
    if (blob.size <= budget) break;
  }

  return best;
}

async function renderPage(page: PdfPage, budget: number): Promise<JpegPage | null> {
  // scale 1 liefert die Seitenmaße in PDF-Punkten – die übernimmt das neue
  // Dokument, damit die Seite exakt so groß bleibt wie vorher.
  const base = page.getViewport({ scale: 1 });
  const scale = renderScale(base.width, base.height, PDF_ENCODE_STEPS[0].maxEdge);
  const viewport = page.getViewport({ scale });
  const size = pixelSize(base.width, base.height, scale);

  const canvas = newCanvas(size.width, size.height);
  if (!canvas) return null;

  // intent "print" ist hier kein Druckwunsch, sondern die Entscheidung gegen
  // requestAnimationFrame: pdf.js taktet das Zeichnen sonst über rAF, und das
  // steht still, sobald der Tab in den Hintergrund gerät – der Upload bliebe
  // dann hängen, bis der Nutzer zurückwechselt.
  await page.render({ canvas, viewport, intent: "print" }).promise;
  // Sonst hält pdf.js die Zeichenoperationen jeder Seite bis zum Schluss im
  // Speicher – bei zwanzig Scanseiten sind das hunderte Megabyte.
  page.cleanup();

  const encoded = await encodePage(canvas, budget);
  if (!encoded) return null;

  return {
    data: new Uint8Array(await encoded.blob.arrayBuffer()),
    pixelWidth: encoded.width,
    pixelHeight: encoded.height,
    pageWidth: base.width,
    pageHeight: base.height,
  };
}

/**
 * Rendert das PDF neu und verpackt es als Bild-PDF. Gibt im Zweifel – zu viele
 * Seiten, fehlende Browser-API, Fehler, kein Größengewinn – das Original
 * zurück; die Prüfung im Aufrufer greift dann wie bisher.
 */
export async function compressPdf(file: File): Promise<File> {
  if (typeof document === "undefined" || typeof Worker === "undefined") return file;

  let task: ReturnType<PdfjsModule["getDocument"]> | null = null;
  try {
    const pdfjs = await import("pdfjs-dist");
    ensureWorker(pdfjs);

    task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
    const doc = await task.promise;
    if (doc.numPages > MAX_PDF_COMPRESS_PAGES) return file;

    const budget = pageBudget(doc.numPages);
    const pages: JpegPage[] = [];
    for (let number = 1; number <= doc.numPages; number++) {
      const rendered = await renderPage(await doc.getPage(number), budget);
      if (!rendered) return file;
      pages.push(rendered);
    }

    const out = buildPdf(pages);
    if (out.length >= file.size) return file;
    return new File([out], file.name, {
      type: "application/pdf",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  } finally {
    // Der LoadingTask hält den Worker offen – ohne destroy bleibt er am Leben.
    await task?.destroy().catch(() => {});
  }
}
