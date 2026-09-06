import { routing, type Locale } from "@/i18n/routing";

/** Stripe-Checkout-Sprachen (Stripe kennt kein Ukrainisch → "auto"). */
const STRIPE_LOCALES: Partial<Record<Locale, string>> = { de: "de", en: "en", tr: "tr", ar: "ar", ru: "ru" };

export function toLocale(v: unknown): Locale {
  return typeof v === "string" && (routing.locales as readonly string[]).includes(v)
    ? (v as Locale)
    : routing.defaultLocale;
}

/** URL-Präfix wie next-intl `as-needed`: de → "", sonst "/<locale>". */
export function localePrefix(locale: Locale): string {
  return locale === routing.defaultLocale ? "" : `/${locale}`;
}

export function stripeLocale(locale: Locale): string {
  return STRIPE_LOCALES[locale] ?? "auto";
}
