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
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Nur PDF, JPG, PNG oder WebP erlaubt.";
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `Datei zu groß (max. ${MAX_SIZE_MB} MB).`;
    }
    return null;
  };

  const handleFile = (file: File) => {
    const err = validate(file);
    if (err) {
      setFileError(err);
      return;
    }
    setFileError(null);
    onUpload(file);
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
      {/* Drop zone */}
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`
          relative rounded-2xl border-2 border-dashed transition-all cursor-pointer
          flex flex-col items-center justify-center
          min-h-[220px] p-8 text-center
          ${dragging
            ? "border-[#2D5A1B] bg-[#EBF5E1]"
            : "border-[#C8C0B0] bg-white hover:border-[#2D5A1B] hover:bg-[#F9F7F3]"
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
        />

        {loading ? (
          <LoadingState />
        ) : (
          <>
            <div className="w-14 h-14 bg-[#EBF5E1] rounded-full flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-[#2D5A1B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="font-semibold text-[#1A1A1A] text-base mb-1">
              Abrechnung hier ablegen
            </p>
            <p className="text-sm text-[#888] mb-4">
              oder klicken zum Auswählen
            </p>
            <span className="text-xs bg-[#F0EDE7] text-[#888] px-3 py-1 rounded-full">
              PDF, JPG, PNG · max. 10 MB
            </span>
          </>
        )}
      </div>

      {/* Error */}
      {displayError && (
        <div className="flex items-start gap-2 bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-4 text-sm text-[#991B1B]">
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
      {/* Spinner */}
      <div className="w-12 h-12 rounded-full border-2 border-[#E0DBD0] border-t-[#2D5A1B] animate-spin" />
      <div className="space-y-1 text-center">
        <p className="font-semibold text-[#1A1A1A]">KI analysiert deine Abrechnung…</p>
        <p className="text-sm text-[#888]">Das dauert meist 10–20 Sekunden</p>
      </div>
      {/* Animated steps */}
      <div className="flex flex-col gap-1.5 w-full max-w-xs text-xs text-[#888]">
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
            <div className="w-1.5 h-1.5 rounded-full bg-[#2D5A1B] opacity-60" />
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}
