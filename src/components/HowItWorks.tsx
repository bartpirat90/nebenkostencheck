import { useTranslations } from "next-intl";
import DocumentReview from "@/components/illustrations/DocumentReview";
import MailSent from "@/components/illustrations/MailSent";
import Receipt from "@/components/illustrations/Receipt";

interface Step {
  title: string;
  description: string;
}

// Feste Zuordnung Schritt zu Motiv (Spec 6). Position statt Titel, damit die
// Bilder in allen sechs Sprachen an derselben Stelle stehen.
const ILLUSTRATIONS = [Receipt, DocumentReview, MailSent];

export default function HowItWorks() {
  const t = useTranslations("howItWorks");
  // Fehlt der Schlüssel in einer Sprache, liefert t.raw die Zeichenkette statt
  // der Liste; ohne diese Weiche bräche das Rendern mit „map is not a function“.
  const raw = t.raw("steps");
  const steps: Step[] = Array.isArray(raw) ? (raw as Step[]) : [];

  return (
    <section id="so-funktionierts" className="mt-16 scroll-mt-24">
      <h2 className="text-[26px] sm:text-[34px] font-extrabold leading-[1.12] tracking-[-0.02em] text-fg">
        {t("heading")}
      </h2>
      <p className="mt-3 text-base sm:text-[17px] leading-[1.55] text-muted max-w-[62ch]">
        {t("lead")}
      </p>

      {/* <ol> ohne Nummern: die Reihenfolge ist semantisch wichtig, optisch
          zählen die Bilder, nummerierte Kästen wirkten zuletzt schematisch. */}
      <ol className="mt-10 grid gap-10 list-none p-0 md:grid-cols-3">
        {steps.map((step, i) => {
          const Illustration = ILLUSTRATIONS[i];
          return (
            <li key={step.title} className="min-w-0">
              {/* Der Container setzt die Akzentfarbe; die Motive füllen ihre
                  Akzentflächen mit currentColor. */}
              <div className="flex h-[110px] md:h-[150px] items-end text-accent">
                {Illustration && <Illustration className="max-h-full w-auto" />}
              </div>
              <div className="mt-5 border-t-2 border-paper-line-strong pt-4">
                <h3 className="text-[18px] font-bold leading-snug text-fg">{step.title}</h3>
                <p className="mt-2 text-sm leading-[1.55] text-muted">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
