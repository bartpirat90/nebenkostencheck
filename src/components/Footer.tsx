import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-line mt-12 py-8">
      <div className="max-w-2xl mx-auto px-6 flex flex-col items-center gap-4 text-center">
        <Logo />
        <nav className="flex gap-5 text-sm text-muted">
          <a href="/impressum" className="hover:text-fg transition-colors">Impressum</a>
          <a href="/datenschutz" className="hover:text-fg transition-colors">Datenschutz</a>
          <a href="/agb" className="hover:text-fg transition-colors">AGB</a>
        </nav>
        <p className="text-xs text-muted leading-relaxed">
          © 2026 Nebenkostencheck<br />
          Automatische Löschung nach 24 Stunden · Keine Rechtsberatung
        </p>
      </div>
    </footer>
  );
}
