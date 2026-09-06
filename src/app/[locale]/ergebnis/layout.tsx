import type { Metadata } from "next";

// Nutzerspezifische Ergebnisseite: nicht indexieren – und ohne Canonical/hreflang,
// damit die vom Locale-Layout geerbten Startseiten-URLs hier nicht auftauchen.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: null, languages: {} },
};

export default function ErgebnisLayout({ children }: { children: React.ReactNode }) {
  return children;
}
