# Monetarisierung & Go-Live Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nebenkostencheck vom kostenlosen Prototyp zu einem rechtssicheren, monetarisierten Produkt machen: serverseitige Teaser-Paywall, Einmalzahlung 9,90 € via Stripe, Claude statt Gemini, PDF-Briefe, Branding/Wording, Rechtsseiten.

**Architecture:** Upload → Claude-Analyse → volles Ergebnis in Vercel KV (24 h TTL), Browser erhält nur Teaser. „Freischalten" → Stripe Checkout → Webhook setzt `paid`-Flag in KV → `/api/result` gibt volles Ergebnis + PDFs frei. Zahlung wird ausschließlich serverseitig über das Webhook-Flag verifiziert.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind v3, `@anthropic-ai/sdk` (Claude), `@upstash/redis` (Vercel KV), `stripe` + `@stripe/stripe-js`, `@react-pdf/renderer`.

**Referenz-Spec:** `docs/superpowers/specs/2026-05-29-monetarisierung-go-live-design.md`

**Verifikation (projektweit, kein Test-Framework):** Nach Code-Änderungen jeweils `npx tsc --noEmit` (0 Fehler) und bei Frontend-Tasks `npm run build` (✓ Compiled successfully). API-Routen mit externen Diensten werden mit Test-Keys manuell verifiziert (in den jeweiligen Tasks beschrieben).

---

## Dateistruktur (Soll)

| Datei | Verantwortung |
|-------|---------------|
| `src/lib/claude.ts` | Anthropic-Client, `analyzeStatement()`, `generateLetter()`, Retry/Backoff, Prompt-Caching |
| `src/lib/prompts.ts` | `SYSTEM_PROMPT` (Analyse) + `buildLetterPrompt()` — aus den Routen extrahiert |
| `src/lib/kv.ts` | Redis-Client + `storeAnalysis()`, `getAnalysis()`, `markPaid()` |
| `src/lib/errors.ts` | (bestehend) `classifyError()` — um Anthropic-Fehler erweitern |
| `src/types/index.ts` | (bestehend) + `PreviewData`, `StoredAnalysis` |
| `src/app/api/analyze/route.ts` | Claude-Analyse, KV-Speicherung, gibt nur Teaser + ID zurück |
| `src/app/api/checkout/route.ts` | Stripe-Checkout-Session |
| `src/app/api/stripe-webhook/route.ts` | Webhook-Verifikation, setzt `paid`-Flag |
| `src/app/api/result/route.ts` | Volles Ergebnis bei bezahltem Status |
| `src/app/api/generate-letter/route.ts` | Brieftext (Claude) + PDF, Freigabe nur bei `paid` |
| `src/lib/pdf/` | react-pdf-Dokumente: `ReportDoc.tsx`, `LetterDoc.tsx` |
| `src/components/PreviewView.tsx` | Teaser-Ansicht + CTA + Widerrufs-Checkbox |
| `src/components/ResultView.tsx` | (bestehend) volle Ergebnisansicht nach Zahlung |
| `src/components/Logo.tsx` | Schutzschild-Häkchen-SVG + Wortmarke |
| `src/components/Footer.tsx` | Footer mit Logo + Rechtslinks |
| `src/app/ergebnis/page.tsx` | Erfolgsseite nach Stripe-Rückkehr |
| `src/app/impressum/page.tsx`, `datenschutz/page.tsx`, `agb/page.tsx` | Rechtsseiten (Roh-Vorlagen) |

**Env-Variablen (`.env.local` + Vercel):** `ANTHROPIC_API_KEY`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_BASE_URL`.

---

# STUFE 1 — Fundament: Claude, KV, Paywall-Basis

## Task 1: Dependencies & Env-Vorlage

**Files:**
- Modify: `package.json` (via npm)
- Modify: `.env.local.example`

- [ ] **Step 1: Neue Pakete installieren**

```bash
npm install @anthropic-ai/sdk @upstash/redis stripe @stripe/stripe-js @react-pdf/renderer
npm uninstall @google/generative-ai
```

- [ ] **Step 2: `.env.local.example` erweitern**

Ersetze den Inhalt von `.env.local.example`:

```
# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...

# Vercel KV / Upstash Redis
KV_REST_API_URL=https://...upstash.io
KV_REST_API_TOKEN=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Basis-URL (für Stripe Redirects)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

- [ ] **Step 3: `.env.local` lokal entsprechend befüllen** (mit echten Test-Keys; Datei ist gitignored)

- [ ] **Step 4: Verify & Commit**

```bash
npx tsc --noEmit
git add package.json package-lock.json .env.local.example
git commit -m "chore: swap Gemini SDK for Anthropic, add Stripe/KV/PDF deps"
```

---

## Task 2: Prompts extrahieren

**Files:**
- Create: `src/lib/prompts.ts`

Der bestehende `SYSTEM_PROMPT` (in `analyze/route.ts`) und die `buildPrompt`-Funktion (in `generate-letter/route.ts`) werden in ein gemeinsames Modul verschoben, damit `claude.ts` sie nutzen kann.

- [ ] **Step 1: `src/lib/prompts.ts` anlegen**

Kopiere den **vollständigen** `SYSTEM_PROMPT`-String aus `src/app/api/analyze/route.ts` (Zeilen 6–145, der gesamte Template-String) als Export hierher. Kopiere zusätzlich die `buildPrompt`-Funktion aus `src/app/api/generate-letter/route.ts` (umbenannt zu `buildLetterPrompt`) inkl. `LetterRequest`-Import.

