import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { generateLetter } from "@/lib/claude";
import { getAnalysis } from "@/lib/kv";
import { classifyError } from "@/lib/errors";
import { LetterDoc } from "@/lib/pdf/LetterDoc";
import { LetterRequest } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LetterRequest & { id: string };
    if (!body.id || !body.type || !body.errors?.length) {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }
    const record = await getAnalysis(body.id);
    if (!record) return NextResponse.json({ error: "Analyse abgelaufen." }, { status: 404 });
    if (!record.paid) return NextResponse.json({ error: "Nicht freigeschaltet." }, { status: 402 });

    const letter = await generateLetter(body);
    const pdf = await renderToBuffer(<LetterDoc letter={letter} />);

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${body.type === "objection" ? "Widerspruch" : "Belegeinsicht"}.pdf"`,
      },
    });
  } catch (err: unknown) {
    console.error("Letter generation error:", err);
    const message = err instanceof Error ? err.message : "";
    return NextResponse.json({ error: classifyError(message) }, { status: 500 });
  }
}
