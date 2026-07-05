import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nutzerspezifische Ergebnisse (auch je Sprache) und API-Routen nicht crawlen.
      disallow: ["/ergebnis", "/*/ergebnis", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
