import { notFound } from "next/navigation";

// Faengt unbekannte Pfade INNERHALB einer gueltigen Sprache ab (z. B. /en/gibtsnicht),
// damit die lokalisierte [locale]/not-found.tsx greift statt der deutschen Root-404.
export default function CatchAllNotFound() {
  notFound();
}
