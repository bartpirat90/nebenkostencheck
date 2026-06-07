/** Reduzierte Teaser-Daten, die der Client vor der Zahlung erhält. */
export interface PreviewData {
  id: string;
  notAStatement?: boolean;
  errorCount: number;
  totalPotentialEur?: number | null;
  totalPotentialLabel?: string | null;
  errorTitles: string[];
  hasDirect: boolean;
  hasReview: boolean;
}
