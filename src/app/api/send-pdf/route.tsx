import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getAnalysis, getLetter, isUnlocked } from "@/lib/kv";
import { sendLetterPdf } from "@/lib/mailer";
import { classifyError } from "@/lib/errors";
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
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }

    const record = await getAnalysis(id);
    if (!record) return NextResponse.json({ error: "Analyse abgelaufen." }, { status: 404 });
    if (!isUnlocked(record)) return NextResponse.json({ error: "Nicht freigeschaltet." }, { status: 402 });

    const [okId, okIp] = await Promise.all([
      checkLimit("rl:send:id", SEND_PDF_PER_ID_PER_DAY, "1 d", id),
      checkLimit("rl:send:ip", SEND_PDF_PER_IP_PER_DAY, "1 d", getClientIp(req)),
    ]);
    if (!okId || !okIp) {
      return NextResponse.json(
        { error: "Zu viele Sendungen. Bitte lade das PDF stattdessen herunter." },
        { status: 429 },
      );
    }

    const letter = await getLetter(id, type);
    if (!letter) {
      return NextResponse.json(
        { error: "Schreiben nicht gefunden. Bitte erstelle es erneut." },
        { status: 404 },
      );
    }

    const pdf = await renderToBuffer(<LetterDoc letter={letter} />);
    await sendLetterPdf(email.trim(), Buffer.from(pdf), LETTER_FILENAMES[type], MAIL_SUBJECTS[type]);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "";
    console.error("send-pdf error:", message);
    return NextResponse.json({ error: classifyError(message) }, { status: 500 });
  }
}
