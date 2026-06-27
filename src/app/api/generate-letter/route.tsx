import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { generateLetter } from "@/lib/claude";
import { getAnalysis, isUnlocked } from "@/lib/kv";
import { classifyError } from "@/lib/errors";
import { LetterDoc } from "@/lib/pdf/LetterDoc";
import { ContactData, LetterType } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Sanitizes client-provided contact data: only known fields, max 200 chars each. */
function sanitizeContact(raw: any, serverDefault?: ContactData): ContactData {
  const ALLOWED_KEYS: (keyof ContactData)[] = [
    "tenantName", "tenantAddress", "landlordName", "landlordAddress", "contractNumber", "billingPeriod",
  ];
  const MAX_LEN = 200;
  const result: ContactData = { ...serverDefault };
  for (const key of ALLOWED_KEYS) {
    const val = raw?.[key];
    if (typeof val === "string" && val.trim()) {
      result[key] = val.trim().slice(0, MAX_LEN);
    }
  }
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { id: string; type: LetterType; contact: ContactData };
    if (!body.id || !body.type) {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }
    const record = await getAnalysis(body.id);
    if (!record) return NextResponse.json({ error: "Analyse abgelaufen." }, { status: 404 });
    if (!isUnlocked(record)) return NextResponse.json({ error: "Nicht freigeschaltet." }, { status: 402 });

    // Sanitize client contact data: only known fields, max length, merged with server defaults.
    const contact = sanitizeContact(body.contact || {}, record.full.contactData);


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

    const letter = await generateLetter({ type: body.type, contact, errors });
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
