import { API_BASE_URL } from "../config";
import type { AnalysisResult, ContactData, LetterPdfResponse, LetterType } from "../types";

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; code?: string };

const NETWORK_MSG =
  "Verbindung fehlgeschlagen. Bitte prüfe deine Internetverbindung und versuche es erneut.";
const PARSE_MSG = "Die Antwort konnte nicht verarbeitet werden. Bitte versuche es erneut.";
const GENERIC_MSG = "Es ist ein Fehler aufgetreten. Bitte versuche es erneut.";

/** Fehlercode des Servers, wenn der Bericht noch nicht bezahlt wurde (siehe apiErrors.ts im Web-Projekt). */
export const NOT_UNLOCKED_CODE = "NOT_UNLOCKED";

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
    const body = json as { error?: string; code?: string };
    return { ok: false, message: body.error ?? GENERIC_MSG, code: body.code };
  }
  return { ok: true, data: json as AnalysisResult };
}

/**
 * Startet den Web-Checkout für den vollständigen Bericht (9,90 €, einmalig).
 * Gibt die Stripe-Checkout-URL zurück, die im Browser geöffnet werden soll –
 * die App selbst nimmt keine Zahlungsdaten entgegen.
 */
export async function startCheckout(id: string): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, locale: "de" }),
    });
  } catch {
    throw new Error(NETWORK_MSG);
  }
  const json = await parseJson(res);
  if (json === null) throw new Error(PARSE_MSG);
  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? GENERIC_MSG);
  }
  const url = (json as { url?: unknown }).url;
  if (typeof url !== "string" || !isHttpsUrl(url)) throw new Error(GENERIC_MSG);
  return url;
}

/**
 * Linking.openURL öffnet jedes Schema (tel:, sms:, intent:, App-Deep-Links).
 * Die Checkout-URL kommt zwar vom eigenen Server, aber falls die Antwort je
 * manipuliert würde, soll die App höchstens eine Web-Seite öffnen können.
 */
function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
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
    const body = json as { error?: string; code?: string };
    return { ok: false, message: body.error ?? GENERIC_MSG, code: body.code };
  }
  return { ok: true, data: json as LetterPdfResponse };
}

export function reportPdfUrl(id: string): string {
  return `${API_BASE_URL}/api/generate-report?id=${encodeURIComponent(id)}`;
}
