import { ApiErrorCode } from "@/lib/apiErrors";

/**
 * Ordnet technische Fehlermeldungen (z.B. vom KI-Prüfdienst) einem der
 * generischen API-Fehlercodes zu. Den Nutzertext liefert `apiError(code)`.
 * Die Muster decken die Originaltexte des Anthropic-SDK ab: 429 "…exceed your
 * organization's rate limit", 529 "overloaded_error", APIConnectionError
 * "Connection error.", APIConnectionTimeoutError "Request timed out.".
 * Reihenfolge ist Absicht: Timeout vor Netzwerk, weil ein Timeout-Text
 * "connection" enthalten kann, aber nie umgekehrt.
 */
export function classifyErrorCode(message: string): ApiErrorCode {
  const msg = message.toLowerCase();
  if (
    msg.includes("503") || msg.includes("529") || msg.includes("429") ||
    msg.includes("overloaded") || msg.includes("service unavailable") ||
    msg.includes("high demand") || msg.includes("rate limit") || msg.includes("rate_limit")
  ) {
    return "OVERLOADED";
  }
  if (msg.includes("timed out") || msg.includes("timeout")) {
    return "TIMEOUT";
  }
  if (
    msg.includes("fetch failed") || msg.includes("network") ||
    msg.includes("econnrefused") || msg.includes("connection error")
  ) {
    return "NETWORK";
  }
  return "UNKNOWN";
}
