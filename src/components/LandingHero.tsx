import { useTranslations } from "next-intl";

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
      <a
        href="#upload"
        className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover active:scale-[0.98]
          text-white font-bold text-base px-7 py-3.5 rounded-xl transition-colors"
      >
        {t("cta")} <span aria-hidden>→</span>
      </a>
      <ul className="lg:hidden flex flex-wrap gap-x-5 gap-y-1.5 mt-6 text-sm text-muted">
        <li className="flex items-center gap-1.5"><span className="text-accent-soft">✓</span> {tt("dsgvo")}</li>
        <li className="flex items-center gap-1.5"><span className="text-accent-soft">✓</span> {tt("deletion")}</li>
        <li className="flex items-center gap-1.5"><span className="text-accent-soft">✓</span> {tt("noAccount")}</li>
      </ul>
    </section>
  );
}
