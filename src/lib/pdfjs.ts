"use client";

/**
 * Gemeinsamer Zugang zu pdf.js für Upload-Aufbereitung und Seitenauswahl.
 *
 * Nur per dynamischem import() erreichbar, damit pdf.js nicht im Bundle jedes
 * Seitenaufrufs steckt – gebraucht wird es erst, wenn jemand ein PDF wählt.
 */

type PdfjsModule = typeof import("pdfjs-dist");
type PdfLoadingTask = ReturnType<PdfjsModule["getDocument"]>;
export type PdfDocument = Awaited<PdfLoadingTask["promise"]>;
export type PdfPage = Awaited<ReturnType<PdfDocument["getPage"]>>;

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

/** Canvas, Worker und DOM sind da – sonst bleibt es beim Original. */
export function canUsePdfjs(): boolean {
  return typeof document !== "undefined" && typeof Worker !== "undefined";
}

export interface OpenPdf {
  doc: PdfDocument;
  /** Muss immer aufgerufen werden: Der LoadingTask hält sonst den Worker-Speicher fest. */
  close: () => Promise<void>;
}

export async function openPdf(file: File): Promise<OpenPdf> {
  const pdfjs = await import("pdfjs-dist");
  ensureWorker(pdfjs);
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  try {
    const doc = await task.promise;
    return { doc, close: () => task.destroy().catch(() => {}) };
  } catch (err) {
    await task.destroy().catch(() => {});
    throw err;
  }
}

/** Leere Zeichenfläche mit weißem Grund in genau diesen Maßen. */
export function whiteCanvas(width: number, height: number): HTMLCanvasElement | null {
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

/**
 * Rastert eine Seite auf eine Zeichenfläche der gewünschten Breite; die Höhe
 * folgt dem Seitenverhältnis, das der Aufrufer schon kennt.
 */
export async function renderPage(
  page: PdfPage,
  width: number,
  height: number,
): Promise<HTMLCanvasElement | null> {
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: width / base.width });
  const canvas = whiteCanvas(width, height);
  if (!canvas) return null;

  // intent "print" ist hier kein Druckwunsch, sondern die Entscheidung gegen
  // requestAnimationFrame: pdf.js taktet das Zeichnen sonst über rAF, und das
  // steht still, sobald der Tab in den Hintergrund gerät – der Upload bliebe
  // dann hängen, bis der Nutzer zurückwechselt.
  await page.render({ canvas, viewport, intent: "print" }).promise;
  // Sonst hält pdf.js die Zeichenoperationen jeder Seite bis zum Schluss im
  // Speicher – bei zwanzig Scanseiten sind das hunderte Megabyte.
  page.cleanup();
  return canvas;
}
