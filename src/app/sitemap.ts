import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { localeUrl } from "@/lib/seo";

const PAGES = ["", "/impressum", "/datenschutz", "/agb"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap((page) => {
    // hreflang-Alternates für diese Seite über alle Sprachen.
    const languages: Record<string, string> = {};
    for (const l of routing.locales) languages[l] = localeUrl(l, page);

    return routing.locales.map((l) => ({
      url: localeUrl(l, page),
      // Kein lastModified: ein Build-Zeitstempel waere ein falsches Frische-Signal,
      // da sich der Seiteninhalt beim Build nicht zwangslaeufig geaendert hat.
      changeFrequency: (page === "" ? "monthly" : "yearly") as "monthly" | "yearly",
      priority: page === "" ? 1 : 0.3,
      alternates: { languages },
    }));
  });
}
