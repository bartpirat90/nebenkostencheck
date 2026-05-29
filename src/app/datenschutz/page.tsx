export default function DatenschutzPage() {
  return (
    <main className="min-h-screen bg-[#0F172A] text-[#94A3B8]">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <p className="text-xs text-[#FCD34D] mb-6">
          ⚠️ Entwurf/Roh-Vorlage – vor dem Live-Betrieb rechtlich prüfen lassen. Keine Rechtsberatung.
        </p>
        <h1 className="text-2xl font-black text-[#F1F5F9] mb-6">Datenschutzerklärung</h1>

        <h2 className="text-lg font-bold text-[#F1F5F9] mt-6 mb-2">Verantwortlicher</h2>
        <p className="mb-3 leading-relaxed text-sm">
          Franz Petschull<br />
          Hintere Reichenstraße 12, 02625 Bautzen<br />
          E-Mail: [GESCHÄFTLICHE E-MAIL – NOCH EINZURICHTEN]
        </p>

        <h2 className="text-lg font-bold text-[#F1F5F9] mt-6 mb-2">Welche Daten wir verarbeiten</h2>
        <p className="mb-3 leading-relaxed text-sm">
          Wir verarbeiten die von Ihnen hochgeladene Nebenkostenabrechnung (als PDF oder Bilddatei) sowie
          die daraus extrahierten Angaben (z.&nbsp;B. Abrechnungspositionen, Beträge, Zeiträume). Bei Kauf
          des vollständigen Berichts werden zusätzlich die für die Zahlungsabwicklung erforderlichen
          Zahlungsdaten verarbeitet.
        </p>

        <h2 className="text-lg font-bold text-[#F1F5F9] mt-6 mb-2">
          Verarbeitung durch Anthropic (Claude)
        </h2>
        <p className="mb-3 leading-relaxed text-sm">
          Die von Ihnen hochgeladene Datei wird zur automatisierten Prüfung an Anthropic (Claude API)
          übermittelt. Der Serverstandort liegt u.&nbsp;a. in den USA; es handelt sich daher um eine
          Drittlandübermittlung nach Art.&nbsp;44&nbsp;ff. DSGVO. Anthropic verpflichtet sich gemäß seinen
          Nutzungsbedingungen, Daten nicht für das Training von Modellen zu verwenden (API-Nutzung).
          Weitere Informationen: <span className="text-[#818CF8]">https://www.anthropic.com/privacy</span>.
        </p>

        <h2 className="text-lg font-bold text-[#F1F5F9] mt-6 mb-2">Speicherung &amp; Löschung</h2>
        <p className="mb-3 leading-relaxed text-sm">
          Prüfergebnisse werden vorübergehend auf unseren Servern gespeichert und automatisch nach
          24&nbsp;Stunden gelöscht. Eine dauerhafte Speicherung Ihrer Abrechnung findet nicht statt.
        </p>

        <h2 className="text-lg font-bold text-[#F1F5F9] mt-6 mb-2">
          Zahlungsabwicklung (Stripe)
        </h2>
        <p className="mb-3 leading-relaxed text-sm">
          Zahlungen werden über den Zahlungsdienstleister Stripe, Inc. (185 Berry Street, Suite 550,
          San Francisco, CA 94107, USA) abgewickelt. Dabei werden die für die Transaktion erforderlichen
          Zahlungsdaten an Stripe übermittelt. Stripe ist nach dem EU-U.S. Data Privacy Framework
          zertifiziert. Weitere Informationen: <span className="text-[#818CF8]">https://stripe.com/de/privacy</span>.
        </p>

        <h2 className="text-lg font-bold text-[#F1F5F9] mt-6 mb-2">Rechtsgrundlage</h2>
        <p className="mb-3 leading-relaxed text-sm">
          Die Verarbeitung Ihrer Daten erfolgt auf Grundlage von Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;b DSGVO
          (Vertragserfüllung bzw. vorvertragliche Maßnahmen). Soweit Sie die Dateiverarbeitung durch
          Anthropic initiieren, gilt Ihre Einwilligung gemäß Art.&nbsp;6 Abs.&nbsp;1 lit.&nbsp;a DSGVO.
        </p>

        <h2 className="text-lg font-bold text-[#F1F5F9] mt-6 mb-2">Ihre Rechte</h2>
        <p className="mb-3 leading-relaxed text-sm">
          Sie haben das Recht auf Auskunft über die zu Ihrer Person gespeicherten Daten (Art.&nbsp;15 DSGVO),
          Berichtigung unrichtiger Daten (Art.&nbsp;16 DSGVO), Löschung (Art.&nbsp;17 DSGVO) sowie
          Widerspruch gegen die Verarbeitung (Art.&nbsp;21 DSGVO). Darüber hinaus steht Ihnen ein
          Beschwerderecht bei der zuständigen Datenschutz-Aufsichtsbehörde zu.
        </p>
        <p className="mb-3 leading-relaxed text-sm">
          Bei Fragen wenden Sie sich an: [GESCHÄFTLICHE E-MAIL – NOCH EINZURICHTEN]
        </p>

        <a href="/" className="inline-block mt-8 text-[#818CF8] text-sm">← Zurück</a>
      </div>
    </main>
  );
}