```typescript
import { LetterRequest } from "@/types";

export const ANALYSIS_SYSTEM_PROMPT = `Du bist ein Experte für deutsches Mietrecht, ...`;
// ^ exakt den bestehenden SYSTEM_PROMPT-Inhalt einsetzen (unverändert übernehmen)

export function buildLetterPrompt(req: LetterRequest): string {
  // exakt den bestehenden buildPrompt-Body übernehmen
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```
Erwartet: 0 Fehler (Datei wird noch nicht importiert, muss aber kompilieren).

- [ ] **Step 3: Commit**

```bash
git add src/lib/prompts.ts
git commit -m "refactor: extract analysis + letter prompts to src/lib/prompts.ts"
```

---

## Task 3: Claude-Modul mit Retry/Backoff + Caching

**Files:**
- Create: `src/lib/claude.ts`

**Hinweis für den Implementierer:** Nutze die `claude-api`-Skill für korrekte SDK-Details (Document/Image content blocks, `cache_control` Prompt-Caching, Modell-ID). Aktuelles Modell: `claude-sonnet-4-6`.

- [ ] **Step 1: `src/lib/claude.ts` anlegen**

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { ANALYSIS_SYSTEM_PROMPT, buildLetterPrompt } from "./prompts";
import { AnalysisResult, LetterRequest } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = "claude-sonnet-4-6";

/** Retry mit exponential Backoff bei Überlast (429/529). */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      const status = (err as { status?: number })?.status;
      if (status !== 429 && status !== 529 && status !== 503) throw err;
      await new Promise((r) => setTimeout(r, 500 * 2 ** i)); // 500ms, 1s, 2s
    }
  }
  throw lastErr;
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```json\n?|```/g, "").trim();
  return JSON.parse(cleaned);
}

/** Analysiert eine Abrechnung (PDF oder Bild als base64). */
export async function analyzeStatement(
  base64: string,
  mediaType: string,
  fileName: string
): Promise<AnalysisResult> {
  const isPdf = mediaType === "application/pdf";
  const docBlock = isPdf
    ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 } }
    : { type: "image" as const, source: { type: "base64" as const, media_type: mediaType as "image/jpeg" | "image/png" | "image/webp", data: base64 } };

  const msg = await withRetry(() =>
    client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: [
        { type: "text", text: ANALYSIS_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      ],
      messages: [
        {
          role: "user",
          content: [
            docBlock,
            { type: "text", text: `Bitte analysiere diese Nebenkostenabrechnung (Dateiname: ${fileName || "unbekannt"}) und gib deine Prüfung als JSON zurück.` },
          ],
        },
      ],
    })
  );

  const textBlock = msg.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Keine Textantwort von Claude");
  return extractJson(textBlock.text) as AnalysisResult;
}

/** Generiert einen Brieftext (Widerspruch oder Belegeinsicht). */
export async function generateLetter(req: LetterRequest): Promise<string> {
  const msg = await withRetry(() =>
    client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: buildLetterPrompt(req) }],
    })
  );
  const textBlock = msg.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("Keine Textantwort von Claude");
  return textBlock.text.trim();
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```
Erwartet: 0 Fehler. Falls SDK-Typen für content blocks abweichen, mit der `claude-api`-Skill abgleichen und Typen anpassen.

- [ ] **Step 3: Commit**

```bash
git add src/lib/claude.ts
git commit -m "feat: add Claude client with retry/backoff and prompt caching"
```

---

## Task 4: Typen erweitern

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Neue Typen ergänzen** (am Ende der Datei anfügen)

```typescript
/** Reduzierte Daten, die der Browser vor der Zahlung sieht. */
export interface PreviewData {
  id: string;
  notAStatement?: boolean;
  errorCount: number;
  totalPotentialEur?: number | null;
  totalPotentialLabel?: string | null;
  errorTitles: string[];
  hasDirect: boolean;        // mind. ein "direct"-Fehler → Widerspruchsbrief verfügbar
  hasReview: boolean;        // mind. ein "needs_review"-Fehler → Belegeinsicht verfügbar
}

/** Was in Vercel KV unter der Analyse-ID liegt. */
export interface StoredAnalysis {
  full: AnalysisResult;
  paid: boolean;
  createdAt: string;
}
```

- [ ] **Step 2: Verify & Commit**

```bash
npx tsc --noEmit
git add src/types/index.ts
git commit -m "feat: add PreviewData and StoredAnalysis types"
```

---

## Task 5: KV-Modul

**Files:**
- Create: `src/lib/kv.ts`

- [ ] **Step 1: `src/lib/kv.ts` anlegen**

```typescript
import { Redis } from "@upstash/redis";
import { AnalysisResult, StoredAnalysis } from "@/types";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const TTL_SECONDS = 60 * 60 * 24; // 24 h Auto-Ablauf
const key = (id: string) => `analysis:${id}`;

/** Speichert das volle Ergebnis, gibt die ID zurück. */
export async function storeAnalysis(full: AnalysisResult): Promise<string> {
  const id = crypto.randomUUID();
  const record: StoredAnalysis = { full, paid: false, createdAt: new Date().toISOString() };
  await redis.set(key(id), record, { ex: TTL_SECONDS });
  return id;
}

export async function getAnalysis(id: string): Promise<StoredAnalysis | null> {
  return (await redis.get<StoredAnalysis>(key(id))) ?? null;
}

