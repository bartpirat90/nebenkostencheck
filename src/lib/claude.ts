import Anthropic from "@anthropic-ai/sdk";
import { ANALYSIS_SYSTEM_PROMPT, buildLetterPrompt } from "./prompts";
import { AnalysisResult, LetterRequest } from "@/types";
import { MOCK_ANALYSIS_RESULT, MOCK_LETTER } from "./mockData";
import { MOCK } from "./mock";
import { InvalidAnalysisError, normalizeAnalysis } from "./validateAnalysis";

// Lazy-Init: Client erst beim ersten Aufruf erstellen, damit der Build
// (ohne gesetzten API-Key) das Modul importieren kann, ohne zu werfen.
let _client: Anthropic | null = null;

/**
 * Zeitbudget je API-Route (maxDuration = 60 s):
 *   Token-Zählung ≤ 10 s  +  Analyse-Versuch(e) ≤ RETRY_BUDGET_MS  <  60 s.
 * Ein zweiter Versuch startet nur, wenn er samt vollem Timeout noch ins Budget
 * passt – also praktisch nur nach einem sofortigen 429/529.
 */
const REQUEST_TIMEOUT_MS = 45_000;
const COUNT_TOKENS_TIMEOUT_MS = 10_000;
const RETRY_BUDGET_MS = 47_000;

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
  /** Gesamtbudget für alle Versuche inkl. Wartezeiten. */
  budgetMs?: number;
  /** Wie lange ein einzelner Versuch maximal dauern darf (= Client-Timeout). */
  timeoutMs?: number;
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const {
    attempts = 3,
    baseDelayMs = 500,
    budgetMs = RETRY_BUDGET_MS,
    timeoutMs = REQUEST_TIMEOUT_MS,
  } = opts;
  const start = Date.now();
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const status = (err as { status?: number })?.status;
      if (status === undefined || !RETRYABLE_STATUSES.has(status)) throw err;
      const delay = baseDelayMs * 2 ** i; // exponentiell: 1×, 2×, 4× baseDelayMs
      // Letzter Versuch, oder der nächste passt samt Timeout nicht mehr ins Budget:
      // nicht warten, direkt weiterwerfen.
      if (i === attempts - 1 || Date.now() - start + delay + timeoutMs > budgetMs) break;
      await new Promise((r) => setTimeout(r, delay));
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

  const res = await client().messages.countTokens(
    {
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
    },
    // Kurzer Timeout: Zählung ist schnell und darf das Analyse-Budget nicht anknabbern.
    { timeout: COUNT_TOKENS_TIMEOUT_MS },
  );
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
