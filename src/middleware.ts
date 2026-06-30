import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Alle Pfade AUSSER: API-Routen, Next-Interna und Dateien mit Endung
  // (robots.txt, sitemap.xml, icon.svg etc. tragen einen Punkt → ausgeschlossen).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
