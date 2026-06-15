"use client";

import { useState } from "react";
import { AnalysisResult, ErrorItem, LetterType, Confidence } from "@/types";
import LetterModal from "./LetterModal";

interface Props {
  result: AnalysisResult;
  id: string;
  onReset: () => void;
}

// Semantische Konfidenz-Skala (grün/gelb/rot) – bewusst NICHT das Marken-Grün,
// sondern eine eigenständige Ampel für die Erfolgsaussicht.
const CONFIDENCE_CONFIG: Record<Confidence, { label: string; bg: string; border: string; text: string; dot: string }> = {
  sicher: {
    label: "Sicher",
    bg: "bg-[#0F2B1F]",
    border: "border-[#166534]",
    text: "text-[#4ADE80]",
    dot: "bg-[#22C55E]",
  },
  wahrscheinlich: {
    label: "Wahrscheinlich",
    bg: "bg-[#1C1A0E]",
    border: "border-[#92400E]",
    text: "text-[#FCD34D]",
    dot: "bg-[#F59E0B]",
  },
  unsicher: {
    label: "Unsicher",
    bg: "bg-[#1C0F0F]",
    border: "border-[#991B1B]",
    text: "text-[#FCA5A5]",
    dot: "bg-[#EF4444]",
  },
};

export default function ResultView({ result, id, onReset }: Props) {
  const [letterModal, setLetterModal] = useState<LetterType | null>(null);

  const directErrors = result.errors.filter((e) => e.category === "direct");
  const reviewErrors = result.errors.filter((e) => e.category === "needs_review");

  const directTotal = result.directPotentialEur ?? sumPotential(directErrors);
  const reviewTotal = result.reviewPotentialEur ?? sumPotential(reviewErrors);
  const total = result.totalPotentialEur ?? (directTotal + reviewTotal);

  const hasErrors = result.errors.length > 0;

  return (
    <div className="space-y-6">
      {/* Bericht-Kopf */}
      <div className="bg-surface rounded-2xl p-6 border border-line">
        <p className="text-sm text-muted mb-1">Geschätztes Erstattungspotenzial</p>
        <p className="text-4xl font-bold tracking-tight mb-4 text-accent-soft tabular-nums">
          {hasErrors ? formatEur(total) : "0 €"}
        </p>

        {hasErrors && (
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-line">
            <div>
              <p className="text-xs text-muted">Sofort angreifbar</p>
              <p className="text-lg font-bold text-[#4ADE80] tabular-nums">{formatEur(directTotal)}</p>
              <p className="text-xs text-faint tabular-nums">{directErrors.length} Punkt{directErrors.length !== 1 ? "e" : ""}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Nach Belegeinsicht</p>
              <p className="text-lg font-bold text-[#FCD34D] tabular-nums">{formatEur(reviewTotal)}</p>
              <p className="text-xs text-faint tabular-nums">{reviewErrors.length} Punkt{reviewErrors.length !== 1 ? "e" : ""}</p>
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
        Bericht als PDF herunterladen
      </button>

      {/* Direct errors section */}
      {directErrors.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            badge="A"
            title="Sofort angreifbar"
            subtitle="Eindeutige Rechtsverstöße – direkter Widerspruch möglich"
          />
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
            Widerspruch erstellen
          </button>
        </section>
      )}

      {/* Review errors section */}
      {reviewErrors.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            badge="B"
            title="Belegeinsicht erforderlich"
            subtitle="Verdacht auf Fehler – Belege beim Vermieter anfordern"
          />
          {reviewErrors.map((err) => (
            <ErrorCard key={`review-${err.title}`} error={err} />
          ))}
          <button
            onClick={() => setLetterModal("document_review")}
            className="w-full rounded-xl border border-line bg-surface text-fg font-semibold py-3.5 text-sm
              hover:border-accent hover:text-accent-bright transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Belegeinsicht anfordern
          </button>
        </section>
      )}

      {/* Combined letter */}
      {directErrors.length > 0 && reviewErrors.length > 0 && (
        <section className="space-y-2 bg-surface border border-line rounded-2xl p-4">
          <p className="text-sm text-muted">
            Beide Anliegen in einem Schreiben zusammenfassen – Widerspruch und Aufforderung
            zur Belegeinsicht in einem PDF.
          </p>
          <button
            onClick={() => setLetterModal("combined")}
            className="w-full rounded-xl border border-accent-border text-accent-bright font-semibold py-3.5 text-sm
              hover:bg-accent-bg/40 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z M9 13h6m-6 4h6" />
            </svg>
            Kombiniertes Schreiben erstellen
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
          <p className="font-semibold text-[#4ADE80]">Keine offensichtlichen Fehler gefunden</p>
          <p className="text-sm text-[#86EFAC] mt-1">
            Das bedeutet nicht, dass die Abrechnung fehlerfrei ist – bei Zweifeln lohnt sich eine rechtliche Prüfung.
          </p>
        </div>
      )}

      {/* Color legend */}
      {hasErrors && (
        <div className="bg-surface border border-line rounded-xl p-4 text-xs text-muted">
          <p className="font-semibold mb-2 text-fg">Farblegende – Erfolgsaussichten:</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
              <span><strong className="text-[#4ADE80]">Sicher</strong> – klare Rechtsverletzung, hohe Erstattungsaussicht</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              <span><strong className="text-[#FCD34D]">Wahrscheinlich</strong> – überwiegende Erfolgsaussicht, Auslegung möglich</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
              <span><strong className="text-[#FCA5A5]">Unsicher</strong> – Verdacht, nur mit Belegen klärbar</span>
            </div>
          </div>
        </div>
      )}

      {/* Legal disclaimer */}
      <div className="bg-surface border border-line rounded-xl p-4 text-xs text-faint leading-relaxed">
        <strong className="text-muted">Hinweis:</strong> Diese Analyse ist eine automatisierte Einschätzung
        ohne Rechtsverbindlichkeit. Sie ersetzt keine anwaltliche Beratung. Beträge sind Schätzungen
        und können von tatsächlich erzielbaren Erstattungen abweichen. Generierte Briefe sind Vorlagen
        und sollten vor dem Versand geprüft und ggf. angepasst werden.
      </div>

      {/* Reset CTA */}
      <button
        onClick={onReset}
        className="w-full rounded-xl border border-line text-muted font-semibold py-3.5 text-sm
          hover:border-accent hover:text-accent-bright transition-colors"
      >
        Neue Abrechnung prüfen
      </button>

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
  const conf = CONFIDENCE_CONFIG[error.confidence];

  return (
    <div className={`rounded-xl border p-4 ${conf.bg} ${conf.border}`}>
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${conf.dot}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className={`font-semibold text-sm ${conf.text}`}>{error.title}</p>
              <span className={`inline-block text-[10px] uppercase tracking-wider font-bold mt-0.5 ${conf.text} opacity-70`}>
                {conf.label}
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
              Rechtsgrundlage: {error.legalBasis}
            </p>
          )}
          {error.evidence && (
            <p className="text-xs text-faint mt-1 italic">
              Beleg im Dokument: „{error.evidence}"
            </p>
          )}
          {error.actionText && (
            <p className="text-xs text-muted mt-2 bg-ink/60 rounded-md px-2 py-1.5">
              <strong className="text-fg">Empfehlung:</strong> {error.actionText}
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
