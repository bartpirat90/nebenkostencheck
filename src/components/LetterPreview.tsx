import { useTranslations } from "next-intl";

/**
 * Statischer Musterbrief neben der Feature-Liste. Wie die Berichtskarte rein
 * dekorativ (aria-hidden) und sichtbar als „Muster“ gekennzeichnet: Name,
 * Anschrift, Beträge und Fristen sind frei erfunden. Die leichte Drehung nimmt
 * dem Blatt die Katalog-Anmutung, ohne dass es kippt.
 */
export default function LetterPreview() {
  const t = useTranslations("letterPreview");
  // Solange eine Sprache den Namespace noch nicht hat, liefert t.raw statt der
  // Liste den Schlüssel als Zeichenkette zurück; ohne diese Weiche bräche das
  // Rendern der Seite mit „map is not a function“ ab (siehe ReportPreviewCard).
  const raw = t.raw("paragraphs");
  const paragraphs: string[] = Array.isArray(raw) ? (raw as string[]) : [];

  return (
    <div
      aria-hidden="true"
      className="w-full max-w-[480px] -rotate-1 rounded-sm border border-paper-line bg-doc px-[34px] py-[38px] text-[12.5px] leading-[1.6] text-fg shadow-[0_12px_30px_rgba(27,31,36,0.08)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{t("senderName")}</p>
          <p className="text-faint">{t("senderAddress")}</p>
        </div>
        <span className="shrink-0 text-faint">{t("badge")}</span>
      </div>

      <div className="mt-7 whitespace-pre-line">
        <p className="font-semibold">{t("recipientName")}</p>
        <p>{t("recipientAddress")}</p>
      </div>

      <p className="mt-6 text-faint">{t("date")}</p>

      <p className="mt-6 font-semibold">{t("subject")}</p>

      <div className="mt-4 space-y-3 text-muted">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <p className="mt-6 text-muted">{t("closing")}</p>
      {/* Kursive Systemschrift als Unterschrift-Andeutung: keine Schriftdatei
          nachladen, nur für ein Muster. */}
      <p className="mt-4 text-base italic" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
        {t("signature")}
      </p>
    </div>
  );
}
