import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getAnalysis, getLetter, isUnlocked } from "@/lib/kv";
import { sendLetterPdf } from "@/lib/mailer";
import { classifyErrorCode } from "@/lib/errors";
import { apiError } from "@/lib/apiErrors";
import { isValidEmail } from "@/lib/email";
import { isLetterType, LETTER_FILENAMES, MAIL_SUBJECTS } from "@/lib/letters";
import { checkLimit, getClientIp } from "@/lib/ratelimit";
import { SEND_PDF_PER_ID_PER_DAY, SEND_PDF_PER_IP_PER_DAY } from "@/lib/limits";
import { LetterDoc } from "@/lib/pdf/LetterDoc";

export const runtime = "nodejs";
export const maxDuration = 30;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Verschickt ein zuvor generiertes Schreiben an genau eine Adresse. Das PDF
 * wird aus dem in Redis gespeicherten Brieftext neu gerendert – der Client
 * liefert weder Bytes noch Dateinamen (kein Relay für Fremdanhänge).
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { id?: unknown; email?: unknown; type?: unknown }
      | null;
    const id = body?.id;
    const email = body?.email;
    const type = body?.type;
    if (typeof id !== "string" || !UUID_RE.test(id) || !isValidEmail(email) || !isLetterType(type)) {
      return apiError("INVALID_REQUEST");
    }

    const record = await getAnalysis(id);
    if (!record) return apiError("ANALYSIS_EXPIRED");
    if (!isUnlocked(record)) return apiError("NOT_UNLOCKED");

    const [okId, okIp] = await Promise.all([
      checkLimit("rl:send:id", SEND_PDF_PER_ID_PER_DAY, "1 d", id),
      checkLimit("rl:send:ip", SEND_PDF_PER_IP_PER_DAY, "1 d", getClientIp(req)),
    ]);
    if (!okId || !okIp) {
      return apiError("SEND_RATE_LIMITED");
    }

    const letter = await getLetter(id, type);
    if (!letter) {
      return apiError("LETTER_NOT_FOUND");
    }

    const pdf = await renderToBuffer(<LetterDoc letter={letter} />);
    await sendLetterPdf(email.trim(), Buffer.from(pdf), LETTER_FILENAMES[type], MAIL_SUBJECTS[type]);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    // Stack statt ganzes Objekt: nodemailer-Fehler tragen die Empfängeradresse.
    console.error("send-pdf error:", err instanceof Error ? err.stack ?? message : String(err));
    return apiError(classifyErrorCode(message), 500);
  }
}
