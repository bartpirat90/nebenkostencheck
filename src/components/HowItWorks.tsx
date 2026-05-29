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
    <section className="mb-10">
      <p className="text-xs font-bold text-[#6366F1] tracking-widest uppercase mb-2">
        So funktioniert&apos;s
      </p>
      <h2 className="text-xl font-black text-[#F1F5F9] mb-5">
        In 3 Schritten zu deiner Erstattung
      </h2>
      <div className="flex flex-col gap-3">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="flex items-start gap-4 bg-[#1E293B] border border-[#334155] rounded-xl p-4"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-xs font-black text-white flex-shrink-0 mt-0.5">
              {i + 1}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F1F5F9] mb-1">{step.title}</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
