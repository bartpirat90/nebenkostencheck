import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { routing } from "@/i18n/routing";

const PAGES = ["", "/impressum", "/datenschutz", "/agb"];

/** URL einer Seite je Locale – Default (de) ohne Präfix, andere mit /<locale>. */
function localeUrl(locale: string, page: string): string {
  return locale === routing.defaultLocale ? `${SITE_URL}${page}` : `${SITE_URL}/${locale}${page}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PAGES.flatMap((page) => {
    // hreflang-Alternates für diese Seite über alle Sprachen.
    const languages: Record<string, string> = {};
    for (const l of routing.locales) languages[l] = localeUrl(l, page);

    return routing.locales.map((l) => ({
      url: localeUrl(l, page),
      lastModified: now,
      changeFrequency: (page === "" ? "monthly" : "yearly") as "monthly" | "yearly",
      priority: page === "" ? 1 : 0.3,
      alternates: { languages },
    }));
  });
}
