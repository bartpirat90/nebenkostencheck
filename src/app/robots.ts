import type { MetadataRoute } from "next";

const SITE_URL = "https://nebenkostencheck24.de";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nutzerspezifische Ergebnisse und API-Routen nicht crawlen.
      disallow: ["/ergebnis", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
