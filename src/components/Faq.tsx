// Häufige Fragen – eine Quelle für die sichtbare Liste UND das FAQPage-JSON-LD,
// damit beides synchron bleibt. Inhalte bewusst akkurat zu Preis (9,90 €),
// Löschfrist (24 h), Rechtsstatus (keine Rechtsberatung, RDG) und § 556 BGB.
const FAQS: { q: string; a: string }[] = [
  {
    q: "Wie funktioniert die Prüfung?",
    a: "Du lädst deine Nebenkostenabrechnung als PDF oder Foto hoch. Sie wird automatisiert anhand der Betriebskostenverordnung (BetrKV), der Heizkostenverordnung (HeizkV) und höchstrichterlicher BGH-Rechtsprechung geprüft. Du erhältst eine Übersicht der Auffälligkeiten mit geschätztem Erstattungspotenzial – und auf Wunsch fertige Musterschreiben (Widerspruch oder Aufforderung zur Belegeinsicht).",
  },
  {
    q: "Was kostet der Nebenkostencheck?",
    a: "Die erste Prüfung mit Vorschau – Anzahl der Auffälligkeiten und geschätztes Potenzial – ist kostenlos. Der vollständige Bericht inklusive Begründung je Punkt und der fertigen Musterschreiben kostet einmalig 9,90 €. Kein Abo, keine versteckten Kosten.",
  },
  {
    q: "Welche Fehler werden gefunden?",
    a: "Typische Beispiele sind nicht umlagefähige Kosten wie Verwaltungs- oder Reparaturkosten (§ 1 BetrKV), eine fehlerhafte Verteilung der Heizkosten (§ 7 HeizkV), Leerstandskosten zulasten der Mieter, überschrittene Abrechnungsfristen oder nicht nachvollziehbare Positionen.",
  },
  {
    q: "Ist das eine Rechtsberatung?",
    a: "Nein. Der Nebenkostencheck ist ein automatisiertes Werkzeug und stellt keine Rechtsberatung im Sinne des Rechtsdienstleistungsgesetzes (RDG) dar. Die Ergebnisse sind unverbindliche Einschätzungen ohne Gewähr und ersetzen keine anwaltliche Beratung.",
  },
  {
    q: "Wie lange kann ich der Abrechnung widersprechen?",
    a: "Einwendungen gegen die Nebenkostenabrechnung kannst du bis zum Ablauf des zwölften Monats nach Zugang der Abrechnung geltend machen (§ 556 Abs. 3 BGB) – auch dann noch, wenn du die geforderte Nachzahlung bereits geleistet hast.",
  },
  {
    q: "Was passiert mit meiner hochgeladenen Abrechnung?",
    a: "Deine Abrechnung wird ausschließlich zur Prüfung verarbeitet und nach 24 Stunden automatisch gelöscht. Ein Nutzerkonto ist nicht nötig. Einzelheiten stehen in der Datenschutzerklärung.",
  },
  {
    q: "Welche Dateien kann ich hochladen?",
    a: "PDF-Dateien oder Fotos (z. B. JPG oder PNG) deiner Abrechnung bis 3 MB. Am besten lädst du nur die eigentliche Nebenkostenabrechnung hoch, nicht den gesamten Schriftverkehr.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function Faq() {
  return (
    <section className="mt-12" aria-labelledby="faq-heading">
      <p className="text-[11px] font-medium tracking-[0.12em] text-faint mb-1">HÄUFIGE FRAGEN</p>
      <h2 id="faq-heading" className="text-xl font-bold text-fg tracking-tight mb-4">
        Was du vor der Prüfung wissen solltest
      </h2>

      <div className="border-t border-line">
        {FAQS.map((f, i) => (
          <details key={i} className="group border-b border-line">
            <summary className="flex items-center justify-between gap-4 cursor-pointer list-none py-4 text-sm font-semibold text-fg [&::-webkit-details-marker]:hidden">
              <span>{f.q}</span>
              <svg
                className="w-4 h-4 shrink-0 text-faint transition-transform duration-200 group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p className="pb-4 -mt-1 text-sm text-muted leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </section>
  );
}
