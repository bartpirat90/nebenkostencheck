import Logo from "./Logo";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="border-t border-line mt-12 py-8">
      <div className="max-w-2xl mx-auto px-6 flex flex-col items-center gap-4 text-center">
        <Logo />
        {/* gap-2 + px-1.5 = 20 px sichtbarer Abstand wie vorher; 8 px Luft zwischen den Touch-Zielen.
            min-w-11 greift nur bei kurzen Labels ("AGB" wäre sonst 40 px breit) – die 44 px
            gelten für beide Achsen, nicht nur für die Höhe. */}
        <nav className="flex gap-2 -mx-1.5 text-sm text-muted">
          <Link href="/impressum" className="inline-flex items-center justify-center min-h-11 min-w-11 px-1.5 hover:text-fg transition-colors">{t("impressum")}</Link>
          <Link href="/datenschutz" className="inline-flex items-center justify-center min-h-11 min-w-11 px-1.5 hover:text-fg transition-colors">{t("datenschutz")}</Link>
          <Link href="/agb" className="inline-flex items-center justify-center min-h-11 min-w-11 px-1.5 hover:text-fg transition-colors">{t("agb")}</Link>
        </nav>
        <p className="text-xs text-muted leading-relaxed">
          {t("copyright")}<br />
          {t("note")}
        </p>
      </div>
    </footer>
  );
}
