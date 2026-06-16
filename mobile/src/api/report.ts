import { API_BASE_URL } from "../config";
import type { AnalysisResult, ContactData, LetterPdfResponse, LetterType } from "../types";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; message: string };

const NETWORK_MSG =
  "Verbindung fehlgeschlagen. Bitte prüfe deine Internetverbindung und versuche es erneut.";
const PARSE_MSG = "Die Antwort konnte nicht verarbeitet werden. Bitte versuche es erneut.";
const GENERIC_MSG = "Es ist ein Fehler aufgetreten. Bitte versuche es erneut.";

async function parseJson(res: Response): Promise<unknown | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchReport(id: string): Promise<ApiResult<AnalysisResult>> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/result?id=${encodeURIComponent(id)}`);
  } catch {
    return { ok: false, message: NETWORK_MSG };
  }
  const json = await parseJson(res);
  if (json === null) return { ok: false, message: PARSE_MSG };
  if (!res.ok) {
    return { ok: false, message: (json as { error?: string }).error ?? GENERIC_MSG };
  }
  return { ok: true, data: json as AnalysisResult };
}

export async function generateLetter(
  id: string,
  type: LetterType,
  contact: ContactData,
): Promise<ApiResult<LetterPdfResponse>> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/generate-letter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type, contact }),
    });
  } catch {
    return { ok: false, message: NETWORK_MSG };
  }
  const json = await parseJson(res);
  if (json === null) return { ok: false, message: PARSE_MSG };
  if (!res.ok) {
    return { ok: false, message: (json as { error?: string }).error ?? GENERIC_MSG };
  }
  return { ok: true, data: json as LetterPdfResponse };
}

export function reportPdfUrl(id: string): string {
  return `${API_BASE_URL}/api/generate-report?id=${encodeURIComponent(id)}`;
}
