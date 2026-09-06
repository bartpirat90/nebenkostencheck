import { Redis } from "@upstash/redis";
import { AnalysisResult, StoredAnalysis } from "@/types";
import { MOCK } from "./mock";

// Lazy-Init: Client erst beim ersten Aufruf erstellen, damit der Build
// (ohne gesetzte Env-Variablen) das Modul importieren kann, ohne zu werfen.
// Exportiert, damit ratelimit.ts denselben Client wiederverwendet.
let _redis: Redis | null = null;
export function redis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
  }
  return _redis;
}

const TTL_SECONDS = 60 * 60 * 24; // 24 h Auto-Ablauf (unbezahlt)
/** Nach Zahlung: 7 Tage, damit der Bericht nicht kurz nach dem Kauf verschwindet. */
export const PAID_TTL_SECONDS = 60 * 60 * 24 * 7;
const key = (id: string) => `analysis:${id}`;

/** Speichert das volle Ergebnis, gibt die ID zurück. */
export async function storeAnalysis(full: AnalysisResult): Promise<string> {
  const id = crypto.randomUUID();
  const record: StoredAnalysis = { full, paid: false, createdAt: new Date().toISOString() };
  await redis().set(key(id), record, { ex: TTL_SECONDS });
  return id;
}

export async function getAnalysis(id: string): Promise<StoredAnalysis | null> {
  return (await redis().get<StoredAnalysis>(key(id))) ?? null;
}

/**
 * Ob das volle Ergebnis ausgeliefert werden darf: nach Zahlung (`paid`) oder
 * im Testmodus (siehe mock.ts – in Production immer aus).
 */
export function isUnlocked(record: StoredAnalysis): boolean {
  return record.paid || MOCK;
}

/**
 * Setzt das paid-Flag und verlängert die Lebensdauer auf PAID_TTL_SECONDS
 * (mindestens – eine längere Rest-TTL bleibt erhalten). Speichert optional die
 * Kunden-E-Mail. Gibt false zurück, wenn der Record bereits abgelaufen war –
 * dann hat jemand bezahlt, ohne dass ein Ergebnis existiert (Aufrufer loggt).
 */
export async function markPaid(id: string, customerEmail?: string): Promise<boolean> {
  const record = await getAnalysis(id);
  if (!record) return false;
  record.paid = true;
  if (customerEmail) record.customerEmail = customerEmail;
  const remaining = await redis().ttl(key(id));
  await redis().set(key(id), record, { ex: Math.max(remaining, PAID_TTL_SECONDS) });
  return true;
}
