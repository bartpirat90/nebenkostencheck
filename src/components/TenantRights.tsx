import { useTranslations } from "next-intl";
import ApartmentRent from "@/components/illustrations/ApartmentRent";

interface RightItem {
  term: string;
  description: string;
}

/**
 * Abgesetzter Kasten auf paper.2: gibt der Seite vor den Fragen eine ruhige
 * Fläche und beantwortet die Frage „darf ich das überhaupt?“, bevor sie
 * gestellt wird.
 */
export default function TenantRights() {
  const t = useTranslations("rights");
  // Solange eine Sprache den Namespace noch nicht hat, liefert t.raw statt der
  // Liste den Schlüssel als Zeichenkette zurück; ohne diese Weiche bräche das
  // Rendern der Seite mit „map is not a function“ ab (siehe ReportFeatures).
  const raw = t.raw("items");
  const items: RightItem[] = Array.isArray(raw) ? (raw as RightItem[]) : [];

  return (
    <section className="mt-16 rounded-[18px] bg-paper-2 px-6 py-10 sm:px-12 sm:py-11">
      <div className="grid gap-8 items-center min-[900px]:grid-cols-[0.9fr_1.1fr] min-[900px]:gap-12">
        {/* Der Container setzt die Akzentfarbe für currentColor im Motiv. */}
        <div className="mx-auto w-full max-w-[360px] min-[900px]:max-w-none text-accent">
          <ApartmentRent className="w-full h-auto" />
        </div>

        <div className="min-w-0">
          <h3 className="text-[22px] sm:text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-fg">
            {t("heading")}
          </h3>
          <dl className="mt-6 space-y-5">
            {items.map((item) => (
              <div key={item.term}>
                <dt className="text-base font-bold text-fg">{item.term}</dt>
                <dd className="mt-1 ms-0 text-sm leading-[1.55] text-muted max-w-[62ch]">
                  {item.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
