const STEPS = [
  {
    title: "Abrechnung hochladen",
    description:
      "PDF oder Foto deiner Nebenkostenabrechnung – einfach ablegen oder auswählen.",
  },
  {
    title: "Automatische Prüfung in Sekunden",
    description:
      "Prüft auf HeizkV-Verstöße, falsche Umlagen, Fristfehler und mehr.",
  },
  {
    title: "Widerspruch mit einem Klick",
    description: "Fertiger Widerspruchsbrief als PDF zum Download.",
  },
];

export default function HowItWorks() {
  return (
    <section className="mb-12">
      <p className="text-sm font-semibold text-accent-soft mb-1">So funktioniert&apos;s</p>
      <h2 className="text-xl font-black text-fg mb-5">
        In 3 Schritten zu deiner Erstattung
      </h2>
      <div className="border border-line rounded-xl divide-y divide-line">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex items-start gap-4 px-4 py-4">
            <span className="text-sm font-medium tabular-nums text-accent-soft w-6 shrink-0 pt-0.5">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3 className="text-sm font-bold text-fg mb-1">{step.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
