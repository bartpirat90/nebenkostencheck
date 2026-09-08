import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";

export default function LandingHero() {
  const t = useTranslations("hero");
  const tt = useTranslations("trust");
  return (
    <section className="pb-10">
      <p className="text-xs font-semibold tracking-wide text-accent-bright mb-4">
        {t("eyebrow")}
      </p>
      <h1 className="text-2xl sm:text-4xl font-black leading-[1.15] mb-4 tracking-tight text-fg text-balance hyphens-auto break-words">
        {t("headline")}
      </h1>
      <p className="text-muted text-lg leading-relaxed mb-7 max-w-lg">
        {t("subline")}
      </p>
      {/* Sprungmarke, kein Routenwechsel – deshalb <a> statt next-intl-Link. */}
      <Button href="#upload" size="lg">
        {t("cta")} <span aria-hidden>→</span>
      </Button>
      <p className="text-sm text-faint mt-3">{t("priceNote")}</p>
      <ul className="lg:hidden flex flex-wrap gap-x-5 gap-y-1.5 mt-6 text-sm text-muted">
        <li className="flex items-center gap-1.5"><span className="text-accent">✓</span> {tt("dsgvo")}</li>
        <li className="flex items-center gap-1.5"><span className="text-accent">✓</span> {tt("deletion")}</li>
        <li className="flex items-center gap-1.5"><span className="text-accent">✓</span> {tt("noAccount")}</li>
      </ul>
    </section>
  );
}
