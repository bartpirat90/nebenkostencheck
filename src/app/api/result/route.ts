import { NextRequest, NextResponse } from "next/server";
import { getAnalysis, isUnlocked } from "@/lib/kv";
import { isSessionId, unlockFromStripeSession } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Fehlende ID." }, { status: 400 });

  let record = await getAnalysis(id);
  if (!record) {
    return NextResponse.json({ error: "Ergebnis abgelaufen oder nicht gefunden." }, { status: 404 });
  }

  // Fallback, falls der Webhook (noch) nicht durch ist: Stripe direkt fragen.
  // Die session_id kommt aus der success_url; verifiziert wird server-zu-Stripe.
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!isUnlocked(record) && isSessionId(sessionId)) {
    try {
      if (await unlockFromStripeSession(id, sessionId)) record = await getAnalysis(id);
    } catch (err: unknown) {
      console.error("Stripe session fallback failed:", err instanceof Error ? err.message : err);
    }
  }

  if (!record || !isUnlocked(record)) {
    return NextResponse.json({ error: "Nicht freigeschaltet." }, { status: 402 });
  }
  return NextResponse.json({ ...record.full, _customerEmail: record.customerEmail ?? null });
}