/** Setzt das paid-Flag (behält die Rest-TTL bei). */
export async function markPaid(id: string): Promise<void> {
  const record = await getAnalysis(id);
  if (!record) return;
  record.paid = true;
  const ttl = await redis.ttl(key(id));
  await redis.set(key(id), record, { ex: ttl > 0 ? ttl : TTL_SECONDS });
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/kv.ts
git commit -m "feat: add Vercel KV store for analysis results with 24h TTL"
```

---

## Task 6: analyze-Route auf Claude + KV + Teaser umbauen

**Files:**
- Modify: `src/app/api/analyze/route.ts`
- Modify: `src/lib/errors.ts`

- [ ] **Step 1: `classifyError` um Anthropic-Überlast erweitern**

In `src/lib/errors.ts` die erste Bedingung ergänzen:

```typescript
  if (msg.includes("503") || msg.includes("529") || msg.includes("overloaded") || msg.includes("service unavailable") || msg.includes("high demand")) {
    return "Der Prüfdienst ist gerade stark ausgelastet. Bitte in einem Moment erneut versuchen.";
  }
```

- [ ] **Step 2: `analyze/route.ts` komplett ersetzen**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { analyzeStatement } from "@/lib/claude";
import { storeAnalysis } from "@/lib/kv";
import { classifyError } from "@/lib/errors";
import { AnalysisResult, PreviewData } from "@/types";

export const maxDuration = 60;

function toPreview(id: string, r: AnalysisResult): PreviewData {
  return {
    id,
    notAStatement: r.notAStatement,
    errorCount: r.errors?.length ?? 0,
    totalPotentialEur: r.totalPotentialEur,
    totalPotentialLabel: r.totalPotentialLabel,
    errorTitles: (r.errors ?? []).map((e) => e.title),
    hasDirect: (r.errors ?? []).some((e) => e.category === "direct"),
    hasReview: (r.errors ?? []).some((e) => e.category === "needs_review"),
  };
}

export async function POST(req: NextRequest) {
  try {
    const { base64, mediaType, fileName } = await req.json();
    if (!base64 || !mediaType) {
      return NextResponse.json({ error: "Keine Datei übermittelt." }, { status: 400 });
    }
    const isImage = mediaType.startsWith("image/");
    const isPdf = mediaType === "application/pdf";
    if (!isImage && !isPdf) {
      return NextResponse.json({ error: "Nur PDF und Bilder werden unterstützt." }, { status: 400 });
    }

    const result = await analyzeStatement(base64, mediaType, fileName);

    // Nicht-Abrechnung: kein Speichern, direkt Teaser mit notAStatement zurückgeben
    if (result.notAStatement) {
      return NextResponse.json(toPreview("", result));
    }

    const id = await storeAnalysis(result);
    return NextResponse.json(toPreview(id, result));
  } catch (err: unknown) {
    console.error("Analysis error:", err);
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Die Analyse konnte nicht verarbeitet werden. Bitte erneut versuchen." },
        { status: 500 }
      );
    }
    const message = err instanceof Error ? err.message : "";
    return NextResponse.json({ error: classifyError(message) }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify (Typen + manuell)**

```bash
npx tsc --noEmit
npm run dev
```
Mit echtem Test-Key + KV: eine Abrechnung hochladen (Frontend zeigt noch die alte Ansicht und bricht ggf. ab — das ist ok, wir prüfen nur die Route). Im Netzwerk-Tab muss die Antwort von `/api/analyze` **nur** `PreviewData` enthalten (keine `errors`-Details, kein `evidence`). In Upstash muss ein `analysis:<id>`-Eintrag liegen.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/analyze/route.ts src/lib/errors.ts
git commit -m "feat: analyze via Claude, store full result in KV, return teaser only"
```

---

# STUFE 2 — Zahlung (Stripe)

## Task 7: Checkout-Route

**Files:**
- Create: `src/app/api/checkout/route.ts`

- [ ] **Step 1: `checkout/route.ts` anlegen**

```typescript
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getAnalysis } from "@/lib/kv";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Fehlende ID." }, { status: 400 });

    const record = await getAnalysis(id);
    if (!record) {
      return NextResponse.json(
        { error: "Analyse abgelaufen. Bitte lade die Abrechnung erneut hoch." },
        { status: 404 }
      );
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL!;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: "Nebenkostencheck – vollständiger Prüfbericht + Schreiben" },
            unit_amount: 990, // 9,90 €
          },
          quantity: 1,
        },
      ],
      allow_promotion_codes: true, // 100%-Gutscheincode für Tester/Freunde
      metadata: { analysisId: id },
      client_reference_id: id,
      success_url: `${base}/ergebnis?id=${id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/?canceled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Zahlung konnte nicht gestartet werden." }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify & Commit**

```bash
npx tsc --noEmit
git add src/app/api/checkout/route.ts
git commit -m "feat: add Stripe checkout session route with promo-code support"
```

---

## Task 8: Stripe-Webhook-Route

**Files:**
- Create: `src/app/api/stripe-webhook/route.ts`

**Hinweis:** Die Route braucht den **rohen** Request-Body für die Signaturprüfung. In Next.js App Router via `await req.text()`.

- [ ] **Step 1: `stripe-webhook/route.ts` anlegen**

```typescript
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { markPaid } from "@/lib/kv";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Keine Signatur." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: unknown) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Ungültige Signatur." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const id = session.metadata?.analysisId ?? session.client_reference_id;
    if (id) await markPaid(id);
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 2: Verify (Typen + Stripe CLI)**

```bash
npx tsc --noEmit
```
Manuell mit der Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe-webhook` und in einem zweiten Terminal `stripe trigger checkout.session.completed`. Erwartet: Log zeigt verarbeitetes Event; bei echter Test-Checkout-Session wird `paid: true` in KV gesetzt.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/stripe-webhook/route.ts
git commit -m "feat: add Stripe webhook to mark analysis as paid"
```

---

## Task 9: Result-Route

**Files:**
- Create: `src/app/api/result/route.ts`

- [ ] **Step 1: `result/route.ts` anlegen**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAnalysis } from "@/lib/kv";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Fehlende ID." }, { status: 400 });

  const record = await getAnalysis(id);
  if (!record) {
    return NextResponse.json({ error: "Ergebnis abgelaufen oder nicht gefunden." }, { status: 404 });
  }
  if (!record.paid) {
    return NextResponse.json({ error: "Nicht freigeschaltet." }, { status: 402 });
  }
  return NextResponse.json(record.full);
}
```

- [ ] **Step 2: Verify & Commit**

```bash
npx tsc --noEmit
git add src/app/api/result/route.ts
git commit -m "feat: add result route gated on paid flag"
```

---

# STUFE 3 — Bezahlinhalt & Frontend

## Task 10: PreviewView-Komponente

**Files:**
- Create: `src/components/PreviewView.tsx`

- [ ] **Step 1: `PreviewView.tsx` anlegen**

```tsx
"use client";

import { useState } from "react";
import { PreviewData } from "@/types";

interface Props {
  preview: PreviewData;
  onReset: () => void;
}

export default function PreviewView({ preview, onReset }: Props) {
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: preview.id }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Zahlung konnte nicht gestartet werden.");
      }
      const { url } = await res.json();
      window.location.href = url; // Redirect zu Stripe
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setLoading(false);
    }
  };

  const potential =
    preview.totalPotentialEur != null
      ? `~${preview.totalPotentialEur.toFixed(0)} €`
      : preview.totalPotentialLabel ?? "Potenzial erkannt";

  return (
    <div className="space-y-5">
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-6 text-center">
        <p className="text-sm text-[#94A3B8] mb-1">Erste Prüfung abgeschlossen</p>
        <p className="text-3xl font-black text-[#F1F5F9]">
          {preview.errorCount} {preview.errorCount === 1 ? "Auffälligkeit" : "Auffälligkeiten"} gefunden
        </p>
        <p className="mt-2 text-lg font-bold bg-gradient-to-r from-[#818CF8] to-[#C084FC] bg-clip-text text-transparent">
          Mögliches Erstattungspotenzial: {potential}
        </p>
      </div>

      {preview.errorTitles.length > 0 && (
        <ul className="space-y-2">
          {preview.errorTitles.map((title, i) => (
            <li key={i} className="flex items-center gap-3 bg-[#1E293B] border border-[#334155] rounded-xl p-3">
              <span className="w-6 h-6 rounded-full bg-[#1E1B4B] text-[#818CF8] text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-sm font-medium text-[#F1F5F9]">{title}</span>
              <span className="ml-auto text-xs text-[#475569]">🔒 Details gesperrt</span>
            </li>
          ))}
        </ul>
      )}

      {/* Wasserzeichen-Brief-Vorschau (statisches Mockup, kein echter Inhalt) */}
      <div className="relative rounded-2xl overflow-hidden border border-[#334155]">
        <div className="bg-[#0F172A] p-6 blur-[3px] select-none pointer-events-none space-y-2" aria-hidden="true">
          <div className="h-2.5 w-1/3 bg-[#334155] rounded" />
          <div className="h-2 w-1/2 bg-[#1E293B] rounded" />
          <div className="h-2 w-2/3 bg-[#1E293B] rounded mt-4" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-2 w-full bg-[#1E293B] rounded" />
          ))}
          <div className="h-2 w-1/4 bg-[#334155] rounded mt-4" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="rotate-[-8deg] text-[#94A3B8] font-black text-xl tracking-widest border-2 border-[#475569] rounded-lg px-4 py-1 bg-[#0F172A]/60">
            VORSCHAU
          </span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-[#1E1B4B] to-[#1E293B] border border-[#3730A3] rounded-2xl p-6">
        <p className="font-bold text-[#F1F5F9] mb-1">Vollständigen Bericht freischalten</p>
        <ul className="text-sm text-[#94A3B8] space-y-1 mb-4">
          <li>✓ Alle Fehler mit Begründung, Beleg & Rechtsgrundlage</li>
          {preview.hasDirect && <li>✓ Fertiger Widerspruchsbrief als PDF</li>}
          {preview.hasReview && <li>✓ Belegeinsicht-Schreiben (§ 259 BGB) als PDF</li>}
          <li>✓ Konkrete Handlungsempfehlungen</li>
        </ul>

        <label className="flex items-start gap-2 text-xs text-[#94A3B8] mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Ich verlange die sofortige Bereitstellung und bestätige, dass mein Widerrufsrecht
            mit vollständiger Bereitstellung erlischt.
          </span>
        </label>

        <button
          onClick={startCheckout}
          disabled={!consent || loading}
          className="w-full rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-bold py-3.5 text-base hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Weiterleitung…" : "Für 9,90 € freischalten"}
        </button>
        {error && <p className="mt-3 text-sm text-[#FCA5A5]">{error}</p>}
      </div>

      <button onClick={onReset} className="w-full text-sm text-[#64748B] hover:text-[#94A3B8] py-2">
        Andere Datei prüfen
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/PreviewView.tsx
git commit -m "feat: add PreviewView with teaser, withdrawal consent and checkout CTA"
```

---

## Task 11: page.tsx auf Preview-Flow umbauen

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: State-Typ und Render-Logik anpassen**

Ersetze in `src/app/page.tsx` den Import von `AnalysisResult` durch `PreviewData`, den State `result` durch `preview`, und die Render-Verzweigung. Die `handleFileUpload`-Funktion setzt jetzt `preview` aus der `/api/analyze`-Antwort:

```tsx
import { PreviewData } from "@/types";
import PreviewView from "@/components/PreviewView";
// ResultView-Import entfällt hier (wird auf der Erfolgsseite genutzt)

// State:
const [preview, setPreview] = useState<PreviewData | null>(null);
// ... loading, error wie bisher

// in handleFileUpload, nach erfolgreichem Response:
const data: PreviewData = await response.json();
setPreview(data);

// handleReset setzt setPreview(null) statt setResult(null)
```

Die Render-Verzweigung im `#upload`-Block:

```tsx
{!preview ? (
  <UploadZone onUpload={handleFileUpload} loading={loading} error={error} />
) : preview.notAStatement ? (
  <NotAStatementBox onReset={handleReset} />
) : (
  <PreviewView preview={preview} onReset={handleReset} />
)}
```

Und die Bedingungen `!result` für Landing/Footer-Sektionen zu `!preview` ändern.

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
npm run build
```
Erwartet: 0 Fehler, ✓ Compiled successfully.

- [ ] **Step 3: Manuell**

`npm run dev` → Abrechnung hochladen → Teaser-Ansicht mit Fehleranzahl, Potenzial, gesperrten Titeln und CTA erscheint. „Freischalten" ohne Checkbox ist deaktiviert; mit Checkbox leitet es zu Stripe weiter.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: switch landing page to preview/paywall flow"
```

---

## Task 12: Erfolgsseite

**Files:**
- Create: `src/app/ergebnis/page.tsx`

- [ ] **Step 1: `ergebnis/page.tsx` anlegen**

```tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ResultView from "@/components/ResultView";
import { AnalysisResult } from "@/types";

function ErgebnisInner() {
  const params = useSearchParams();
  const id = params.get("id");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setError("Keine Ergebnis-ID gefunden.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    // Webhook kann minimal verzögert sein → bis zu 5x mit kurzer Pause versuchen
    (async () => {
      for (let i = 0; i < 5; i++) {
        const res = await fetch(`/api/result?id=${id}`);
        if (res.ok) {
          if (!cancelled) { setResult(await res.json()); setLoading(false); }
          return;
        }
        if (res.status !== 402) {
          if (!cancelled) { setError("Ergebnis nicht gefunden oder abgelaufen."); setLoading(false); }
          return;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      if (!cancelled) { setError("Freischaltung wird noch verarbeitet. Bitte Seite in einem Moment neu laden."); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <p className="text-center text-[#94A3B8] py-20">Dein Bericht wird geladen…</p>;
  if (error || !result) return <p className="text-center text-[#FCA5A5] py-20">{error}</p>;
  return <ResultView result={result} onReset={() => (window.location.href = "/")} />;
}

export default function ErgebnisPage() {
  return (
    <main className="min-h-screen bg-[#0F172A]">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Suspense fallback={<p className="text-center text-[#94A3B8] py-20">Laden…</p>}>
          <ErgebnisInner />
        </Suspense>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/ergebnis/page.tsx
git commit -m "feat: add post-payment result page with webhook-delay retry"
```

---

## Task 13: PDF-Dokumente + generate-letter auf PDF + paid-Gate

**Files:**
- Create: `src/lib/pdf/LetterDoc.tsx`
- Create: `src/lib/pdf/ReportDoc.tsx`
- Modify: `src/app/api/generate-letter/route.ts`

- [ ] **Step 1: `LetterDoc.tsx` anlegen** (Geschäftsbrief-Layout)

```tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const s = StyleSheet.create({
  page: { padding: 56, fontSize: 11, lineHeight: 1.5, fontFamily: "Helvetica", color: "#111" },
  body: { whiteSpace: "pre-wrap" },
});

export function LetterDoc({ letter }: { letter: string }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View>
          {letter.split("\n").map((line, i) => (
            <Text key={i} style={s.body}>{line || " "}</Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 2: `ReportDoc.tsx` anlegen** (Detailbericht-Layout)

```tsx
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { AnalysisResult } from "@/types";

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 10, lineHeight: 1.4, fontFamily: "Helvetica", color: "#111" },
  h1: { fontSize: 18, marginBottom: 8, fontFamily: "Helvetica-Bold" },
  summary: { marginBottom: 16, color: "#333" },
  item: { marginBottom: 12, paddingBottom: 12, borderBottom: "1pt solid #ddd" },
  title: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  meta: { color: "#555", marginBottom: 2 },
});

