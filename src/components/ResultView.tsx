"use client";

import { useState } from "react";
import { AnalysisResult, ErrorItem, LetterType } from "@/types";
import LetterModal from "./LetterModal";

interface Props {
  result: AnalysisResult;
  onReset: () => void;
}

const CONFIDENCE_CONFIG = {
  sicher: {
    label: "Sicher",
    bg: "bg-[#F0FDF4]",
    border: "border-[#BBF7D0]",
    text: "text-[#166534]",
    dot: "bg-[#22C55E]",
  },
  wahrscheinlich: {
    label: "Wahrscheinlich",
    bg: "bg-[#FFFBEB]",
    border: "border-[#FDE68A]",
    text: "text-[#92400E]",
    dot: "bg-[#F59E0B]",
  },
  unsicher: {
    label: "Unsicher",
    bg: "bg-[#FEF2F2]",
    border: "border-[#FECACA]",
    text: "text-[#991B1B]",
    dot: "bg-[#EF4444]",
  },
};

export default function ResultView({ result, onReset }: Props) {
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
      <div className="bg-white rounded-2xl p-6 border border-[#E0DBD0]">
        <p className="text-sm text-[#888] mb-1">Geschätztes Erstattungspotenzial</p>
        <p className="text-4xl font-bold text-[#1A1A1A] tracking-tight mb-4">
          {hasErrors ? formatEur(total) : "0 €"}
        </p>

        {hasErrors && (
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#F0EDE7]">
            <div>
              <p className="text-xs text-[#888]">Sofort angreifbar</p>
              <p className="text-lg font-bold text-[#166534]">{formatEur(directTotal)}</p>
              <p className="text-xs text-[#888]">{directErrors.length} Punkt{directErrors.length !== 1 ? "e" : ""}</p>
            </div>
            <div>
              <p className="text-xs text-[#888]">Nach Belegeinsicht</p>
              <p className="text-lg font-bold text-[#92400E]">{formatEur(reviewTotal)}</p>
              <p className="text-xs text-[#888]">{reviewErrors.length} Punkt{reviewErrors.length !== 1 ? "e" : ""}</p>
            </div>
          </div>
        )}

        {result.summary && (
          <p className="mt-4 text-sm text-[#555] leading-relaxed border-t border-[#F0EDE7] pt-4">
            {result.summary}
          </p>
        )}
      </div>

      {/* Direct errors section */}
      {directErrors.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            badge="A"
            badgeColor="bg-[#1A1A1A]"
            title="Sofort angreifbar"
            subtitle="Eindeutige Rechtsverstöße – direkter Widerspruch möglich"
          />
          {directErrors.map((err, i) => (
            <ErrorCard key={i} error={err} />
          ))}
          <button
            onClick={() => setLetterModal("objection")}
            className="w-full rounded-xl bg-[#1A1A1A] text-white font-semibold py-3.5 text-sm
              hover:bg-[#2D5A1B] transition-colors flex items-center justify-center gap-2"
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
            badgeColor="bg-[#555]"
            title="Belegeinsicht erforderlich"
            subtitle="Verdacht auf Fehler – Belege beim Vermieter anfordern"
          />
          {reviewErrors.map((err, i) => (
            <ErrorCard key={i} error={err} />
          ))}
          <button
            onClick={() => setLetterModal("document_review")}
            className="w-full rounded-xl bg-[#555] text-white font-semibold py-3.5 text-sm
              hover:bg-[#1A1A1A] transition-colors flex items-center justify-center gap-2"
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
        <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-[#DCFCE7] rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[#166534]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-semibold text-[#166534]">Keine offensichtlichen Fehler gefunden</p>
          <p className="text-sm text-[#4B7A5A] mt-1">
            Das bedeutet nicht, dass die Abrechnung fehlerfrei ist – bei Zweifeln lohnt sich eine rechtliche Prüfung.
          </p>
        </div>
      )}

      {/* Color legend */}
      {hasErrors && (
        <div className="bg-white border border-[#E0DBD0] rounded-xl p-4 text-xs text-[#555]">
          <p className="font-semibold mb-2 text-[#1A1A1A]">Farblegende – Erfolgsaussichten:</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
              <span><strong className="text-[#166534]">Sicher</strong> – klare Rechtsverletzung, hohe Erstattungsaussicht</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              <span><strong className="text-[#92400E]">Wahrscheinlich</strong> – überwiegende Erfolgsaussicht, Auslegung möglich</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
              <span><strong className="text-[#991B1B]">Unsicher</strong> – Verdacht, nur mit Belegen klärbar</span>
            </div>
          </div>
        </div>
      )}

      {/* Legal disclaimer */}
      <div className="bg-[#F5F2EC] border border-[#E0DBD0] rounded-xl p-4 text-xs text-[#888] leading-relaxed">
        <strong className="text-[#555]">Hinweis:</strong> Diese Analyse ist eine automatisierte KI-Einschätzung
        ohne Rechtsverbindlichkeit. Sie ersetzt keine anwaltliche Beratung. Beträge sind Schätzungen
        und können von tatsächlich erzielbaren Erstattungen abweichen. Generierte Briefe sind Vorlagen
        und sollten vor dem Versand geprüft und ggf. angepasst werden.
      </div>

      {/* Reset CTA */}
      <button
        onClick={onReset}
        className="w-full rounded-xl border-2 border-[#1A1A1A] text-[#1A1A1A] font-semibold py-3.5 text-sm
          hover:bg-[#1A1A1A] hover:text-white transition-colors"
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
      <div className={`shrink-0 w-8 h-8 rounded-lg ${badgeColor} text-white font-bold flex items-center justify-center text-sm`}>
        {badge}
      </div>
      <div>
        <h2 className="font-bold text-[#1A1A1A] text-base leading-tight">{title}</h2>
        <p className="text-xs text-[#888] mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function ErrorCard({ error }: { error: ErrorItem }) {
  const conf = CONFIDENCE_CONFIG[error.confidence] || CONFIDENCE_CONFIG.wahrscheinlich;

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
          <p className="text-sm text-[#444] mt-2 leading-relaxed">{error.description}</p>
          {error.legalBasis && (
            <p className="text-xs text-[#888] mt-2">
              Rechtsgrundlage: {error.legalBasis}
            </p>
          )}
          {error.evidence && (
            <p className="text-xs text-[#777] mt-1 italic">
              Beleg im Dokument: „{error.evidence}"
            </p>
          )}
          {error.actionText && (
            <p className="text-xs text-[#555] mt-2 bg-white/60 rounded-md px-2 py-1.5">
              <strong>Empfehlung:</strong> {error.actionText}
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
  return errors.reduce((sum, e) => sum + (e.potentialEur || 0), 0);
}
