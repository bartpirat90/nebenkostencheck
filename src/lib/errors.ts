import { ApiErrorCode } from "@/lib/apiErrors";

/**
 * Ordnet technische Fehlermeldungen (z.B. vom KI-Prüfdienst) einem der
 * generischen API-Fehlercodes zu. Den Nutzertext liefert `apiError(code)`.
 * Reihenfolge ist Absicht: "timed out" enthält kein "network", aber ein
 * Timeout-Text kann "fetch" enthalten – Timeout also vor Netzwerk prüfen.
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
