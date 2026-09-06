"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnalysisResult, ErrorItem, LetterType, Confidence } from "@/types";
import LetterModal from "./LetterModal";

interface Props {
  result: AnalysisResult;
  id: string;
  onReset: () => void;
}

// Nur die Farben der Konfidenz-Ampel (grün/gelb/rot). Label + Beschreibung
// kommen übersetzt aus messages (Namespace "report.confidence").
const CONFIDENCE_COLORS: Record<Confidence, { bg: string; border: string; text: string; dot: string }> = {
  sicher: { bg: "bg-[#0F2B1F]", border: "border-[#166534]", text: "text-[#4ADE80]", dot: "bg-[#22C55E]" },
  wahrscheinlich: { bg: "bg-[#1C1A0E]", border: "border-[#92400E]", text: "text-[#FCD34D]", dot: "bg-[#F59E0B]" },
  // Neutral statt Rot: "unsicher" ist keine Fehlermeldung, sondern eine offene
  // Pruefkategorie. Rot bleibt echten Fehlerzustaenden (API-/Sendefehler) vorbehalten.
  unsicher: { bg: "bg-[#161B23]", border: "border-[#3A4556]", text: "text-[#B8C2CF]", dot: "bg-[#8A96A6]" },
};

export default function ResultView({ result, id, onReset }: Props) {
  const t = useTranslations("report");
  const [letterModal, setLetterModal] = useState<LetterType | null>(null);

  const directErrors = result.errors.filter((e) => e.category === "direct");
  const reviewErrors = result.errors.filter((e) => e.category === "needs_review");

  const directTotal = result.directPotentialEur ?? sumPotential(directErrors);
  const reviewTotal = result.reviewPotentialEur ?? sumPotential(reviewErrors);
  const total = result.totalPotentialEur ?? (directTotal + reviewTotal);

  const hasErrors = result.errors.length > 0;

  return (
    <>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-10">
        <div className="space-y-6 min-w-0">
          {/* Bericht-Kopf */}
          <div className="bg-surface rounded-2xl p-6 border border-line">
            <p className="text-sm text-muted mb-1">{t("potentialLabel")}</p>
            <p className="text-4xl font-bold tracking-tight mb-4 text-accent-soft tabular-nums">
              {hasErrors ? formatEur(total) : "0 €"}
            </p>

            {hasErrors && (
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-line">
                <div>
                  <p className="text-xs text-muted">{t("directLabel")}</p>
                  <p className="text-lg font-bold text-[#4ADE80] tabular-nums">{formatEur(directTotal)}</p>
                  <p className="text-xs text-faint tabular-nums">{t("points", { count: directErrors.length })}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">{t("reviewLabel")}</p>
                  <p className="text-lg font-bold text-[#FCD34D] tabular-nums">{formatEur(reviewTotal)}</p>
                  <p className="text-xs text-faint tabular-nums">{t("points", { count: reviewErrors.length })}</p>
                </div>
              </div>
            )}

            {result.summary && (
              <p className="mt-4 text-sm text-muted leading-relaxed border-t border-line pt-4">
                {result.summary}
              </p>
            )}
          </div>

          {/* Report PDF download */}
          <button
            onClick={() => window.open(`/api/generate-report?id=${id}`, "_blank")}
            className="w-full rounded-xl border border-line text-muted font-semibold py-3.5 text-sm
              hover:border-accent hover:text-accent-bright transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t("downloadPdf")}
          </button>

          {/* Direct errors section */}
          {directErrors.length > 0 && (
            <section className="space-y-3">
              <SectionHeader badge="A" title={t("sectionAtitle")} subtitle={t("sectionAsubtitle")} />
              {directErrors.map((err) => (
                <ErrorCard key={`direct-${err.title}`} error={err} />
              ))}
              <button
                onClick={() => setLetterModal("objection")}
                className="w-full rounded-xl bg-accent hover:bg-accent-hover active:scale-[0.98] text-white font-semibold py-3.5 text-sm
                  transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t("createObjection")}
              </button>
            </section>
          )}

          {/* Review errors section */}
          {reviewErrors.length > 0 && (
            <section className="space-y-3">
              <SectionHeader badge="B" title={t("sectionBtitle")} subtitle={t("sectionBsubtitle")} />
              {reviewErrors.map((err) => (
                <ErrorCard key={`review-${err.title}`} error={err} />
              ))}
              <button
                onClick={() => setLetterModal("document_review")}
                className="w-full rounded-xl bg-accent hover:bg-accent-hover active:scale-[0.98] text-white font-semibold py-3.5 text-sm
                  transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t("requestReview")}
              </button>
            </section>
          )}

          {/* Combined letter */}
          {directErrors.length > 0 && reviewErrors.length > 0 && (
            <section className="space-y-2 bg-surface border border-line rounded-2xl p-4">
              <p className="text-sm text-muted">{t("combinedText")}</p>
              <button
                onClick={() => setLetterModal("combined")}
                className="w-full rounded-xl border border-accent-border text-accent-bright font-semibold py-3.5 text-sm
                  hover:bg-accent-bg/40 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z M9 13h6m-6 4h6" />
                </svg>
                {t("createCombined")}
              </button>
            </section>
          )}

          {/* No errors state */}
          {!hasErrors && (
            <div className="bg-[#0F2B1F] border border-[#166534] rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-[#14532D] rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-[#4ADE80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-semibold text-[#4ADE80]">{t("noErrorsTitle")}</p>
              <p className="text-sm text-[#86EFAC] mt-1">{t("noErrorsBody")}</p>
            </div>
          )}

          {/* Farblegende – mobil im Fluss (Desktop: in der Randleiste) */}
          {hasErrors && (
            <div className="lg:hidden bg-surface border border-line rounded-xl p-4">
              <ConfidenceLegend />
            </div>
          )}

          {/* Legal disclaimer */}
          <div className="bg-surface border border-line rounded-xl p-4 text-xs text-faint leading-relaxed">
            <strong className="text-muted">{t("disclaimerLabel")}</strong> {t("disclaimer")}
          </div>

          {/* Reset CTA */}
          <button
            onClick={onReset}
            className="w-full rounded-xl border border-line text-muted font-semibold py-3.5 text-sm
              hover:border-accent hover:text-accent-bright transition-colors"
          >
            {t("reset")}
          </button>
        </div>

        {/* Farblegende – Desktop-Randleiste, klebend */}
        {hasErrors && (
          <aside className="hidden lg:block">
            <div className="sticky top-24 border-s border-line ps-6">
              <ConfidenceLegend />
            </div>
          </aside>
        )}
      </div>

      {/* Letter Modal */}
      {letterModal && (
        <LetterModal
          open={true}
          onClose={() => setLetterModal(null)}
          type={letterModal}
          initialContact={result.contactData || {}}
          errors={
            letterModal === "objection"
              ? directErrors
              : letterModal === "document_review"
              ? reviewErrors
              : result.errors
          }
          id={id}
          customerEmail={(result as AnalysisResult & { _customerEmail?: string })._customerEmail ?? undefined}
        />
      )}
    </>
  );
}

