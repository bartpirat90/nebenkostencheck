import { NextRequest, NextResponse } from "next/server";
import { getAnalysis } from "@/lib/kv";
import { stripe } from "@/lib/stripe";

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
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      // Stripe-Minimum 30 min. Verhindert Zahlungen, nachdem der 24-h-Record
      // in Redis abgelaufen ist (Session lebt sonst standardmäßig 24 h).
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60 + 60,
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
