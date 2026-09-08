import { notFound } from "next/navigation";

// Hebt das dynamicParams=false des [locale]-Layouts wieder auf: für diesen
// Catch-all gibt es naturgemäß keine generateStaticParams, er soll aber jeden
// Pfad annehmen, um die lokalisierte 404 zu rendern.
export const dynamicParams = true;

// Fängt unbekannte Pfade INNERHALB einer gültigen Sprache ab (z. B. /en/gibtsnicht),
// damit die lokalisierte [locale]/not-found.tsx greift statt der deutschen Root-404.
export default function CatchAllNotFound() {
  notFound();
}
