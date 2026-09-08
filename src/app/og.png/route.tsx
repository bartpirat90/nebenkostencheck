import { ImageResponse } from "next/og";
import { BRAND_INK, BRAND_PAPER } from "@/lib/seo";
import { LOGO_CHECK_PATH, LOGO_GREEN_ON_DARK, LOGO_SHIELD_PATH } from "@/lib/logo";

// ImageResponse läuft auch unter Node; das Projekt deployt durchgängig auf der
// Node-Runtime, deshalb hier kein Edge-Sonderfall.
export const runtime = "nodejs";
export const dynamic = "force-static";

const size = { width: 1200, height: 630 };

// Gebrandetes Teilen-Vorschaubild im Design „Papier auf Ink“: dunkler Rahmen mit
// Wortmarke und Domain, darin das helle Blatt mit der Kernaussage.
// Bewusst als /og.png-Route (Punkt im Pfad) – so greift der Middleware-Matcher
// nicht und Social-Crawler bekommen 200 statt eines 307-Redirects.
// contentType/alt setzt die Route nicht: Der Dateiname liefert bereits image/png,
// und der Alt-Text kommt lokalisiert aus den Metadaten (layout.tsx bzw.
// pageMetadata, jeweils meta.ogAlt) – hier wäre er nur auf Deutsch möglich.
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background: BRAND_INK,
          padding: "40px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Rahmenzeile oben: Logo und Wortmarke auf Ink */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "0 12px 26px" }}>
          {/* Geometrie und Farbe aus lib/logo statt Kopie: sonst driftet das
              Teilen-Bild vom Logo der Website und des PDF-Berichts weg. */}
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <path
              d={LOGO_SHIELD_PATH}
              stroke={LOGO_GREEN_ON_DARK}
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={LOGO_CHECK_PATH}
              stroke={LOGO_GREEN_ON_DARK}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ display: "flex", fontSize: "28px", fontWeight: 800, color: "#EEF1F4" }}>
            Nebenkostencheck
          </div>
        </div>

        {/* Das Blatt */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "28px",
            background: BRAND_PAPER,
            borderRadius: "18px",
            padding: "56px 64px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "64px",
              fontWeight: 800,
              color: "#1B1F24",
              lineHeight: 1.08,
              letterSpacing: "-1.6px",
            }}
          >
            Nebenkostenabrechnung in Sekunden geprüft
          </div>
          <div style={{ display: "flex", width: "130px", height: "6px", background: "#047857", borderRadius: "3px" }} />
          <div style={{ display: "flex", fontSize: "27px", color: "#4E555C", lineHeight: 1.35 }}>
            Typische Fehler finden, nach BetrKV, HeizkV und BGH-Rechtsprechung. Erst-Prüfung kostenlos.
          </div>
        </div>

        {/* Rahmenzeile unten: Domain auf Ink */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "22px 12px 0", fontSize: "24px", color: "#8F9AA6" }}>
          nebenkostencheck24.de
        </div>
      </div>
    ),
    { ...size },
  );
}
