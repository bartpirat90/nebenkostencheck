import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { generateLetter } from "@/lib/claude";
import { getAnalysis } from "@/lib/kv";
import { classifyError } from "@/lib/errors";
import { LetterDoc } from "@/lib/pdf/LetterDoc";
import { ContactData, LetterType } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { id: string; type: LetterType; contact: ContactData };
    if (!body.id || !body.type) {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }
    const record = await getAnalysis(body.id);
    if (!record) return NextResponse.json({ error: "Analyse abgelaufen." }, { status: 404 });
    if (!record.paid) return NextResponse.json({ error: "Nicht freigeschaltet." }, { status: 402 });

    // Fehler serverseitig aus dem bezahlten Ergebnis beziehen (nicht aus Client-Input).
    const errors =
      body.type === "combined"
        ? record.full.errors.filter(
            (e) => e.category === "direct" || e.category === "needs_review"
          )
        : record.full.errors.filter(
            (e) => e.category === (body.type === "objection" ? "direct" : "needs_review")
          );
    if (!errors.length) {
      return NextResponse.json(
        { error: "Für dieses Schreiben liegen keine passenden Punkte vor." },
        { status: 400 }
      );
    }

    const filename =
      body.type === "combined"
        ? "Widerspruch_und_Belegeinsicht"
        : body.type === "objection"
        ? "Widerspruch"
        : "Belegeinsicht";

    const letter = await generateLetter({ type: body.type, contact: body.contact, errors });
    const pdf = await renderToBuffer(<LetterDoc letter={letter} />);

    return NextResponse.json({
      letter,
      pdfBase64: Buffer.from(pdf).toString("base64"),
      filename: `${filename}.pdf`,
    });
  } catch (err: unknown) {
    console.error("Letter generation error:", err);
    const message = err instanceof Error ? err.message : "";
    return NextResponse.json({ error: classifyError(message) }, { status: 500 });
  }
}
