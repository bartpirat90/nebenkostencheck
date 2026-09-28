/**
 * Erkennt leere Seiten an einem gerenderten Vorschaubild – typischerweise die
 * Rückseiten eines Duplex-Scans. Sie kosten je rund 1.560 Token und enthalten
 * nichts, deshalb wählt die Seitenauswahl sie von vornherein ab.
 *
 * Bewusst nur ein Vorschlag: Der Nutzer sieht die abgewählte Seite und kann
 * sie zurückholen. Automatisch weggeworfen wird nichts.
 */

/**
 * Ab dieser Helligkeit (0–255) zählt ein Pixel als Papier. Grau
 * durchscheinende Schrift der Rückseite liegt beim Scan meist bei 220–240
 * und soll nicht als Inhalt zählen; echte Schrift ist im Vorschaubild auch
 * kantengeglättet noch deutlich dunkler.
 */
const INK_LUMINANCE = 200;

/**
 * Rand, der nicht mitgezählt wird. Scanner werfen dort gern einen dunklen
 * Schatten der Deckelkante oder Lochungen – das ist kein Inhalt.
 */
const MARGIN_SHARE = 0.04;

/**
 * Unterhalb dieses Anteils dunkler Pixel gilt eine Seite als leer. Eine
 * einzelne Textzeile im Vorschaubild (360 px breit) liegt beim Doppelten bis
 * Vierfachen, eine alleinstehende Seitenzahl darunter.
 */
export const BLANK_INK_SHARE = 0.0008;

/** Anteil dunkler Pixel im Inneren eines RGBA-Bildes (Canvas-ImageData). */
export function inkShare(rgba: Uint8ClampedArray, width: number, height: number): number {
  const x0 = Math.floor(width * MARGIN_SHARE);
  const y0 = Math.floor(height * MARGIN_SHARE);
  const x1 = width - x0;
  const y1 = height - y0;
  const total = (x1 - x0) * (y1 - y0);
  if (total <= 0) return 0;

  let ink = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
      // Wahrgenommene Helligkeit nach ITU-R BT.601 – dieselbe Gewichtung, mit
      // der Graustufen-Scanner rechnen.
      const luminance = 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2];
      if (luminance < INK_LUMINANCE) ink++;
    }
  }
  return ink / total;
}

export function looksBlank(share: number): boolean {
  return share < BLANK_INK_SHARE;
}
