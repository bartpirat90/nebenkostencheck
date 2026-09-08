import { useTranslations } from "next-intl";

interface FaqItem {
  q: string;
  a: string;
}

// Häufige Fragen – eine Quelle für die sichtbare Liste UND das FAQPage-JSON-LD,
// damit beides synchron in der aktiven Sprache bleibt. Inhalte in messages/*.json
// (Namespace "faq"). Bewusst akkurat zu Preis (9,90 €), Löschfrist (24 h),
// Rechtsstatus (keine Rechtsberatung, RDG) und § 556 BGB.
export default function Faq() {
  const t = useTranslations("faq");
  // Fehlt der Schlüssel in einer Sprache, liefert t.raw die Zeichenkette statt
  // der Liste; ohne diese Weiche bräche das Rendern (und das JSON-LD) mit
  // „map is not a function“ ab (siehe ReportFeatures/HowItWorks).
  const raw = t.raw("items");
  const items: FaqItem[] = Array.isArray(raw) ? (raw as FaqItem[]) : [];

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
    <section id="fragen" className="mt-16 scroll-mt-24" aria-labelledby="faq-heading">
      <h2
        id="faq-heading"
        className="text-[26px] sm:text-[34px] font-extrabold leading-[1.12] tracking-[-0.02em] text-fg"
      >
        {t("heading")}
      </h2>

      {/* 760 px Lesebreite: die Antworten sind lang, das Blatt ist breit. */}
      <div className="mt-8 max-w-[760px] border-t border-paper-line">
        {items.map((f, i) => (
          // Der erste Eintrag ist offen: eine geschlossene Liste wirkt wie eine
          // Wand, ein sichtbarer Antwortstil lädt zum Aufklappen ein.
          <details key={i} open={i === 0} className="group border-b border-paper-line">
            <summary className="flex items-center justify-between gap-4 cursor-pointer list-none py-4 text-base font-semibold text-fg [&::-webkit-details-marker]:hidden">
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
            <p className="pb-4 -mt-1 text-sm leading-[1.55] text-muted max-w-[62ch]">{f.a}</p>
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
