// Gemeinsame Logo-Geometrie für Web (Logo.tsx) und PDF (ReportDoc).
//
// Schild-Outline mit ECHTER Lücke oben rechts, durch die der Haken bricht –
// kein Knockout in der Hintergrundfarbe. Dadurch ist das Logo
// hintergrundunabhängig: dunkle Website wie weißes PDF.
export const LOGO_VIEWBOX = "0 0 24 24";

// Schild-Kontur in zwei Teilstücken. Das obere Teilstück endet bei (18, 4.25),
// das rechte beginnt erst wieder bei (20, 6) – die Lücke dazwischen lässt den
// Haken durch die Schulter austreten.
export const LOGO_SHIELD_PATH =
  "M12 2l6 2.25 M20 6v5c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3";

// Haken; tritt oben rechts aus der Schild-Kontur heraus.
export const LOGO_CHECK_PATH = "M7.8 11.5l3.4 3.4L21.5 2.8";

// Markengrün. Auf weißem Grund (PDF) etwas kräftiger als auf der dunklen
// Website, damit der Kontrast trägt.
export const LOGO_GREEN_ON_DARK = "#10B981";
export const LOGO_GREEN_ON_LIGHT = "#059669";
