import { useTranslations } from "next-intl";
import Button from "@/components/ui/Button";
import ReportPreviewCard from "@/components/ReportPreviewCard";

export default function LandingHero() {
  const t = useTranslations("hero");
  const tt = useTranslations("trust");

  return (
    <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-[52px] lg:items-center pb-12">
      <div className="min-w-0">
        <h1 className="text-[34px] sm:text-[52px] font-extrabold leading-[1.08] tracking-[-0.025em] text-fg hyphens-auto break-words">
          {t("headline")}
        </h1>
        <p className="mt-5 text-base sm:text-[17px] leading-[1.55] text-muted max-w-[62ch]">
          {t("subline")}
        </p>

        {/* Sprungmarke, kein Routenwechsel – Button rendert dafür ein rohes <a>. */}
        <div className="mt-7">
          <Button href="#upload" size="lg">
            {t("cta")} <span aria-hidden>→</span>
          </Button>
        </div>

        <p className="mt-3 text-[12.5px] text-faint">{t("priceNote")}</p>

        <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
          <li className="flex items-center gap-1.5"><span className="text-accent">✓</span> {tt("dsgvo")}</li>
          <li className="flex items-center gap-1.5"><span className="text-accent">✓</span> {tt("deletion")}</li>
          <li className="flex items-center gap-1.5"><span className="text-accent">✓</span> {tt("noAccount")}</li>
        </ul>
      </div>

      {/* Unter 1024 px steht die Karte unter dem Text und bleibt bei 520 px stehen. */}
      <div className="flex justify-center lg:justify-end">
        <ReportPreviewCard />
      </div>
    </section>
  );
}
