export default function AgbPage() {
  return (
    <main className="min-h-[100dvh] bg-ink text-muted">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <p className="text-xs text-[#FCD34D] mb-6">
          Entwurf/Roh-Vorlage – vor dem Live-Betrieb rechtlich prüfen lassen. Keine Rechtsberatung.
        </p>
        <h1 className="text-2xl font-black text-fg mb-6">
          Allgemeine Geschäftsbedingungen (AGB)
        </h1>

        <h2 className="text-lg font-bold text-fg mt-6 mb-2">1. Leistungsbeschreibung</h2>
        <p className="mb-3 leading-relaxed text-sm">
          Nebenkostencheck bietet eine automatisierte Prüfung von Nebenkostenabrechnungen sowie die
          Erstellung von Musterschreiben (Widerspruch, Aufforderung zur Belegeinsicht). Die Prüfung
          erfolgt anhand der einschlägigen gesetzlichen Grundlagen (u.&nbsp;a. BetrKV, HeizkV) und der
          höchstrichterlichen Rechtsprechung.
        </p>

        <h2 className="text-lg font-bold text-fg mt-6 mb-2">2. Keine Rechtsberatung</h2>
        <p className="mb-3 leading-relaxed text-sm">
          Der Dienst ist ein automatisiertes Werkzeug und stellt <strong className="text-fg">keine
          Rechtsberatung</strong> im Sinne des Rechtsdienstleistungsgesetzes (RDG) dar. Die Ergebnisse
          sind unverbindliche Einschätzungen ohne Gewähr und ersetzen keine anwaltliche Beratung.
        </p>

        <h2 className="text-lg font-bold text-fg mt-6 mb-2">3. Preis</h2>
        <p className="mb-3 leading-relaxed text-sm">
          Die Freischaltung des vollständigen Prüfberichts inklusive der Musterschreiben kostet einmalig
          9,90&nbsp;€. Gemäß § 19 UStG (Kleinunternehmerregelung) wird keine Umsatzsteuer ausgewiesen.
          Die erste Prüfung mit Vorschau ist kostenlos.
        </p>

        <h2 className="text-lg font-bold text-fg mt-6 mb-2">
          4. Widerrufsrecht und vorzeitiges Erlöschen
        </h2>
        <p className="mb-3 leading-relaxed text-sm">
          Verbrauchern steht grundsätzlich ein 14-tägiges Widerrufsrecht zu. Bei digitalen Inhalten und
          Dienstleistungen erlischt das Widerrufsrecht jedoch, wenn der Kunde der sofortigen Ausführung
          ausdrücklich zugestimmt und seine Kenntnis davon bestätigt hat, dass er durch die Zustimmung mit
          Beginn der Ausführung sein Widerrufsrecht verliert (§&nbsp;356 Abs.&nbsp;5 BGB). Diese Zustimmung
          wird vor der Zahlung ausdrücklich eingeholt.
        </p>

        <h2 className="text-lg font-bold text-fg mt-6 mb-2">5. Haftung</h2>
        <p className="mb-3 leading-relaxed text-sm">
          Wir übernehmen keine Gewähr für die inhaltliche Richtigkeit, Vollständigkeit und Aktualität der
          Prüfergebnisse und erstellten Schreiben. Angegebene Beträge sind Schätzungen und können von
          tatsächlich erzielbaren Erstattungen abweichen. Eine Haftung für Schäden, die aus der Verwendung
          der Ergebnisse entstehen, ist im gesetzlich zulässigen Rahmen ausgeschlossen.
        </p>

        <h2 className="text-lg font-bold text-fg mt-6 mb-2">6. Anbieter</h2>
        <p className="mb-3 leading-relaxed text-sm">
          Franz Petschull, Hintere Reichenstraße 12, 02625 Bautzen. Weitere Angaben im{" "}
          <a href="/impressum" className="text-accent-bright hover:text-accent-soft transition-colors">Impressum</a>.
        </p>

        <a href="/" className="inline-block mt-8 text-accent-bright hover:text-accent-soft text-sm transition-colors">← Zurück</a>
      </div>
    </main>
  );
}
