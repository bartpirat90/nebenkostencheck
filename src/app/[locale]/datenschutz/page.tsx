import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import LegalPage from "@/components/LegalPage";
import { pageMetadata, toLocale } from "@/lib/seo";

const PATH = "/datenschutz";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.datenschutz" });
  const tMeta = await getTranslations({ locale, namespace: "meta" });
  return pageMetadata(
    toLocale(locale),
    PATH,
    t("title"),
    t("metaDescription"),
    tMeta("ogAlt"),
  );
}

export default function DatenschutzPage() {
  return <LegalPage page="datenschutz" />;
}
