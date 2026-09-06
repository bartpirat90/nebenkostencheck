import { Geist } from "next/font/google";
import Link from "next/link";
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
            {/* next/link (nicht next-intl's Link) – diese 404 hat keinen Locale-Kontext. */}
            <Link href="/" aria-label="Zur Startseite" className="inline-flex items-center min-h-11">
              <Logo />
            </Link>
          </nav>

          <div className="max-w-2xl mx-auto px-6 py-24 text-center space-y-6">
            <p className="text-sm font-semibold tracking-widest text-faint">404</p>
            <h1 className="text-3xl sm:text-4xl font-black text-fg tracking-tight">
              Seite nicht gefunden
            </h1>
            <p className="text-muted">Die Adresse existiert nicht oder wurde entfernt.</p>
            {/* external: diese 404 liegt ausserhalb von [locale] und hat keinen
                Locale-Kontext – der next-intl-Link wuerde hier fehlschlagen. */}
            <Button href="/" external>
              Zur Startseite
            </Button>
          </div>
        </main>
      </body>
    </html>
  );
}
