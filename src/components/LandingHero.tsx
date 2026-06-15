export default function LandingHero() {
  return (
    <section className="pb-10">
      <p className="text-xs font-semibold tracking-wide text-accent-bright mb-4">
        § geprüft nach BetrKV / HeizkV / BGH
      </p>
      <h1 className="text-2xl sm:text-4xl font-black leading-[1.15] mb-4 tracking-tight text-fg text-balance hyphens-auto break-words">
        Steckt Geld in deiner Nebenkostenabrechnung?
      </h1>
      <p className="text-muted text-lg leading-relaxed mb-7 max-w-lg">
        Lade deine Abrechnung hoch. Sie wird in Sekunden auf typische Fehler geprüft
        und dein Erstattungspotenzial berechnet.
      </p>
      <a
        href="#upload"
        className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover active:scale-[0.98]
          text-white font-bold text-base px-7 py-3.5 rounded-xl transition-colors"
      >
        Abrechnung prüfen <span aria-hidden>→</span>
      </a>
      <ul className="lg:hidden flex flex-wrap gap-x-5 gap-y-1.5 mt-6 text-sm text-muted">
        <li className="flex items-center gap-1.5"><span className="text-accent-soft">✓</span> DSGVO-konform</li>
        <li className="flex items-center gap-1.5"><span className="text-accent-soft">✓</span> Löschung nach 24 h</li>
        <li className="flex items-center gap-1.5"><span className="text-accent-soft">✓</span> Kein Account nötig</li>
      </ul>
    </section>
  );
}
