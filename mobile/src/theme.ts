import type { Confidence } from "./types";

// Gespiegelt aus dem Web-„Prüfbericht"-Design (grün/ink statt lila/slate).
// Token-Namen bleiben (accentFrom/accentTo) für Kompatibilität; sie tragen jetzt
// einen dezenten Grün-Verlauf statt des alten Lila.
export const colors = {
  bg: "#0C1016", // ink
  card: "#11161D", // surface
  border: "#1E2733", // line
  text: "#E7ECF2", // fg
  textMuted: "#9AA6B4", // muted
  faint: "#828C9A", // faint
  accentFrom: "#059669", // accent
  accentTo: "#10B981", // accent-soft
  green: "#34D399", // accent-bright (Erstattung/„sofort angreifbar")
  yellow: "#F59E0B", // Belegeinsicht/amber
  red: "#EF4444",
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { md: 12, lg: 16, xl: 24 } as const;

/** Farbsätze je Erfolgsaussicht – gespiegelt aus dem Web-Design. */
export const confidence: Record<
  Confidence,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  sicher: { label: "Sicher", bg: "#0F2B1F", border: "#166534", text: "#4ADE80", dot: "#22C55E" },
  wahrscheinlich: { label: "Wahrscheinlich", bg: "#1C1A0E", border: "#92400E", text: "#FCD34D", dot: "#F59E0B" },
  unsicher: { label: "Unsicher", bg: "#1C0F0F", border: "#991B1B", text: "#FCA5A5", dot: "#EF4444" },
};
