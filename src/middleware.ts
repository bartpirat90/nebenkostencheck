import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Alle Pfade AUSSER: API-Routen, Next-Interna und Dateien mit Endung
  // (robots.txt, sitemap.xml, icon.svg etc. tragen einen Punkt → ausgeschlossen).
  // `/apple-icon` ist eine Metadata-Route ohne Punkt und würde sonst als
  // Locale-Pfad behandelt (→ 404 über [locale]/[...rest]).
  matcher: ["/((?!api|_next|_vercel|apple-icon|.*\\..*).*)"],
};
