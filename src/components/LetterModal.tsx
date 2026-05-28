"use client";

import { useState, useEffect } from "react";
import { ContactData, ErrorItem, LetterType } from "@/types";
import ContactForm from "./ContactForm";

interface Props {
  open: boolean;
  onClose: () => void;
  type: LetterType;
  initialContact: ContactData;
  errors: ErrorItem[];
}

export default function LetterModal({ open, onClose, type, initialContact, errors }: Props) {
  const [step, setStep] = useState<"form" | "letter">("form");
  const [contact, setContact] = useState<ContactData>(initialContact);
  const [letter, setLetter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("form");
      setContact(initialContact);
      setLetter("");
      setError(null);
      setCopied(false);
    }
  }, [open, initialContact]);

  if (!open) return null;

  const title = type === "objection" ? "Widerspruch erstellen" : "Belegeinsicht anfordern";
  const description =
    type === "objection"
      ? "Wir erstellen einen Widerspruch gegen die sofort angreifbaren Punkte."
      : "Wir erstellen ein Schreiben zur Forderung der Belegeinsicht zu den unklaren Positionen.";

  const generateLetter = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, contact, errors }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Brief konnte nicht erstellt werden");
      }
      const data = await res.json();
      setLetter(data.letter);
      setStep("letter");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsText = () => {
    const blob = new Blob([letter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type === "objection" ? "Widerspruch" : "Belegeinsicht"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#F5F2EC] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[#E0DBD0]">
          <div>
            <h2 className="text-xl font-bold text-[#1A1A1A]">{title}</h2>
            <p className="text-sm text-[#888] mt-1">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#888] hover:text-[#1A1A1A] p-1"
            aria-label="Schließen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === "form" && (
            <ContactForm contact={contact} onChange={setContact} />
          )}

          {step === "letter" && (
            <div className="space-y-3">
              <div className="bg-white border border-[#E0DBD0] rounded-xl p-5 font-mono text-sm text-[#1A1A1A] whitespace-pre-wrap leading-relaxed">
                {letter}
              </div>
              <p className="text-xs text-[#888]">
                Bitte vor dem Versenden nochmal durchlesen und ggf. anpassen. Dieses Schreiben ist
                eine KI-Vorlage ohne Rechtsverbindlichkeit.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3 text-sm text-[#991B1B]">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#E0DBD0] p-4 flex flex-col sm:flex-row gap-2">
          {step === "form" && (
            <>
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none rounded-xl border border-[#E0DBD0] text-[#555] font-semibold py-3 px-4 text-sm hover:bg-white"
              >
                Abbrechen
              </button>
              <button
                onClick={generateLetter}
                disabled={loading}
                className="flex-1 rounded-xl bg-[#1A1A1A] text-white font-semibold py-3 px-4 text-sm
                  hover:bg-[#2D5A1B] transition-colors disabled:opacity-60"
              >
                {loading ? "Brief wird erstellt…" : "Brief erstellen"}
              </button>
            </>
          )}

          {step === "letter" && (
            <>
              <button
                onClick={() => setStep("form")}
                className="flex-1 sm:flex-none rounded-xl border border-[#E0DBD0] text-[#555] font-semibold py-3 px-4 text-sm hover:bg-white"
              >
                Zurück
              </button>
              <button
                onClick={downloadAsText}
                className="flex-1 sm:flex-none rounded-xl border-2 border-[#1A1A1A] text-[#1A1A1A] font-semibold py-3 px-4 text-sm hover:bg-[#1A1A1A] hover:text-white transition-colors"
              >
                Als .txt herunterladen
              </button>
              <button
                onClick={copyToClipboard}
                className="flex-1 rounded-xl bg-[#1A1A1A] text-white font-semibold py-3 px-4 text-sm hover:bg-[#2D5A1B] transition-colors"
              >
                {copied ? "✓ Kopiert!" : "In Zwischenablage kopieren"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
