export default function LandingHero() {
  return (
    <section className="text-center pt-16 pb-10">
      <div className="inline-block bg-[#1E1B4B] text-[#A78BFA] text-xs font-bold px-3 py-1.5 rounded-full mb-5 border border-[#3730A3]">
        🏆 Bereits 2.400+ Abrechnungen geprüft
      </div>
      <h1 className="text-4xl font-black leading-tight mb-4 tracking-tight text-[#F1F5F9]">
        Steckt Geld in deiner<br />
        <span className="bg-gradient-to-r from-[#818CF8] via-[#A78BFA] to-[#C084FC] bg-clip-text text-transparent">
          Nebenkostenabrechnung?
        </span>
      </h1>
      <p className="text-[#94A3B8] text-lg leading-relaxed mb-8 max-w-lg mx-auto">
        Lade deine Abrechnung hoch – unsere KI prüft sie in Sekunden auf typische
        Fehler und berechnet dein Erstattungspotenzial.
      </p>
      <a
        href="#upload"
        className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]
          text-white font-bold text-base px-7 py-3.5 rounded-xl hover:opacity-90 transition-opacity"
      >
        Abrechnung jetzt prüfen <span aria-hidden>→</span>
      </a>
      <div className="flex justify-center flex-wrap gap-5 mt-6">
        {["Datei wird nicht gespeichert", "DSGVO-konform", "Kein Account nötig"].map((item) => (
          <span key={item} className="flex items-center gap-1.5 text-sm text-[#64748B]">
            <span className="text-[#818CF8]">✓</span> {item}
          </span>
        ))}
      </div>
    </section>
  );
}