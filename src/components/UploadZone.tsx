"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { ProgressBar, PhaseList } from "./ActivityIndicator";
import { Link } from "@/i18n/navigation";
import {
  MAX_FILE_BYTES,
  MAX_FILE_MB,
  MAX_SOURCE_FILE_BYTES,
  MAX_SOURCE_FILE_MB,
} from "@/lib/limits";
import { ALLOWED_MEDIA_TYPES } from "@/lib/fileType";

interface Props {
  onUpload: (file: File) => void;
  loading: boolean;
  error: string | null;
}

// Eine Quelle für erlaubte Typen: dieselbe Liste, die die Route serverseitig sniffed.
const ACCEPTED_TYPES: readonly string[] = ALLOWED_MEDIA_TYPES;

export default function UploadZone({ onUpload, loading, error }: Props) {
  const t = useTranslations("upload");
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) return t("errInvalidType");
    // Fotos dürfen groß ankommen – sie werden vor dem Upload verkleinert. Nur
    // was selbst dafür zu schwer ist, wird abgewiesen. PDFs behalten die harte
    // Grenze, weil sie ungekürzt an die Function gehen.
    if (file.type.startsWith("image/")) {
      if (file.size > MAX_SOURCE_FILE_BYTES) {
        return t("errImageTooLarge", { mb: MAX_SOURCE_FILE_MB });
      }
      return null;
    }
    if (file.size > MAX_FILE_BYTES) return t("errTooLarge", { mb: MAX_FILE_MB });
    return null;
  };

  const handleFile = (file: File) => {
    const err = validate(file);
    if (err) { setFileError(err); return; }
    setFileError(null);
    onUpload(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const displayError = fileError || error;

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={loading ? -1 : 0}
        aria-label={t("ariaLabel")}
        onClick={() => !loading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!loading && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragging(false);
          }
        }}
        onDrop={onDrop}
        className={`
          relative rounded-2xl border-2 border-dashed transition-colors cursor-pointer
          flex flex-col items-center justify-center
          min-h-[240px] p-11 text-center
          ${dragging
            ? "border-accent bg-accent-soft"
            : "border-paper-line-control bg-doc hover:border-accent hover:bg-accent-soft"
          }
          ${loading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={onInputChange}
          className="hidden"
          aria-describedby={displayError ? "upload-error" : undefined}
        />

        {loading ? (
          <LoadingState />
        ) : (
          <>
            <div className="w-11 h-11 bg-accent-soft border border-accent-border rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
                  d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 17v1.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V17" />
              </svg>
            </div>
            <p className="text-xl font-bold text-fg mb-1">
              {t("heading")}
            </p>
            <p className="text-sm text-muted mb-4">{t("hint")}</p>
            <span className="text-[12.5px] text-faint">
              {t("formats", { mb: MAX_FILE_MB })}
            </span>
          </>
        )}
      </div>

      {/* 12,5 px statt text-xs: unterhalb dieser Größe trägt "faint" den Kontrast nicht. */}
      <p className="text-[12.5px] text-faint text-center leading-relaxed">
        {t.rich("privacyHint", {
          link: (chunks) => (
            <Link href="/datenschutz" className="underline text-accent hover:text-accent-hover">{chunks}</Link>
          ),
        })}
      </p>

      {displayError && (
        <div id="upload-error" role="alert" className="flex items-start gap-2 bg-status-dangerBg border border-status-dangerBorder rounded-xl p-4 text-sm text-status-danger">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {displayError}
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  const t = useTranslations("upload");
  const phases = t.raw("phases") as string[];
  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-xs">
      <div className="w-full">
        <ProgressBar />
      </div>
      <div className="w-12 h-12 rounded-full border-2 border-paper-line border-t-accent animate-spin" />
      <div className="space-y-1 text-center">
        <p className="font-semibold text-fg">{t("loadingTitle")}</p>
        <p className="text-sm text-muted">{t("loadingSubtitle")}</p>
      </div>
      <PhaseList phases={phases} />
    </div>
  );
}
