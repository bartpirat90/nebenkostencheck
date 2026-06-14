"use client";

import { useState, useCallback } from "react";
import UploadZone from "@/components/UploadZone";
import PreviewView from "@/components/PreviewView";
import LandingHero from "@/components/LandingHero";
import StatsBar from "@/components/StatsBar";
import HowItWorks from "@/components/HowItWorks";
import { PreviewData } from "@/types";
import { MAX_FILE_BYTES, MAX_FILE_MB } from "@/lib/limits";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";

export default function Home() {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setError(`Die Datei ist zu groß (max. ${MAX_FILE_MB} MB). Bitte lade die Abrechnung als PDF oder Foto hoch — große Scans vorher komprimieren.`);
      setPreview(null);
      return;
    }
    setLoading(true);
    setError(null);
    setPreview(null);

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
          if (response.status === 413) {
            errorMessage = `Die Datei ist zu groß (max. ${MAX_FILE_MB} MB). Bitte lade die Abrechnung als PDF oder Foto hoch — große Scans vorher komprimieren.`;
          } else if (response.status === 504 || response.status === 503) {
            errorMessage = "Der Prüfdienst ist gerade stark ausgelastet. Bitte in einem Moment erneut versuchen.";
          }
        }
        throw new Error(errorMessage);
      }

      const data: PreviewData = await response.json();
      setPreview(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReset = () => {
    setPreview(null);
    setError(null);
  };

  return (
    <main className="min-h-[100dvh] bg-ink">
      {/* Navigation */}
      <nav className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b border-line bg-ink/90 backdrop-blur-sm">
        <Logo />
        <span className="hidden sm:inline-block text-[11px] font-medium tracking-[0.14em] text-faint">
          PRÜFBERICHT · GRATIS
        </span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 pb-12">
        {/* Landing sections – nur vor der Analyse */}
        {!preview && !loading && (
          <>
            <LandingHero />
            <Reveal>
              <StatsBar />
            </Reveal>
            <Reveal delay={80}>
              <HowItWorks />
            </Reveal>
          </>
        )}

        {/* Upload oder Vorschau */}
        <div id="upload">
          {!preview ? (
            <UploadZone onUpload={handleFileUpload} loading={loading} error={error} />
          ) : preview.notAStatement ? (
            <NotAStatementBox onReset={handleReset} />
          ) : (
            <PreviewView preview={preview} onReset={handleReset} />
          )}
        </div>

      </div>

      <Footer />
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
        className="rounded-xl bg-accent hover:bg-accent-hover active:scale-[0.98] text-white font-semibold py-3 px-6 text-sm transition-colors"
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
