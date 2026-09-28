import { AnalysisResult, Confidence, ContactData, ErrorCategory, ErrorItem } from "@/types";

/**
 * Härtet die KI-Antwort, bevor sie gespeichert wird. Claude liest den
 * hochgeladenen Text – ein präpariertes PDF könnte beliebige Felder/Typen
 * ins JSON schmuggeln. Alles, was der Client oder die PDF-Renderer nicht
 * vertragen, wird hier auf sichere Defaults gezogen oder verworfen.
 */
const CONFIDENCES: ReadonlySet<string> = new Set<Confidence>(["sicher", "wahrscheinlich", "unsicher"]);
const CATEGORIES: ReadonlySet<string> = new Set<ErrorCategory>(["direct", "needs_review"]);
const MAX_ERRORS = 30;
const MAX_TEXT = 2000;
const MAX_SHORT = 300;
const MAX_EUR = 100_000;

function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().slice(0, max);
  return s.length ? s : null;
}

function eur(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > MAX_EUR) return null;
  return Math.round(v * 100) / 100;
}

function contact(v: unknown): ContactData | undefined {
  if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
  const o = v as Record<string, unknown>;
  return {
    tenantName: str(o.tenantName, MAX_SHORT),
    tenantAddress: str(o.tenantAddress, MAX_SHORT),
    landlordName: str(o.landlordName, MAX_SHORT),
    landlordAddress: str(o.landlordAddress, MAX_SHORT),
    contractNumber: str(o.contractNumber, MAX_SHORT),
    billingPeriod: str(o.billingPeriod, MAX_SHORT),
  };
}

function errorItem(v: unknown): ErrorItem | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const title = str(o.title, MAX_SHORT);
  const description = str(o.description, MAX_TEXT);
  if (!title || !description) return null;
  return {
    title,
    description,
    confidence: CONFIDENCES.has(o.confidence as string) ? (o.confidence as Confidence) : "unsicher",
    category: CATEGORIES.has(o.category as string) ? (o.category as ErrorCategory) : "needs_review",
    potentialEur: eur(o.potentialEur),
    legalBasis: str(o.legalBasis, MAX_SHORT),
    actionText: str(o.actionText, MAX_TEXT),
    evidence: str(o.evidence, MAX_TEXT),
  };
}

/** Gibt ein bereinigtes Ergebnis zurück – oder null, wenn die Antwort unbrauchbar ist. */
export function normalizeAnalysis(raw: unknown): AnalysisResult | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const summary = str(r.summary, MAX_TEXT);
  if (!summary) return null;

  const rawErrors = Array.isArray(r.errors) ? r.errors.slice(0, MAX_ERRORS) : [];
  const errors = rawErrors.map(errorItem).filter((e): e is ErrorItem => e !== null);

  return {
    notAStatement: r.notAStatement === true,
    summary,
    errors,
    ...potentialTotals(errors),
    totalPotentialLabel: str(r.totalPotentialLabel, MAX_SHORT),
    contactData: contact(r.contactData),
  };
}

const cents = (n: number) => Math.round(n * 100) / 100;

/**
 * Summen aus den Einzelbeträgen statt aus der Modellantwort: Das Modell hat
 * sich früher verrechnet oder Beträge summiert, die es einzeln auf null
 * gesetzt hatte, und die Summe steht als Erstattungspotenzial in der
 * Vorschau. Ohne Befunde ist das Potenzial 0; gibt es Befunde, aber keinen
 * bezifferten, bleibt die Gesamtsumme null, damit die Vorschau das Label zeigt.
 */
function potentialTotals(errors: ErrorItem[]) {
  if (errors.length === 0) {
    return { totalPotentialEur: 0, directPotentialEur: 0, reviewPotentialEur: 0 };
  }
  const sum = (category: ErrorCategory) =>
    cents(
      errors
        .filter((e) => e.category === category && e.potentialEur != null)
        .reduce((acc, e) => acc + (e.potentialEur ?? 0), 0),
    );
  const hasAmount = errors.some((e) => e.potentialEur != null);
  const directPotentialEur = sum("direct");
  const reviewPotentialEur = sum("needs_review");
  return {
    totalPotentialEur: hasAmount ? cents(directPotentialEur + reviewPotentialEur) : null,
    directPotentialEur,
    reviewPotentialEur,
  };
}

/** Wird geworfen, wenn Claude kein brauchbares Ergebnis geliefert hat. */
export class InvalidAnalysisError extends Error {
  constructor() {
    super("Ungültige Analyse-Antwort");
    this.name = "InvalidAnalysisError";
  }
}
