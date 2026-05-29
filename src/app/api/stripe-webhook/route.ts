import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { markPaid } from "@/lib/kv";

let _stripe: Stripe | null = null;
function stripe(): Stripe {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return _stripe;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Keine Signatur." }, { status: 400 });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err: unknown) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Ungültige Signatur." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const id = session.metadata?.analysisId ?? session.client_reference_id;
    if (id) await markPaid(id);
  }

  return NextResponse.json({ received: true });
}
