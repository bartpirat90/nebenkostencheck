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

  return (
    <div className="space-y-5">
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 text-center">
        <p className="text-sm text-[#94A3B8] mb-1">Erste Prüfung abgeschlossen</p>
        <p className="text-3xl font-black text-[#F1F5F9]">
          {preview.errorCount} {preview.errorCount === 1 ? "Auffälligkeit" : "Auffälligkeiten"} gefunden
        </p>
        <p className="mt-2 text-lg font-bold bg-gradient-to-r from-[#818CF8] to-[#C084FC] bg-clip-text text-transparent">
          Mögliches Erstattungspotenzial: {potential}
        </p>
      </div>

      {preview.errorTitles.length > 0 && (
        <ul className="space-y-2">
          {preview.errorTitles.map((title, i) => (
            <li key={i} className="flex items-center gap-3 bg-[#1E293B] border border-[#334155] rounded-xl p-3">
              <span className="w-6 h-6 rounded-full bg-[#1E1B4B] text-[#818CF8] text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-sm font-medium text-[#F1F5F9]">{title}</span>
              <span className="ml-auto text-xs text-[#475569]">🔒 Details gesperrt</span>
            </li>
          ))}
        </ul>
      )}

      {/* Wasserzeichen-Brief-Vorschau (statisches Mockup, kein echter Inhalt) */}
      <div className="relative rounded-2xl overflow-hidden border border-[#334155]">
        <div className="bg-[#0F172A] p-6 blur-[3px] select-none pointer-events-none space-y-2" aria-hidden="true">
          <div className="h-2.5 w-1/3 bg-[#334155] rounded" />
          <div className="h-2 w-1/2 bg-[#1E293B] rounded" />
          <div className="h-2 w-2/3 bg-[#1E293B] rounded mt-4" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-2 w-full bg-[#1E293B] rounded" />
          ))}
          <div className="h-2 w-1/4 bg-[#334155] rounded mt-4" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="rotate-[-8deg] text-[#94A3B8] font-black text-xl tracking-widest border-2 border-[#475569] rounded-lg px-4 py-1 bg-[#0F172A]/60">
            VORSCHAU
          </span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#1E1B4B] to-[#1E293B] border border-[#3730A3] rounded-2xl p-6">
        <p className="font-bold text-[#F1F5F9] mb-1">Vollständigen Bericht freischalten</p>
        <ul className="text-sm text-[#94A3B8] space-y-1 mb-4">
          <li>✓ Alle Fehler mit Begründung, Beleg & Rechtsgrundlage</li>
          {preview.hasDirect && <li>✓ Fertiger Widerspruchsbrief als PDF</li>}
          {preview.hasReview && <li>✓ Belegeinsicht-Schreiben (§ 259 BGB) als PDF</li>}
          <li>✓ Konkrete Handlungsempfehlungen</li>
        </ul>

        <label className="flex items-start gap-2 text-xs text-[#94A3B8] mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Ich verlange die sofortige Bereitstellung und bestätige, dass mein Widerrufsrecht
            mit vollständiger Bereitstellung erlischt.
          </span>
        </label>

        <button
          onClick={startCheckout}
          disabled={!consent || loading}
          className="w-full rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold py-3.5 text-base hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Weiterleitung…" : "Für 9,90 € freischalten"}
        </button>
        {error && <p className="mt-3 text-sm text-[#FCA5A5]">{error}</p>}
      </div>

      <button onClick={onReset} className="w-full text-sm text-[#64748B] hover:text-[#94A3B8] py-2">
        Andere Datei prüfen
      </button>
    </div>
  );
}
