import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SiteShell from "@/components/SiteShell";

type LegalKey = "impressum" | "datenschutz" | "agb";

// Generische Rechtstext-Seite: rendert Überschrift + Abschnitte aus dem
// "legal"-Namespace. Betreiber-Platzhalter, E-Mail und URLs stehen als Literale
// in den Body-Strings. Für Nicht-Deutsch erscheint der Unverbindlichkeits-Hinweis.
// Server Component (getTranslations statt useTranslations): "legal" wird
// bewusst nicht mehr an den Client-Provider gegeben (siehe [locale]/layout.tsx),
// deshalb muss diese Seite ihre Übersetzungen serverseitig auflösen. Die Shell
// ist eine Client-Komponente und bekommt das fertig gerenderte children.
export default async function LegalPage({ page }: { page: LegalKey }) {
  const t = await getTranslations("legal");
  const locale = await getLocale();
  // Fehlt der Abschnittsblock in einer Sprache, liefert t.raw den Schlüssel als
  // Zeichenkette statt der Liste; ohne diese Weiche bräche die Seite mit
  // „map is not a function“ ab (siehe Faq/HowItWorks).
  const raw = t.raw(`${page}.sections`);
  const sections: { heading: string; body: string }[] = Array.isArray(raw)
    ? (raw as { heading: string; body: string }[])
    : [];

  return (
    <SiteShell width="narrow">
      <p className="text-[12.5px] text-status-warn mb-6">{t("draftNotice")}</p>

      {locale !== "de" && (
        <p className="text-[12.5px] text-muted border border-paper-line rounded-lg p-3 mb-6 leading-relaxed">
          {t("disclaimerNonDe")}
        </p>
      )}

      <h1 className="text-[26px] sm:text-[34px] font-extrabold leading-[1.12] tracking-[-0.02em] text-fg mb-6">
        {t(`${page}.title`)}
      </h1>

      {sections.map((s, i) => (
        <section key={i} className="max-w-[62ch]">
          <h2 className="text-[22px] sm:text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-fg mt-8 mb-2">
            {s.heading}
          </h2>
          <p className="mb-3 text-base leading-[1.55] text-muted whitespace-pre-line break-words">{s.body}</p>
        </section>
      ))}

      <Link
        href="/"
        className="inline-flex items-center min-h-11 mt-8 text-sm text-accent underline hover:text-accent-hover transition-colors"
      >
        {t("back")}
      </Link>
    </SiteShell>
  );
}
