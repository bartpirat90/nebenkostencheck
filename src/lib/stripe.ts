import Stripe from "stripe";
import { markPaid } from "./kv";

// Lazy-Init wie bei kv/claude: Build darf ohne Env importieren.
let _stripe: Stripe | null = null;
export function stripe(): Stripe {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return _stripe;
}

/** Stripe-Session-IDs sehen so aus: cs_test_… / cs_live_… */
const SESSION_ID_RE = /^cs_(test|live)_[A-Za-z0-9]{10,}$/;
export function isSessionId(v: unknown): v is string {
  return typeof v === "string" && SESSION_ID_RE.test(v);
}

/**
 * Reine Regel: Eine Session schaltet eine Analyse nur frei, wenn sie wirklich
 * bezahlt ist (Klarna/SEPA liefern `completed` auch bei `unpaid`) UND zu genau
 * dieser Analyse gehört.
 */
export function sessionUnlocksAnalysis(
  session: Stripe.Checkout.Session,
  analysisId: string
): boolean {
  if (session.payment_status !== "paid") return false;
  const owner = session.metadata?.analysisId ?? session.client_reference_id;
  return owner === analysisId;
}

/**
 * Fallback zur Webhook-Freischaltung: Der Server fragt Stripe direkt nach der
 * Session (kein Client-Vertrauen nötig). Gibt true zurück, wenn freigeschaltet.
 */
export async function unlockFromStripeSession(
  analysisId: string,
  sessionId: string
): Promise<boolean> {
  const session = await stripe().checkout.sessions.retrieve(sessionId);
  if (!sessionUnlocksAnalysis(session, analysisId)) return false;
  const email = session.customer_details?.email ?? session.customer_email ?? undefined;
  const ok = await markPaid(analysisId, email);
  if (!ok) {
    // Bezahlt, aber Record schon abgelaufen – gleiche Meldung wie im Webhook.
    console.error(`Stripe-Fallback: Zahlung fuer abgelaufene Analyse ${analysisId}, session ${session.id}`);
  }
  return ok;
}
