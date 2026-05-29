import { NextRequest, NextResponse } from "next/server";
import { analyzeStatement } from "@/lib/claude";
import { storeAnalysis } from "@/lib/kv";
import { classifyError } from "@/lib/errors";
import { AnalysisResult, PreviewData } from "@/types";

export const maxDuration = 60;

function toPreview(id: string, r: AnalysisResult): PreviewData {
  return {
    id,
    notAStatement: r.notAStatement,
    errorCount: r.errors?.length ?? 0,
    totalPotentialEur: r.totalPotentialEur,
    totalPotentialLabel: r.totalPotentialLabel,
    errorTitles: (r.errors ?? []).map((e) => e.title),
    hasDirect: (r.errors ?? []).some((e) => e.category === "direct"),
    hasReview: (r.errors ?? []).some((e) => e.category === "needs_review"),
  };
}

export async function POST(req: NextRequest) {
  try {
    const { base64, mediaType, fileName } = await req.json();
    if (!base64 || !mediaType) {
      return NextResponse.json({ error: "Keine Datei übermittelt." }, { status: 400 });
    }
    const isImage = mediaType.startsWith("image/");
    const isPdf = mediaType === "application/pdf";
    if (!isImage && !isPdf) {
      return NextResponse.json({ error: "Nur PDF und Bilder werden unterstützt." }, { status: 400 });
    }

    const result = await analyzeStatement(base64, mediaType, fileName);

    if (result.notAStatement) {
      return NextResponse.json(toPreview("", result));
    }

    const id = await storeAnalysis(result);
    return NextResponse.json(toPreview(id, result));
  } catch (err: unknown) {
    console.error("Analysis error:", err);
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Die Analyse konnte nicht verarbeitet werden. Bitte erneut versuchen." },
        { status: 500 }
      );
    }
    const message = err instanceof Error ? err.message : "";
    return NextResponse.json({ error: classifyError(message) }, { status: 500 });
  }
}
