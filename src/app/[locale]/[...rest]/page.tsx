import { notFound } from "next/navigation";

// Fängt unbekannte Pfade INNERHALB einer gültigen Sprache ab (z. B. /en/gibtsnicht),
// damit die lokalisierte [locale]/not-found.tsx greift statt der deutschen Root-404.
export default function CatchAllNotFound() {
  notFound();
}