export function ReportDoc({ result }: { result: AnalysisResult }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>Prüfbericht Nebenkostenabrechnung</Text>
        <Text style={s.summary}>{result.summary}</Text>
        {result.errors.map((e, i) => (
          <View key={i} style={s.item}>
            <Text style={s.title}>{i + 1}. {e.title}</Text>
            <Text style={s.meta}>Einschätzung: {e.confidence} · {e.category === "direct" ? "sofort angreifbar" : "Belegeinsicht"}</Text>
            {e.legalBasis ? <Text style={s.meta}>Rechtsgrundlage: {e.legalBasis}</Text> : null}
            {e.potentialEur != null ? <Text style={s.meta}>Potenzial: {e.potentialEur.toFixed(2)} €</Text> : null}
            <Text>{e.description}</Text>
            {e.evidence ? <Text style={s.meta}>Beleg: {e.evidence}</Text> : null}
            {e.actionText ? <Text style={s.meta}>Empfehlung: {e.actionText}</Text> : null}
          </View>
        ))}
      </Page>
    </Document>
  );
}
```

- [ ] **Step 3: `generate-letter/route.ts` ersetzen** (Claude-Brieftext + PDF, nur bei `paid`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { generateLetter } from "@/lib/claude";
import { getAnalysis } from "@/lib/kv";
import { classifyError } from "@/lib/errors";
import { LetterDoc } from "@/lib/pdf/LetterDoc";
import { LetterRequest } from "@/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LetterRequest & { id: string };
    if (!body.id || !body.type || !body.errors?.length) {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }
    const record = await getAnalysis(body.id);
    if (!record) return NextResponse.json({ error: "Analyse abgelaufen." }, { status: 404 });
    if (!record.paid) return NextResponse.json({ error: "Nicht freigeschaltet." }, { status: 402 });

    const letter = await generateLetter(body);
    const pdf = await renderToBuffer(LetterDoc({ letter }));

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${body.type === "objection" ? "Widerspruch" : "Belegeinsicht"}.pdf"`,
      },
    });
  } catch (err: unknown) {
    console.error("Letter generation error:", err);
    const message = err instanceof Error ? err.message : "";
    return NextResponse.json({ error: classifyError(message) }, { status: 500 });
  }
}
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run build
```
Hinweis: Falls `renderToBuffer(LetterDoc({...}))` einen Typfehler wirft, stattdessen JSX verwenden: `renderToBuffer(<LetterDoc letter={letter} />)` (Datei-Endung `.tsx` der Route nötig — dann Route als `route.tsx` anlegen, sonst die Komponenten-Aufruf-Variante nutzen).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pdf/ src/app/api/generate-letter/
git commit -m "feat: generate letters as PDF via react-pdf, gated on paid status"
```

