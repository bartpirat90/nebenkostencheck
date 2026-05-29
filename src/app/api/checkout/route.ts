import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAnalysis } from "@/lib/kv";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Fehlende ID." }, { status: 400 });

    const record = await getAnalysis(id);
    if (!record) {
      return NextResponse.json(
        { error: "Analyse abgelaufen. Bitte lade die Abrechnung erneut hoch." },
        { status: 404 }
      );
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL!;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: "Nebenkostencheck – vollständiger Prüfbericht + Schreiben" },
            unit_amount: 990,
          },
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      metadata: { analysisId: id },
      client_reference_id: id,
      success_url: `${base}/ergebnis?id=${id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/?canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Zahlung konnte nicht gestartet werden." }, { status: 500 });
  }
}
