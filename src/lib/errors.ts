import { API_ERRORS, ApiErrorCode } from "@/lib/apiErrors";

/**
 * Ordnet technische Fehlermeldungen (z.B. vom KI-Prüfdienst) einem der
 * generischen API-Fehlercodes zu. Einzige Quelle für die Match-Logik –
 * `classifyError` liest den deutschen Text darüber aus `API_ERRORS`.
 */
export function classifyErrorCode(message: string): ApiErrorCode {
  const msg = message.toLowerCase();
  if (msg.includes("503") || msg.includes("529") || msg.includes("overloaded") || msg.includes("service unavailable") || msg.includes("high demand")) {
    return "OVERLOADED";
  }
  if (msg.includes("timed out") || msg.includes("timeout")) {
    return "TIMEOUT";
  }
  if (msg.includes("fetch failed") || msg.includes("network") || msg.includes("econnrefused")) {
    return "NETWORK";
  }
  return "UNKNOWN";
}

/**
 * Übersetzt technische Fehlermeldungen (z.B. vom KI-Prüfdienst) in
 * nutzerfreundliche deutsche Texte. Wird von allen API-Routen geteilt.
 */
export function classifyError(message: string): string {
  return API_ERRORS[classifyErrorCode(message)][1];
}
