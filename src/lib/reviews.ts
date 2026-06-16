// Kundenstimmen für die linke Beleg-Spalte der Startseite.
//
// WICHTIG: Hier ausschließlich ECHTE, eingeholte Bewertungen eintragen.
// Erfundene Testimonials sind wettbewerbsrechtlich abmahnbar (§ 5 UWG) und
// untergraben das Vertrauensversprechen der Seite.
//
// Solange dieses Array leer ist, erscheint in der linken Spalte kein
// Bewertungs-Block – die belegten Fachquellen (Mieterbund etc.) bleiben
// allein sichtbar. Sobald echte Stimmen vorliegen, einfach hier ergänzen.
export interface Review {
  /** Kurze Erfahrung, 1–2 Sätze (die Spalte ist nur ~12rem breit). */
  text: string;
  /** Datenschutzfreundlich: Vorname + Initial, z. B. "Sandra K." */
  name: string;
  /** Optional, z. B. "Leipzig". */
  location?: string;
  /** Optional konkretes Ergebnis, z. B. 184 → "184 € zurückgeholt". */
  savedEur?: number;
}

export const reviews: Review[] = [];
