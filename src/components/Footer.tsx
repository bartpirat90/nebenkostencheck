import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

/**
 * Fuß der Seitenshell. Liegt bewusst auf Ink (nicht auf dem Papierblatt):
 * Rahmen und Fuß sind dasselbe Markenelement, das Blatt endet darüber.
 */
export default function Footer() {
  const t = useTranslations("footer");
  return (
    <footer data-on-ink className="bg-ink px-5 sm:px-6 py-10 sm:py-12">
      <div className="max-w-[1180px] mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <span className="font-black text-ink-fg tracking-tight text-lg">Nebenkostencheck</span>

        {/* -mx-2 gleicht das Innenpolster der Touch-Ziele optisch aus, damit die
            Linkreihe buendig mit der Wortmarke beginnt. */}
        <nav className="flex flex-wrap gap-1 -mx-2 text-sm">
          <Link href="/impressum" className="inline-flex items-center justify-center min-h-11 min-w-11 px-2 text-ink-faint hover:text-ink-fg transition-colors">{t("impressum")}</Link>
          <Link href="/datenschutz" className="inline-flex items-center justify-center min-h-11 min-w-11 px-2 text-ink-faint hover:text-ink-fg transition-colors">{t("datenschutz")}</Link>
          <Link href="/agb" className="inline-flex items-center justify-center min-h-11 min-w-11 px-2 text-ink-faint hover:text-ink-fg transition-colors">{t("agb")}</Link>
        </nav>

        <p className="text-[12.5px] leading-relaxed text-ink-faint">{t("note")}</p>
      </div>

      <p className="max-w-[1180px] mx-auto mt-6 text-[12.5px] text-ink-faint">{t("copyright")}</p>
    </footer>
  );
}
