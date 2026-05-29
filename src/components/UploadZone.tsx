"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";

interface Props {
  onUpload: (file: File) => void;
  loading: boolean;
  error: string | null;
}

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;

export default function UploadZone({ onUpload, loading, error }: Props) {
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) return "Nur PDF, JPG, PNG oder WebP erlaubt.";
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `Datei zu groß (max. ${MAX_SIZE_MB} MB).`;
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
        aria-label="Abrechnung hochladen"
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
          relative rounded-2xl border-2 border-dashed transition-all cursor-pointer
          flex flex-col items-center justify-center
          min-h-[220px] p-8 text-center
          ${dragging
            ? "border-[#6366F1] bg-[#1E1B4B]/30"
            : "border-[#334155] bg-[#1E293B] hover:border-[#6366F1] hover:bg-[#1E1B4B]/20"
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
            <div className="w-14 h-14 bg-[#1E1B4B] rounded-full flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-[#818CF8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="font-semibold text-[#F1F5F9] text-base mb-1">
              Abrechnung hier ablegen
            </p>
            <p className="text-sm text-[#64748B] mb-4">oder klicken zum Auswählen</p>
            <span className="text-xs bg-[#1E293B] border border-[#334155] text-[#475569] px-3 py-1 rounded-full">
              PDF, JPG, PNG · max. 10 MB
            </span>
          </>
        )}
      </div>

      {displayError && (
        <div id="upload-error" role="alert" className="flex items-start gap-2 bg-[#1C0F0F] border border-[#991B1B] rounded-xl p-4 text-sm text-[#FCA5A5]">
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
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-2 border-[#334155] border-t-[#6366F1] animate-spin" />
      <div className="space-y-1 text-center">
        <p className="font-semibold text-[#F1F5F9]">Deine Abrechnung wird geprüft…</p>
        <p className="text-sm text-[#64748B]">Das dauert meist 10–20 Sekunden</p>
      </div>
      <div className="flex flex-col gap-1.5 w-full max-w-xs text-xs text-[#64748B]">
        {[
          "Dokument wird gelesen",
          "Positionen werden extrahiert",
          "Fehler werden geprüft",
          "Gutschriftpotenzial wird berechnet",
        ].map((step, i) => (
          <div
            key={step}
            className="flex items-center gap-2 animate-pulse"
            style={{ animationDelay: `${i * 400}ms` }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] opacity-60" />
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}
