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
          "line-strong": "#C9C2B2", // dekorative Strichlinien, Schritt-Oberkanten
          // Rahmen von Bedienelementen (Eingaben, Upload-Zone, Sekundärbutton)
          // brauchen nach WCAG 1.4.11 mindestens 3:1 gegen ihre Umgebung.
          // "line-strong" schafft auf doc nur 1,77:1; dieser Ton erreicht
          // 3,52:1 auf doc und 3,35:1 auf paper.
          "line-control": "#8F8878",
        },

        // Dokumentfläche: Berichtskarte, Brief, Upload-Zone, Modal, Eingaben.
        // Der einzige Ort mit reinem Weiß - bewusst als "Papier im Papier",
        // damit gedruckte Artefakte sich vom Blatt abheben.
        doc: "#FFFFFF",

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
          // Zugleich die Quelle des Hex-Werts, der in globals.css für den
          // [data-on-ink]-Fokusring hart notiert ist: CSS außerhalb von
          // Tailwind kann das Token nicht referenzieren. Wert also nur
          // gemeinsam mit globals.css ändern.
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
        },
      },

      // Drei Schattenrollen statt wiederholter arbitrary values: das Blatt liegt
      // auf dem Ink-Rahmen, Dokumente liegen auf dem Blatt, der Dialog über allem.
      boxShadow: {
        sheet: "0 30px 80px rgba(0,0,0,0.55)", // Blatt (main) auf dem Ink-Rahmen
        card: "0 12px 30px rgba(27,31,36,0.08)", // Bericht- und Briefmuster auf Papier
        dialog: "0 24px 60px rgba(18,23,30,0.35)", // Modal über dem Backdrop
      },
    },
  },
  plugins: [],
};
