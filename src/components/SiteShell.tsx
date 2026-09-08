"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Logo from "@/components/Logo";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import Footer from "@/components/Footer";

interface Props {
  children: ReactNode;
  /** Sprungmarken erscheinen nur dort, wo die Zielsektionen existieren (Startseite). */
  withNavLinks?: boolean;
  /** Blattbreite: „wide“ für die Landingpage, „narrow“ für Lesespalten. */
  width?: "wide" | "narrow";
}

/**
 * Seitenshell „Papier auf Ink“: dunkler Rahmen mit Navigation und Fuß, dazwischen
 * der Inhalt als helles Blatt. Client-Komponente, weil LocaleSwitcher Hooks
 * nutzt und Nav/Footer ihre Texte per useTranslations ziehen – Server-Seiten
 * (LegalPage, Locale-404) reichen ihr fertig gerendertes children hinein.
 */
export default function SiteShell({ children, withNavLinks = false, width = "wide" }: Props) {
  const t = useTranslations("nav");

  const navLink =
    "inline-flex items-center min-h-11 px-1 text-ink-muted hover:text-ink-fg transition-colors";

  return (
    <div className="min-h-[100dvh] bg-ink flex flex-col">
      <nav
        data-on-ink
        aria-label={t("label")}
        className="sticky top-0 z-20 h-[68px] px-4 sm:px-6 flex items-center justify-between gap-3 border-b border-ink-line bg-ink/90 backdrop-blur-sm"
      >
        <Link href="/" aria-label={t("home")} className="inline-flex items-center min-h-11">
          <Logo />
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          {withNavLinks && (
            /* Echte Anker, keine Router-Links: die Ziele liegen auf derselben Seite. */
            <div className="hidden md:flex items-center gap-4 text-sm">
              <a href="#so-funktionierts" className={navLink}>{t("links.how")}</a>
              <a href="#bericht" className={navLink}>{t("links.report")}</a>
              <a href="#fragen" className={navLink}>{t("links.faq")}</a>
            </div>
          )}
          <span className="hidden sm:inline-flex items-center rounded-full border border-ink-line bg-ink-2 px-3 py-1.5 text-[12.5px] text-ink-muted">
            {t("pill")}
          </span>
          <LocaleSwitcher />
        </div>
      </nav>

      {/* px-2 auf Mobil: 8 px Seitenrand, damit der Ink-Rahmen sichtbar bleibt. */}
      <div className="flex-1 px-2 sm:px-6">
        <main
          className={`mx-auto w-full bg-paper text-fg shadow-sheet rounded-xl sm:rounded-b-none sm:rounded-t-[18px] px-5 py-10 sm:px-14 sm:py-14 ${
            width === "wide" ? "max-w-[1180px]" : "max-w-3xl"
          }`}
        >
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
}
