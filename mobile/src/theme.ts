import type { Confidence } from "./types";

export const colors = {
  bg: "#0F172A",
  card: "#1E293B",
  border: "#334155",
  text: "#F1F5F9",
  textMuted: "#94A3B8",
  accentFrom: "#6366F1",
  accentTo: "#8B5CF6",
  green: "#22C55E",
  yellow: "#EAB308",
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
