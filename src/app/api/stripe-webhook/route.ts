import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, sessionUnlocksAnalysis } from "@/lib/stripe";
import { extendAnalysisTtl, markPaid, PENDING_TTL_SECONDS } from "@/lib/kv";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Keine Signatur." }, { status: 400 });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err: unknown) {
    console.error("Webhook signature error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Ungültige Signatur." }, { status: 400 });
  }

  // `completed` feuert bei Klarna/SEPA/Sofort auch mit payment_status "unpaid";
  // die echte Zahlung kommt dann später als `async_payment_succeeded`.
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const id = session.metadata?.analysisId ?? session.client_reference_id;
    if (id && sessionUnlocksAnalysis(session, id)) {
      const email = session.customer_details?.email ?? session.customer_email ?? undefined;
      const ok = await markPaid(id, email);
      if (!ok) {
        // Geld ist da, Ergebnis nicht mehr: muss auffallen (Refund manuell).
        console.error(`Webhook: Zahlung fuer abgelaufene Analyse ${id}, session ${session.id}`);
      }
    } else if (id && session.payment_status === "unpaid") {
      // Zahlung steht noch aus (SEPA bis zu 14 Tage): Record am Leben halten,
      // aber NICHT freischalten.
      await extendAnalysisTtl(id, PENDING_TTL_SECONDS);
    }
  } else if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.warn(`Webhook: asynchrone Zahlung fehlgeschlagen, session ${session.id}`);
  }

  return NextResponse.json({ received: true });
}
