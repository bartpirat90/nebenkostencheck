import type { MetadataRoute } from "next";

// Web-App-Manifest fuer "Zum Startbildschirm hinzufuegen" (Android/Chrome).
// Icons: icon.svg deckt beliebige Groessen ab, apple-icon liefert das PNG,
// das auch Chrome/Android als maskierbares Fallback nutzen kann.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nebenkostencheck",
    short_name: "NK-Check",
    start_url: "/",
    display: "standalone",
    background_color: "#0C1016",
    theme_color: "#0C1016",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
