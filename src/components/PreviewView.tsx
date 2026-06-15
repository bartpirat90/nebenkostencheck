"use client";

import { useState } from "react";
import { PreviewData } from "@/types";

interface Props {
  preview: PreviewData;
  onReset: () => void;
}

export default function PreviewView({ preview, onReset }: Props) {
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: preview.id }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Zahlung konnte nicht gestartet werden.");
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setLoading(false);
    }
  };

  const potential =
    preview.totalPotentialEur != null
      ? `~${preview.totalPotentialEur.toFixed(0)} €`
      : preview.totalPotentialLabel ?? "Potenzial erkannt";

  // Schreiben-Typ aus der Befundlage (Fall-Bezug, ohne Inhalt zu verraten).
  const letterKind =
    preview.hasDirect && preview.hasReview
      ? "Widerspruch und Belegeinsicht"
      : preview.hasReview
      ? "Belegeinsicht-Schreiben"
      : "Widerspruchsschreiben";

  const nextSteps = [
    { title: "Bericht freischalten", desc: "Alle Befunde im Detail: Begründung, Beleg im Dokument und Rechtsgrundlage." },
    { title: "Schreiben erstellen", desc: `${letterKind} als fertiges PDF, mit deinen Daten vorausgefüllt.` },
    { title: "An Vermieter senden", desc: "PDF herunterladen und per E-Mail oder Post einreichen." },
  ];

  return (
    <div className="space-y-5">
      {/* Bericht-Kopf */}
      <div className="border border-line rounded-xl p-6">
        <p className="text-xs font-semibold tracking-wide text-accent-bright mb-2">
          Erste Prüfung abgeschlossen
        </p>
        <p className="text-3xl font-black text-fg tabular-nums">
          {preview.errorCount}{" "}
          {preview.errorCount === 1 ? "Auffälligkeit" : "Auffälligkeiten"}
        </p>
        <div className="flex items-baseline justify-between gap-3 border-t border-line mt-4 pt-4">
          <span className="text-sm text-muted">Mögliches Erstattungspotenzial</span>
          <span className="text-lg font-bold text-accent-soft tabular-nums">{potential}</span>
        </div>
      </div>

      {preview.errorTitles.length > 0 && (
        <div className="border border-line rounded-xl divide-y divide-line">
          {preview.errorTitles.map((title, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <span className="text-xs font-medium tabular-nums text-accent-soft w-6 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-sm font-medium text-fg">{title}</span>
              <span className="ml-auto flex items-center gap-1.5 text-xs text-faint shrink-0">
                <LockIcon /> gesperrt
              </span>
            </div>
          ))}
        </div>
      )}

      {/* So geht's weiter (kein Befund-Inhalt, Fall-Bezug über Schreiben-Typ) */}
      <div className="rounded-xl border border-line overflow-hidden">
        <div className="px-4 py-2.5 border-b border-line">
          <span className="text-[11px] font-medium tracking-[0.12em] text-faint">SO GEHT&apos;S WEITER</span>
        </div>
        <div className="divide-y divide-line">
          {nextSteps.map((step, i) => (
            <div key={step.title} className="flex items-start gap-3 px-4 py-3">
              <span className="text-xs font-medium tabular-nums text-accent-soft w-6 shrink-0 pt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-sm font-semibold text-fg">{step.title}</p>
                <p className="text-xs text-muted leading-relaxed mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-accent-border bg-accent-bg/40 rounded-xl p-6">
        <p className="font-bold text-fg mb-3">Vollständigen Bericht freischalten</p>
        <ul className="text-sm text-muted space-y-1.5 mb-4">
          <li className="flex gap-2"><span className="text-accent-soft">✓</span> Alle Fehler mit Begründung, Beleg &amp; Rechtsgrundlage</li>
          {preview.hasDirect && <li className="flex gap-2"><span className="text-accent-soft">✓</span> Fertiger Widerspruchsbrief als PDF</li>}
          {preview.hasReview && <li className="flex gap-2"><span className="text-accent-soft">✓</span> Belegeinsicht-Schreiben (§ 259 BGB) als PDF</li>}
          <li className="flex gap-2"><span className="text-accent-soft">✓</span> Konkrete Handlungsempfehlungen</li>
        </ul>

        <label className="flex items-start gap-2 text-xs text-muted mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 accent-accent"
          />
          <span>
            Ich verlange die sofortige Bereitstellung und bestätige, dass mein Widerrufsrecht
            mit vollständiger Bereitstellung erlischt.
          </span>
        </label>

        <button
          onClick={startCheckout}
          disabled={!consent || loading}
          className="w-full rounded-xl bg-accent hover:bg-accent-hover active:scale-[0.98] text-white font-bold py-3.5 text-base tabular-nums transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {loading ? "Weiterleitung…" : "Für 9,90 € freischalten"}
        </button>
        {error && <p className="mt-3 text-sm text-[#FCA5A5]">{error}</p>}
      </div>

      {preview.mock && (
        <a
          href={`/ergebnis?id=${preview.id}`}
          className="block text-center rounded-xl border border-dashed border-[#92400E] bg-[#1C1A0E] text-[#FCD34D] text-sm font-semibold py-3 px-4 hover:bg-[#231f12] transition-colors"
        >
          Demo-Modus: Bericht ohne Bezahlung öffnen →
        </a>
      )}

      <button onClick={onReset} className="w-full text-sm text-muted hover:text-fg py-2 transition-colors">
        Andere Datei prüfen
      </button>
    </div>
  );
}

function LockIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
