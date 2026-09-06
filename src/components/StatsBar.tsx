import { useTranslations } from "next-intl";

export default function StatsBar() {
  const t = useTranslations("stats");
  const items = t.raw("items") as { label: string; value: string; source?: string }[];
  // Welche Zeilen das Akzent-Grün bekommen (Position-basiert, sprachunabhängig).
  const accentRows = [0, 2];

  return (
    <div className="mb-12">
      <div className="border border-line rounded-xl divide-y divide-line">
        {items.map((stat, i) => (
          <div key={stat.label} className="flex items-center justify-between px-4 py-3.5">
            <span className="flex flex-col min-w-0 flex-1">
              <span className="text-sm text-muted">{stat.label}</span>
              {/* Quelle nur an der Mieterbund-Zahl, damit nicht alle Kennzahlen dem Mieterbund zugeschrieben wirken */}
              {stat.source && (
                <span className="text-[11px] text-faint mt-0.5">{stat.source}</span>
              )}
            </span>
            <span
              className={`text-base font-medium tabular-nums shrink-0 ps-3 ${
                accentRows.includes(i) ? "text-accent-soft" : "text-fg"
              }`}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
