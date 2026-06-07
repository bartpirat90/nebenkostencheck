import { API_BASE_URL } from "../config";
import type { PreviewData } from "../types";

export type AnalyzeResult =
  | { ok: true; data: PreviewData }
  | { ok: false; message: string };

export async function analyzeDocument(
  base64: string,
  mediaType: string,
  fileName: string,
): Promise<AnalyzeResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64, mediaType, fileName }),
    });
  } catch {
    return {
      ok: false,
      message:
        "Verbindung fehlgeschlagen. Bitte prüfe deine Internetverbindung und versuche es erneut.",
    };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return {
      ok: false,
      message: "Die Analyse konnte nicht verarbeitet werden. Bitte versuche es erneut.",
    };
  }

  if (!res.ok) {
    const message =
      (json as { error?: string }).error ??
      "Es ist ein Fehler aufgetreten. Bitte versuche es erneut.";
    return { ok: false, message };
  }

  return { ok: true, data: json as PreviewData };
}
