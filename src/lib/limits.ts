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
 * Was Claude (Sonnet 4.6, Standard-Auflösung) von einem Bild überhaupt ansieht:
 * höchstens 1568 px lange Kante und höchstens 1568 Bild-Token zu je 28×28 px.
 * Größere Bilder verkleinert Claude selbst – wir tun es vorher, dann fallen
 * nur Bytes weg, die nie jemand gesehen hätte (Rechnung in visionSize.ts).
 * Beim Wechsel auf ein Modell mit hoher Auflösung (Sonnet 5: 2576 px, 4784
 * Token) müssen beide Werte mitziehen, sonst schicken wir zu wenig.
 */
export const VISION_MAX_EDGE_PX = 1568;
export const VISION_MAX_TOKENS = 1568;

/** JPEG-Qualität der verkleinerten Fotos. 0,82 hält Zahlen und Kleingedrucktes lesbar. */
export const IMAGE_QUALITY = 0.82;

/**
 * Obergrenzen für die Datei, die der Browser überhaupt zum Aufbereiten annimmt.
 * Bilder enger, weil ein riesiges PNG beim Dekodieren komplett im Speicher
 * liegt und einen Handy-Tab abstürzen lässt; pdf.js liest PDFs dagegen Seite
 * für Seite und kommt mit großen Scans zurecht.
 */
export const MAX_SOURCE_IMAGE_MB = 40;
export const MAX_SOURCE_IMAGE_BYTES = MAX_SOURCE_IMAGE_MB * 1024 * 1024;
export const MAX_SOURCE_PDF_MB = 100;
export const MAX_SOURCE_PDF_BYTES = MAX_SOURCE_PDF_MB * 1024 * 1024;

/**
 * JPEG-Qualitäten, mit denen eine gerasterte PDF-Seite kodiert wird – die
 * erste, die ins Seitenbudget passt, wird genommen. Die Auflösung bleibt
 * dabei immer die, die Claude sieht: Weniger Pixel würden Kleingedrucktes
 * kosten, weniger Qualität kostet bis 0,56 nur etwas Randschärfe.
 */
export const PDF_JPEG_QUALITIES = [IMAGE_QUALITY, 0.72, 0.64, 0.56] as const;

/**
 * Höchstzahl an Seiten, die in eine Prüfung gehen. Eine gerasterte Seite kostet
 * rund 1.560 Token; 45 Seiten plus Systemprompt liegen knapp unter
 * MAX_INPUT_TOKENS. Mehr würde ohnehin am Token-Gate der Route scheitern.
 */
export const MAX_PDF_PAGES = 45;

/**
 * Ab dieser Seitenzahl bekommt der Nutzer die Seitenauswahl zu sehen. Eine
 * Abrechnung mit Deckblatt, Kostenaufstellung und Heizkosten hat selten mehr
 * als vier Seiten – ab der fünften hängt meist Beiwerk wie der Energiemix dran.
 */
export const PAGE_PICKER_MIN_PAGES = 5;

/**
 * Ab dieser Seitenzahl zeigen wir nicht einmal mehr Vorschaubilder: Das ist
 * keine Abrechnung mehr, sondern eine ganze Akte, und hundert Vorschaubilder
 * rendern dauert auf dem Handy zu lange.
 */
export const MAX_PICKER_PAGES = 150;
