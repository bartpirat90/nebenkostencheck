import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-[#1E293B] mt-12 py-8">
      <div className="max-w-2xl mx-auto px-6 flex flex-col items-center gap-4 text-center">
        <Logo />
        <nav className="flex gap-5 text-sm text-[#64748B]">
          <a href="/impressum" className="hover:text-[#94A3B8]">Impressum</a>
          <a href="/datenschutz" className="hover:text-[#94A3B8]">Datenschutz</a>
          <a href="/agb" className="hover:text-[#94A3B8]">AGB</a>
        </nav>
        <p className="text-xs text-[#334155] leading-relaxed">
          © 2026 Nebenkostencheck · Automatische Löschung nach 24 Stunden · Keine Rechtsberatung
        </p>
      </div>
    </footer>
  );
}
