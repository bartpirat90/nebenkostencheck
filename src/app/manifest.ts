import type { MetadataRoute } from "next";
import { APPLE_ICON_SIZE, APPLE_ICON_TYPE, BRAND_INK } from "@/lib/seo";

// Web-App-Manifest für „Zum Startbildschirm hinzufügen" (Android/Chrome).
// Icons: icon.svg deckt beliebige Größen ab, apple-icon liefert das PNG,
// das auch Chrome/Android als Fallback nutzen kann.
// start_url bleibt bewusst "/" (Deutsch): Das Manifest liegt außerhalb von
// [locale] und wird für alle Sprachen identisch ausgeliefert; die
// Locale-Erkennung der Middleware leitet beim Start ggf. weiter.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nebenkostencheck",
    short_name: "NK-Check",
    start_url: "/",
    display: "standalone",
    background_color: BRAND_INK,
    theme_color: BRAND_INK,
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      {
        src: "/apple-icon",
        sizes: `${APPLE_ICON_SIZE.width}x${APPLE_ICON_SIZE.height}`,
        type: APPLE_ICON_TYPE,
      },
    ],
  };
}
