import { Redis } from "@upstash/redis";
import { AnalysisResult, StoredAnalysis } from "@/types";

// Lazy-Init: Client erst beim ersten Aufruf erstellen, damit der Build
// (ohne gesetzte Env-Variablen) das Modul importieren kann, ohne zu werfen.
let _redis: Redis | null = null;
function redis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
  }
  return _redis;
}

const TTL_SECONDS = 60 * 60 * 24; // 24 h Auto-Ablauf
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

/** Setzt das paid-Flag (behält die Rest-TTL bei). */
export async function markPaid(id: string): Promise<void> {
  const record = await getAnalysis(id);
  if (!record) return;
  record.paid = true;
  const ttl = await redis().ttl(key(id));
  await redis().set(key(id), record, { ex: ttl > 0 ? ttl : TTL_SECONDS });
}
