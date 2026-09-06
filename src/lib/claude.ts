import Anthropic from "@anthropic-ai/sdk";
import { ANALYSIS_SYSTEM_PROMPT, buildLetterPrompt } from "./prompts";
import { AnalysisResult, LetterRequest } from "@/types";
import { MOCK_ANALYSIS_RESULT, MOCK_LETTER } from "./mockData";
import { MOCK } from "./mock";
import { InvalidAnalysisError, normalizeAnalysis } from "./validateAnalysis";

// Lazy-Init: Client erst beim ersten Aufruf erstellen, damit der Build
// (ohne gesetzten API-Key) das Modul importieren kann, ohne zu werfen.
let _client: Anthropic | null = null;

const REQUEST_TIMEOUT_MS = 45_000; // unter maxDuration = 60 s der API-Routen
const RETRY_BUDGET_MS = 15_000; // nur „schnelle" Fehler (429/529) lohnen einen zweiten Versuch

function client(): Anthropic {
  if (!_client) {
    // Retries macht withRetry — ein Ort, ein Zeitbudget (SDK-Default: 2 Retries + 10-min-Timeout).
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
      maxRetries: 0,
      timeout: REQUEST_TIMEOUT_MS,
    });
  }
  return _client;
}

const MODEL = "claude-sonnet-4-6";

const RETRYABLE_STATUSES = new Set([429, 503, 529]);

export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  budgetMs?: number;
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const { attempts = 3, baseDelayMs = 500, budgetMs = RETRY_BUDGET_MS } = opts;
  const start = Date.now();
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const status = (err as { status?: number })?.status;
      if (status === undefined || !RETRYABLE_STATUSES.has(status)) throw err;
      // Last attempt or Zeitbudget aufgebraucht: don't sleep, fall through to rethrow.
      if (i === attempts - 1 || Date.now() - start > budgetMs) break;
      // Exponential backoff: 500ms, 1s, 2s, ...
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** i));
    }
  }
  throw lastErr;
}

function buildDocBlock(
  base64: string,
  mediaType: string,
): Anthropic.DocumentBlockParam | Anthropic.ImageBlockParam {
  const isPdf = mediaType === "application/pdf";
  return isPdf
    ? {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: base64 },
      }
    : {
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType as Anthropic.Base64ImageSource["media_type"],
          data: base64,
        },
      };
}

const ANALYSIS_USER_TEXT = (fileName: string) =>
  `Bitte analysiere diese Nebenkostenabrechnung (Dateiname: ${
    fileName || "unbekannt"
  }) und gib deine Prüfung als JSON zurück.`;

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

  const docBlock = buildDocBlock(base64, mediaType);

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
            { type: "text", text: ANALYSIS_USER_TEXT(fileName) },
          ],
        },
      ],
    }),
  );

  const parsed = normalizeAnalysis(extractJson(extractText(message)));
  if (!parsed) throw new InvalidAnalysisError();
  return parsed;
}

/**
 * Zählt die Input-Token, die das Dokument kosten würde — kostenloser
 * Anthropic-Endpoint. Im MOCK-Modus ohne API-Call (Demo bleibt bei 0 Cent).
 */
export async function countDocumentTokens(
  base64: string,
  mediaType: string,
  fileName: string,
): Promise<number> {
  if (MOCK) return 1000;

  const res = await client().messages.countTokens({
    model: MODEL,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          buildDocBlock(base64, mediaType),
          { type: "text", text: ANALYSIS_USER_TEXT(fileName) },
        ],
      },
    ],
  });
  return res.input_tokens;
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
