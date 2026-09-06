import { ImageResponse } from "next/og";

// ImageResponse laeuft auch unter Node; das Projekt deployt durchgaengig auf der
// Node-Runtime, deshalb hier kein Edge-Sonderfall.
export const runtime = "nodejs";
export const dynamic = "force-static";

const size = { width: 1200, height: 630 };

// Gebrandetes Teilen-Vorschaubild im gruenen „Pruefbericht"-Design.
// Bewusst als /og.png-Route (Punkt im Pfad) – so greift der Middleware-Matcher
// nicht und Social-Crawler bekommen 200 statt eines 307-Redirects.
// contentType/alt setzt die Route nicht: Der Dateiname liefert bereits image/png,
// und der Alt-Text kommt lokalisiert aus den Metadaten (layout.tsx bzw.
// pageMetadata, jeweils meta.ogAlt) – hier waere er nur auf Deutsch moeglich.
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0C1016",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2l6 2.25 M20 6v5c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3"
              stroke="#10B981"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7.8 11.5l3.4 3.4L21.5 2.8"
              stroke="#10B981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ display: "flex", fontSize: "34px", fontWeight: 800, color: "#E7ECF2" }}>
            Nebenkostencheck
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "68px",
              fontWeight: 800,
              color: "#E7ECF2",
              lineHeight: 1.1,
              letterSpacing: "-1px",
            }}
          >
            Nebenkostenabrechnung in Sekunden geprüft
          </div>
          <div style={{ display: "flex", width: "130px", height: "6px", background: "#059669", borderRadius: "3px" }} />
          <div style={{ display: "flex", fontSize: "30px", color: "#9AA6B4", lineHeight: 1.3 }}>
            Typische Fehler finden – nach BetrKV, HeizkV &amp; BGH-Rechtsprechung. Erst-Prüfung kostenlos.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: "26px", color: "#828C9A" }}>nebenkostencheck24.de</div>
      </div>
    ),
    { ...size },
  );
}
