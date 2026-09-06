import { NextRequest, NextResponse } from "next/server";
import { analyzeStatement, countDocumentTokens } from "@/lib/claude";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { MAX_FILE_BYTES, MAX_FILE_MB, MAX_INPUT_TOKENS } from "@/lib/limits";
import { storeAnalysis } from "@/lib/kv";
import { classifyError } from "@/lib/errors";
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
    const { base64, mediaType, fileName } = await req.json();
    if (!base64 || !mediaType) {
      return NextResponse.json({ error: "Keine Datei übermittelt." }, { status: 400 });
    }

    // Gate 1: MIME-Typ
    const isImage = mediaType.startsWith("image/");
    const isPdf = mediaType === "application/pdf";
    if (!isImage && !isPdf) {
      return NextResponse.json(
        { error: "Nur PDF und Bilder werden unterstützt. Bitte lade deine Abrechnung als PDF oder Foto hoch." },
        { status: 400 },
      );
    }

    // Gate 2: Dateigröße (aus base64-Länge rekonstruiert)
    const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
    const byteSize = (base64.length * 3) / 4 - padding;
    if (byteSize > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `Die Datei ist zu groß (max. ${MAX_FILE_MB} MB). Bitte lade nur die Nebenkostenabrechnung hoch.` },
        { status: 413 },
      );
    }

    // Gate 3: Rate-Limit pro IP — erst hier, damit abgelehnte Uploads (falscher
    // Typ, zu groß) kein Kontingent verbrauchen; zählt nur echte Analyse-Versuche.
    const ip = getClientIp(req);
    if (!(await checkRateLimit(ip))) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte versuche es später noch einmal." },
        { status: 429 },
      );
    }

    // Gate 4: Token-Zählung (kostenlos) — fängt den „Roman" präzise ab
    const tokenCount = await countDocumentTokens(base64, mediaType, fileName);
    if (tokenCount > MAX_INPUT_TOKENS) {
      return NextResponse.json(
        { error: "Das Dokument ist zu umfangreich für die Prüfung. Bitte lade nur die Nebenkostenabrechnung hoch." },
        { status: 422 },
      );
    }

    const result = await analyzeStatement(base64, mediaType, fileName);

    if (result.notAStatement) {
      return NextResponse.json(toPreview("", result));
    }

    const id = await storeAnalysis(result);
    return NextResponse.json(toPreview(id, result));
  } catch (err: unknown) {
    if (err instanceof SyntaxError || err instanceof InvalidAnalysisError) {
      console.error("Analysis error: unbrauchbare KI-Antwort", err.message);
      return NextResponse.json(
        { error: "Die Analyse konnte nicht verarbeitet werden. Bitte erneut versuchen." },
        { status: 502 }
      );
    }
    const message = err instanceof Error ? err.message : "";
    // Stack statt ganzes Objekt: API-Fehlerobjekte können Request-Inhalte tragen.
    console.error("Analysis error:", err instanceof Error ? err.stack ?? message : String(err));
    return NextResponse.json({ error: classifyError(message) }, { status: 500 });
  }
}
