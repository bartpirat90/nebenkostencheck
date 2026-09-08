import { useTranslations } from "next-intl";
import LetterPreview from "@/components/LetterPreview";

interface Feature {
  title: string;
  subtitle: string;
}

// Vier Lucide-Motive als Inline-Pfade (scale, file-text, search, arrow-right).
// Bewusst kopiert statt als Paket installiert: vier Icons rechtfertigen keine
// neue Abhängigkeit im Client-Bundle.
const ICONS = [
  "M12 3v18M7 6h10M6 6l-3 7h6l-3-7Zm12 0-3 7h6l-3-7ZM8 21h8",
  "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Zm0 0v5h5M9 13h6M9 17h6",
  "m21 21-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z",
  "M5 12h14m-6-6 6 6-6 6",
];

export default function ReportFeatures() {
  const t = useTranslations("reportFeatures");
  // Solange eine Sprache den Namespace noch nicht hat, liefert t.raw statt der
  // Liste den Schlüssel als Zeichenkette zurück; ohne diese Weiche bräche das
  // Rendern der Seite mit „map is not a function“ ab (siehe ReportPreviewCard).
  const raw = t.raw("items");
  const items: Feature[] = Array.isArray(raw) ? (raw as Feature[]) : [];

  return (
    <section id="bericht" className="mt-16 scroll-mt-24">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-[56px] lg:items-center">
        <div className="min-w-0">
          <h2 className="text-[26px] sm:text-[34px] font-extrabold leading-[1.12] tracking-[-0.02em] text-fg">
            {t("heading")}
          </h2>
          <p className="mt-3 text-base sm:text-[17px] leading-[1.55] text-muted max-w-[62ch]">
            {t("lead")}
          </p>

          <ul className="mt-8 space-y-5">
            {items.map((item, i) => (
              <li key={item.title} className="flex items-start gap-4">
                <span className="mt-0.5 shrink-0 w-7 h-7 rounded-lg bg-accent-soft border border-accent-border flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-accent"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d={ICONS[i % ICONS.length]} />
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-bold text-fg">{item.title}</span>
                  <span className="block mt-0.5 text-sm leading-[1.55] text-muted">{item.subtitle}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Unter 1024 px rutscht der Brief unter die Liste und bleibt bei 480 px. */}
        <div className="flex justify-center lg:justify-end">
          <LetterPreview />
        </div>
      </div>
    </section>
  );
}
