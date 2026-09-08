"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import ResultView from "@/components/ResultView";
import SiteShell from "@/components/SiteShell";
import { Link, useRouter } from "@/i18n/navigation";
import { AnalysisResult } from "@/types";
import Button from "@/components/ui/Button";

const POLL_ATTEMPTS = 5;
const POLL_DELAY_MS = 1500;

function ErgebnisInner() {
  const t = useTranslations("ergebnis");
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const sessionId = params.get("session_id");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0); // Retry-Button erhöht → Effekt läuft erneut

  useEffect(() => {
    if (!id) {
      setError(t("noId"));
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPending(false);
    const query = new URLSearchParams({ id });
    if (sessionId) query.set("session_id", sessionId);

    // Webhook kann minimal verzögert sein → mehrfach mit kurzer Pause versuchen.
    // Die result-Route fragt bei session_id zusätzlich Stripe direkt (Fallback).
    (async () => {
      try {
        for (let i = 0; i < POLL_ATTEMPTS; i++) {
          const res = await fetch(`/api/result?${query}`);
          if (cancelled) return;
          if (res.ok) {
            setResult(await res.json());
            setLoading(false);
            return;
          }
          // Serverfehler (z. B. Redis-Störung) ist nicht „abgelaufen" → Retry anbieten.
          if (res.status >= 500) break;
          if (res.status !== 402) {
            setError(t("notFound"));
            setLoading(false);
            return;
          }
          if (i < POLL_ATTEMPTS - 1) await new Promise((r) => setTimeout(r, POLL_DELAY_MS));
        }
      } catch {
        // Netzwerkfehler: nicht ewig „laden" zeigen, sondern den Retry anbieten.
      }
      if (!cancelled) {
        setPending(true);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // t ist stabil pro Locale; attempt triggert bewusst einen erneuten Lauf.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, sessionId, attempt]);

  if (loading) return <p className="text-center text-muted py-20">{t("loading")}</p>;

  if (pending) {
    return (
      <div className="text-center py-20 space-y-6">
        <p className="text-muted">{t("pending")}</p>
        <Button onClick={() => setAttempt((a) => a + 1)}>{t("retry")}</Button>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="text-center py-20 space-y-6">
        <p className="text-status-danger">{error ?? t("notFound")}</p>
        <Link href="/" className="inline-flex items-center min-h-11 text-sm text-accent underline hover:text-accent-hover">
          {t("home")}
        </Link>
      </div>
    );
  }

  return <ResultView result={result} id={id!} onReset={() => router.push("/")} />;
}

export default function ErgebnisPage() {
  const t = useTranslations("ergebnis");
  return (
    // narrow: ResultView ist auf eine Lesespalte ausgelegt, nicht auf die volle Blattbreite.
    <SiteShell width="narrow">
      <Suspense fallback={<p className="text-center text-muted py-20">{t("loading")}</p>}>
        <ErgebnisInner />
      </Suspense>
    </SiteShell>
  );
}
