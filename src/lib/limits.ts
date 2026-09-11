// Zentrale Grenzwerte für den Kostenschutz der Analyse.
// Großzügig gewählt (~2,5x über dem Normalfall einer Abrechnung mit ~31k Token).

/**
 * Maximale Dateigröße eines Uploads. Vercel kappt den Serverless-Function-Body
 * bei 4,5 MB; höher zu setzen brächte nichts, weil Vercel den Request vorher mit
 * einem rohen 413 ablehnt. Die Website schickt die Datei als Rohbytes (siehe
 * uploadRequest.ts), der Body entspricht also der Dateigröße – 4 MB lassen
 * genug Luft für Header. Die Android-App schickt weiterhin base64 (×1,33) und
 * riegelt deshalb schon selbst bei 3 MB ab (mobile/src/lib/fileGuard.ts).
 */
export const MAX_FILE_MB = 4;
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

/** Maximale Input-Token, die ein Dokument an Claude kosten darf. */
export const MAX_INPUT_TOKENS = 80_000;

// Gilt pro öffentlicher IP. Bewusst nicht zu knapp, weil sich Nutzer oft eine
// IP teilen (Haushalt, Büro, Mobilfunk/CGNAT). Gezählt werden nur wohlgeformte
// Analyse-Versuche — abgelehnte Uploads (falscher Typ, zu groß) zählen NICHT,
// weil das Gate erst hinter MIME-/Größen-Prüfung läuft (siehe analyze-Route).

/** Maximale kostenlose Analysen pro IP und Stunde. */
export const RATE_LIMIT_PER_HOUR = 10;

/** Maximale kostenlose Analysen pro IP und Tag. */
export const RATE_LIMIT_PER_DAY = 30;

/** PDF-Mailversand: pro Analyse-ID und Tag (schützt die Absender-Reputation). */
export const SEND_PDF_PER_ID_PER_DAY = 5;

/** PDF-Mailversand: pro IP und Tag. */
export const SEND_PDF_PER_IP_PER_DAY = 20;

/**
 * Stripe-Session-Fallback in /api/result (je ein Stripe-API-Call): pro
 * Analyse-ID und Stunde. Bewusst nicht pro IP: Die Ergebnisseite pollt bis zu
 * 5× pro Aufruf, hinter CGNAT würden sich zahlende Nutzer sonst gegenseitig
 * aussperren. Neue IDs sind ohnehin über das Analyse-Limit gedeckelt.
 */
export const RESULT_FALLBACK_PER_ID_PER_HOUR = 20;

/** Brief-Generierung (je ein Claude-Call): pro Analyse-ID und Tag – 3 Typen × Korrekturen. */
export const LETTER_PER_ID_PER_DAY = 12;

/** Brief-Generierung pro IP und Tag. */
export const LETTER_PER_IP_PER_DAY = 40;

/** Checkout-Sessions (je ein Stripe-Call) pro IP und Stunde. */
export const CHECKOUT_PER_IP_PER_HOUR = 20;

/** Bericht-PDF-Render pro IP und Stunde (CPU-lastig). */
export const REPORT_PER_IP_PER_HOUR = 30;

// ─── Upload-Vorbereitung im Browser ──────────────────────────────────────────

/**
 * Längste Kante, auf die Fotos vor dem Upload verkleinert werden. Claude
 * skaliert Bilder ohnehin auf diese Kantenlänge herunter, bevor es sie ansieht –
 * ein 12-MP-Handyfoto liefert also keinerlei Mehrinformation, kostet aber
 * Bandbreite und sprengt die Größengrenze.
 */
export const IMAGE_MAX_EDGE_PX = 1568;

/** JPEG-Qualität der verkleinerten Fotos. 0,82 hält Zahlen und Kleingedrucktes lesbar. */
export const IMAGE_QUALITY = 0.82;

/**
 * Obergrenze für die Datei, die der Browser überhaupt zum Verkleinern annimmt.
 * Deutlich über jedem Handyfoto, aber klein genug, dass das Dekodieren im
 * Canvas den Tab nicht zum Absturz bringt.
 */
export const MAX_SOURCE_FILE_MB = 40;
export const MAX_SOURCE_FILE_BYTES = MAX_SOURCE_FILE_MB * 1024 * 1024;

/**
 * Stufen, mit denen eine gerasterte PDF-Seite als JPEG kodiert wird – von der
 * ersten passenden wird genommen. Die erste entspricht genau dem, was Claude
 * ohnehin zu sehen bekommt, kostet also keine Erkennungsqualität.
 *
 * Reihenfolge ist Absicht: erst die Qualität senken (billig und kaum sichtbar),
 * dann die Kante. Unter 1100 px wäre Kleingedrucktes nicht mehr sicher lesbar;
 * dort ist Schluss, und der Nutzer bekommt lieber den Hinweis, überflüssige
 * Seiten wegzulassen. Gerastert wird dabei nur ein einziges Mal – die weiteren
 * Stufen rechnen auf dem fertigen Bild weiter, sonst dauerte ein zehnseitiger
 * Scan im Browser eine halbe Minute.
 */
export const PDF_ENCODE_STEPS = [
  { maxEdge: IMAGE_MAX_EDGE_PX, quality: IMAGE_QUALITY },
  { maxEdge: IMAGE_MAX_EDGE_PX, quality: 0.68 },
  { maxEdge: 1300, quality: 0.64 },
  { maxEdge: 1100, quality: 0.56 },
] as const;

/**
 * Ab wie vielen Seiten gar nicht erst neu gerendert wird. Rund 30 Bildseiten
 * liegen bereits an MAX_INPUT_TOKENS – ein solches Dokument scheitert ohnehin
 * am Token-Gate, das Rendern würde den Browser nur minutenlang blockieren.
 */
export const MAX_PDF_COMPRESS_PAGES = 30;
