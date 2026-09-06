import type Stripe from "stripe";
import { routing, type Locale } from "@/i18n/routing";

type StripeLocale = Stripe.Checkout.SessionCreateParams.Locale;

/**
 * Stripe-Checkout-Sprachen. Stripe kennt weder Ukrainisch noch Arabisch
 * (Stand SDK-Enum) → "auto" lässt Stripe nach Browser-Sprache entscheiden,
 * statt mit einem ungültigen Wert die Session-Erstellung scheitern zu lassen.
 */
const STRIPE_LOCALES: Partial<Record<Locale, StripeLocale>> = { de: "de", en: "en", tr: "tr", ru: "ru" };

export function toLocale(v: unknown): Locale {
  return typeof v === "string" && (routing.locales as readonly string[]).includes(v)
    ? (v as Locale)
    : routing.defaultLocale;
}

/** URL-Präfix wie next-intl `as-needed`: de → "", sonst "/<locale>". */
export function localePrefix(locale: Locale): string {
  return locale === routing.defaultLocale ? "" : `/${locale}`;
}

export function stripeLocale(locale: Locale): StripeLocale {
  return STRIPE_LOCALES[locale] ?? "auto";
}
