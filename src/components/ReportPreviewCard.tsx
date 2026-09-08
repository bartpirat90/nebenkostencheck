import { useTranslations } from "next-intl";

interface Item {
  title: string;
  reason: string;
  amount: string;
  confidence: "ok" | "warn";
}

/**
 * Statisches Musterbeispiel des Prüfberichts im Hero. Zeigt das verkaufte
 * Produkt, ohne es zu simulieren: die Karte ist komplett aria-hidden, der
 * „Button“ ist ein <span> ohne Interaktion, und die Kennzeichnung „Beispiel“
 * steht sichtbar oben und in der Fußzeile. Zahlen und Paragrafen sind erfunden
 * und in allen Sprachen identisch (nur der Fließtext wird übersetzt).
 */
export default function ReportPreviewCard() {
  const t = useTranslations("heroReport");
  // Solange eine Sprache den Namespace noch nicht hat, liefert t.raw statt der
  // Liste den Schlüssel als Zeichenkette zurück; ohne diese Weiche bräche das
  // Rendern der Seite mit „map is not a function“ ab.
  const raw = t.raw("items");
  const items: Item[] = Array.isArray(raw) ? (raw as Item[]) : [];

  return (
    <div
      aria-hidden="true"
      className="w-full max-w-[520px] rounded-[14px] border border-paper-line bg-doc shadow-card overflow-hidden"
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-paper-line">
        <div>
          <p className="text-lg font-extrabold tracking-tight text-fg">{t("title")}</p>
          <p className="text-[12.5px] text-faint mt-0.5">{t("meta")}</p>
        </div>
        <span className="shrink-0 rounded-full border border-paper-line-strong px-2.5 py-1 text-[12.5px] text-faint">
          {t("badge")}
        </span>
      </div>

      <ul className="divide-y divide-paper-line">
        {items.map((item) => (
          <li key={item.title} className="flex items-start gap-3 px-5 py-3.5">
            <span
              className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                item.confidence === "ok" ? "bg-status-okStrong" : "bg-status-warnStrong"
              }`}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-fg">{item.title}</span>
              <span className="block text-[12.5px] text-muted leading-snug mt-0.5">{item.reason}</span>
            </span>
            <span className="shrink-0 text-sm font-bold tabular-nums text-fg">{item.amount}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-baseline justify-between gap-3 px-5 py-4 border-t border-paper-line bg-paper">
        <span className="text-[12.5px] text-muted">{t("totalLabel")}</span>
        <span className="text-lg font-extrabold tabular-nums text-accent">{t("totalValue")}</span>
      </div>

      <div className="px-5 pb-5 pt-1 bg-paper">
        {/* Bewusst ein <span>: die Karte ist Dekoration, kein zweiter CTA. */}
        <span className="flex items-center justify-center min-h-11 rounded-xl bg-accent px-5 text-sm font-semibold text-white">
          {t("cta")}
        </span>
        <p className="mt-3 text-[12.5px] leading-snug text-faint">{t("footer")}</p>
      </div>
    </div>
  );
}
