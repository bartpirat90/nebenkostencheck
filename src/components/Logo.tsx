import {
  LOGO_VIEWBOX,
  LOGO_SHIELD_PATH,
  LOGO_CHECK_PATH,
  LOGO_GREEN_ON_DARK,
} from "@/lib/logo";

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Schild-Umriss mit echter Lücke oben rechts; der Haken bricht durch die
          Schulter heraus. Kein Knockout → das Logo funktioniert auf jedem
          Hintergrund (Website wie PDF, siehe src/lib/logo.ts). */}
      <svg width="28" height="28" viewBox={LOGO_VIEWBOX} fill="none" aria-hidden="true">
        <path
          d={LOGO_SHIELD_PATH}
          stroke={LOGO_GREEN_ON_DARK}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d={LOGO_CHECK_PATH}
          stroke={LOGO_GREEN_ON_DARK}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span className="font-black text-fg tracking-tight text-lg">Nebenkostencheck</span>
    </div>
  );
}
