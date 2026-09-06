import { NextRequest, NextResponse } from "next/server";
import { getAnalysis, getAnalysisTtl } from "@/lib/kv";
import { stripe } from "@/lib/stripe";
import { checkLimit, getClientIp } from "@/lib/ratelimit";
import { CHECKOUT_PER_IP_PER_HOUR } from "@/lib/limits";

/** Lebensdauer der Checkout-Session: Stripe-Minimum 30 min + Puffer. */
const SESSION_LIFETIME_S = 30 * 60 + 60;

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

    // Die Session darf den Record nicht überleben: Wer erst nach dem Ablauf
    // zahlt, bekäme nichts. Also nur starten, wenn genug Rest-TTL da ist.
    // -1 = kein Ablauf (ok), -2 = Record ist gerade verschwunden (nicht ok).
    const remaining = await getAnalysisTtl(id);
    if (remaining !== -1 && remaining < SESSION_LIFETIME_S + 60) {
      return NextResponse.json(
        { error: "Analyse läuft gleich ab. Bitte lade die Abrechnung erneut hoch." },
        { status: 410 }
      );
    }

    // Kostenschutz: jeder Aufruf kostet einen Stripe-API-Call.
    if (!(await checkLimit("rl:checkout:ip", CHECKOUT_PER_IP_PER_HOUR, "1 h", getClientIp(req)))) {
      return NextResponse.json(
        { error: "Zu viele Zahlungsversuche. Bitte in ein paar Minuten erneut versuchen." },
        { status: 429 }
      );
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL!;
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      // Stripe-Minimum 30 min (+60 s Puffer gegen Uhrenabweichung).
      expires_at: Math.floor(Date.now() / 1000) + SESSION_LIFETIME_S,
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
