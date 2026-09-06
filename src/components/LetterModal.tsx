"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ContactData, LetterType, LetterPdfResponse } from "@/types";
import { MAIL_SUBJECTS } from "@/lib/letters";
import { useApiErrorMessage } from "@/lib/clientErrors";
import ContactForm from "./ContactForm";
import { ProgressBar, PhaseList } from "./ActivityIndicator";
import Button from "@/components/ui/Button";

interface Props {
  open: boolean;
  onClose: () => void;
  type: LetterType;
  initialContact: ContactData;
  id: string;
  customerEmail?: string;
}

/** Wandelt einen Base64-String in einen PDF-Blob um. */
function base64ToPdfBlob(base64: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: "application/pdf" });
}

/**
 * Ermittelt alle fokussierbaren Elemente innerhalb eines Containers.
 * Wird sowohl fuer den initialen Fokus als auch fuer die Fokus-Falle
 * (Tab/Shift+Tab) gebraucht, deshalb als eigene Funktion ausgelagert.
 * offsetParent === null filtert unsichtbare Elemente (z.B. display:none) heraus.
 */
function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
  );
}

export default function LetterModal({
  open,
  onClose,
  type,
  initialContact,
  id,
  customerEmail,
}: Props) {
  const t = useTranslations("letter");
  const te = useTranslations("errors");
  const apiMessage = useApiErrorMessage();
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
  // Merkt sich das Element, das vor dem Oeffnen fokussiert war, damit der
  // Fokus beim Schliessen dorthin zurueckkehrt (sonst faellt er auf <body>
  // zurueck und Tastatur-/Screenreader-Nutzer verlieren ihre Position).
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

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
      setTimeout(() => {
        const focusables = getFocusableElements(modalRef.current);
        (focusables[0] ?? modalRef.current)?.focus();
      }, 0);
    }
  }, [open, customerEmail]);

  // Fokus-Uebergabe: aktuelles Element merken, solange das Modal offen ist;
  // beim Schliessen (Cleanup greift sowohl bei open=false als auch bei Unmount)
  // den Fokus zurueckgeben, damit die Seite dahinter bedienbar bleibt.
  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    return () => {
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open]);

  // Escape schliesst das Modal – mit denselben Ausnahmen wie der Backdrop-Klick:
  // nicht waehrend des Ladens (laufende PDF-Generierung nicht abbrechen) und
  // nicht mit fertigem Brief (ein Reflex-Escape wuerde das Ergebnis genauso
  // verwerfen wie ein Fehlklick; dann nur ueber "Fertig"/X). Tab/Shift+Tab
  // wird innerhalb des Modals gefangen (Focus-Trap), damit der Tastaturfokus
  // die Seite dahinter nicht verlassen kann, solange der Dialog offen ist.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!loading && !result) onClose();
        return;
      }
      if (e.key === "Tab") {
        const focusables = getFocusableElements(modalRef.current);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey) {
          if (active === first || !modalRef.current?.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else if (active === last || !modalRef.current?.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, result, onClose]);

  if (!open) return null;

  const title =
    type === "objection"
      ? t("titleObjection")
      : type === "document_review"
      ? t("titleReview")
      : t("titleCombined");
  const description =
    type === "objection"
      ? t("descObjection")
      : type === "document_review"
      ? t("descReview")
      : t("descCombined");

  const generateLetter = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, contact, id }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => null);
        throw new Error(apiMessage(e, t("errCreate")));
      }
      const data = (await res.json()) as LetterPdfResponse;
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : te("unknown"));
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
      setSendError(t("emailRequired"));
      return;
    }
    setSending(true);
    setSendError(null);
    setSent(false);
    try {
      const res = await fetch("/api/send-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email, type }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => null);
        throw new Error(apiMessage(e, t("errSend")));
      }
      setSent(true);
    } catch (err: unknown) {
      setSendError(err instanceof Error ? err.message : te("unknown"));
    } finally {
      setSending(false);
    }
  };

  const inputClass = `
    w-full min-h-11 px-3 py-2.5 rounded-lg border border-line-strong bg-ink
    text-sm text-fg placeholder:text-faint
    focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
  `;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      // Schliessen per Backdrop-Klick nur im Formular-Schritt: ist der Brief
      // bereits fertig (result) oder wird gerade geladen, wuerde ein Fehlklick
      // das Ergebnis unwiederbringlich verwerfen – dann nur ueber "Fertig"/X.
      onClick={(e) => { if (e.button === 0 && !loading && !result) onClose(); }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="letter-modal-title"
        className="bg-surface rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-line outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-line">
          <div>
            <h2 id="letter-modal-title" className="text-xl font-bold text-fg">{title}</h2>
            <p className="text-sm text-muted mt-1">
              {result ? t("readyDesc") : description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-faint hover:text-fg w-11 h-11 -m-2 flex items-center justify-center transition-colors"
            aria-label={t("close")}
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
              <div className="w-12 h-12 rounded-full border-2 border-line border-t-accent animate-spin" />
              <div className="space-y-1 text-center">
                <p className="font-semibold text-fg">{t("loadingTitle")}</p>
                <p className="text-sm text-muted">{t("loadingSubtitle")}</p>
              </div>
              <PhaseList
                phases={[t("phaseFormulating"), t("phasePdf")]}
                intervalMs={5000}
              />
            </div>
          ) : result ? (
            /* Aktions-Schritt */
            <div className="space-y-6">
              {/* PDF herunterladen */}
              <Button className="w-full" onClick={downloadPdf}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t("downloadPdf")}
              </Button>

              {/* Per Mail an Vermieter */}
              <div className="space-y-2 border-t border-line pt-5">
                <p className="text-sm font-semibold text-fg">{t("mailToLandlord")}</p>
                <label className="block">
                  <span className="text-xs font-semibold text-muted block mb-1">
                    {t("landlordEmailLabel")}
                  </span>
                  <input
                    type="email"
                    value={landlordEmail}
                    onChange={(e) => setLandlordEmail(e.target.value)}
                    placeholder="vermieter@example.de"
                    className={inputClass}
                  />
                </label>
                <Button variant="secondary" className="w-full" onClick={openMailto}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {t("mailToLandlord")}
                </Button>
                <p className="text-xs text-muted">{t("mailHint")}</p>
              </div>

              {/* PDF an meine E-Mail senden */}
              <div className="space-y-2 border-t border-line pt-5">
                <p className="text-sm font-semibold text-fg">{t("sendToMe")}</p>
                <p className="text-xs text-muted">{t("sendToMeHint")}</p>
                <label className="block">
                  <span className="text-xs font-semibold text-muted block mb-1">{t("yourEmail")}</span>
                  <input
                    type="email"
                    value={myEmail}
                    onChange={(e) => setMyEmail(e.target.value)}
                    placeholder="du@example.de"
                    className={inputClass}
                  />
                </label>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={sendToMyEmail}
                  loading={sending}
                >
                  {sending ? t("sending") : t("sendToMe")}
                </Button>
                {sent && (
                  <p className="text-xs text-status-ok font-semibold">
                    {t("sent")}
                  </p>
                )}
                {sendError && (
                  <div className="bg-status-dangerBg border border-status-dangerBorder rounded-xl p-3 text-sm text-status-danger">
                    {sendError}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <ContactForm contact={contact} onChange={setContact} />

              {error && (
                <div className="mt-4 bg-status-dangerBg border border-status-dangerBorder rounded-xl p-3 text-sm text-status-danger">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && !result && (
          <div className="border-t border-line p-4 flex flex-col sm:flex-row gap-2">
            <Button variant="secondary" className="flex-1 sm:flex-none" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button className="flex-1" onClick={generateLetter}>
              {t("createPdf")}
            </Button>
          </div>
        )}
        {!loading && result && (
          <div className="border-t border-line p-4">
            <Button variant="secondary" className="w-full" onClick={onClose}>
              {t("done")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
