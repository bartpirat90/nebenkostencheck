import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import UploadHelpPage from "@/components/UploadHelpPage";
import { pageMetadata, toLocale } from "@/lib/seo";

const PATH = "/upload-hilfe";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "uploadHelp" });
  const tMeta = await getTranslations({ locale, namespace: "meta" });
  return pageMetadata(
    toLocale(locale),
    PATH,
    t("title"),
    t("metaDescription"),
    tMeta("ogAlt"),
  );
}

export default function UploadHilfePage() {
  return <UploadHelpPage />;
}
