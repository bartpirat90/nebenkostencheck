// Zentrale Grenzwerte für den Kostenschutz der Analyse.
// Großzügig gewählt (~2,5x über dem Normalfall einer Abrechnung mit ~31k Token).

/**
 * Maximale Dateigröße eines Uploads. Vercel kappt den Serverless-Function-Body
 * bei ~4,5 MB; durch die base64-Aufblähung (×1,33) bleibt als Nutzdatei ~3 MB.
 * Höher zu setzen brächte nichts — Vercel würde den Request vorher mit einem
 * rohen 413 ablehnen.
 */
export const MAX_FILE_MB = 3;
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
