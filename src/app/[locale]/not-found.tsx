import { getTranslations } from "next-intl/server";
import Button from "@/components/ui/Button";
import SiteShell from "@/components/SiteShell";

// Zusätzlich zur Root-404: greift für unbekannte Pfade *innerhalb* einer
// gültigen Sprache (z. B. /en/gibtsnicht). Nur hier steht eine Locale fest,
// deshalb ist das die einzige 404, die übersetzt und mit der vollen Shell
// gerendert werden kann; src/app/not-found.tsx fängt den Rest ohne next-intl ab.
export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <SiteShell width="narrow">
      <div className="py-16 text-center space-y-6">
        <p className="text-[12.5px] font-semibold text-faint">404</p>
        <h1 className="text-[26px] sm:text-[34px] font-extrabold leading-[1.12] tracking-[-0.02em] text-fg">
          {t("title")}
        </h1>
        <p className="text-base text-muted">{t("body")}</p>
        <Button href="/">{t("home")}</Button>
      </div>
    </SiteShell>
  );
}