---

## Task 14: ResultView um PDF-Downloads erweitern

**Files:**
- Modify: `src/components/ResultView.tsx`
- Modify: `src/components/LetterModal.tsx`

**Kontext:** `LetterModal` lädt heute den Brieftext als `.txt`. Es bekommt nun die `id` und lädt das PDF von `/api/generate-letter`. Bedingte Buttons: Widerspruch nur bei `direct`-Fehlern, Belegeinsicht nur bei `needs_review`-Fehlern.

- [ ] **Step 1: ResultView — `id` durchreichen + bedingte Brief-Buttons**

In `src/components/ResultView.tsx`: Die Komponente bekommt zusätzlich `id` (aus dem `AnalysisResult` ist die ID nicht enthalten — sie wird von der Erfolgsseite via Prop übergeben). Anpassung der Props und Weitergabe an die Brief-Trigger. Die Buttons „Widerspruch erstellen" / „Belegeinsicht anfordern" nur rendern, wenn die jeweilige Fehlerkategorie vorhanden ist (`errors.some(e => e.category === "direct")` bzw. `"needs_review"`).

**Erfolgsseite anpassen** (`src/app/ergebnis/page.tsx`): `<ResultView result={result} id={id!} onReset={…} />`.

- [ ] **Step 2: LetterModal — PDF-Download statt Text**

