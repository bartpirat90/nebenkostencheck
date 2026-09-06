import { Geist } from "next/font/google";
import Logo from "@/components/Logo";
import Button from "@/components/ui/Button";
// globals.css wird hier erneut importiert, weil das Root-Layout kein CSS laedt –
// die Styles haengen am [locale]-Layout, das fuer diese 404 nie rendert.
import "./globals.css";

const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-geist" });

// Greift bei Pfaden ausserhalb von [locale] (z. B. /xx/foo mit unbekannter Sprache).
// Das Root-Layout rendert kein <html>, deshalb hier eigenes Grundgeruest –
// und ohne next-intl, weil es hier keine gueltige Locale gibt.
export default function RootNotFound() {
  return (
    <html lang="de" dir="ltr">
      <body className={`${geist.variable} ${geist.className}`}>
        <main className="min-h-[100dvh] bg-ink">
          <nav className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b border-line bg-ink/90 backdrop-blur-sm">
            {/* Bewusst ein rohes <a> statt next/link: diese 404 rendert ein eigenes
                <html> außerhalb des [locale]-Baums. Eine Soft-Navigation von hier in
                den Locale-Baum scheitert am RSC-Fetch (Konsolenfehler, dann ohnehin
                Fallback auf harte Navigation) – der harte Reload ist hier der
                Normalfall, wie beim Button unten (external). */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" aria-label="Zur Startseite" className="inline-flex items-center min-h-11">
              <Logo />
            </a>
          </nav>

          <div className="max-w-2xl mx-auto px-6 py-24 text-center space-y-6">
            <p className="text-sm font-semibold tracking-widest text-faint">404</p>
            <h1 className="text-3xl sm:text-4xl font-black text-fg tracking-tight">
              Seite nicht gefunden
            </h1>
            <p className="text-muted">Die Adresse existiert nicht oder wurde entfernt.</p>
            {/* external: diese 404 liegt außerhalb von [locale] und hat keinen
                Locale-Kontext – der next-intl-Link würde hier fehlschlagen. */}
            <Button href="/" external>
              Zur Startseite
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
