import { useTranslations } from "next-intl";
import { reviews } from "@/lib/reviews";

interface ProofItem {
  value: string;
  text: string;
  source: string;
}

/**
 * Beleg-Zeile unter dem Hero: drei belegte Aussagen statt einer Metrik-Tabelle.
 * Bewusst ohne Kasten und ohne Rasterlinien – nur zwei Haarlinien oben und
 * unten, damit die Zeile als Beleg und nicht als Werbeblock liest.
 */
export default function ProofLine() {
  const t = useTranslations("proof");
  const tr = useTranslations("reviews");
  // Solange eine Sprache den Namespace noch nicht hat, liefert t.raw statt der
  // Liste den Schlüssel als Zeichenkette zurück; ohne diese Weiche bräche das
  // Rendern der Seite mit „map is not a function“ ab (siehe ReportPreviewCard).
  const raw = t.raw("items");
  const items: ProofItem[] = Array.isArray(raw) ? (raw as ProofItem[]) : [];

  return (
    <section className="border-y border-paper-line py-6">
      <div className="grid gap-[18px] md:grid-cols-[1.4fr_1fr_1fr] md:gap-10">
        {items.map((item) => (
          <div key={item.value} className="min-w-0">
            <p className="text-[26px] sm:text-[30px] font-extrabold leading-[1.1] tracking-[-0.02em] text-fg">
              {item.value}
            </p>
            <p className="mt-1 text-sm leading-[1.5] text-muted">{item.text}</p>
            <p className="mt-1 text-[12.5px] text-faint">{item.source}</p>
          </div>
        ))}
      </div>

      {/* Echte Kundenstimmen erscheinen erst, wenn welche eingetragen sind
          (src/lib/reviews.ts). Erfundene Testimonials wären nach § 5 UWG
          abmahnbar, deshalb bleibt der Block bis dahin leer. */}
      {reviews.length > 0 && (
        <ul className="mt-6 grid gap-5 border-t border-paper-line pt-6 md:grid-cols-3">
          {reviews.map((r, i) => (
            <li key={i} className="min-w-0">
              <blockquote className="m-0 text-sm leading-relaxed text-muted">{r.text}</blockquote>
              <p className="mt-2 text-[12.5px] text-faint">
                {r.name}
                {r.location ? ` · ${r.location}` : ""}
              </p>
              {r.savedEur != null && (
                <p className="mt-1 text-[12.5px] font-semibold tabular-nums text-accent">
                  {tr("saved", { amount: r.savedEur })}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
