import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de", "en", "tr", "ar", "ru", "uk"],
  defaultLocale: "de",
  // Deutsch bleibt auf "/", andere Sprachen unter "/en", "/tr", ...
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

/** Sprachen, die von rechts nach links gesetzt werden. */
export const RTL_LOCALES: Locale[] = ["ar"];

export const localeNames: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
  tr: "Türkçe",
  ar: "العربية",
  ru: "Русский",
  uk: "Українська",
};
