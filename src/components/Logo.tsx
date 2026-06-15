export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" stroke="#10B981" strokeWidth="1.75" strokeLinejoin="round" fill="none" />
        <path d="M8.5 12l2.5 2.5 4.5-4.5" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <span className="font-black text-fg tracking-tight text-lg">Nebenkostencheck</span>
    </div>
  );
}
