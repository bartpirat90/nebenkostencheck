/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Neutrale Flächen & Text (dunkles "Ledger/Dokument"-Ink)
        // Hinweis: NICHT "base" nennen – kollidiert mit Tailwinds text-base (Schriftgröße).
        ink: "#0C1016", // Seiten-Hintergrund (tiefes, neutrales Ink)
        surface: "#11161D", // dezent gehobene Flächen
        line: "#1E2733", // Haarlinien fürs Ledger-Raster / Trenner
        fg: "#E7ECF2", // Primärtext (off-white)
        muted: "#9AA6B4", // Sekundärtext – WCAG AA auf base
        faint: "#828C9A", // Meta/Fußnoten – WCAG AA (~5,5:1 auf ink)

        // Marken-Akzent: Erstattungs-Grün (emerald)
        accent: {
          DEFAULT: "#059669", // Buttons/primär (emerald-600)
          hover: "#047857", // (emerald-700)
          soft: "#10B981", // Zahlen/Icons (emerald-500)
          bright: "#34D399", // Akzenttext auf dunklem Grund (emerald-400)
          bg: "#06231C", // getönte Akzentfläche (emerald-950-nah)
          border: "#065F46", // (emerald-800)
        },
      },
    },
  },
  plugins: [],
};
