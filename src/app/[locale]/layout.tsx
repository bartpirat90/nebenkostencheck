import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing, RTL_LOCALES } from "@/i18n/routing";
import { SITE_URL } from "@/lib/constants";
import { localeUrl, pageAlternates, toLocale, OG_LOCALES } from "@/lib/seo";
import "../globals.css";

const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-geist" });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const current = toLocale(locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("title"), template: "%s · Nebenkostencheck" },
    description: t("description"),
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
    alternates: pageAlternates(current),
    openGraph: {
      type: "website",
      locale: OG_LOCALES[current],
      url: localeUrl(current),
      siteName: "Nebenkostencheck",
      title: t("title"),
      description: t("description"),
      images: [{ url: "/og.png", width: 1200, height: 630, alt: t("ogAlt") }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/og.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
  };
}

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
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  // hasLocale oben verengt `locale` bereits auf Locale – kein Cast noetig.
  const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body className={`${geist.variable} ${geist.className}`}>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
