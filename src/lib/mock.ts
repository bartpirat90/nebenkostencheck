/**
 * Einzige Quelle für den Testmodus. MOCK_ANALYSIS=true liefert Beispieldaten
 * ohne Claude-Aufruf UND öffnet die Paywall – deshalb ist das Flag in Vercel-
 * Production hart abgeschaltet: Ein versehentlich kopiertes Env darf die
 * Bezahlschranke nicht aushebeln.
 */
// Bewusst nicht NodeJS.ProcessEnv: Next.js macht dort NODE_ENV zur Pflicht,
// dann wären Test-Aufrufe wie isMockEnabled({}) nicht typisierbar.
type MockEnv = Record<string, string | undefined>;

export function isMockEnabled(env: MockEnv = process.env): boolean {
  return env.MOCK_ANALYSIS === "true" && env.VERCEL_ENV !== "production";
}

export const MOCK = isMockEnabled();
