"use client";

import { IMAGE_MAX_EDGE_PX, IMAGE_QUALITY, MAX_FILE_BYTES } from "./limits";
import { shouldCompressPdf } from "./pdfCompress";

/**
 * Verkleinert Fotos im Browser, bevor sie hochgeladen werden.
 *
 * Hintergrund: Vercel kappt den Request-Body bei 4,5 MB, ein Handyfoto wiegt
 * aber schnell 5–15 MB – die Abrechnung wäre dann gar nicht prüfbar. Claude
 * skaliert Bilder ohnehin auf IMAGE_MAX_EDGE_PX herunter, bevor es sie ansieht;
 * das Verkleinern kostet also keine Erkennungsqualität, sondern nur Bytes.
 *
 * PDFs laufen über pdfCompress, aber nur wenn sie sonst abgelehnt würden.
 */

/**
 * Zielmaße für die Verkleinerung, oder null, wenn das Bild schon klein genug
 * ist. Seitenverhältnis bleibt erhalten; gerundet wird auf ganze Pixel, und nie
 * auf 0 (ein extrem schmales Panorama behält mindestens 1 px).
 */
export function targetSize(
  width: number,
  height: number,
  maxEdge: number = IMAGE_MAX_EDGE_PX,
): { width: number; height: number } | null {
  if (!(width > 0) || !(height > 0)) return null;
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return null;
  const factor = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * factor)),
    height: Math.max(1, Math.round(height * factor)),
  };
}

/** Ersetzt die Endung durch .jpg, damit Dateiname und Inhalt zusammenpassen. */
export function toJpegName(fileName: string): string {
  const base = fileName.replace(/\.[^./\\]+$/, "");
  return `${base || "foto"}.jpg`;
}

/** Die Browser-APIs, die zum Verkleinern nötig sind – sonst bleibt es beim Original. */
function canCompress(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof createImageBitmap === "function" &&
    typeof URL?.createObjectURL === "function"
  );
}

/**
 * Dekodiert die Datei. `imageOrientation: "from-image"` ist wichtig: Handyfotos
 * tragen die Drehung als EXIF-Flag, ohne diese Option läge ein hochkant
 * fotografiertes Blatt quer im Canvas.
 */
async function decode(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file, { imageOrientation: "from-image" });
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", IMAGE_QUALITY));
}

/**
 * Verkleinert ein Bild auf IMAGE_MAX_EDGE_PX und kodiert es als JPEG.
 * Gibt das Original zurück, wenn nichts zu gewinnen ist oder etwas schiefgeht –
 * die Größenprüfung im Aufrufer greift dann wie bisher.
 */
export async function compressImage(file: File): Promise<File> {
  if (!canCompress()) return file;

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await decode(file);
    const size = targetSize(bitmap.width, bitmap.height);

    // Kleines Bild, das ohnehin durch die Größengrenze passt: nicht anfassen.
    // Ein PNG-Screenshot verliert durch eine JPEG-Runde nur Schärfe.
    if (!size && file.size <= MAX_FILE_BYTES) return file;

    const canvas = document.createElement("canvas");
    canvas.width = size?.width ?? bitmap.width;
    canvas.height = size?.height ?? bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await toBlob(canvas);
    // Kein Gewinn (kommt bei kleinen Grafiken mit wenigen Farben vor): Original behalten.
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], toJpegName(file.name), {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
}

/**
 * Bereitet eine Datei für den Upload vor: Fotos werden verkleinert, zu große
 * PDFs neu gerendert. Wirft nie – im Zweifel kommt das Original zurück.
 */
export async function prepareUpload(file: File): Promise<File> {
  if (file.type.startsWith("image/")) return compressImage(file);

  // Nachgeladen, damit pdf.js nicht im Bundle jedes Seitenaufrufs steckt –
  // gebraucht wird es nur bei den seltenen übergroßen Scans.
  if (shouldCompressPdf(file)) {
    const { compressPdf } = await import("./pdfCompress");
    return compressPdf(file);
  }

  return file;
}
