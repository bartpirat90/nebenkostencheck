export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-[#0F172A] text-[#94A3B8]">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <p className="text-xs text-[#FCD34D] mb-6">
          ⚠️ Entwurf/Roh-Vorlage – vor dem Live-Betrieb rechtlich prüfen lassen. Keine Rechtsberatung.
        </p>
        <h1 className="text-2xl font-black text-[#F1F5F9] mb-6">Impressum</h1>

        <h2 className="text-lg font-bold text-[#F1F5F9] mt-6 mb-2">Angaben gemäß § 5 DDG</h2>
        <p className="mb-3 leading-relaxed text-sm">
          Franz Petschull<br />
          Hintere Reichenstraße 12<br />
          02625 Bautzen
        </p>

        <h2 className="text-lg font-bold text-[#F1F5F9] mt-6 mb-2">Kontakt</h2>
        <p className="mb-3 leading-relaxed text-sm">
          E-Mail: kontakt@nebenkostencheck24.de
        </p>

        <h2 className="text-lg font-bold text-[#F1F5F9] mt-6 mb-2">Umsatzsteuer</h2>
        <p className="mb-3 leading-relaxed text-sm">
          Als Kleinunternehmer im Sinne von § 19 UStG wird keine Umsatzsteuer ausgewiesen.
        </p>

        <h2 className="text-lg font-bold text-[#F1F5F9] mt-6 mb-2">
          Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
        </h2>
        <p className="mb-3 leading-relaxed text-sm">
          Franz Petschull<br />
          Hintere Reichenstraße 12, 02625 Bautzen
        </p>

        <a href="/" className="inline-block mt-8 text-[#818CF8] text-sm">← Zurück</a>
      </div>
    </main>
  );
}
