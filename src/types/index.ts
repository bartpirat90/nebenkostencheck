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

export type LetterType = "objection" | "document_review";

export interface LetterRequest {
  type: LetterType;
  contact: ContactData;
  errors: ErrorItem[];
}

export interface LetterResponse {
  letter: string;
}
