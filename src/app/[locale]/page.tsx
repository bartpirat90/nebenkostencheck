"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import UploadZone from "@/components/UploadZone";
import PreviewView from "@/components/PreviewView";
import LandingHero from "@/components/LandingHero";
import StatsBar from "@/components/StatsBar";
import HowItWorks from "@/components/HowItWorks";
import { PreviewData } from "@/types";
import { MAX_FILE_BYTES, MAX_FILE_MB } from "@/lib/limits";
import { useApiErrorMessage } from "@/lib/clientErrors";
import { clearPreview, loadPreview } from "@/lib/previewStorage";
import Logo from "@/components/Logo";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import Faq from "@/components/Faq";
import LocaleSwitcher from "@/components/LocaleSwitcher";
import { SITE_URL } from "@/lib/constants";
import { reviews } from "@/lib/reviews";

export default function Home() {
  const t = useTranslations();
  const apiMessage = useApiErrorMessage();
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Zahlungsabbruch bei Stripe: gespeicherte Vorschau wiederherstellen statt
  // den Nutzer zu einer zweiten (kostenpflichtigen) KI-Analyse zu zwingen.
  const handleCanceled = useCallback(
    (restored: PreviewData) => {
      setPreview(restored);
      setNotice(t("teaser.canceled"));
    },
    [t]
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_BYTES) {
        setError(t("errors.fileTooLarge", { mb: MAX_FILE_MB }));
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
          let errorMessage = t("errors.analyzeFailed");
          try {
            const err = await response.json();
            errorMessage = apiMessage(err, errorMessage);
          } catch {
            if (response.status === 413) {
              errorMessage = t("errors.fileTooLarge", { mb: MAX_FILE_MB });
            } else if (response.status === 504 || response.status === 503) {
              errorMessage = t("errors.busy");
            }
          }
          throw new Error(errorMessage);
        }

        const data: PreviewData = await response.json();
        setPreview(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t("errors.unknown"));
      } finally {
        setLoading(false);
      }
    },
    [t, apiMessage]
  );

  const handleReset = () => {
    setPreview(null);
    setError(null);
    setNotice(null);
    // Wer bewusst neu startet, will die alte Vorschau nicht später zurückbekommen.
    clearPreview();
  };

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Nebenkostencheck",
    serviceType: "Prüfung von Nebenkostenabrechnungen",
    provider: { "@id": `${SITE_URL}/#organization` },
    areaServed: { "@type": "Country", name: "Deutschland" },
    description: t("meta.description"),
    offers: {
      "@type": "Offer",
      price: "9.90",
      priceCurrency: "EUR",
    },
  };

  return (
    <main className="min-h-[100dvh] bg-ink">
      {/* Eigene, kleine Suspense-Grenze nur fuer useSearchParams: haelt sie fern von
          preview/notice weiter oben, damit ein Re-Suspend beim URL-Cleanup nicht
          den gesamten Seiten-State zuruecksetzt. */}
      <Suspense fallback={null}>
        <CancelRestore onRestore={handleCanceled} />
      </Suspense>

      {/* Navigation */}
      <nav className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b border-line bg-ink/90 backdrop-blur-sm">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-[11px] font-medium tracking-[0.14em] text-faint">
            {t("nav.badge")}
          </span>
          <LocaleSwitcher />
        </div>
      </nav>

      {!preview && !loading ? (
        /* Landing: eine Lesespalte + schmale, klebende Akten-Randleiste (nur Desktop) */
        <div className="max-w-6xl mx-auto px-6 pt-10 lg:pt-14 pb-16">
          <div className="lg:grid lg:grid-cols-[12rem_minmax(0,1fr)_14rem] lg:gap-10">

            {/* Linke Randspalte: belegte Editorial-Stimmen (nur Desktop) */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 border-e border-line pe-6 space-y-5">
                <figure className="m-0">
                  <div aria-hidden className="text-accent-soft text-4xl leading-none mb-1">&ldquo;</div>
                  <blockquote className="m-0 text-sm text-muted leading-relaxed hyphens-auto break-words">
                    {t("evidence.mieterbundQuote")}
                  </blockquote>
                  <figcaption className="mt-2 text-xs text-faint">{t("evidence.mieterbundSource")}</figcaption>
                </figure>

                <figure className="m-0 border-t border-line pt-5">
                  <blockquote className="m-0 text-sm text-muted leading-relaxed hyphens-auto break-words">
                    {t("evidence.vzQuote")}
                  </blockquote>
                  <figcaption className="mt-2 text-xs text-faint">{t("evidence.vzSource")}</figcaption>
                </figure>

                <figure className="m-0 border-t border-line pt-5">
                  <blockquote className="m-0 text-sm text-muted leading-relaxed hyphens-auto break-words">
                    {t("evidence.fristQuote")}
                  </blockquote>
                  <figcaption className="mt-2 text-xs text-faint">{t("evidence.fristSource")}</figcaption>
                </figure>

                {/* Echte Kundenstimmen – erscheint nur, wenn welche eingetragen sind (src/lib/reviews.ts) */}
                {reviews.length > 0 && (
                  <div className="border-t border-line pt-5 space-y-5">
                    <p className="text-[11px] font-medium tracking-[0.12em] text-faint">{t("reviews.heading")}</p>
                    {reviews.map((r, i) => (
                      <figure key={i} className="m-0">
                        <blockquote className="m-0 text-sm text-muted leading-relaxed hyphens-auto break-words">
                          {r.text}
                        </blockquote>
                        <figcaption className="mt-2 text-xs text-faint">
                          {r.name}
                          {r.location ? ` · ${r.location}` : ""}
                        </figcaption>
                        {r.savedEur != null && (
                          <p className="mt-1 text-xs font-semibold text-accent-soft tabular-nums">
                            {t("reviews.saved", { amount: r.savedEur })}
                          </p>
                        )}
                      </figure>
                    ))}
                  </div>
                )}
              </div>
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
              <Reveal delay={120}>
                <Faq />
              </Reveal>
            </div>

            {/* Rechte Akten-Randleiste (nur Desktop) */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 border-s border-line ps-6 space-y-7">
                <div>
                  <p className="text-[11px] font-medium tracking-[0.12em] text-faint mb-3">{t("assurance.checkedTitle")}</p>
                  <ul className="space-y-1.5 text-sm text-muted">
                    <li>BetrKV</li>
                    <li>HeizkV</li>
                    <li>BGH-Rechtsprechung</li>
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-medium tracking-[0.12em] text-faint mb-3">{t("assurance.securityTitle")}</p>
                  <ul className="space-y-2 text-sm text-muted">
                    <li className="flex items-center gap-2"><span className="text-accent-soft">✓</span> {t("trust.dsgvo")}</li>
                    <li className="flex items-center gap-2"><span className="text-accent-soft">✓</span> {t("trust.deletion")}</li>
                    <li className="flex items-center gap-2"><span className="text-accent-soft">✓</span> {t("trust.noAccount")}</li>
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
            <>
              {notice && preview && (
                <div
                  role="status"
                  className="mb-4 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted"
                >
                  {notice}
                </div>
              )}
              <PreviewView preview={preview!} onReset={handleReset} />
            </>
          )}
        </div>
      )}

      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
    </main>
  );
}

