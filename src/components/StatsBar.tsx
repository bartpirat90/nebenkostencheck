const STATS = [
  { label: "Abrechnungen mit Fehlern", value: "~50 %", accent: true },
  { label: "Analyse-Dauer", value: "15 Sek.", accent: false },
  { label: "Erst-Prüfung", value: "0 €", accent: true },
];

export default function StatsBar() {
  return (
    <div className="mb-12">
      <div className="border border-line rounded-xl divide-y divide-line">
        {STATS.map((stat) => (
          <div key={stat.label} className="flex items-center justify-between px-4 py-3.5">
            <span className="text-sm text-muted">{stat.label}</span>
            <span
              className={`text-base font-medium tabular-nums ${
                stat.accent ? "text-accent-soft" : "text-fg"
              }`}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-faint mt-2">Quelle: Deutscher Mieterbund</p>
    </div>
  );
}
