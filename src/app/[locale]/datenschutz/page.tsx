import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LegalPage from "@/components/LegalPage";
import type { Locale } from "@/i18n/routing";
import { localeUrl, pageAlternates } from "@/lib/seo";

const PATH = "/datenschutz";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.datenschutz" });
  return {
    title: t("title"),
    description: t("metaDescription"),
    alternates: pageAlternates(locale as Locale, PATH),
    openGraph: {
      url: localeUrl(locale, PATH),
      title: t("title"),
      description: t("metaDescription"),
    },
  };
}

export default function DatenschutzPage() {
  return <LegalPage page="datenschutz" />;
}
