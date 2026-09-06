import { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./kv";
import { RATE_LIMIT_PER_HOUR, RATE_LIMIT_PER_DAY } from "./limits";

type Window = Parameters<typeof Ratelimit.slidingWindow>[1];

// Ein Limiter pro Konfiguration, lazy erzeugt (Build darf ohne Env importieren).
// Cache-Key enthält Limit + Fenster, damit ein Prefix nicht still eine alte
// Konfiguration wiederverwendet.
const _limiters = new Map<string, Ratelimit>();
function limiter(prefix: string, limit: number, window: Window): Ratelimit {
  const cacheKey = `${prefix}|${limit}|${window}`;
  let l = _limiters.get(cacheKey);
  if (!l) {
    l = new Ratelimit({
      redis: redis(),
      limiter: Ratelimit.slidingWindow(limit, window),
      analytics: false,
      prefix,
    });
    _limiters.set(cacheKey, l);
  }
  return l;
}

/** Generisches Sliding-Window-Limit. true = erlaubt. */
export async function checkLimit(prefix: string, limit: number, window: Window, key: string): Promise<boolean> {
  const res = await limiter(prefix, limit, window).limit(key);
  return res.success;
}

/** Ermittelt die Client-IP aus den von Vercel gesetzten Headern. */
export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Analyse-Limit: prüft beide Fenster (Stunde + Tag). true, wenn beide erlauben. */
export async function checkRateLimit(ip: string): Promise<boolean> {
  const [h, d] = await Promise.all([
    checkLimit("rl:analyze:h", RATE_LIMIT_PER_HOUR, "1 h", ip),
    checkLimit("rl:analyze:d", RATE_LIMIT_PER_DAY, "1 d", ip),
  ]);
  return h && d;
}
