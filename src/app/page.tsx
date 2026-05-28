"use client";

import { useState, useCallback } from "react";
import UploadZone from "@/components/UploadZone";
import ResultView from "@/components/ResultView";
import LandingHero from "@/components/LandingHero";
import StatsBar from "@/components/StatsBar";
import HowItWorks from "@/components/HowItWorks";
import { AnalysisResult } from "@/types";

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const base64 = await fileToBase64(file);
      const mediaType = file.type || "application/pdf";

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, mediaType, fileName: file.name }),
      });

      if (!response.ok) {
        let errorMessage = "Analyse fehlgeschlagen. Bitte erneut versuchen.";
        try {
          const err = await response.json();
          errorMessage = err.error || errorMessage;
        } catch {
          if (response.status === 504 || response.status === 503) {
            errorMessage = "Die KI ist gerade stark ausgelastet. Bitte in einem Moment erneut versuchen.";
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-[#0F172A]">
      {/* Navigation */}
      <nav className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b border-[#1E293B] bg-[#0F172A]/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-black">NK</span>
          </div>
          <span className="font-black text-[#F1F5F9] tracking-tight text-lg">
            Nebenkostencheck
          </span>
        </div>
        <span className="text-xs text-[#64748B] bg-[#1E293B] px-3 py-1 rounded-full border border-[#334155]">
          Kostenlos & ohne Anmeldung
        </span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 pb-12">
        {/* Landing sections – nur vor der Analyse */}
        {!result && !loading && (
          <>
            <LandingHero />
            <StatsBar />
            <HowItWorks />
          </>
        )}

        {/* Upload oder Ergebnis */}
        <div id="upload">
          {!result ? (
            <UploadZone onUpload={handleFileUpload} loading={loading} error={error} />
          ) : result.notAStatement ? (
            <NotAStatementBox onReset={handleReset} />
          ) : (
            <ResultView result={result} onReset={handleReset} />
          )}
        </div>

        {/* Footer-Disclaimer */}
        {!result && !loading && (
          <p className="mt-8 text-center text-xs text-[#334155] leading-relaxed">
            © 2026 Nebenkostencheck · DSGVO-konform · Keine Datenspeicherung
          </p>
        )}
      </div>
    </main>
  );
}

function NotAStatementBox({ onReset }: { onReset: () => void }) {
  return (
    <div className="bg-[#1C1A0E] border border-[#92400E] rounded-2xl p-8 text-center">
      <div className="w-12 h-12 bg-[#451a03] rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-[#FCD34D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="font-bold text-[#FCD34D] text-lg mb-2">Kein passendes Dokument erkannt</p>
      <p className="text-sm text-[#D97706] leading-relaxed mb-6">
        Das sieht nicht wie eine Nebenkostenabrechnung aus.<br />
        Bitte lade deine Abrechnung als PDF oder Foto hoch.
      </p>
      <button
        onClick={onReset}
        className="rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold py-3 px-6 text-sm hover:opacity-90 transition-opacity"
      >
        Andere Datei hochladen
      </button>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
