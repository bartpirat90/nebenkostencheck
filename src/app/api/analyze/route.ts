import { NextRequest, NextResponse } from "next/server";
import { analyzeStatement, countDocumentTokens } from "@/lib/claude";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { MAX_FILE_BYTES, MAX_INPUT_TOKENS } from "@/lib/limits";
import { storeAnalysis } from "@/lib/kv";
import { classifyErrorCode } from "@/lib/errors";
import { apiError } from "@/lib/apiErrors";
import { isAllowedUpload, sniffMediaType } from "@/lib/fileType";
import { isUploadError, readUpload } from "@/lib/uploadRequest";
import { AnalysisResult, PreviewData } from "@/types";
import { MOCK } from "@/lib/mock";
import { InvalidAnalysisError } from "@/lib/validateAnalysis";

export const maxDuration = 60;

function toPreview(id: string, r: AnalysisResult): PreviewData {
  const errors = r.errors ?? [];
  return {
    id,
    notAStatement: r.notAStatement,
    errorCount: errors.length,
    totalPotentialEur: r.totalPotentialEur,
    totalPotentialLabel: r.totalPotentialLabel,
    errorTitles: errors.map((e) => e.title),
    hasDirect: errors.some((e) => e.category === "direct"),
    hasReview: errors.some((e) => e.category === "needs_review"),
    mock: MOCK,
  };
}

export async function POST(req: NextRequest) {
  try {
    // Rohbytes (Website) oder JSON mit base64 (Android-App) — siehe readUpload.
    const upload = await readUpload(req);
    if (isUploadError(upload)) {
      return apiError(upload.code);
    }
    const { base64, mediaType, fileName: safeFileName, byteSize } = upload;

    // Gate 1: Magic-Byte-Prüfung — der deklarierte mediaType ist nur noch ein
    // Plausibilitäts-Check; maßgeblich sind die echten Datei-Bytes (sniffed).
    const sniffed = sniffMediaType(base64);
    if (!sniffed || !isAllowedUpload(mediaType, sniffed)) {
      return apiError("UNSUPPORTED_TYPE");
    }

    // Gate 2: Dateigröße
    if (byteSize > MAX_FILE_BYTES) {
      return apiError("FILE_TOO_LARGE");
    }

    // Gate 3: Rate-Limit pro IP — erst hier, damit abgelehnte Uploads (falscher
    // Typ, zu groß) kein Kontingent verbrauchen; zählt nur echte Analyse-Versuche.
    const ip = getClientIp(req);
    if (!(await checkRateLimit(ip))) {
      return apiError("RATE_LIMITED");
    }

    // Gate 4: Token-Zählung (kostenlos) — fängt den „Roman" präzise ab
    const tokenCount = await countDocumentTokens(base64, sniffed, safeFileName);
    if (tokenCount > MAX_INPUT_TOKENS) {
      return apiError("DOCUMENT_TOO_LONG");
    }

    const result = await analyzeStatement(base64, sniffed, safeFileName);

    if (result.notAStatement) {
      return NextResponse.json(toPreview("", result));
    }

    const id = await storeAnalysis(result);
    return NextResponse.json(toPreview(id, result));
  } catch (err: unknown) {
    if (err instanceof SyntaxError || err instanceof InvalidAnalysisError) {
      console.error("Analysis error: unbrauchbare KI-Antwort", err.message);
      return apiError("ANALYSIS_UNUSABLE");
    }
    const message = err instanceof Error ? err.message : "";
    // Stack statt ganzes Objekt: API-Fehlerobjekte können Request-Inhalte tragen.
    console.error("Analysis error:", err instanceof Error ? err.stack ?? message : String(err));
    return apiError(classifyErrorCode(message));
  }
}
