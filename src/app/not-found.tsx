import { Geist } from "next/font/google";
import Logo from "@/components/Logo";
import Button from "@/components/ui/Button";
// globals.css wird hier erneut importiert, weil das Root-Layout kein CSS lädt –
// die Styles hängen am [locale]-Layout, das für diese 404 nie rendert.
import "./globals.css";

const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-geist" });

// Greift bei Pfaden außerhalb von [locale] (z. B. /xx/foo mit unbekannter Sprache).
// Das Root-Layout rendert kein <html>, deshalb hier ein eigenes Grundgerüst.
//
// Bewusst NICHT die gemeinsame SiteShell: die zieht ihre Texte per
// useTranslations und rendert LocaleSwitcher und Footer-Links über den
// next-intl-Router. Hier gibt es weder einen NextIntlClientProvider noch eine
// gültige Locale – jeder dieser Aufrufe würde zur Laufzeit werfen. Deshalb
// eine schlanke Kopie des Rahmens mit fest deutschen Texten und rohen <a>.
// Ändert sich die Shell optisch, muss diese Datei mitgezogen werden.
export default function RootNotFound() {
  return (
    <html lang="de" dir="ltr">
      <body className={`${geist.variable} ${geist.className}`}>
        <div className="min-h-[100dvh] bg-ink flex flex-col">
          <nav
            data-on-ink
            aria-label="Hauptnavigation"
            className="sticky top-0 z-20 h-[68px] px-4 sm:px-6 border-b border-ink-line bg-ink/90 backdrop-blur-sm"
          >
            {/* Gleiche Achse wie Blatt und Fuß dieser Seite (max-w-3xl), damit das
                Logo auf breiten Bildschirmen nicht an der Fensterkante klebt. */}
            <div className="mx-auto flex h-full w-full max-w-3xl items-center">
              {/* Rohes <a> statt next/link: eine Soft-Navigation von hier in den
                  [locale]-Baum scheitert am RSC-Fetch (Konsolenfehler, danach
                  ohnehin harte Navigation) – der Reload ist hier der Normalfall. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/" aria-label="Zur Startseite" className="inline-flex items-center min-h-11">
                <Logo />
              </a>
            </div>
          </nav>

          <div className="flex-1 px-2 sm:px-6">
            <main className="mx-auto w-full max-w-3xl bg-paper text-fg shadow-sheet rounded-xl sm:rounded-b-none sm:rounded-t-[18px] px-5 py-10 sm:px-14 sm:py-14">
              <div className="py-16 text-center space-y-6">
                <p className="text-[12.5px] font-semibold text-faint">404</p>
                <h1 className="text-[26px] sm:text-[34px] font-extrabold leading-[1.12] tracking-[-0.02em] text-fg">
                  Seite nicht gefunden
                </h1>
                <p className="text-base text-muted">Die Adresse existiert nicht oder wurde entfernt.</p>
                {/* external: diese 404 liegt außerhalb von [locale] und hat keinen
                    Locale-Kontext – der next-intl-Link würde hier fehlschlagen. */}
                <Button href="/" external>
                  Zur Startseite
                </Button>
              </div>
            </main>
          </div>

          <footer data-on-ink className="bg-ink px-5 sm:px-6 py-10">
            <div className="max-w-3xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12.5px] text-ink-faint">
                Nebenkostencheck · Automatische Löschung · Keine Rechtsberatung
              </p>
              {/* Rohes <a> statt next-intl-Link: siehe Kommentar am Kopf der Datei. */}
              <nav aria-label="Rechtliches" className="flex text-sm">
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a
                  href="/impressum"
                  className="inline-flex items-center justify-center min-h-11 min-w-11 px-2 text-ink-faint hover:text-ink-fg transition-colors"
                >
                  Impressum
                </a>
              </nav>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
