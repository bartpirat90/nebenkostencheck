import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nebenkostencheck – Abrechnung prüfen & Geld zurückholen",
  description:
    "Lade deine Nebenkostenabrechnung hoch und finde in Sekunden typische Fehler – geprüft nach aktuellem Mietrecht (BetrKV, HeizkV) und höchstrichterlicher BGH-Rechtsprechung.",
  keywords: ["Nebenkostenabrechnung", "Prüfung", "Fehler", "Erstattung", "Mieter"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={geist.className}>{children}</body>
    </html>
  );
}
