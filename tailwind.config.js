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
        line: "#243040", // Haarlinien fürs Ledger-Raster / Trenner
        // Rahmen interaktiver Elemente (Dropzone/Inputs): 3,06:1 auf ink – WCAG 1.4.11
        // verlangt für UI-Komponenten mindestens 3:1 (#34415A hätte nur 1,86:1 erreicht).
        "line-strong": "#4F6184",
        fg: "#E7ECF2", // Primärtext (off-white)
        muted: "#9AA6B4", // Sekundärtext – WCAG AA auf base
        faint: "#828C9A", // Meta/Fußnoten – WCAG AA (~5,5:1 auf ink)

        // Marken-Akzent: Erstattungs-Grün (emerald)
        // DEFAULT ist dunkler als zuvor (emerald-700 statt -600), damit weisser
        // Buttontext AA erreicht (5,48:1 statt 3,77:1). Unbedenklich, da "text-accent"
        // (ohne Suffix) im Code nirgends fuer Text auf dunklem Grund verwendet wird –
        // dort kommen ausschliesslich die helleren Tokens accent-soft/accent-bright zum Einsatz.
        accent: {
          DEFAULT: "#047857", // Buttons/primär (emerald-700, vorher emerald-600)
          hover: "#065F46", // (emerald-800, vorher emerald-700)
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
