import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nebenkostencheck – KI-gestützte Abrechnungsprüfung",
  description:
    "Lade deine Nebenkostenabrechnung hoch. Unsere KI prüft sie kostenlos auf Fehler und zeigt dein Erstattungspotenzial – ohne Anmeldung.",
  keywords: ["Nebenkostenabrechnung", "Prüfung", "Fehler", "Erstattung", "Mieter"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={geist.className}>{children}</body>
    </html>
  );
}
