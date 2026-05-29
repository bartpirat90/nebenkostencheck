/**
 * Übersetzt technische Fehlermeldungen (z.B. von der Gemini-API) in
 * nutzerfreundliche deutsche Texte. Wird von allen API-Routen geteilt.
 */
export function classifyError(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("503") || msg.includes("529") || msg.includes("overloaded") || msg.includes("service unavailable") || msg.includes("high demand")) {
    return "Der Prüfdienst ist gerade stark ausgelastet. Bitte in einem Moment erneut versuchen.";
  }
  if (msg.includes("fetch failed") || msg.includes("network") || msg.includes("timeout") || msg.includes("econnrefused")) {
    return "Verbindung unterbrochen. Bitte erneut versuchen.";
  }
  return "Ein unbekannter Fehler ist aufgetreten. Bitte erneut versuchen.";
}
