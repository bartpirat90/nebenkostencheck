"use client";

import { useState, useEffect, useRef } from "react";
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

  const initialContactRef = useRef<ContactData>(initialContact);
  const modalRef = useRef<HTMLDivElement>(null);

  // Update ref only when modal is closed so open-modal edits are never overwritten
  useEffect(() => {
    if (!open) initialContactRef.current = initialContact;
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      setStep("form");
      setContact(initialContactRef.current);
      setLetter("");
      setError(null);
      setCopied(false);
      setTimeout(() => modalRef.current?.focus(), 0);
    }
  }, [open]);

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
    try {
      await navigator.clipboard.writeText(letter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Kopieren fehlgeschlagen. Bitte manuell kopieren.");
    }
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
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={(e) => { if (e.button === 0) onClose(); }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="letter-modal-title"
        className="bg-[#1E293B] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#334155] outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[#334155]">
          <div>
            <h2 id="letter-modal-title" className="text-xl font-bold text-[#F1F5F9]">{title}</h2>
            <p className="text-sm text-[#64748B] mt-1">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#475569] hover:text-[#94A3B8] p-1"
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
              <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-5 font-mono text-sm text-[#94A3B8] whitespace-pre-wrap leading-relaxed">
                {letter}
              </div>
              <p className="text-xs text-[#475569]">
                Bitte vor dem Versenden nochmal durchlesen und ggf. anpassen. Dieses Schreiben ist
                eine KI-Vorlage ohne Rechtsverbindlichkeit.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-[#1C0F0F] border border-[#991B1B] rounded-xl p-3 text-sm text-[#FCA5A5]">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#334155] p-4 flex flex-col sm:flex-row gap-2">
          {step === "form" && (
            <>
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none rounded-xl border border-[#334155] text-[#94A3B8] font-semibold py-3 px-4 text-sm hover:bg-[#334155] transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={generateLetter}
                disabled={loading}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold py-3 px-4 text-sm
                  hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Brief wird erstellt…" : "Brief erstellen"}
              </button>
            </>
          )}

          {step === "letter" && (
            <>
              <button
                onClick={() => setStep("form")}
                className="flex-1 sm:flex-none rounded-xl border border-[#334155] text-[#94A3B8] font-semibold py-3 px-4 text-sm hover:bg-[#334155] transition-colors"
              >
                Zurück
              </button>
              <button
                onClick={downloadAsText}
                className="flex-1 sm:flex-none rounded-xl border-2 border-[#6366F1] text-[#818CF8] font-semibold py-3 px-4 text-sm hover:bg-[#6366F1] hover:text-white transition-colors"
              >
                Als .txt herunterladen
              </button>
              <button
                onClick={copyToClipboard}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold py-3 px-4 text-sm hover:opacity-90 transition-opacity"
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