function NotAStatementBox({ onReset }: { onReset: () => void }) {
  const t = useTranslations("notAStatement");
  return (
    <div className="bg-[#1C1A0E] border border-[#92400E] rounded-2xl p-8 text-center">
      <div className="w-12 h-12 bg-[#451a03] rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-[#FCD34D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="font-bold text-[#FCD34D] text-lg mb-2">{t("title")}</p>
      <p className="text-sm text-[#D97706] leading-relaxed mb-6">{t("body")}</p>
      <button
        onClick={onReset}
        className="rounded-xl bg-accent hover:bg-accent-hover active:scale-[0.98] text-white font-semibold py-3 px-6 text-sm transition-colors"
      >
        {t("cta")}
      </button>
    </div>
  );
}

/**
 * Liest den `canceled`/`id`-Query-Parameter und meldet eine passende gespeicherte
 * Vorschau an den Elternteil zurueck. Bewusst als eigene, winzige Komponente:
 * `useSearchParams` braucht eine Suspense-Grenze, und wenn diese Grenze beim
 * Bereinigen der URL neu rendert, darf das nur diese Komponente treffen – nicht
 * `Home` mit seinem preview/notice-State (sonst geht die Wiederherstellung sofort
 * wieder verloren, siehe Kommentar bei history.replaceState unten).
 */
function CancelRestore({ onRestore }: { onRestore: (preview: PreviewData) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("canceled") !== "1") return;
    const restored = loadPreview(searchParams.get("id"));
    if (restored) onRestore(restored);
    // Nur die URL-Leiste bereinigen (kein next-intl-Router-Push): jede Aenderung
    // an history.pushState/replaceState wird vom App Router abgefangen und laesst
    // diese Suspense-Grenze neu aufloesen. Da `onRestore` den State im Elternteil
    // (ausserhalb dieser Grenze) setzt, bleibt er davon unberuehrt.
    window.history.replaceState(null, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
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
