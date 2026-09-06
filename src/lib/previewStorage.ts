import { PreviewData } from "@/types";

/**
 * Zwischenspeicher für die Analyse-Vorschau während des Stripe-Checkouts.
 * Bricht der Nutzer bei Stripe ab, holen wir die Vorschau aus der
 * sessionStorage zurück, statt eine zweite (kostenpflichtige) KI-Analyse
 * zu erzwingen. sessionStorage, nicht localStorage: gehört zum Tab und
 * verschwindet mit ihm – ein alter Teaser soll nicht Tage später auftauchen.
 */
export const PREVIEW_STORAGE_KEY = "nkc:preview";

/** Strukturprüfung für Daten aus der sessionStorage – die kann jeder manipulieren. */
export function isPreviewData(value: unknown): value is PreviewData {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<PreviewData>;
  return (
    typeof p.id === "string" &&
    typeof p.errorCount === "number" &&
    Array.isArray(p.errorTitles) &&
    p.errorTitles.every((t) => typeof t === "string") &&
    typeof p.hasDirect === "boolean" &&
    typeof p.hasReview === "boolean"
  );
}

/** Speichert die Vorschau; Fehler (Safari Private Mode, Quota) werden ignoriert. */
export function savePreview(preview: PreviewData): void {
  try {
    sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(preview));
  } catch {}
}

/** Liefert die gespeicherte Vorschau, wenn sie zur erwarteten Analyse-ID passt. */
export function loadPreview(id: string | null): PreviewData | null {
  if (!id) return null;
  try {
    const raw = sessionStorage.getItem(PREVIEW_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isPreviewData(parsed) && parsed.id === id ? parsed : null;
  } catch {
    return null;
  }
}

export function clearPreview(): void {
  try {
    sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
  } catch {}
}
