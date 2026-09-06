import { NextRequest, NextResponse } from "next/server";
import { getAnalysis, getAnalysisTtl } from "@/lib/kv";
import { stripe } from "@/lib/stripe";
import { checkLimit, getClientIp } from "@/lib/ratelimit";
import { CHECKOUT_PER_IP_PER_HOUR } from "@/lib/limits";
import { localePrefix, stripeLocale, toLocale } from "@/lib/checkoutLocale";
import { apiError } from "@/lib/apiErrors";

/** Lebensdauer der Checkout-Session: Stripe-Minimum 30 min + Puffer. */
const SESSION_LIFETIME_S = 30 * 60 + 60;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { id?: unknown; locale?: unknown };
    const { id } = body;
    if (typeof id !== "string" || !id) {
      return apiError("MISSING_ID");
    }

    // Rücksprung von Stripe soll in der Sprache des Nutzers landen, nicht immer auf Deutsch.
    const locale = toLocale(body.locale);
    const prefix = localePrefix(locale);

    const record = await getAnalysis(id);
    if (!record) {
      return apiError("ANALYSIS_EXPIRED");
    }

    // Die Session darf den Record nicht überleben: Wer erst nach dem Ablauf
    // zahlt, bekäme nichts. Also nur starten, wenn genug Rest-TTL da ist.
    // -1 = kein Ablauf (ok), -2 = Record ist gerade verschwunden (nicht ok).
    const remaining = await getAnalysisTtl(id);
    if (remaining !== -1 && remaining < SESSION_LIFETIME_S + 60) {
      return apiError("ANALYSIS_EXPIRING");
    }

    // Kostenschutz: jeder Aufruf kostet einen Stripe-API-Call.
    if (!(await checkLimit("rl:checkout:ip", CHECKOUT_PER_IP_PER_HOUR, "1 h", getClientIp(req)))) {
      return apiError("CHECKOUT_RATE_LIMITED");
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
      locale: stripeLocale(locale),
      success_url: `${base}${prefix}/ergebnis?id=${id}&session_id={CHECKOUT_SESSION_ID}`,
      // `/en/?…` würde Next erst auf `/en?…` umleiten – daher ohne Trailing-Slash.
      cancel_url: `${base}${prefix || "/"}?canceled=1&id=${id}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Checkout error:", err instanceof Error ? err.stack ?? err.message : String(err));
    return apiError("CHECKOUT_FAILED");
  }
}
