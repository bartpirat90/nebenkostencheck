import Logo from "./Logo";
import { Link } from "@/i18n/navigation";

export default function Footer() {
  return (
    <footer className="border-t border-line mt-12 py-8">
      <div className="max-w-2xl mx-auto px-6 flex flex-col items-center gap-4 text-center">
        <Logo />
        <nav className="flex gap-5 text-sm text-muted">
          <Link href="/impressum" className="hover:text-fg transition-colors">Impressum</Link>
          <Link href="/datenschutz" className="hover:text-fg transition-colors">Datenschutz</Link>
          <Link href="/agb" className="hover:text-fg transition-colors">AGB</Link>
        </nav>
        <p className="text-xs text-muted leading-relaxed">
          © 2026 Nebenkostencheck<br />
          Automatische Löschung nach 24 Stunden · Keine Rechtsberatung
        </p>
      </div>
    </footer>
  );
}
