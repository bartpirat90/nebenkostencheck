import { ImageResponse } from "next/og";

// ImageResponse laeuft auch unter Node; das Projekt deployt durchgaengig auf der
// Node-Runtime, deshalb hier kein Edge-Sonderfall (analog zu og.png/route.tsx).
export const runtime = "nodejs";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple-Touch-Icon: gleiches Schild-und-Haken-Motiv wie icon.svg, aber mit
// gefuelltem ink-Hintergrund statt Transparenz – iOS legt sonst ein weisses
// Quadrat dahinter.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0C1016",
        }}
      >
        <svg width="132" height="132" viewBox="0 0 24 24">
          <path
            d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z"
            fill="#047857"
          />
          <path
            d="M7.8 11.8l3 3L16.6 9.2"
            fill="none"
            stroke="#E7ECF2"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
