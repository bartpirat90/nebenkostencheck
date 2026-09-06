import Logo from "./Logo";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="border-t border-line mt-12 py-8">
      <div className="max-w-2xl mx-auto px-6 flex flex-col items-center gap-4 text-center">
        <Logo />
        <nav className="flex gap-1 -mx-2 text-sm text-muted">
          <Link href="/impressum" className="inline-flex items-center min-h-11 px-2 hover:text-fg transition-colors">{t("impressum")}</Link>
          <Link href="/datenschutz" className="inline-flex items-center min-h-11 px-2 hover:text-fg transition-colors">{t("datenschutz")}</Link>
          <Link href="/agb" className="inline-flex items-center min-h-11 px-2 hover:text-fg transition-colors">{t("agb")}</Link>
        </nav>
        <p className="text-xs text-muted leading-relaxed">
          {t("copyright")}<br />
          {t("note")}
        </p>
      </div>
    </footer>
  );
}
