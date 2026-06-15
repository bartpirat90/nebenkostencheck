export default function ImpressumPage() {
  return (
    <main className="min-h-[100dvh] bg-ink text-muted">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <p className="text-xs text-[#FCD34D] mb-6">
          Entwurf/Roh-Vorlage – vor dem Live-Betrieb rechtlich prüfen lassen. Keine Rechtsberatung.
        </p>
        <h1 className="text-2xl font-black text-fg mb-6">Impressum</h1>

        <h2 className="text-lg font-bold text-fg mt-6 mb-2">Angaben gemäß § 5 DDG</h2>
        <p className="mb-3 leading-relaxed text-sm">
          [Name des Betreibers]<br />
          [Straße & Hausnummer]<br />
          [PLZ Ort]
        </p>

        <h2 className="text-lg font-bold text-fg mt-6 mb-2">Kontakt</h2>
        <p className="mb-3 leading-relaxed text-sm">
          E-Mail: kontakt@nebenkostencheck24.de
        </p>

        <h2 className="text-lg font-bold text-fg mt-6 mb-2">Umsatzsteuer</h2>
        <p className="mb-3 leading-relaxed text-sm">
          Als Kleinunternehmer im Sinne von § 19 UStG wird keine Umsatzsteuer ausgewiesen.
        </p>

        <h2 className="text-lg font-bold text-fg mt-6 mb-2">
          Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
        </h2>
        <p className="mb-3 leading-relaxed text-sm">
          [Name des Betreibers]<br />
          [Straße & Hausnummer], [PLZ Ort]
        </p>

        <a href="/" className="inline-block mt-8 text-accent-bright hover:text-accent-soft text-sm transition-colors">← Zurück</a>
      </div>
    </main>
  );
}
