import Logo from "./Logo";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  return (
    <footer className="border-t border-line mt-12 py-8">
      <div className="max-w-2xl mx-auto px-6 flex flex-col items-center gap-4 text-center">
        <Logo />
        <nav className="flex gap-5 text-sm text-muted">
          <Link href="/impressum" className="hover:text-fg transition-colors">{t("impressum")}</Link>
          <Link href="/datenschutz" className="hover:text-fg transition-colors">{t("datenschutz")}</Link>
          <Link href="/agb" className="hover:text-fg transition-colors">{t("agb")}</Link>
        </nav>
        <p className="text-xs text-muted leading-relaxed">
          {t("copyright")}<br />
          {t("note")}
        </p>
      </div>
    </footer>
  );
}
