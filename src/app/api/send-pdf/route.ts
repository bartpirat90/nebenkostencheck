import { NextRequest, NextResponse } from "next/server";
import { getAnalysis } from "@/lib/kv";
import { sendLetterPdf } from "@/lib/mailer";
import { classifyError } from "@/lib/errors";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { id, email, pdfBase64, filename } = await req.json();
    if (!id || !email || !pdfBase64) {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }
    const record = await getAnalysis(id);
    if (!record) return NextResponse.json({ error: "Analyse abgelaufen." }, { status: 404 });
    if (!record.paid) return NextResponse.json({ error: "Nicht freigeschaltet." }, { status: 402 });

    await sendLetterPdf(email, pdfBase64, filename || "Schreiben.pdf", "Dein Nebenkostencheck-Schreiben");
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error("send-pdf error:", err);
    const message = err instanceof Error ? err.message : "";
    return NextResponse.json({ error: classifyError(message) }, { status: 500 });
  }
}
