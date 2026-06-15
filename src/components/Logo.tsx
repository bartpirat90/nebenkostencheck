export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Schild-Umriss; der Haken bricht oben rechts durch die Schulter heraus.
          Die Aussparung wird in der Ink-Hintergrundfarbe (#0C1016) ausgestanzt –
          das Logo sitzt auf der Website immer auf diesem Hintergrund (Nav/Footer). */}
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" stroke="#10B981" strokeWidth="1.7" strokeLinejoin="round" fill="none" />
        <path d="M18 3.7l3.4 1.3" stroke="#0C1016" strokeWidth="3.2" strokeLinecap="round" fill="none" />
        <path d="M7.8 11.5l3.4 3.4L21.5 2.8" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <span className="font-black text-fg tracking-tight text-lg">Nebenkostencheck</span>
    </div>
  );
}
