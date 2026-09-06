import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getAnalysis, isUnlocked } from "@/lib/kv";
import { ReportDoc } from "@/lib/pdf/ReportDoc";
import { classifyErrorCode } from "@/lib/errors";
import { apiError } from "@/lib/apiErrors";
import { checkLimit, getClientIp } from "@/lib/ratelimit";
import { REPORT_PER_IP_PER_HOUR } from "@/lib/limits";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return apiError("MISSING_ID");

    const record = await getAnalysis(id);
    if (!record) return apiError("ANALYSIS_EXPIRED");
    if (!isUnlocked(record)) return apiError("NOT_UNLOCKED");

    // Kostenschutz: CPU-lastiges PDF-Rendering.
    if (!(await checkLimit("rl:report:ip", REPORT_PER_IP_PER_HOUR, "1 h", getClientIp(req)))) {
      return apiError("REPORT_RATE_LIMITED");
    }

    const pdf = await renderToBuffer(<ReportDoc result={record.full} />);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Pruefbericht.pdf"`,
      },
    });
  } catch (err: unknown) {
    console.error("Report error:", err instanceof Error ? err.stack ?? err.message : String(err));
    const message = err instanceof Error ? err.message : "";
    return apiError(classifyErrorCode(message), 500);
  }
}
