import type { Metadata } from "next";

// Nutzerspezifische Ergebnisseite: nicht indexieren.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ErgebnisLayout({ children }: { children: React.ReactNode }) {
  return children;
}
