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
  id: string;
}

export default function LetterModal({ open, onClose, type, initialContact, errors, id }: Props) {
  const [contact, setContact] = useState<ContactData>(initialContact);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialContactRef = useRef<ContactData>(initialContact);
  const modalRef = useRef<HTMLDivElement>(null);

  // Update ref only when modal is closed so open-modal edits are never overwritten
  useEffect(() => {
    if (!open) initialContactRef.current = initialContact;
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      setContact(initialContactRef.current);
      setError(null);
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
        body: JSON.stringify({ type, contact, errors, id }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Brief konnte nicht erstellt werden");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type === "objection" ? "Widerspruch" : "Belegeinsicht"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
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
          <ContactForm contact={contact} onChange={setContact} />

          {error && (
            <div className="mt-4 bg-[#1C0F0F] border border-[#991B1B] rounded-xl p-3 text-sm text-[#FCA5A5]">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#334155] p-4 flex flex-col sm:flex-row gap-2">
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
            {loading ? "PDF wird erstellt…" : "PDF erstellen"}
          </button>
        </div>
      </div>
    </div>
  );
}
