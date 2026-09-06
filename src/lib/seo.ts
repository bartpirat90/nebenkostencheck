import type { Metadata } from "next";
import { routing, type Locale } from "@/i18n/routing";
import { SITE_URL } from "@/lib/constants";

// Eine einzige Locale-Pruefung im Projekt: die Implementierung liegt schon in
// checkoutLocale.ts. Hier nur re-exportiert, damit SEO-Aufrufer sie zusammen mit
// pageAlternates/pageMetadata aus einem Modul beziehen.
export { toLocale } from "@/lib/checkoutLocale";

/** Absolute URL einer Seite je Locale – de ohne Praefix, andere mit /<locale>. */
export function localeUrl(locale: string, path = ""): string {
  return locale === routing.defaultLocale ? `${SITE_URL}${path}` : `${SITE_URL}/${locale}${path}`;
}

/** canonical + hreflang (inkl. x-default = de) fuer eine Seite. */
export function pageAlternates(locale: Locale, path = "") {
  const languages: Record<string, string> = { "x-default": localeUrl(routing.defaultLocale, path) };
  for (const l of routing.locales) languages[l] = localeUrl(l, path);
  return { canonical: localeUrl(locale, path), languages };
}

/** OG-locale-Codes je Sprache (og:locale erwartet xx_XX). */
export const OG_LOCALES: Record<Locale, string> = {
  de: "de_DE",
  en: "en_US",
  tr: "tr_TR",
  ar: "ar_AR",
  ru: "ru_RU",
  uk: "uk_UA",
};

/**
 * Vollstaendige Metadaten einer Unterseite (Rechtsseiten etc.).
 * `openGraph` und `twitter` muessen komplett sein: Next ersetzt die Objekte des
 * Layouts, statt sie tief zu mergen – eine Teilangabe wuerde og:image, og:type,
 * og:site_name und og:locale aus dem Layout verlieren.
 */
export function pageMetadata(
  locale: Locale,
  path: string,
  title: string,
  description: string,
  ogAlt: string,
): Metadata {
  return {
    title,
    description,
    alternates: pageAlternates(locale, path),
    openGraph: {
      type: "website",
      siteName: "Nebenkostencheck",
      locale: OG_LOCALES[locale],
      url: localeUrl(locale, path),
      title,
      description,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: ogAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og.png"],
    },
  };
}
