import { useTranslations } from "next-intl";

export default function HowItWorks() {
  const t = useTranslations("howItWorks");
  const steps = t.raw("steps") as { title: string; description: string }[];

  return (
    <section className="mb-12">
      <p className="text-sm font-semibold text-accent mb-1">{t("eyebrow")}</p>
      <h2 className="text-xl font-black text-fg mb-5">{t("heading")}</h2>
      <div className="border border-line rounded-xl divide-y divide-line">
        {steps.map((step, i) => (
          <div key={step.title} className="flex items-start gap-4 px-4 py-4">
            <span className="text-sm font-medium tabular-nums text-accent w-6 shrink-0 pt-0.5">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="text-sm font-bold text-fg mb-1">{step.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
