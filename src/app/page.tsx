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

      {!preview && !loading ? (
        /* Landing: eine Lesespalte + schmale, klebende Akten-Randleiste (nur Desktop) */
        <div className="max-w-6xl mx-auto px-6 pt-10 lg:pt-14 pb-16">
          <div className="lg:grid lg:grid-cols-[12rem_minmax(0,1fr)_14rem] lg:gap-10">

            {/* Linke Randspalte: belegtes Editorial-Zitat (nur Desktop) */}
            <aside className="hidden lg:block">
              <figure className="sticky top-24 m-0 border-r border-line pr-6">
                <div aria-hidden className="text-accent-soft text-4xl leading-none mb-1">&ldquo;</div>
                <blockquote className="m-0 text-sm text-muted leading-relaxed hyphens-auto break-words">
                  Rund die Hälfte aller Betriebskostenabrechnungen ist fehlerhaft.
                </blockquote>
                <figcaption className="mt-3 text-xs text-faint">Deutscher Mieterbund</figcaption>
              </figure>
            </aside>

            {/* Hauptspalte */}
            <div className="min-w-0">
              <LandingHero />
              <Reveal>
                <StatsBar />
              </Reveal>
              <Reveal delay={80}>
                <HowItWorks />
              </Reveal>
              <div id="upload" className="mt-2">
                <UploadZone onUpload={handleFileUpload} loading={loading} error={error} />
              </div>
            </div>

            {/* Rechte Akten-Randleiste (nur Desktop) */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 border-l border-line pl-6 space-y-7">
                <div>
                  <p className="text-[11px] font-medium tracking-[0.12em] text-faint mb-3">GEPRÜFT, NICHT GESCHÄTZT</p>
                  <ul className="space-y-1.5 text-sm text-muted">
                    <li>BetrKV</li>
                    <li>HeizkV</li>
                    <li>BGH-Rechtsprechung</li>
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-medium tracking-[0.12em] text-faint mb-3">DEINE SICHERHEIT</p>
                  <ul className="space-y-2 text-sm text-muted">
                    <li className="flex items-center gap-2"><span className="text-accent-soft">✓</span> DSGVO-konform</li>
                    <li className="flex items-center gap-2"><span className="text-accent-soft">✓</span> Löschung nach 24 h</li>
                    <li className="flex items-center gap-2"><span className="text-accent-soft">✓</span> Kein Account nötig</li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </div>
      ) : (
        /* Laden / Teaser / Ergebnis: schmale Lesespalte */
        <div id="upload" className="max-w-2xl mx-auto px-6 pt-10 pb-12">
          {loading ? (
            <UploadZone onUpload={handleFileUpload} loading={loading} error={error} />
          ) : preview?.notAStatement ? (
            <NotAStatementBox onReset={handleReset} />
          ) : (
            <PreviewView preview={preview!} onReset={handleReset} />
          )}
        </div>
      )}

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
