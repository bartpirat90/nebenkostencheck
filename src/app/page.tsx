"use client";

import { useState, useCallback } from "react";
import UploadZone from "@/components/UploadZone";
import ResultView from "@/components/ResultView";
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
    <main className="min-h-screen bg-[#F5F2EC]">
      {/* Header */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-[#E0DBD0]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#1A1A1A] rounded-sm flex items-center justify-center">
            <span className="text-[#F5F2EC] text-xs font-bold">NK</span>
          </div>
          <span className="font-bold text-[#1A1A1A] tracking-tight text-lg">
            Nebenkostencheck
          </span>
        </div>
        <span className="text-xs text-[#888] bg-[#E8E3DA] px-2 py-1 rounded-full">
          Kostenlos & ohne Anmeldung
        </span>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Hero */}
        {!result && !loading && (
          <div className="mb-10">
            <div className="inline-block bg-[#D4E8C2] text-[#2D5A1B] text-xs font-semibold px-3 py-1 rounded-full mb-4">
              KI-gestützte Prüfung in Sekunden
            </div>
            <h1 className="text-4xl font-bold text-[#1A1A1A] leading-tight mb-4 tracking-tight">
              Steckt Geld in deiner<br />
              <span className="text-[#2D5A1B]">Nebenkostenabrechnung?</span>
            </h1>
            <p className="text-[#555] text-lg leading-relaxed">
              Lade deine Abrechnung hoch – unsere KI prüft sie auf typische Fehler
              und schätzt dein Erstattungspotenzial.
            </p>
          </div>
        )}

        {/* Upload or Result */}
        {!result ? (
          <UploadZone onUpload={handleFileUpload} loading={loading} error={error} />
        ) : (
          <ResultView result={result} onReset={handleReset} />
        )}

        {/* Trust signals */}
        {!result && !loading && (
          <div className="mt-8 flex flex-wrap gap-4 text-sm text-[#888]">
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#2D5A1B]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Datei wird nicht gespeichert
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#2D5A1B]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              DSGVO-konform
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-[#2D5A1B]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Kein Account nötig
            </div>
          </div>
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
      resolve(result.split(",")[1]); // strip data:...;base64,
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
