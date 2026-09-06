import { NextRequest, NextResponse } from "next/server";
import { getAnalysis, isUnlocked } from "@/lib/kv";
import { isSessionId, unlockFromStripeSession } from "@/lib/stripe";
import { checkLimit } from "@/lib/ratelimit";
import { RESULT_FALLBACK_PER_ID_PER_HOUR } from "@/lib/limits";
import { apiError } from "@/lib/apiErrors";
import { classifyErrorCode } from "@/lib/errors";

/** Stripe meldet unbekannte Session-IDs so – kein Server-Fehler, nur Rauschen. */
function isResourceMissing(err: unknown): boolean {
  return (err as { code?: string })?.code === "resource_missing";
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return apiError("MISSING_ID");

  try {
    let record = await getAnalysis(id);
    if (!record) {
      return apiError("ANALYSIS_EXPIRED");
    }

    // Fallback, falls der Webhook (noch) nicht durch ist: Stripe direkt fragen.
    // Die session_id kommt aus der success_url; verifiziert wird server-zu-Stripe.
    const sessionId = req.nextUrl.searchParams.get("session_id");
    // Jeder Fallback ist ein Stripe-API-Call → pro Analyse-ID begrenzen, sonst
    // kann jemand mit einer Gratis-Analyse-ID die Stripe-Quota leerlaufen lassen.
    if (!isUnlocked(record) && isSessionId(sessionId)) {
      if (await checkLimit("rl:result:session", RESULT_FALLBACK_PER_ID_PER_HOUR, "1 h", id)) {
        try {
          if (await unlockFromStripeSession(id, sessionId)) record = await getAnalysis(id);
        } catch (err: unknown) {
          if (isResourceMissing(err)) console.warn("Stripe session fallback: unbekannte Session");
          else console.error("Stripe session fallback failed:", err instanceof Error ? err.message : err);
        }
      } else {
        console.warn(`Stripe session fallback: Limit fuer Analyse ${id} erreicht`);
      }
    }

    if (!record || !isUnlocked(record)) {
      return apiError("NOT_UNLOCKED");
    }
    return NextResponse.json({ ...record.full, _customerEmail: record.customerEmail ?? null });
  } catch (err: unknown) {
    console.error("Result error:", err instanceof Error ? err.stack ?? err.message : String(err));
    const message = err instanceof Error ? err.message : "";
    return apiError(classifyErrorCode(message), 500);
  }
}
