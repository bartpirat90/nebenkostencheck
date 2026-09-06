import { getTranslations } from "next-intl/server";
import Logo from "@/components/Logo";
import { Link } from "@/i18n/navigation";

// Zusaetzlich zur Root-404: greift fuer unbekannte Pfade *innerhalb* einer
// gueltigen Sprache (z. B. /en/gibtsnicht). Nur hier steht eine Locale fest,
// deshalb ist das die einzige 404, die uebersetzt und mit Layout/Navigation
// gerendert werden kann; src/app/not-found.tsx faengt den Rest ohne next-intl ab.
export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main className="min-h-[100dvh] bg-ink">
      <nav className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b border-line bg-ink/90 backdrop-blur-sm">
        <Link href="/" aria-label={t("home")}>
          <Logo />
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-24 text-center space-y-6">
        <p className="text-sm font-semibold tracking-widest text-faint">404</p>
        <h1 className="text-3xl sm:text-4xl font-black text-fg tracking-tight">{t("title")}</h1>
        <p className="text-muted">{t("body")}</p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold py-3 px-6 text-sm transition-colors"
        >
          {t("home")}
        </Link>
      </div>
    </main>
  );
}