In `src/components/LetterModal.tsx`: `generateLetter` ruft `/api/generate-letter` mit `{ type, contact, errors, id }` auf, erwartet jetzt eine PDF-Blob-Antwort und löst den Download aus:

```tsx
const res = await fetch("/api/generate-letter", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ type, contact, errors, id }),
});
if (!res.ok) {
  const e = await res.json();
  throw new Error(e.error || "Brief konnte nicht erstellt werden");
}
const blob = await res.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = `${type === "objection" ? "Widerspruch" : "Belegeinsicht"}.pdf`;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
```

`LetterModal` bekommt dafür eine zusätzliche Prop `id: string`. Die bisherige Text-/Copy-Ansicht (`step === "letter"`) entfällt zugunsten des direkten PDF-Downloads; das Modal zeigt nur noch das Kontaktformular + „PDF erstellen".

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ResultView.tsx src/components/LetterModal.tsx src/app/ergebnis/page.tsx
git commit -m "feat: PDF letter downloads, conditional letter buttons by error category"
```

---

# STUFE 4 — Branding & Wording

## Task 15: Logo-Komponente

**Files:**
- Create: `src/components/Logo.tsx`

- [ ] **Step 1: `Logo.tsx` anlegen** (Schutzschild + Häkchen, Indigo-Violett-Gradient)

```tsx
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="nk-grad" x1="0" y1="0" x2="24" y2="24">
            <stop offset="0" stopColor="#6366F1" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" fill="url(#nk-grad)" />
        <path d="M8.5 12l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <span className="font-black text-[#F1F5F9] tracking-tight text-lg">Nebenkostencheck</span>
    </div>
  );
}
```

- [ ] **Step 2: In Navigation einsetzen** — in `src/app/page.tsx` das bestehende „NK"-Badge + Wortmarke im `<nav>` durch `<Logo />` ersetzen.

- [ ] **Step 3: Verify & Commit**

```bash
npx tsc --noEmit
npm run build
git add src/components/Logo.tsx src/app/page.tsx
git commit -m "feat: add shield+check logo, use in navigation"
```

---

## Task 16: Wording entschärfen + Claims korrigieren + Rechts-Claim

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/components/LandingHero.tsx`
- Modify: `src/components/HowItWorks.tsx`
- Modify: `src/components/StatsBar.tsx`
- Modify: `src/components/UploadZone.tsx`

