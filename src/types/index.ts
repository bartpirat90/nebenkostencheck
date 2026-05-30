export type ErrorCategory = "direct" | "needs_review";
export type Confidence = "sicher" | "wahrscheinlich" | "unsicher";

export interface ErrorItem {
  title: string;
  description: string;
  confidence: Confidence;
  category: ErrorCategory;
  potentialEur?: number | null;
  legalBasis?: string | null;
  actionText?: string | null;
  evidence?: string | null;
}

export interface ContactData {
  tenantName?: string | null;
  tenantAddress?: string | null;
  landlordName?: string | null;
  landlordAddress?: string | null;
  contractNumber?: string | null;
  billingPeriod?: string | null;
}

export interface AnalysisResult {
  notAStatement?: boolean;
  summary: string;
  errors: ErrorItem[];
  totalPotentialEur?: number | null;
  totalPotentialLabel?: string | null;
  directPotentialEur?: number | null;
  reviewPotentialEur?: number | null;
  contactData?: ContactData;
}

export type LetterType = "objection" | "document_review" | "combined";

export interface LetterRequest {
  type: LetterType;
  contact: ContactData;
  errors: ErrorItem[];
}

export interface LetterResponse {
  letter: string;
}

/** Antwort der generate-letter-Route: Brieftext + PDF (Base64) + Dateiname. */
export interface LetterPdfResponse {
  letter: string;
  pdfBase64: string;
  filename: string;
}

/** Reduzierte Daten, die der Browser vor der Zahlung sieht. */
export interface PreviewData {
  id: string;
  notAStatement?: boolean;
  errorCount: number;
  totalPotentialEur?: number | null;
  totalPotentialLabel?: string | null;
  errorTitles: string[];
  hasDirect: boolean; // mind. ein "direct"-Fehler → Widerspruchsbrief verfügbar
  hasReview: boolean; // mind. ein "needs_review"-Fehler → Belegeinsicht verfügbar
}

/** Was in Vercel KV unter der Analyse-ID liegt. */
export interface StoredAnalysis {
  full: AnalysisResult;
  paid: boolean;
  createdAt: string;
  customerEmail?: string;
}
