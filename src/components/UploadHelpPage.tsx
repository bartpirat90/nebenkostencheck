import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import SiteShell from "@/components/SiteShell";

// Hilfeseite für abgelehnte Uploads: erklärt, welche Seiten einer Abrechnung
// die Prüfung braucht und welche Beiblätter weg können. Verlinkt aus der
// Fehlerbox der Upload-Fläche und aus dem Hinweis „kein passendes Dokument“.
// Server Component wie LegalPage – die Shell ist die Client-Komponente und
// bekommt fertig gerendertes children.

type ListKey = "needed" | "skip" | "smaller";

/** Marker je Liste: Haken für Gebrauchtes, Strich für Verzichtbares, Punkt für die Tipps. */
function Marker({ kind }: { kind: ListKey }) {
  if (kind === "needed") {
    return (
      <svg className="w-4 h-4 mt-[3px] shrink-0 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (kind === "skip") {
    return (
      <svg className="w-4 h-4 mt-[3px] shrink-0 text-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeWidth={2.2} d="M6 12h12" />
      </svg>
    );
  }
  return <span className="mt-[9px] w-1.5 h-1.5 shrink-0 rounded-full bg-paper-line-control" aria-hidden="true" />;
}

export default async function UploadHelpPage() {
  const t = await getTranslations("uploadHelp");

  // Fehlt die Liste in einer Sprache, liefert t.raw den Schlüssel als Zeichenkette
  // statt der Liste; ohne diese Weiche bräche die Seite mit „map is not a function“ ab.
  const items = (key: ListKey): string[] => {
    const raw = t.raw(`${key}.items`);
    return Array.isArray(raw) ? (raw as string[]) : [];
  };

  return (
    <SiteShell width="narrow">
      <h1 className="text-[26px] sm:text-[34px] font-extrabold leading-[1.12] tracking-[-0.02em] text-fg">
        {t("title")}
      </h1>

      <p className="mt-5 max-w-[62ch] text-base leading-[1.55] text-muted">{t("intro")}</p>

      {/* Die eigentliche Frage an den Nutzer – der Rest der Seite beantwortet sie. */}
      <p className="mt-5 max-w-[62ch] text-lg font-semibold leading-[1.4] text-fg">
        {t("question")}
      </p>

      {(["needed", "skip", "smaller"] as const).map((key) => (
        <section key={key} className="mt-10 max-w-[62ch]">
          <h2 className="text-[20px] sm:text-[24px] font-extrabold leading-[1.2] tracking-[-0.02em] text-fg">
            {t(`${key}.heading`)}
          </h2>
          <ul className="mt-4 space-y-3 border-t border-paper-line pt-4">
            {items(key).map((item, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-[1.55] text-muted">
                <Marker kind={key} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="mt-10 max-w-[62ch] border border-paper-line rounded-xl p-4 text-sm leading-[1.55] text-muted">
        {t("note")}
      </p>

      <Link
        href="/#upload"
        className="inline-flex items-center min-h-11 mt-8 text-sm text-accent underline hover:text-accent-hover transition-colors"
      >
        {t("back")}
      </Link>
    </SiteShell>
  );
}
