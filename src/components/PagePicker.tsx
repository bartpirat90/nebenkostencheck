"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Button from "./ui/Button";
import { MAX_PDF_PAGES } from "@/lib/limits";
import type { PageThumb } from "@/lib/pdfPages";

interface Props {
  file: File;
  /** Gewählte Seiten (1-basiert); undefined heißt „alle“ – dann bleibt ein kleines PDF unangetastet. */
  onConfirm: (pages: number[] | undefined) => void;
  onCancel: () => void;
}

/**
 * Seitenauswahl vor der Prüfung: Vorschaubilder aller Seiten, abwählbar per
 * Klick. Spart bei langen Abrechnungen Bytes und Token – der Energiemix am
 * Ende einer Heizkostenabrechnung kostet sonst mehrere tausend Token, ohne
 * etwas zur Prüfung beizutragen. Leere Seiten sind vorab abgewählt.
 */
export default function PagePicker({ file, onConfirm, onCancel }: Props) {
  const t = useTranslations("pagePicker");
  const tUpload = useTranslations("upload");
  const [count, setCount] = useState<number | null>(null);
  const [thumbs, setThumbs] = useState<Record<number, PageThumb>>({});
  const [skipped, setSkipped] = useState<ReadonlySet<number>>(new Set());
  // Seiten, die der Nutzer selbst angefasst hat: Die Leerseiten-Erkennung
  // läuft nach, und ihr Vorschlag darf eine bewusste Wahl nicht überschreiben.
  const touched = useRef(new Set<number>());
  const rootRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef(onConfirm);

  useEffect(() => {
    confirmRef.current = onConfirm;
  });

  useEffect(() => {
    // Die Auswahl ersetzt die Startseite; ohne Sprung stünde der Nutzer mitten
    // im leeren Raum, wo eben noch die Upload-Fläche war.
    rootRef.current?.scrollIntoView({ block: "start" });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const urls: string[] = [];
    import("@/lib/pdfPages")
      .then(({ renderThumbnails }) =>
        renderThumbnails(
          file,
          {
            onCount: setCount,
            onThumb: (page, thumb) => {
              urls.push(thumb.url);
              setThumbs((prev) => ({ ...prev, [page]: thumb }));
              if (thumb.blank && !touched.current.has(page)) {
                setSkipped((prev) => new Set(prev).add(page));
              }
            },
          },
          controller.signal,
        ),
      )
      // Kann pdf.js die Datei nicht öffnen (etwa passwortgeschützt), geht sie
      // wie früher als Ganzes zur Prüfung – der Server entscheidet dann.
      .catch(() => {
        if (!controller.signal.aborted) confirmRef.current(undefined);
      });
    return () => {
      controller.abort();
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [file]);

  const pages = count === null ? [] : Array.from({ length: count }, (_, i) => i + 1);
  const selected = pages.length - skipped.size;
  const blankCount = pages.filter((n) => thumbs[n]?.blank).length;
  const tooMany = selected > MAX_PDF_PAGES;
  // Solange noch keine Seite gezeichnet ist, gilt A4 als Platzhalterformat.
  const placeholderRatio = thumbs[1] ? thumbs[1].height / thumbs[1].width : Math.SQRT2;

  const toggle = (page: number) => {
    touched.current.add(page);
    setSkipped((prev) => {
      const next = new Set(prev);
      if (next.has(page)) next.delete(page);
      else next.add(page);
      return next;
    });
  };

  const selectAll = () => {
    pages.forEach((n) => touched.current.add(n));
    setSkipped(new Set());
  };

  const confirm = () => {
    onConfirm(skipped.size === 0 ? undefined : pages.filter((n) => !skipped.has(n)));
  };

  return (
    <div
      ref={rootRef}
      className="scroll-mt-24 rounded-2xl border border-paper-line bg-doc px-5 pt-6 sm:px-8 sm:pt-8"
    >
      <h2 className="text-balance text-[20px] font-extrabold leading-[1.2] tracking-[-0.02em] text-fg sm:text-[24px]">
        {t("title")}
      </h2>
      <p className="mt-3 max-w-[62ch] text-[15px] leading-[1.55] text-muted">
        {count === null ? t("loading") : t("intro", { count })}
      </p>
      {blankCount > 0 && (
        <p className="mt-2 max-w-[62ch] text-[15px] leading-[1.55] text-muted">
          {t("blankNote", { count: blankCount })}
        </p>
      )}
      {/* Neuer Tab: Beim Wechsel der Seite ginge die gewählte Datei verloren. */}
      <Link
        href="/upload-hilfe"
        target="_blank"
        rel="noopener"
        className="mt-1 inline-flex min-h-11 items-center text-sm text-accent underline hover:text-accent-hover"
      >
        {tUpload("helpLink")}
      </Link>

      <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-4">
        {pages.map((n) => {
          const thumb = thumbs[n];
          const isSelected = !skipped.has(n);
          const status = thumb?.blank ? t("blank") : isSelected ? null : t("skipped");
          return (
            <li key={n}>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggle(n)}
                className="group block w-full rounded-lg text-left"
              >
                <span
                  className={`relative block overflow-hidden rounded-lg border transition-colors ${
                    isSelected
                      ? "border-accent ring-1 ring-accent"
                      : "border-paper-line group-hover:border-paper-line-control"
                  }`}
                >
                  {thumb ? (
                    // Blob-URL aus dem Browser: next/image kann damit nichts anfangen.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb.url}
                      width={thumb.width}
                      height={thumb.height}
                      alt=""
                      className={`block h-auto w-full transition-opacity duration-150 ${
                        isSelected ? "" : "opacity-40"
                      }`}
                    />
                  ) : (
                    <span
                      className="block w-full bg-paper-2 motion-safe:animate-pulse"
                      style={{ aspectRatio: `1 / ${placeholderRatio}` }}
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className={`absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full ${
                      isSelected ? "bg-accent text-doc" : "border-2 border-paper-line-control bg-doc"
                    }`}
                  >
                    {isSelected && (
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                </span>
                <span className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-2 text-[12.5px] leading-snug">
                  <span className="font-semibold tabular-nums text-fg">{t("page", { n })}</span>
                  {status && <span className="text-faint">{status}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Klebt am unteren Rand, damit der Button auch bei 30 Seiten erreichbar bleibt. */}
      <div className="sticky bottom-0 -mx-5 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-b-2xl border-t border-paper-line bg-doc px-5 py-4 sm:-mx-8 sm:px-8">
        <div className="min-w-0 text-sm" role="status">
          <p className="tabular-nums text-muted">
            {count === null ? " " : t("selectedCount", { selected, total: count })}
          </p>
          {tooMany && <p className="text-status-danger">{t("tooMany", { max: MAX_PDF_PAGES })}</p>}
          {count !== null && selected === 0 && <p className="text-status-danger">{t("noneSelected")}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {skipped.size > 0 && (
            <Button variant="ghost" onClick={selectAll}>
              {t("selectAll")}
            </Button>
          )}
          <Button variant="secondary" onClick={onCancel}>
            {t("cancel")}
          </Button>
          <Button onClick={confirm} disabled={count === null || selected === 0 || tooMany}>
            {t("confirm", { count: selected })}
          </Button>
        </div>
      </div>
    </div>
  );
}
