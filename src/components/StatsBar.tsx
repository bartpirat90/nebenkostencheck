const STATS = [
  { value: "Ø 187 €", label: "Erstattungspotenzial" },
  { value: "15 Sek.", label: "Analyse-Dauer" },
  { value: "100 %", label: "Kostenlos" },
];

export default function StatsBar() {
  return (
    <div className="flex rounded-2xl border border-[#334155] bg-[#1E293B] overflow-hidden mb-10">
      {STATS.map((stat, i) => (
        <div
          key={stat.label}
          className={`flex-1 text-center py-5 px-4 ${i > 0 ? "border-l border-[#334155]" : ""}`}
        >
          <div className="text-2xl font-black bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">
            {stat.value}
          </div>
          <div className="text-xs text-[#64748B] mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
