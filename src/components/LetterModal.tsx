"use client";

import { useState, useEffect, useRef } from "react";
import { ContactData, ErrorItem, LetterType, LetterPdfResponse } from "@/types";
import ContactForm from "./ContactForm";
import { ProgressBar, PhaseList } from "./ActivityIndicator";

interface Props {
  open: boolean;
  onClose: () => void;
  type: LetterType;
  initialContact: ContactData;
  errors: ErrorItem[];
  id: string;
  customerEmail?: string;
}

const MAIL_SUBJECTS: Record<LetterType, string> = {
  objection: "Widerspruch gegen die Nebenkostenabrechnung",
  document_review: "Aufforderung zur Belegeinsicht",
  combined: "Widerspruch und Belegeinsicht – Nebenkostenabrechnung",
};

/** Wandelt einen Base64-String in einen PDF-Blob um. */
function base64ToPdfBlob(base64: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: "application/pdf" });
}

export default function LetterModal({
  open,
  onClose,
  type,
  initialContact,
  errors,
  id,
  customerEmail,
}: Props) {
  const [contact, setContact] = useState<ContactData>(initialContact);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ergebnis der Generierung (Brieftext + PDF) → schaltet den Aktions-Schritt frei.
  const [result, setResult] = useState<LetterPdfResponse | null>(null);

  // Felder im Aktions-Schritt
  const [landlordEmail, setLandlordEmail] = useState("");
  const [myEmail, setMyEmail] = useState(customerEmail ?? "");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

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
      setResult(null);
      setLandlordEmail("");
      setMyEmail(customerEmail ?? "");
      setSending(false);
      setSendError(null);
      setSent(false);
      setTimeout(() => modalRef.current?.focus(), 0);
    }
  }, [open, customerEmail]);

  if (!open) return null;

  const title =
    type === "objection"
      ? "Widerspruch erstellen"
      : type === "document_review"
      ? "Belegeinsicht anfordern"
      : "Kombiniertes Schreiben erstellen";
  const description =
    type === "objection"
      ? "Wir erstellen einen Widerspruch gegen die sofort angreifbaren Punkte."
      : type === "document_review"
      ? "Wir erstellen ein Schreiben zur Forderung der Belegeinsicht zu den unklaren Positionen."
      : "Wir fassen Widerspruch und Aufforderung zur Belegeinsicht in einem Schreiben zusammen.";

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
      const data = (await res.json()) as LetterPdfResponse;
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!result) return;
    const blob = base64ToPdfBlob(result.pdfBase64);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openMailto = () => {
    if (!result) return;
    const subject = MAIL_SUBJECTS[type];
    const recipient = landlordEmail.trim();
    const mailto = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(result.letter)}`;
    window.location.href = mailto;
  };

  const sendToMyEmail = async () => {
    if (!result) return;
    const email = myEmail.trim();
    if (!email) {
      setSendError("Bitte eine E-Mail-Adresse eingeben.");
      return;
    }
    setSending(true);
    setSendError(null);
    setSent(false);
    try {
      const res = await fetch("/api/send-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email, pdfBase64: result.pdfBase64, filename: result.filename }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "PDF konnte nicht gesendet werden");
      }
      setSent(true);
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setSending(false);
    }
  };

  const inputClass = `
    w-full px-3 py-2 rounded-lg border border-[#334155] bg-[#0F172A]
    text-sm text-[#F1F5F9] placeholder:text-[#475569]
    focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]
  `;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={(e) => { if (e.button === 0 && !loading) onClose(); }}
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
            <p className="text-sm text-[#64748B] mt-1">
              {result ? "Dein Schreiben ist fertig. So geht es weiter:" : description}
            </p>
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
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-8 w-full">
              <div className="w-full max-w-xs">
                <ProgressBar />
              </div>
              <div className="w-12 h-12 rounded-full border-2 border-[#334155] border-t-[#6366F1] animate-spin" />
              <div className="space-y-1 text-center">
                <p className="font-semibold text-[#F1F5F9]">Dein Schreiben wird erstellt…</p>
                <p className="text-sm text-[#64748B]">Das dauert meist 5–15 Sekunden.</p>
              </div>
              <PhaseList
                phases={["Schreiben wird formuliert", "PDF wird erzeugt"]}
                intervalMs={5000}
              />
            </div>
          ) : result ? (
            /* Aktions-Schritt */
            <div className="space-y-6">
              {/* PDF herunterladen */}
              <button
                onClick={downloadPdf}
                className="w-full rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold py-3 px-4 text-sm
                  hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                PDF herunterladen
              </button>

              {/* Per Mail an Vermieter */}
              <div className="space-y-2 border-t border-[#334155] pt-5">
                <p className="text-sm font-semibold text-[#F1F5F9]">Per Mail an Vermieter</p>
                <label className="block">
                  <span className="text-xs font-semibold text-[#94A3B8] block mb-1">
                    E-Mail des Vermieters (optional)
                  </span>
                  <input
                    type="email"
                    value={landlordEmail}
                    onChange={(e) => setLandlordEmail(e.target.value)}
                    placeholder="vermieter@example.de"
                    className={inputClass}
                  />
                </label>
                <button
                  onClick={openMailto}
                  className="w-full rounded-xl border border-[#334155] text-[#CBD5E1] font-semibold py-2.5 px-4 text-sm
                    hover:bg-[#334155] transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Per Mail an Vermieter
                </button>
                <p className="text-xs text-[#64748B]">
                  Bitte das heruntergeladene PDF in deinem Mailprogramm anhängen.
                </p>
              </div>

              {/* PDF an meine E-Mail senden */}
              <div className="space-y-2 border-t border-[#334155] pt-5">
                <p className="text-sm font-semibold text-[#F1F5F9]">PDF an meine E-Mail senden</p>
                <p className="text-xs text-[#64748B]">
                  Wir senden dir das PDF als Anhang zu – so kannst du es bequem weiterleiten.
                </p>
                <label className="block">
                  <span className="text-xs font-semibold text-[#94A3B8] block mb-1">Deine E-Mail</span>
                  <input
                    type="email"
                    value={myEmail}
                    onChange={(e) => setMyEmail(e.target.value)}
                    placeholder="du@example.de"
                    className={inputClass}
                  />
                </label>
                <button
                  onClick={sendToMyEmail}
                  disabled={sending}
                  className="w-full rounded-xl border border-[#334155] text-[#CBD5E1] font-semibold py-2.5 px-4 text-sm
                    hover:bg-[#334155] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {sending ? "Wird gesendet…" : "PDF an meine E-Mail senden"}
                </button>
                {sent && (
                  <p className="text-xs text-[#4ADE80] font-semibold">
                    ✓ Gesendet! Schau in dein Postfach.
                  </p>
                )}
                {sendError && (
                  <div className="bg-[#1C0F0F] border border-[#991B1B] rounded-xl p-3 text-sm text-[#FCA5A5]">
                    {sendError}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <ContactForm contact={contact} onChange={setContact} />

              {error && (
                <div className="mt-4 bg-[#1C0F0F] border border-[#991B1B] rounded-xl p-3 text-sm text-[#FCA5A5]">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && !result && (
          <div className="border-t border-[#334155] p-4 flex flex-col sm:flex-row gap-2">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none rounded-xl border border-[#334155] text-[#94A3B8] font-semibold py-3 px-4 text-sm hover:bg-[#334155] transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={generateLetter}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold py-3 px-4 text-sm
                hover:opacity-90 transition-opacity"
            >
              PDF erstellen
            </button>
          </div>
        )}
        {!loading && result && (
          <div className="border-t border-[#334155] p-4">
            <button
              onClick={onClose}
              className="w-full rounded-xl border border-[#334155] text-[#94A3B8] font-semibold py-3 px-4 text-sm hover:bg-[#334155] transition-colors"
            >
              Fertig
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
