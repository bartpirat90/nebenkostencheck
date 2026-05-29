import Anthropic from "@anthropic-ai/sdk";
import { ANALYSIS_SYSTEM_PROMPT, buildLetterPrompt } from "./prompts";
import { AnalysisResult, LetterRequest } from "@/types";
import { MOCK_ANALYSIS_RESULT, MOCK_LETTER } from "./mockData";

// Testmodus: liefert Beispieldaten ohne (kostenpflichtigen) Claude-Aufruf.
const MOCK = process.env.MOCK_ANALYSIS === "true";

// Lazy-Init: Client erst beim ersten Aufruf erstellen, damit der Build
// (ohne gesetzten API-Key) das Modul importieren kann, ohne zu werfen.
let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  return _client;
}

const MODEL = "claude-sonnet-4-6";

const RETRYABLE_STATUSES = new Set([429, 503, 529]);

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const status = (err as { status?: number })?.status;
      if (status === undefined || !RETRYABLE_STATUSES.has(status)) throw err;
      // Last attempt: don't sleep, fall through to rethrow.
      if (i === attempts - 1) break;
      // Exponential backoff: 500ms, 1s, 2s, ...
      await new Promise((r) => setTimeout(r, 500 * 2 ** i));
    }
  }
  throw lastErr;
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json\n?|```/g, "").trim();
  return JSON.parse(cleaned);
}

function extractText(message: Anthropic.Message): string {
  const textBlock = message.content.find(
    (b): b is Anthropic.TextBlock => b.type === "text",
  );
  if (!textBlock) throw new Error("Keine Textantwort von Claude");
  return textBlock.text;
}

export async function analyzeStatement(
  base64: string,
  mediaType: string,
  fileName: string,
): Promise<AnalysisResult> {
  if (MOCK) {
    // kleine künstliche Verzögerung, damit die Lade-Animation sichtbar ist
    await new Promise((r) => setTimeout(r, 1500));
    return MOCK_ANALYSIS_RESULT;
  }

  const isPdf = mediaType === "application/pdf";

  const docBlock: Anthropic.DocumentBlockParam | Anthropic.ImageBlockParam = isPdf
    ? {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: base64,
        },
      }
    : {
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType as Anthropic.Base64ImageSource["media_type"],
          data: base64,
        },
      };

  const message = await withRetry(() =>
    client().messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: ANALYSIS_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            docBlock,
            {
              type: "text",
              text: `Bitte analysiere diese Nebenkostenabrechnung (Dateiname: ${
                fileName || "unbekannt"
              }) und gib deine Prüfung als JSON zurück.`,
            },
          ],
        },
      ],
    }),
  );

  return extractJson(extractText(message)) as AnalysisResult;
}

export async function generateLetter(req: LetterRequest): Promise<string> {
  if (MOCK) {
    await new Promise((r) => setTimeout(r, 1200));
    return MOCK_LETTER;
  }

  const message = await withRetry(() =>
    client().messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: buildLetterPrompt(req) }],
    }),
  );

  return extractText(message).trim();
}
