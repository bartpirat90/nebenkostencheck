import Anthropic from "@anthropic-ai/sdk";
import { ANALYSIS_SYSTEM_PROMPT, buildLetterPrompt } from "./prompts";
import { AnalysisResult, LetterRequest } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
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
    client.messages.create({
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
  const message = await withRetry(() =>
    client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: buildLetterPrompt(req) }],
    }),
  );

  return extractText(message).trim();
}
