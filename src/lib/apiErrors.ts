import { NextResponse } from "next/server";
import { MAX_FILE_MB } from "@/lib/limits";

/**
 * Fehlercode + deutscher Fallback-Text + Default-Status. Der Client übersetzt
 * anhand des Codes (apiErrors.*); der Text greift nur, wenn ein Client den Code
 * (noch) nicht kennt – daher muss er für sich allein verständlich sein.
 */
export const API_ERRORS = {
  MISSING_ID: [400, "Fehlende ID."],
  INVALID_REQUEST: [400, "Ungültige Anfrage."],
  NO_FILE: [400, "Keine Datei übermittelt."],
  UNSUPPORTED_TYPE: [400, "Nur PDF und Bilder werden unterstützt. Bitte lade deine Abrechnung als PDF oder Foto hoch."],
  FILE_TOO_LARGE: [413, `Die Datei ist zu groß (max. ${MAX_FILE_MB} MB). Bitte lade nur die Nebenkostenabrechnung hoch.`],
  RATE_LIMITED: [429, "Zu viele Anfragen. Bitte versuche es später noch einmal."],
  DOCUMENT_TOO_LONG: [422, "Das Dokument ist zu umfangreich für die Prüfung. Bitte lade nur die Nebenkostenabrechnung hoch."],
  ANALYSIS_UNUSABLE: [502, "Die Analyse konnte nicht verarbeitet werden. Bitte erneut versuchen."],
  ANALYSIS_EXPIRED: [404, "Analyse abgelaufen. Bitte lade die Abrechnung erneut hoch."],
  ANALYSIS_EXPIRING: [410, "Analyse läuft gleich ab. Bitte lade die Abrechnung erneut hoch."],
  NOT_UNLOCKED: [402, "Nicht freigeschaltet."],
  NO_MATCHING_ERRORS: [400, "Für dieses Schreiben liegen keine passenden Punkte vor."],
  LETTER_NOT_FOUND: [404, "Schreiben nicht gefunden. Bitte erstelle es erneut."],
  LETTER_RATE_LIMITED: [429, "Zu viele Schreiben erstellt. Bitte lade das vorhandene PDF herunter oder versuche es morgen erneut."],
  SEND_RATE_LIMITED: [429, "Zu viele Sendungen. Bitte lade das PDF stattdessen herunter."],
  CHECKOUT_RATE_LIMITED: [429, "Zu viele Zahlungsversuche. Bitte in ein paar Minuten erneut versuchen."],
  CHECKOUT_FAILED: [500, "Zahlung konnte nicht gestartet werden."],
  REPORT_RATE_LIMITED: [429, "Zu viele Downloads. Bitte kurz warten."],
  OVERLOADED: [503, "Der Prüfdienst ist gerade stark ausgelastet. Bitte in einem Moment erneut versuchen."],
  TIMEOUT: [504, "Die Prüfung hat zu lange gedauert. Bitte erneut versuchen – bei großen Scans hilft eine kleinere Datei."],
  NETWORK: [502, "Verbindung unterbrochen. Bitte erneut versuchen."],
  UNKNOWN: [500, "Ein unbekannter Fehler ist aufgetreten. Bitte erneut versuchen."],
} as const satisfies Record<string, readonly [number, string]>;

export type ApiErrorCode = keyof typeof API_ERRORS;

/** JSON-Fehlerantwort `{ error, code }`; `status` überschreibt den Default. */
export function apiError(code: ApiErrorCode, status?: number) {
  const [defaultStatus, message] = API_ERRORS[code];
  return NextResponse.json({ error: message, code }, { status: status ?? defaultStatus });
}
