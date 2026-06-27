import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { SITE_URL } from "@/lib/constants";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

const TITLE = "Nebenkostencheck – Nebenkostenabrechnung prüfen & Geld zurückholen";
const DESCRIPTION =
  "Lade deine Nebenkostenabrechnung hoch und finde in Sekunden typische Fehler – geprüft nach aktuellem Mietrecht (BetrKV, HeizkV) und höchstrichterlicher BGH-Rechtsprechung. Erst-Prüfung kostenlos.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · Nebenkostencheck",
  },
  description: DESCRIPTION,
  keywords: [
    "Nebenkostenabrechnung prüfen",
    "Betriebskostenabrechnung Fehler",
    "Nebenkosten Widerspruch",
    "Heizkostenabrechnung prüfen",
    "Mieter Erstattung",
    "BetrKV",
    "HeizkV",
  ],
  applicationName: "Nebenkostencheck",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: SITE_URL,
    siteName: "Nebenkostencheck",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Nebenkostencheck",
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Nebenkostencheck",
      inLanguage: "de-DE",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Service",
      name: "Nebenkostenabrechnung prüfen",
      serviceType: "Prüfung von Nebenkostenabrechnungen",
      provider: { "@id": `${SITE_URL}/#organization` },
      areaServed: { "@type": "Country", name: "Deutschland" },
      description: DESCRIPTION,
      offers: {
        "@type": "Offer",
        price: "9.90",
        priceCurrency: "EUR",
        description:
          "Vollständiger Prüfbericht inklusive Musterschreiben. Die erste Prüfung mit Vorschau ist kostenlos.",
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className={geist.className}>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
