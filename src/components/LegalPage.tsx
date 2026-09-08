import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

type LegalKey = "impressum" | "datenschutz" | "agb";

// Generische Rechtstext-Seite: rendert Überschrift + Abschnitte aus dem
// "legal"-Namespace. Betreiber-Platzhalter, E-Mail und URLs stehen als Literale
// in den Body-Strings. Für Nicht-Deutsch erscheint der Unverbindlichkeits-Hinweis.
// Server Component (getTranslations statt useTranslations): "legal" wird
// bewusst nicht mehr an den Client-Provider gegeben (siehe [locale]/layout.tsx),
// deshalb muss diese Seite ihre Übersetzungen serverseitig auflösen.
export default async function LegalPage({ page }: { page: LegalKey }) {
  const t = await getTranslations("legal");
  const locale = await getLocale();
  const sections = t.raw(`${page}.sections`) as { heading: string; body: string }[];

  return (
    <main className="min-h-[100dvh] bg-ink text-muted">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <p className="text-xs text-status-warn mb-6">{t("draftNotice")}</p>

        {locale !== "de" && (
          <p className="text-xs text-muted border border-line rounded-lg p-3 mb-6 leading-relaxed">
            {t("disclaimerNonDe")}
          </p>
        )}

        <h1 className="text-2xl font-black text-fg mb-6">{t(`${page}.title`)}</h1>

        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-lg font-bold text-fg mt-6 mb-2">{s.heading}</h2>
            <p className="mb-3 leading-relaxed text-sm whitespace-pre-line break-words">{s.body}</p>
          </section>
        ))}

        <Link
          href="/"
          className="inline-flex items-center min-h-11 mt-8 text-accent underline hover:text-accent-hover text-sm transition-colors"
        >
          {t("back")}
        </Link>
      </div>
    </main>
  );
}
