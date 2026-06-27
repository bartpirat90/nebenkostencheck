import { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./kv";
import { RATE_LIMIT_PER_HOUR, RATE_LIMIT_PER_DAY } from "./limits";


let _hourly: Ratelimit | null = null;
function hourly(): Ratelimit {
  if (!_hourly) {
    _hourly = new Ratelimit({
      redis: redis(),
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_PER_HOUR, "1 h"),
      analytics: false,
      prefix: "rl:analyze:h",
    });
  }
  return _hourly;
}

let _daily: Ratelimit | null = null;
function daily(): Ratelimit {
  if (!_daily) {
    _daily = new Ratelimit({
      redis: redis(),
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_PER_DAY, "1 d"),
      analytics: false,
      prefix: "rl:analyze:d",
    });
  }
  return _daily;
}

/** Ermittelt die Client-IP aus den von Vercel gesetzten Headern. */
export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Prüft beide Fenster (Stunde + Tag). Gibt true zurück, wenn beide erlauben. */
export async function checkRateLimit(ip: string): Promise<boolean> {
  const [h, d] = await Promise.all([hourly().limit(ip), daily().limit(ip)]);
  return h.success && d.success;
}
