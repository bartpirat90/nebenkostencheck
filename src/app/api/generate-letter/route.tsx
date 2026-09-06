import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { generateLetter } from "@/lib/claude";
import { getAnalysis, isUnlocked, storeLetter } from "@/lib/kv";
import { classifyErrorCode } from "@/lib/errors";
import { apiError } from "@/lib/apiErrors";
import { isLetterType, LETTER_FILENAMES } from "@/lib/letters";
import { LetterDoc } from "@/lib/pdf/LetterDoc";
import { checkLimit, getClientIp } from "@/lib/ratelimit";
import { LETTER_PER_ID_PER_DAY, LETTER_PER_IP_PER_DAY } from "@/lib/limits";
import { ContactData } from "@/types";

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
    const body = (await req.json()) as { id?: unknown; type?: unknown; contact?: unknown };
    if (typeof body.id !== "string" || !body.id || !isLetterType(body.type)) {
      return apiError("INVALID_REQUEST");
    }
    const { id, type } = body;
    const record = await getAnalysis(id);
    if (!record) return apiError("ANALYSIS_EXPIRED");
    if (!isUnlocked(record)) return apiError("NOT_UNLOCKED");

    // Sanitize client contact data: only known fields, max length, merged with server defaults.
    const contact = sanitizeContact(body.contact || {}, record.full.contactData);


    // Fehler serverseitig aus dem bezahlten Ergebnis beziehen (nicht aus Client-Input).
    const errors =
      type === "combined"
        ? record.full.errors.filter(
            (e) => e.category === "direct" || e.category === "needs_review"
          )
        : record.full.errors.filter(
            (e) => e.category === (type === "objection" ? "direct" : "needs_review")
          );
    if (!errors.length) {
      return apiError("NO_MATCHING_ERRORS");
    }

    // Kostenschutz: jeder Aufruf kostet einen Claude-Call.
    const ip = getClientIp(req);
    const [okId, okIp] = await Promise.all([
      checkLimit("rl:letter:id", LETTER_PER_ID_PER_DAY, "1 d", id),
      checkLimit("rl:letter:ip", LETTER_PER_IP_PER_DAY, "1 d", ip),
    ]);
    if (!okId || !okIp) {
      return apiError("LETTER_RATE_LIMITED");
    }

    const letter = await generateLetter({ type, contact, errors });
    await storeLetter(id, type, letter);
    const pdf = await renderToBuffer(<LetterDoc letter={letter} />);

    return NextResponse.json({
      letter,
      pdfBase64: Buffer.from(pdf).toString("base64"),
      filename: LETTER_FILENAMES[type],
    });
  } catch (err: unknown) {
    // Stack statt ganzes Objekt: API-Fehlerobjekte können Request-Inhalte tragen.
    console.error("Letter generation error:", err instanceof Error ? err.stack ?? err.message : String(err));
    const message = err instanceof Error ? err.message : "";
    return apiError(classifyErrorCode(message));
  }
}
