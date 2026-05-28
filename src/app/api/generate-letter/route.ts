import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { LetterRequest } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function buildPrompt(req: LetterRequest): string {
  const { type, contact, errors } = req;
  const today = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const errorList = errors
    .map((e, i) => {
      const parts = [`${i + 1}. ${e.title}`];
      parts.push(`   Beschreibung: ${e.description}`);
      if (e.legalBasis) parts.push(`   Rechtsgrundlage: ${e.legalBasis}`);
      if (e.potentialEur != null) parts.push(`   Geschätztes Potenzial: ${e.potentialEur.toFixed(2)} €`);
      return parts.join("\n");
    })
    .join("\n\n");

  const tenant = `${contact.tenantName || "[Name Mieter]"}\n${contact.tenantAddress || "[Adresse Mieter]"}`;
  const landlord = `${contact.landlordName || "[Name Vermieter]"}\n${contact.landlordAddress || "[Adresse Vermieter]"}`;
  const contract = contact.contractNumber || "[Vertragsnummer]";
  const period = contact.billingPeriod || "[Abrechnungszeitraum]";

  if (type === "objection") {
    return `Erstelle einen formellen, höflichen aber bestimmten Widerspruch gegen eine Nebenkostenabrechnung.

ABSENDER (Mieter):
${tenant}

EMPFÄNGER (Vermieter):
${landlord}

Datum: ${today}
Vertragsnummer: ${contract}
Abrechnungszeitraum: ${period}

KONKRETE WIDERSPRUCHSPUNKTE (alle sind sofort angreifbare Rechtsverstöße):
${errorList}

ANFORDERUNGEN AN DEN BRIEF:
- Formaler deutscher Geschäftsbrief mit Briefkopf, Anrede, Betreff
- Betreff: "Widerspruch gegen die Nebenkostenabrechnung für den Zeitraum ${period}"
- Einleitung: kurzer Bezug auf die erhaltene Abrechnung
- Hauptteil: jeden Widerspruchspunkt einzeln nummerieren mit konkretem Verweis auf die Rechtsgrundlage
- Forderung: konkrete Korrektur der Abrechnung und Erstattung der zu Unrecht abgerechneten Beträge
- Fristsetzung: 14 Tage zur schriftlichen Stellungnahme
- Höfliche Schlussformel
- KEIN juristisches Übermaß, klar und nachvollziehbar
- Tonfall: bestimmt, sachlich, nicht aggressiv

Gib AUSSCHLIESSLICH den fertigen Brief zurück, ohne Erklärungen, ohne Markdown-Formatierung. Der Brief soll direkt kopierbar sein.`;
  }

  // document_review
  return `Erstelle ein formelles Schreiben zur Aufforderung der Belegeinsicht nach § 259 BGB.

ABSENDER (Mieter):
${tenant}

EMPFÄNGER (Vermieter):
${landlord}

Datum: ${today}
Vertragsnummer: ${contract}
Abrechnungszeitraum: ${period}

POSITIONEN, ZU DENEN BELEGEINSICHT GEFORDERT WIRD:
${errorList}

ANFORDERUNGEN AN DEN BRIEF:
- Formaler deutscher Geschäftsbrief mit Briefkopf, Anrede, Betreff
- Betreff: "Aufforderung zur Belegeinsicht – Nebenkostenabrechnung ${period}"
- Einleitung: Bezug auf die erhaltene Abrechnung und das Recht auf Belegeinsicht nach § 259 BGB
- Hauptteil: jede Position nummeriert mit konkreter Begründung warum Belegeinsicht erforderlich ist
- Forderung: Einsicht in die Originalbelege (Rechnungen, Verträge, Aufschlüsselungen) – wahlweise vor Ort oder durch Übersendung von Kopien
- Hinweis auf Vorbehalt der Anfechtung der entsprechenden Positionen bis zur Belegeinsicht
- Fristsetzung: 4 Wochen zur Terminvereinbarung bzw. Übersendung der Kopien
- Höfliche Schlussformel
- Tonfall: bestimmt, sachlich, kooperativ

Gib AUSSCHLIESSLICH den fertigen Brief zurück, ohne Erklärungen, ohne Markdown-Formatierung. Der Brief soll direkt kopierbar sein.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LetterRequest;

    if (!body.type || !body.errors || body.errors.length === 0) {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(buildPrompt(body));
    const letter = result.response.text().trim();

    return NextResponse.json({ letter });
  } catch (err: unknown) {
    console.error("Letter generation error:", err);
    const message = err instanceof Error ? err.message : "Interner Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
