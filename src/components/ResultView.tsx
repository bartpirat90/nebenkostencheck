"use client";

import { useState } from "react";
import { AnalysisResult, ErrorItem, LetterType, Confidence } from "@/types";
import LetterModal from "./LetterModal";

interface Props {
  result: AnalysisResult;
  id: string;
  onReset: () => void;
}

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
      {/* Summary card */}
      <div className="bg-[#1E293B] rounded-2xl p-6 border border-[#334155]">
        <p className="text-sm text-[#64748B] mb-1">Geschätztes Erstattungspotenzial</p>
        <p className="text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-[#818CF8] to-[#C084FC] bg-clip-text text-transparent">
          {hasErrors ? formatEur(total) : "0 €"}
        </p>

        {hasErrors && (
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#334155]">
            <div>
              <p className="text-xs text-[#64748B]">Sofort angreifbar</p>
              <p className="text-lg font-bold text-[#4ADE80]">{formatEur(directTotal)}</p>
              <p className="text-xs text-[#475569]">{directErrors.length} Punkt{directErrors.length !== 1 ? "e" : ""}</p>
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Nach Belegeinsicht</p>
              <p className="text-lg font-bold text-[#FCD34D]">{formatEur(reviewTotal)}</p>
              <p className="text-xs text-[#475569]">{reviewErrors.length} Punkt{reviewErrors.length !== 1 ? "e" : ""}</p>
            </div>
          </div>
        )}

        {result.summary && (
          <p className="mt-4 text-sm text-[#94A3B8] leading-relaxed border-t border-[#334155] pt-4">
            {result.summary}
          </p>
        )}
      </div>

      {/* Report PDF download */}
      <button
        onClick={() => window.open(`/api/generate-report?id=${id}`, "_blank")}
        className="w-full rounded-xl border-2 border-[#334155] text-[#94A3B8] font-semibold py-3.5 text-sm
          hover:border-[#6366F1] hover:text-[#818CF8] transition-colors flex items-center justify-center gap-2"
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
            badgeColor="bg-[#1E293B] border border-[#334155]"
            title="Sofort angreifbar"
            subtitle="Eindeutige Rechtsverstöße – direkter Widerspruch möglich"
          />
          {directErrors.map((err) => (
            <ErrorCard key={`direct-${err.title}`} error={err} />
          ))}
          <button
            onClick={() => setLetterModal("objection")}
            className="w-full rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold py-3.5 text-sm
              hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
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
            badgeColor="bg-[#334155]"
            title="Belegeinsicht erforderlich"
            subtitle="Verdacht auf Fehler – Belege beim Vermieter anfordern"
          />
          {reviewErrors.map((err) => (
            <ErrorCard key={`review-${err.title}`} error={err} />
          ))}
          <button
            onClick={() => setLetterModal("document_review")}
            className="w-full rounded-xl bg-[#334155] text-[#CBD5E1] font-semibold py-3.5 text-sm
              hover:bg-[#475569] transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Belegeinsicht anfordern
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
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 text-xs text-[#94A3B8]">
          <p className="font-semibold mb-2 text-[#F1F5F9]">Farblegende – Erfolgsaussichten:</p>
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
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 text-xs text-[#64748B] leading-relaxed">
        <strong className="text-[#94A3B8]">Hinweis:</strong> Diese Analyse ist eine automatisierte Einschätzung
        ohne Rechtsverbindlichkeit. Sie ersetzt keine anwaltliche Beratung. Beträge sind Schätzungen
        und können von tatsächlich erzielbaren Erstattungen abweichen. Generierte Briefe sind Vorlagen
        und sollten vor dem Versand geprüft und ggf. angepasst werden.
      </div>

      {/* Reset CTA */}
      <button
        onClick={onReset}
        className="w-full rounded-xl border-2 border-[#334155] text-[#94A3B8] font-semibold py-3.5 text-sm
          hover:border-[#6366F1] hover:text-[#818CF8] transition-colors"
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
          errors={letterModal === "objection" ? directErrors : reviewErrors}
          id={id}
        />
      )}
    </div>
  );
}

function SectionHeader({ badge, badgeColor, title, subtitle }: {
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`shrink-0 w-8 h-8 rounded-lg ${badgeColor} text-[#F1F5F9] font-bold flex items-center justify-center text-sm`}>
        {badge}
      </div>
      <div>
        <h2 className="font-bold text-[#F1F5F9] text-base leading-tight">{title}</h2>
        <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>
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
              <span className={`text-xs font-bold shrink-0 ${conf.text}`}>
                ~{formatEur(error.potentialEur)}
              </span>
            )}
          </div>
          <p className="text-sm text-[#94A3B8] mt-2 leading-relaxed">{error.description}</p>
          {error.legalBasis && (
            <p className="text-xs text-[#64748B] mt-2">
              Rechtsgrundlage: {error.legalBasis}
            </p>
          )}
          {error.evidence && (
            <p className="text-xs text-[#475569] mt-1 italic">
              Beleg im Dokument: „{error.evidence}"
            </p>
          )}
          {error.actionText && (
            <p className="text-xs text-[#64748B] mt-2 bg-[#0F172A]/60 rounded-md px-2 py-1.5">
              <strong className="text-[#94A3B8]">Empfehlung:</strong> {error.actionText}
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
