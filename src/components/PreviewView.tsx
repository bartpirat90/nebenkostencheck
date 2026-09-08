"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PreviewData } from "@/types";
import { useApiErrorMessage } from "@/lib/clientErrors";
import { savePreview } from "@/lib/previewStorage";
import Button from "@/components/ui/Button";

interface Props {
  preview: PreviewData;
  onReset: () => void;
}

export default function PreviewView({ preview, onReset }: Props) {
  const t = useTranslations("teaser");
  const te = useTranslations("errors");
  const apiMessage = useApiErrorMessage();
  const locale = useLocale();
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
        body: JSON.stringify({ id: preview.id, locale }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => null);
        throw new Error(apiMessage(e, t("checkoutError")));
      }
      const { url } = await res.json();
      // Vorschau vor der Weiterleitung sichern: bricht der Nutzer bei Stripe ab,
      // holen wir sie zurueck statt eine zweite KI-Analyse zu erzwingen.
      savePreview(preview);
      window.location.href = url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : te("unknown"));
      setLoading(false);
    }
  };

  const potential =
    preview.totalPotentialEur != null
      ? `~${preview.totalPotentialEur.toFixed(0)} €`
      : preview.totalPotentialLabel ?? t("potentialFallback");

  // Schreiben-Typ aus der Befundlage (Fall-Bezug, ohne Inhalt zu verraten).
  const letterKind =
    preview.hasDirect && preview.hasReview
      ? t("kindBoth")
      : preview.hasReview
      ? t("kindReview")
      : t("kindObjection");

  const nextSteps = [
    { title: t("stepUnlockTitle"), desc: t("stepUnlockDesc") },
    { title: t("stepLetterTitle"), desc: t("stepLetterDesc", { kind: letterKind }) },
    { title: t("stepSendTitle"), desc: t("stepSendDesc") },
  ];

  return (
    <div className="space-y-5">
      {/* Bericht-Kopf */}
      <div className="rounded-[14px] border border-paper-line bg-doc p-6">
        <p className="text-[12.5px] text-faint mb-2">{t("firstCheckDone")}</p>
        <p className="text-[30px] font-extrabold leading-[1.1] tracking-[-0.02em] text-fg tabular-nums">
          {t("findings", { count: preview.errorCount })}
        </p>
        <div className="flex items-baseline justify-between gap-3 border-t border-paper-line mt-4 pt-4">
          <span className="text-sm text-muted">{t("potentialLabel")}</span>
          <span className="text-lg font-extrabold text-accent tabular-nums">{potential}</span>
        </div>
      </div>

      {preview.errorTitles.length > 0 && (
        <div className="rounded-[14px] border border-paper-line bg-doc divide-y divide-paper-line">
          {preview.errorTitles.map((title, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <span className="w-2 h-2 rounded-full shrink-0 bg-status-neutralStrong" />
              {/* Titel bewusst in faint: der Inhalt ist noch nicht gekauft. */}
              <span className="text-sm font-medium text-faint min-w-0">{title}</span>
              <span className="ms-auto flex items-center gap-1.5 text-[12.5px] text-faint shrink-0">
                <LockIcon /> {t("locked")}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* So geht's weiter (kein Befund-Inhalt, Fall-Bezug über Schreiben-Typ) */}
      <div className="rounded-[14px] border border-paper-line bg-doc overflow-hidden">
        <div className="px-4 py-2.5 border-b border-paper-line">
          <span className="text-[12.5px] text-faint">{t("howItGoes")}</span>
        </div>
        <div className="divide-y divide-paper-line">
          {nextSteps.map((step, i) => (
            <div key={step.title} className="flex items-start gap-3 px-4 py-3">
              <span className="text-xs font-medium tabular-nums text-accent w-6 shrink-0 pt-0.5">
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

      <div className="rounded-[14px] border border-accent-border bg-accent-soft p-6">
        <p className="font-bold text-fg mb-3">{t("unlockTitle")}</p>
        <ul className="text-sm text-muted space-y-2.5 mb-4">
          {[
            t("featureAll"),
            preview.hasDirect ? t("featureObjection") : null,
            preview.hasReview ? t("featureReview") : null,
            t("featureRecommendations"),
          ]
            .filter((label): label is string => label !== null)
            .map((label) => (
              <li key={label} className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-md bg-doc border border-accent-border flex items-center justify-center text-accent text-[12px] leading-none">
                  ✓
                </span>
                <span>{label}</span>
              </li>
            ))}
        </ul>

        {/* min-h-11 + größere Box: Checkbox ist Teil des Bezahl-Flows, Touch-Ziel ≥ 44 px */}
        <label className="flex items-center gap-3 min-h-11 text-xs text-muted mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="w-5 h-5 shrink-0 accent-accent"
          />
          <span>{t("consent")}</span>
        </label>

        <Button
          size="lg"
          className="w-full tabular-nums"
          onClick={startCheckout}
          disabled={!consent}
          loading={loading}
        >
          {loading ? t("redirecting") : t("unlockCta")}
        </Button>
        {error && <p className="mt-3 text-sm text-status-danger">{error}</p>}
      </div>

      {/* Nur im Testmodus sichtbar: bewusst als gestrichelte Warn-Kachel und
          nicht als Button-Variante – das ist ein Debug-Hinweis, kein CTA. */}
      {preview.mock && (
        <a
          href={`/ergebnis?id=${preview.id}`}
          className="block text-center rounded-xl border border-dashed border-status-warnBorder bg-status-warnBg text-status-warn text-sm font-semibold py-3 px-4 hover:border-status-warnStrong transition-colors"
        >
          {t("demo")}
        </a>
      )}

      <Button variant="ghost" className="w-full" onClick={onReset}>
        {t("checkAnother")}
      </Button>
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
