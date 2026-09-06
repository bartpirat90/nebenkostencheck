/**
 * Einzige Quelle für den Testmodus. MOCK_ANALYSIS=true liefert Beispieldaten
 * ohne Claude-Aufruf UND öffnet die Paywall – deshalb ist das Flag in Vercel-
 * Production hart abgeschaltet: Ein versehentlich kopiertes Env darf die
 * Bezahlschranke nicht aushebeln.
 */
type MockEnv = Partial<Record<"MOCK_ANALYSIS" | "VERCEL_ENV", string>> & {
  [key: string]: string | undefined;
};

export function isMockEnabled(env: MockEnv = process.env): boolean {
  return env.MOCK_ANALYSIS === "true" && env.VERCEL_ENV !== "production";
}

export const MOCK = isMockEnabled();
