/**
 * Liest den Upload aus dem Request – in zwei Varianten:
 *
 *  • Rohbytes (Content-Type = der echte Dateityp, Dateiname im Header
 *    `x-file-name`): der Weg der Website. Ohne die base64-Aufblähung von 33 %
 *    passt bei Vercels 4,5-MB-Grenze eine spürbar größere Abrechnung durch.
 *  • JSON `{ base64, mediaType, fileName }`: der bisherige Weg, den die
 *    Android-App weiterhin nutzt. Bleibt unverändert unterstützt.
 */

/** Header, über den der Rohbyte-Upload seinen Dateinamen mitschickt (URL-kodiert). */
export const FILE_NAME_HEADER = "x-file-name";

export interface UploadPayload {
  /** Datei als base64 – so erwartet die Anthropic-API sie. */
  base64: string;
  /** Vom Client deklarierter Typ; die Route gleicht ihn gegen die Magic Bytes ab. */
  mediaType: string;
  /** Bereinigter Dateiname (nie leer). */
  fileName: string;
  /** Echte Dateigröße in Bytes, für die Größenprüfung. */
  byteSize: number;
}

export type UploadError = { code: "INVALID_REQUEST" | "NO_FILE" };

export function isUploadError(v: UploadPayload | UploadError): v is UploadError {
  return "code" in v;
}

/**
 * Der Dateiname landet im Prompt und in Logs: Steuerzeichen (Zeilenumbrüche,
 * ESC-Sequenzen) raus, Länge begrenzen, nie leer zurückgeben.
 */
export function sanitizeFileName(name: unknown): string {
  if (typeof name !== "string") return "upload";
  return name.replace(/[\x00-\x1f\x7f]/g, "").slice(0, 200) || "upload";
}

/** „image/jpeg; charset=utf-8" → „image/jpeg". */
export function parseContentType(header: string | null): string {
  return (header ?? "").split(";")[0].trim().toLowerCase();
}

/**
 * Dateiname aus dem Header. HTTP-Header tragen nur ASCII, Umlaute kommen also
 * URL-kodiert an; eine kaputte Kodierung darf den Upload nicht scheitern lassen.
 */
export function decodeFileNameHeader(header: string | null): string {
  if (!header) return "upload";
  try {
    return sanitizeFileName(decodeURIComponent(header));
  } catch {
    return sanitizeFileName(header);
  }
}

/** Bytegröße aus der Länge eines base64-Strings (ohne ihn zu dekodieren). */
export function base64ByteSize(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length * 3) / 4 - padding;
}

export async function readUpload(req: Request): Promise<UploadPayload | UploadError> {
  const contentType = parseContentType(req.headers.get("content-type"));

  if (contentType === "application/json") {
    // Body kommt roh vom Client — kein Vertrauen in Form/Typ, bevor wir ihn geprüft haben.
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return { code: "INVALID_REQUEST" };
    }
    const { base64, mediaType, fileName } = body as Record<string, unknown>;
    // Zwei Codes: „nichts geschickt" ist ein Nutzerfehler (NO_FILE), ein falscher
    // Typ im JSON ein Client-Bug (INVALID_REQUEST) — beides 400, aber anders zu deuten.
    if (base64 === undefined || base64 === "" || mediaType === undefined || mediaType === "") {
      return { code: "NO_FILE" };
    }
    if (typeof base64 !== "string" || typeof mediaType !== "string") {
      return { code: "INVALID_REQUEST" };
    }
    return {
      base64,
      mediaType,
      fileName: sanitizeFileName(fileName),
      byteSize: base64ByteSize(base64),
    };
  }

  const buffer = await req.arrayBuffer().catch(() => null);
  if (!buffer || buffer.byteLength === 0) return { code: "NO_FILE" };

  return {
    base64: Buffer.from(buffer).toString("base64"),
    // Fehlender Content-Type bleibt absichtlich stehen: der Abgleich mit den
    // Magic Bytes schlägt dann fehl und die Route antwortet UNSUPPORTED_TYPE.
    mediaType: contentType || "application/octet-stream",
    fileName: decodeFileNameHeader(req.headers.get(FILE_NAME_HEADER)),
    byteSize: buffer.byteLength,
  };
}
