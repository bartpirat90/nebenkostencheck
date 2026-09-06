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

        // Statusfarben der Befund-Ampel und der Meldungsboxen. Bewusst getrennt
        // vom Marken-Akzent: "ok" ist eine Aussage über einen Befund, nicht die
        // Markenfarbe – sonst würde jede Akzent-Anpassung die Ampel mitziehen.
        // Werte sind 1:1 die bisherigen Hex-Literale aus ResultView/LetterModal/
        // UploadZone, damit die Umstellung rein strukturell bleibt.
        status: {
          ok: "#4ADE80", // Text/Icon "sicher" (green-400)
          okStrong: "#22C55E", // Ampelpunkt (green-500)
          okSoft: "#86EFAC", // Fließtext im Erfolgsfeld (green-300)
          okBg: "#0F2B1F", // Kartenfläche
          okSurface: "#14532D", // gefüllter Icon-Kreis (green-900)
          okBorder: "#166534", // (green-800)

          warn: "#FCD34D", // Text/Icon "wahrscheinlich" (amber-300)
          warnStrong: "#F59E0B", // Ampelpunkt (amber-500)
          warnSoft: "#D97706", // Fließtext im Hinweisfeld (amber-600)
          warnBg: "#1C1A0E", // Kartenfläche
          warnBgHover: "#231F12", // Hover der Demo-Kachel
          warnSurface: "#451A03", // gefüllter Icon-Kreis (amber-950)
          warnBorder: "#92400E", // (amber-800)

          neutral: "#B8C2CF", // Text "unsicher" – offene Prüfkategorie, kein Fehler
          neutralStrong: "#8A96A6", // Ampelpunkt
          neutralBg: "#161B23",
          neutralBorder: "#3A4556",

          danger: "#FCA5A5", // Text echter Fehlerzustände (red-300)
          dangerBg: "#1C0F0F",
          dangerBorder: "#991B1B", // (red-800)
        },
      },
    },
  },
  plugins: [],
};
