"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import UploadZone from "@/components/UploadZone";
import PreviewView from "@/components/PreviewView";
import LandingHero from "@/components/LandingHero";
import ProofLine from "@/components/ProofLine";
import HowItWorks from "@/components/HowItWorks";
import { PreviewData } from "@/types";
import { MAX_FILE_BYTES, MAX_FILE_MB } from "@/lib/limits";
import { useApiErrorMessage } from "@/lib/clientErrors";
import { clearPreview, loadPreview } from "@/lib/previewStorage";
import Reveal from "@/components/Reveal";
import Faq from "@/components/Faq";
import SiteShell from "@/components/SiteShell";
import { SITE_URL } from "@/lib/constants";
import Button from "@/components/ui/Button";

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
    <SiteShell withNavLinks={!preview && !loading}>
      {/* Eigene, kleine Suspense-Grenze nur fuer useSearchParams: haelt sie fern von
          preview/notice weiter oben, damit ein Re-Suspend beim URL-Cleanup nicht
          den gesamten Seiten-State zuruecksetzt. */}
      <Suspense fallback={null}>
        <CancelRestore onRestore={handleCanceled} />
      </Suspense>

      {!preview && !loading ? (
        <>
          <LandingHero />
          <Reveal>
            <ProofLine />
          </Reveal>
          <Reveal delay={80}>
            <HowItWorks />
          </Reveal>
          <div id="upload" className="mt-12 scroll-mt-24">
            <UploadZone onUpload={handleFileUpload} loading={loading} error={error} />
          </div>
          <Reveal delay={120}>
            <Faq />
          </Reveal>
        </>
      ) : (
        /* Laden / Teaser: schmale Lesespalte innerhalb des Blatts */
        <div id="upload" className="max-w-2xl mx-auto">
          {loading ? (
            <UploadZone onUpload={handleFileUpload} loading={loading} error={error} />
          ) : preview?.notAStatement ? (
            <NotAStatementBox onReset={handleReset} />
          ) : (
            <>
              {notice && preview && (
                <div
                  role="status"
                  className="mb-4 rounded-xl border border-line bg-doc px-4 py-3 text-sm text-muted"
                >
                  {notice}
                </div>
              )}
              <PreviewView preview={preview!} onReset={handleReset} />
            </>
          )}
        </div>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
    </SiteShell>
  );
}

function NotAStatementBox({ onReset }: { onReset: () => void }) {
  const t = useTranslations("notAStatement");
  return (
    <div className="bg-status-warnBg border border-status-warnBorder rounded-2xl p-8 text-center">
      <div className="w-12 h-12 bg-status-warnBg border border-status-warnBorder rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-status-warn" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="font-bold text-status-warn text-lg mb-2">{t("title")}</p>
      <p className="text-sm text-muted leading-relaxed mb-6">{t("body")}</p>
      <Button onClick={onReset}>{t("cta")}</Button>
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
