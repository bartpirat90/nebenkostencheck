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
        const err = await response.json();
        throw new Error(err.error || "Analyse fehlgeschlagen");
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