- [ ] **Step 1: `layout.tsx` Metadata**

```tsx
export const metadata: Metadata = {
  title: "Nebenkostencheck – Abrechnung prüfen & Geld zurückholen",
  description:
    "Lade deine Nebenkostenabrechnung hoch und finde in Sekunden typische Fehler – geprüft nach aktuellem Mietrecht (BetrKV, HeizkV) und höchstrichterlicher BGH-Rechtsprechung.",
  keywords: ["Nebenkostenabrechnung", "Prüfung", "Fehler", "Erstattung", "Mieter"],
};
```

- [ ] **Step 2: `LandingHero.tsx`** — KI-Satz ersetzen, Rechts-Claim als Badge, Badge-Claim „Datei wird nicht gespeichert" korrigieren

Absatz ersetzen:
```tsx
<p className="text-[#94A3B8] text-lg leading-relaxed mb-8 max-w-lg mx-auto">
  Lade deine Abrechnung hoch – sie wird in Sekunden auf typische Fehler geprüft und
  dein Erstattungspotenzial berechnet.
</p>
<p className="text-xs text-[#818CF8] font-semibold mb-8">
  Geprüft nach aktuellem Mietrecht (BetrKV, HeizkV) und höchstrichterlicher BGH-Rechtsprechung
</p>
```
Im Badge-Array `"Datei wird nicht gespeichert"` → `"Automatische Löschung nach 24 h"`.

- [ ] **Step 3: `HowItWorks.tsx`** — Schritt-2-Titel `"KI analysiert in Sekunden"` → `"Automatische Prüfung in Sekunden"`. Schritt 3 Beschreibung `"Fertiger Brief direkt kopierbar oder als .txt-Download."` → `"Fertiger Widerspruchsbrief als PDF zum Download."`

- [ ] **Step 4: `StatsBar.tsx`** — `{ value: "100 %", label: "Kostenlos" }` → `{ value: "Gratis", label: "Erst-Prüfung" }`.

