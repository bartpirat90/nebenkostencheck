/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Zwei Welten: "ink" ist der dunkle Rahmen (Navigation, Seitenrand,
        // Footer, Modal-Backdrop), alles Übrige gilt innerhalb des Blatts.
        // Hinweis: NICHT "base" nennen - kollidiert mit Tailwinds text-base.
        ink: {
          DEFAULT: "#12171E", // Rahmenfläche, html/body-Hintergrund
          2: "#1B222B", // leicht gehobene Fläche auf Ink (Pill in der Nav)
          line: "#26303A", // Haarlinien auf Ink
          fg: "#EEF1F4", // Text auf Ink
          muted: "#B4BDC7", // Sekundärtext auf Ink (Nav-Links)
          faint: "#8F9AA6", // Footer-Text auf Ink
        },

        // Papier: die Fläche, auf der der gesamte Inhalt liegt.
        paper: {
          DEFAULT: "#FBF9F4", // Blattfläche
          2: "#F3EFE6", // abgesetzte Sektion (Mieterrechte), Empfehlungsbox
          line: "#E3DDD0", // Haarlinien, Kartenrahmen
          "line-strong": "#C9C2B2", // Rahmen interaktiver Elemente, Strichlinien
        },

        // Dokumentfläche: Berichtskarte, Brief, Upload-Zone, Modal, Eingaben.
        // Der einzige Ort mit reinem Weiß - bewusst als "Papier im Papier",
        // damit gedruckte Artefakte sich vom Blatt abheben.
        doc: "#FFFFFF",

        // Aliase, damit bestehende Komponenten mit border-line und
        // border-line-strong ohne Umbenennung Papier werden (Spec 2.2).
        line: "#E3DDD0",
        "line-strong": "#C9C2B2",

        fg: {
          DEFAULT: "#1B1F24", // Primärtext, Primärbutton-Fläche
          hover: "#2A3038", // Hover des Primärbuttons
        },
        muted: "#4E555C", // Sekundärtext
        faint: "#5F666D", // Meta und Fußnoten (mindestens 12,5 px)

        // Marken-Akzent auf Papier. "bright" ist die einzige Variante für
        // dunklen Grund (Logo-Schild, Links und Fokusring im Ink-Rahmen).
        accent: {
          DEFAULT: "#047857", // Icons, Haken, Beträge, Berichts-Button
          hover: "#065F46", // Hover des Akzentbuttons
          bright: "#34D399", // Akzent auf Ink
          soft: "#E4F2EA", // Akzent-Hintergrund (Icon-Kacheln, Marker)
          border: "#BFE0CF", // Rahmen auf Akzent-Hintergrund
        },

        // Statusfarben der Befund-Ampel und der Meldungsboxen, jetzt in der
        // Papier-Welt. Bewusst getrennt vom Marken-Akzent: "ok" ist eine
        // Aussage über einen Befund, nicht die Markenfarbe. "unsicher" bleibt
        // neutral, Rot ist echten Fehlerzuständen vorbehalten.
        status: {
          ok: "#166534",
          okBg: "#EAF6EE",
          okBorder: "#BBE3C8",
          okStrong: "#16A34A",

          warn: "#92400E",
          warnBg: "#FDF3E3",
          warnBorder: "#F3D9A8",
          warnStrong: "#D97706",

          neutral: "#4E555C",
          neutralBg: "#F3EFE6",
          neutralBorder: "#D9D3C6",
          neutralStrong: "#8A96A6",

          danger: "#991B1B",
          dangerBg: "#FDECEC",
          dangerBorder: "#F2B8B8",
          dangerStrong: "#DC2626",
        },
      },
    },
  },
  plugins: [],
};
