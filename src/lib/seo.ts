import { routing, type Locale } from "@/i18n/routing";
import { SITE_URL } from "@/lib/constants";

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
