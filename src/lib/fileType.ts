// Magic-Byte-Pruefung: der vom Client gemeldete mediaType ist nicht vertrauenswuerdig
// (Body kommt roh als JSON rein) — wir sniffen die echten Datei-Bytes und vergleichen.
//
// GIF/HEIC bewusst nicht: weder die Dropzone (UploadZone.ACCEPTED_TYPES) noch die
// Anthropic-API (buildDocBlock in claude.ts) akzeptieren diese Typen.
export const ALLOWED_MEDIA_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];

// Nur Standard-Base64-Zeichen zulassen (kein base64url, kein Whitespace) — alles
// andere ist kein gueltiges Base64 und wird nicht "grosszuegig" dekodiert.
const VALID_BASE64_RE = /^[A-Za-z0-9+/]*={0,2}$/;

/**
 * Sniffed den Datei-Typ anhand der ersten Bytes (Magic Numbers). Dekodiert nur
 * die ersten 16 Base64-Zeichen (= 12 Bytes ohne Padding) — reicht fuer alle
 * unterstuetzten Signaturen und bleibt fuer riesige Uploads billig.
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

/** image/jpg (nicht-standard, aber gaengig) auf image/jpeg abbilden; sonst nur Gross-/Kleinschreibung angleichen. */
function normalizeMediaType(mediaType: string): string {
  const lower = mediaType.toLowerCase().trim();
  return lower === "image/jpg" ? "image/jpeg" : lower;
}

/**
 * True nur, wenn die echten Datei-Bytes (sniffed) zu einem erlaubten Typ
 * gehoeren UND der vom Client deklarierte Typ (normalisiert) damit uebereinstimmt.
 * Der deklarierte Typ dient damit nur noch als Plausibilitaets-Check.
 */
export function isAllowedUpload(declared: string, sniffed: AllowedMediaType | null): boolean {
  if (!sniffed) return false;
  if (!(ALLOWED_MEDIA_TYPES as readonly string[]).includes(sniffed)) return false;
  return normalizeMediaType(declared) === sniffed;
}
