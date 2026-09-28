import { VISION_MAX_EDGE_PX, VISION_MAX_TOKENS } from "./limits";

/**
 * Die Größe, auf die Claude ein Bild verkleinert, bevor es hinsieht – genau
 * nachgebaut nach der Referenzimplementierung aus Anthropics Doku
 * (build-with-claude/vision-coordinates, „How Claude resizes and pads images“).
 *
 * Wichtig ist die zweite Grenze neben der Kantenlänge: Claude rechnet in
 * Blöcken von 28×28 Pixeln und nimmt pro Bild höchstens VISION_MAX_TOKENS
 * davon. Eine A4-Seite landet dadurch bei 924×1307 und nicht bei 1109×1568 –
 * alles darüber ginge ohnehin verloren, bevor Claude die Seite liest.
 */

const PATCH_PX = 28;

/** Kosten eines Bildes in Bild-Token: ein Token je angefangenem 28×28-Block. */
export function visionTokens(width: number, height: number): number {
  return Math.ceil(width / PATCH_PX) * Math.ceil(height / PATCH_PX);
}

/**
 * Halbe Werte zur geraden Nachbarzahl runden wie Pythons round() – so rechnet
 * die API. Math.round rundet .5 immer auf und käme bei manchen Seitenformaten
 * einen Pixel daneben.
 */
function roundTiesToEven(value: number): number {
  const floor = Math.floor(value);
  if (value - floor !== 0.5) return Math.round(value);
  return floor % 2 === 0 ? floor : floor + 1;
}

/**
 * Zielmaße in ganzen Pixeln. Bilder, die schon passen, kommen unverändert
 * zurück; unbrauchbare Maße ebenfalls, damit der Aufrufer nicht mit 0 rechnet.
 */
export function visionSize(
  width: number,
  height: number,
  maxEdge: number = VISION_MAX_EDGE_PX,
  maxTokens: number = VISION_MAX_TOKENS,
): { width: number; height: number } {
  if (!(width >= 1) || !(height >= 1)) return { width, height };
  const w0 = Math.round(width);
  const h0 = Math.round(height);

  const fits = (w: number, h: number): boolean =>
    Math.ceil(w / PATCH_PX) * PATCH_PX <= maxEdge &&
    Math.ceil(h / PATCH_PX) * PATCH_PX <= maxEdge &&
    visionTokens(w, h) <= maxTokens;

  if (fits(w0, h0)) return { width: w0, height: h0 };
  if (h0 > w0) {
    const turned = visionSize(h0, w0, maxEdge, maxTokens);
    return { width: turned.height, height: turned.width };
  }

  // Binärsuche entlang der langen Kante: größte Breite, die bei gleichem
  // Seitenverhältnis noch passt. lo passt immer, hi nie.
  const aspect = w0 / h0;
  let lo = 1;
  let hi = w0;
  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (fits(mid, Math.max(roundTiesToEven(mid / aspect), 1))) lo = mid;
    else hi = mid;
  }
  return { width: lo, height: Math.max(roundTiesToEven(lo / aspect), 1) };
}