- [ ] **Step 5: `UploadZone.tsx`** — im `LoadingState` `"KI analysiert deine Abrechnung…"` → `"Deine Abrechnung wird geprüft…"`.

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit
npm run build
```
Danach manuell prüfen, dass das Wort „KI" auf keiner sichtbaren Seite mehr vorkommt (Landing, Upload, How-it-works).

- [ ] **Step 7: Commit**

```bash
git add src/app/layout.tsx src/components/LandingHero.tsx src/components/HowItWorks.tsx src/components/StatsBar.tsx src/components/UploadZone.tsx
git commit -m "feat: de-emphasize AI wording, add legal-grounds claim, fix misleading claims"
```

---

# STUFE 5 — Recht

## Task 17: Rechtsseiten (Roh-Vorlagen)

**Files:**
- Create: `src/app/impressum/page.tsx`
- Create: `src/app/datenschutz/page.tsx`
- Create: `src/app/agb/page.tsx`

**Wichtig:** Dies sind **Roh-Vorlagen ohne Rechtsverbindlichkeit** — der Betreiber muss sie anwaltlich/über einen Generator prüfen lassen. Jede Seite trägt einen sichtbaren Hinweis darauf und Platzhalter in `[eckigen Klammern]`.

- [ ] **Step 1: Gemeinsames Seiten-Layout** — alle drei Seiten nutzen denselben Wrapper:

```tsx
// Muster pro Seite, Inhalt unterscheidet sich
export default function Page() {
  return (
    <main className="min-h-screen bg-[#0F172A] text-[#94A3B8]">
      <div className="max-w-2xl mx-auto px-6 py-12 prose-invert">
        <p className="text-xs text-[#FCD34D] mb-6">
          ⚠️ Entwurf/Roh-Vorlage – vor dem Live-Betrieb rechtlich prüfen lassen. Keine Rechtsberatung.
        </p>
        {/* Inhalt */}
        <a href="/" className="inline-block mt-8 text-[#818CF8] text-sm">← Zurück</a>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: `impressum/page.tsx`** — Überschrift „Impressum", Angaben gemäß § 5 DDG mit Platzhaltern: `[Name/Firma]`, `[Anschrift]`, `[E-Mail]`, `[Telefon]`, `[USt-IdNr. falls vorhanden]`, Verantwortlicher i.S.d. § 18 Abs. 2 MStV.

- [ ] **Step 3: `datenschutz/page.tsx`** — Abschnitte: Verantwortlicher `[…]`; verarbeitete Daten (hochgeladene Abrechnung); **Weitergabe an Anthropic (Claude, Serverstandort USA → Drittlandtransfer, Art. 44 ff. DSGVO)**; **Speicherung in Vercel KV mit automatischer Löschung nach 24 Stunden**; Zahlungsabwicklung über Stripe; Rechtsgrundlage Art. 6 Abs. 1 lit. b DSGVO; Betroffenenrechte. Platzhalter wo nötig.

- [ ] **Step 4: `agb/page.tsx`** — Leistungsbeschreibung (automatisierte Prüfung + Schreiben-Erstellung), **ausdrücklich keine Rechtsberatung / kein RDG-Dienst**, Haftungsausschluss, Preis 9,90 € inkl. USt, Widerrufsbelehrung + Hinweis auf vorzeitiges Erlöschen bei digitalen Inhalten (§ 356 Abs. 5 BGB), `[Anbieterdaten]`.

- [ ] **Step 5: Verify & Commit**

```bash
npx tsc --noEmit
npm run build
git add src/app/impressum src/app/datenschutz src/app/agb
git commit -m "feat: add legal page draft templates (Impressum/Datenschutz/AGB)"
```

---

## Task 18: Footer + Datenschutz-Claim auf Startseite

**Files:**
- Create: `src/components/Footer.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: `Footer.tsx` anlegen**

```tsx
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-[#1E293B] mt-12 py-8">
      <div className="max-w-2xl mx-auto px-6 flex flex-col items-center gap-4 text-center">
        <Logo />
        <nav className="flex gap-5 text-sm text-[#64748B]">
          <a href="/impressum" className="hover:text-[#94A3B8]">Impressum</a>
          <a href="/datenschutz" className="hover:text-[#94A3B8]">Datenschutz</a>
          <a href="/agb" className="hover:text-[#94A3B8]">AGB</a>
        </nav>
        <p className="text-xs text-[#334155] leading-relaxed">
          © 2026 Nebenkostencheck · Automatische Löschung nach 24 Stunden · Keine Rechtsberatung
        </p>
      </div>
    </footer>
  );
}
```

- [ ] **Step 2: Footer in `page.tsx` einbinden** — den bestehenden inline-Footer-Disclaimer (`© 2026 Nebenkostencheck · DSGVO-konform · Keine Datenspeicherung`) entfernen und stattdessen `<Footer />` außerhalb des `max-w-2xl`-Containers, am Ende von `<main>`, rendern. Footer auf allen Zuständen anzeigen (nicht nur `!preview`).

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Footer.tsx src/app/page.tsx
git commit -m "feat: add footer with logo and legal links, fix data-retention claim"
```

---

## Task 19: Integrations-Durchlauf & Push

**Files:** keine (Verifikation + Deploy)

- [ ] **Step 1: Vollständiger End-to-End-Test im Stripe-Testmodus**

`npm run dev` + `stripe listen --forward-to localhost:3000/api/stripe-webhook`. Durchlauf:
1. Abrechnung hochladen → Teaser erscheint (Fehleranzahl, Potenzial, gesperrte Titel)
2. Ohne Checkbox: Button deaktiviert. Mit Checkbox: Weiterleitung zu Stripe
3. Test-Karte `4242 4242 4242 4242` → Rückkehr auf `/ergebnis?id=…` → voller Bericht
4. Brief-Buttons nur passend zu vorhandenen Fehlerkategorien; PDF-Download funktioniert
5. 100 %-Gutscheincode im Stripe-Checkout → 0 €, identischer Ablauf
6. `/api/result?id=<fremde-id>` ohne Zahlung → 402/404 (Paywall hält)
7. Rechtslinks im Footer öffnen Impressum/Datenschutz/AGB

- [ ] **Step 2: Finaler Build**

```bash
npx tsc --noEmit && npm run build
```
Erwartet: 0 Fehler, ✓ Compiled successfully.

- [ ] **Step 3: Auf main pushen** (Vercel deployt automatisch; Env-Variablen müssen in Vercel gesetzt sein)

```bash
git push origin main
```

---

## Erfolgskriterien (gegen Spec abgeglichen)

- [ ] Vorschau zeigt Fehleranzahl + €-Potenzial + Titel; Details/Briefe serverseitig gesperrt (nicht im Netzwerk-Tab auslesbar)
- [ ] „Freischalten" → Stripe-Checkout → erfolgreiche Zahlung → volles Ergebnis + PDF-Downloads
- [ ] Zahlung ausschließlich über Webhook-`paid`-Flag verifiziert (manipulierte Rückkehr-URL gibt nichts frei)
- [ ] Detailbericht-PDF immer; Widerspruchs-PDF nur bei `direct`-Fehlern; Belegeinsicht-PDF nur bei `needs_review`-Fehlern
- [ ] Analyse über Claude mit Retry/Backoff + Prompt-Caching
- [ ] KV-Einträge laufen nach 24 h ab
- [ ] Widerrufs-Checkbox ist Pflicht vor Checkout
- [ ] Logo (Schutzschild + Häkchen) in Nav und Footer
- [ ] Kein „KI" im sichtbaren Marketing; Datenschutz legt Anthropic-Verarbeitung offen
- [ ] Rechts-Claim prominent; irreführende Claims korrigiert
- [ ] Impressum/Datenschutz/AGB als Roh-Vorlagen, im Footer verlinkt, mit Prüf-Hinweis
- [ ] Test-Zugang via Stripe-Testmodus + 100 %-Gutscheincode
- [ ] `npx tsc --noEmit` + `npm run build` ohne Fehler

## Offene Betreiber-Aufgaben (kein Code — vor echtem Launch)

- Vercel Pro abonnieren (kommerzielle Nutzung)
- Anthropic-Konto + bezahltes API-Guthaben, `ANTHROPIC_API_KEY` in Vercel
- Stripe live-Konto, Produkt/Keys, Webhook-Endpoint (`/api/stripe-webhook`) registrieren, 100 %-Gutscheincode anlegen
- Vercel KV / Upstash-Integration, Env-Variablen in Vercel
- Rechtstexte anwaltlich/über Generator prüfen lassen
- Gewerbe/Umsatzsteuer klären