function ConfidenceLegend() {
  const t = useTranslations("report");
  const order: Confidence[] = ["sicher", "wahrscheinlich", "unsicher"];
  return (
    <div>
      <p className="text-[11px] font-medium tracking-[0.12em] text-faint mb-4">{t("legendTitle")}</p>
      <ul className="space-y-4">
        {order.map((key) => {
          const c = CONFIDENCE_COLORS[key];
          return (
            <li key={key}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.dot}`} />
                <span className={`text-sm font-semibold ${c.text}`}>{t(`confidence.${key}.label`)}</span>
              </div>
              <p className="text-xs text-muted leading-snug ps-[18px]">{t(`confidence.${key}.desc`)}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SectionHeader({ badge, title, subtitle }: {
  badge: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 w-8 h-8 rounded-lg bg-surface border border-line text-fg font-bold flex items-center justify-center text-sm tabular-nums">
        {badge}
      </div>
      <div>
        <h2 className="font-bold text-fg text-base leading-tight">{title}</h2>
        <p className="text-xs text-muted mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function ErrorCard({ error }: { error: ErrorItem }) {
  const t = useTranslations("report");
  const conf = CONFIDENCE_COLORS[error.confidence];

  return (
    <div className={`rounded-xl border p-4 ${conf.bg} ${conf.border}`}>
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${conf.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className={`font-semibold text-sm ${conf.text}`}>{error.title}</p>
              <span className={`inline-block text-[10px] uppercase tracking-wider font-bold mt-0.5 ${conf.text} opacity-70`}>
                {t(`confidence.${error.confidence}.label`)}
              </span>
            </div>
            {error.potentialEur != null && (
              <span className={`text-xs font-bold shrink-0 tabular-nums ${conf.text}`}>
                ~{formatEur(error.potentialEur)}
              </span>
            )}
          </div>
          <p className="text-sm text-muted mt-2 leading-relaxed">{error.description}</p>
          {error.legalBasis && (
            <p className="text-xs text-faint mt-2">
              {t("cardLegalBasis")} {error.legalBasis}
            </p>
          )}
          {error.evidence && (
            <p className="text-xs text-faint mt-1 italic">
              {t("cardEvidence")} „{error.evidence}"
            </p>
          )}
          {error.actionText && (
            <p className="text-xs text-muted mt-2 bg-ink/60 rounded-md px-2 py-1.5">
              <strong className="text-fg">{t("cardRecommendation")}</strong> {error.actionText}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatEur(value: number): string {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

function sumPotential(errors: ErrorItem[]): number {
  return errors.reduce((sum, e) => sum + (e.potentialEur ?? 0), 0);
}
