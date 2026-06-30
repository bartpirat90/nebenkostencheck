import { useTranslations } from "next-intl";

// Häufige Fragen – eine Quelle für die sichtbare Liste UND das FAQPage-JSON-LD,
// damit beides synchron in der aktiven Sprache bleibt. Inhalte in messages/*.json
// (Namespace "faq"). Bewusst akkurat zu Preis (9,90 €), Löschfrist (24 h),
// Rechtsstatus (keine Rechtsberatung, RDG) und § 556 BGB.
export default function Faq() {
  const t = useTranslations("faq");
  const items = t.raw("items") as { q: string; a: string }[];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <section className="mt-12" aria-labelledby="faq-heading">
      <p className="text-[11px] font-medium tracking-[0.12em] text-faint mb-1">{t("eyebrow")}</p>
      <h2 id="faq-heading" className="text-xl font-bold text-fg tracking-tight mb-4">
        {t("heading")}
      </h2>

      <div className="border-t border-line">
        {items.map((f, i) => (
          <details key={i} className="group border-b border-line">
            <summary className="flex items-center justify-between gap-4 cursor-pointer list-none py-4 text-sm font-semibold text-fg [&::-webkit-details-marker]:hidden">
              <span>{f.q}</span>
              <svg
                className="w-4 h-4 shrink-0 text-faint transition-transform duration-200 group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="pb-4 -mt-1 text-sm text-muted leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </section>
  );
}
