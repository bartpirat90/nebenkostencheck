// Magic-Byte-Prüfung: der vom Client gemeldete mediaType ist nicht vertrauenswürdig
// (Body kommt roh als JSON rein) — wir sniffen die echten Datei-Bytes und vergleichen.
//
// GIF bewusst nicht: die Anthropic-API akzeptiert image/gif zwar, aber die Dropzone
// (UploadZone.ACCEPTED_TYPES) bietet per `accept`-Attribut nur PDF/JPG/PNG/WebP an —
// Abrechnungen kommen als Scan/Foto/PDF, nie als GIF. HEIC (iOS-Fotos) akzeptiert die
// Anthropic-API dagegen nicht; solche Dateien müssen vor dem Upload konvertiert werden.
export const ALLOWED_MEDIA_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];

// Nur Standard-Base64-Zeichen zulassen (kein base64url, kein Whitespace) — alles
// andere ist kein gültiges Base64 und wird nicht "großzügig" dekodiert.
const VALID_BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

/**
 * Sniffed den Datei-Typ anhand der ersten Bytes (Magic Numbers). Dekodiert nur
 * die ersten 16 Base64-Zeichen (= 12 Bytes ohne Padding) — reicht für alle
 * unterstützten Signaturen und bleibt für riesige Uploads billig.
 */
export function sniffMediaType(base64: string): AllowedMediaType | null {
  if (!base64) return null;
  const head = base64.slice(0, 16);
  if (!VALID_BASE64_RE.test(head)) return null;

  const bytes = Buffer.from(head, "base64");
  if (bytes.length < 4) return null;

  // %PDF
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "application/pdf";
  }

  // FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  // 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  // RIFF ???? WEBP
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

/** image/jpg (nicht-standard, aber gängig) auf image/jpeg abbilden; sonst nur Groß-/Kleinschreibung angleichen. */
function normalizeMediaType(mediaType: string): string {
  const lower = mediaType.toLowerCase().trim();
  return lower === "image/jpg" ? "image/jpeg" : lower;
}

/**
 * True nur, wenn die echten Datei-Bytes (sniffed) zu einem erlaubten Typ
 * gehören UND der vom Client deklarierte Typ (normalisiert) damit übereinstimmt.
 * Der deklarierte Typ dient damit nur noch als Plausibilitäts-Check.
 *
 * Hinweis: `sniffed` ist bereits vom Typ `AllowedMediaType | null` — die
 * Zugehörigkeit zu ALLOWED_MEDIA_TYPES ist also durch das Typsystem garantiert
 * und muss hier nicht erneut zur Laufzeit geprüft werden. Es wird nur die
 * Signatur geprüft, nicht die Wohlgeformtheit der Datei; das reicht, weil die
 * Rohbytes nur an die Anthropic-API gehen und nie an den Browser zurückgereicht werden.
 */
export function isAllowedUpload(declared: string, sniffed: AllowedMediaType | null): boolean {
  if (!sniffed) return false;
  return normalizeMediaType(declared) === sniffed;
}
