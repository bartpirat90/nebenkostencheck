# Release-Blocker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die 7 Launch-Blocker aus dem Audit vom 2026-09-06 beheben, sodass zahlende Kunden ihr Ergebnis nie verlieren, die Paywall in Produktion nicht per Env-Variable ausgehebelt werden kann, präparierte PDFs die Ergebnisseite nicht crashen und `/api/send-pdf` kein Mail-Relay mehr ist.

**Architecture:** Kleine, fokussierte Lib-Module (`mock.ts`, `validateAnalysis.ts`, `email.ts`, `letters.ts`, `stripe.ts`) mit reinen, unit-testbaren Funktionen; die API-Routen werden nur dünn angepasst. Briefe werden nach der Generierung in Redis abgelegt und beim Mailversand serverseitig neu gerendert – der Client schickt nie mehr PDF-Bytes. Die Freischaltung nach Zahlung hat zwei Wege: Webhook (wie bisher) **und** Server-zu-Stripe-Abfrage der Checkout-Session als Fallback.

**Tech Stack:** Next.js 15 App Router, TypeScript, Upstash Redis (`@upstash/redis`, `@upstash/ratelimit`), Stripe SDK v22, `@react-pdf/renderer`, nodemailer, next-intl. **Neu:** `vitest` (devDependency) für Unit-Tests unter `src/**/*.test.ts`.

**Repo-Root:** `E:\Neko-Check\nebenkostencheck\nebenkostencheck` · Branch `monetarisierung` (nicht nach `main` mergen). Commit-Messages ohne Umlaute (Repo-Konvention: `fix(i18n): tuerkische …`).

**Nicht Teil dieses Plans (manuell, Franz):** Blocker 2 – Betreiberdaten in Impressum/Datenschutz/AGB (alle 6 `messages/*.json`) eintragen und danach `draftNotice` aus `src/components/LegalPage.tsx:17` entfernen. Das hängt an der Betreiber-/Impressum-Entscheidung und wird bewusst nicht per Agent erledigt.

---

## Dateiübersicht

| Datei | Verantwortung |
|---|---|
| `vitest.config.ts` (neu) | Test-Runner, Alias `@/` → `src/` |
| `src/lib/mock.ts` (neu) | Einzige Quelle für das MOCK-Flag, in Production immer `false` |
| `src/lib/validateAnalysis.ts` (neu) | KI-JSON → validiertes `AnalysisResult` oder `null` |
| `src/lib/email.ts` (neu) | `isValidEmail()` – genau eine Adresse, keine Listen/Header |
| `src/lib/letters.ts` (neu) | `LETTER_TYPES`, `isLetterType()`, `LETTER_FILENAMES` – geteilt von generate-letter + send-pdf |
| `src/lib/stripe.ts` (neu) | Lazy Stripe-Client + `sessionUnlocksAnalysis()` + `unlockFromStripeSession()` |
| `src/lib/kv.ts` | `PAID_TTL_SECONDS`, `markPaid` verlängert TTL, `storeLetter`/`getLetter` |
| `src/lib/ratelimit.ts` | Generischer `checkLimit(prefix, limit, window, key)` |
| `src/lib/limits.ts` | Neue Konstanten für send-pdf-Limits |
| `src/lib/claude.ts` | MOCK aus `mock.ts`, Antwort durch `validateAnalysis` |
| `src/lib/mailer.ts` | Nimmt `Buffer` statt Base64 |
| `src/app/api/analyze/route.ts` | MOCK aus `mock.ts`, 502 bei ungültiger KI-Antwort |
| `src/app/api/checkout/route.ts` | Stripe-Client aus `stripe.ts`, `expires_at` 30 min |
| `src/app/api/stripe-webhook/route.ts` | `payment_status`-Prüfung, async-Events, Logging |
| `src/app/api/result/route.ts` | Session-Fallback über `session_id` |
| `src/app/api/generate-letter/route.tsx` | `type` validieren, Brief in KV speichern |
| `src/app/api/send-pdf/route.ts` → `route.tsx` | Neuer Vertrag `{id,email,type}`, Rerender, Limits |
| `src/app/[locale]/ergebnis/page.tsx` | `session_id` durchreichen, Retry-Button, i18n |
| `src/components/LetterModal.tsx` | schickt `type` statt `pdfBase64` |
| `messages/{de,en,tr,ar,ru,uk}.json` | Namespace `ergebnis`, DSE-Satz zur Speicherdauer |

---

### Task 1: Vitest einrichten

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (scripts + devDependencies)

- [ ] **Step 1: vitest installieren**

Run: `npm install -D vitest`
Expected: `added N packages`, `package.json` enthält `"vitest"` unter devDependencies.

- [ ] **Step 2: Konfiguration anlegen**

```ts
// vitest.config.ts
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: { "@": path.resolve(process.cwd(), "src") },
  },
});
```

- [ ] **Step 3: Script ergänzen**

In `package.json` unter `"scripts"` nach `"lint"` einfügen:

```json
"test": "vitest run"
```

- [ ] **Step 4: Smoke-Test schreiben und laufen lassen**

```ts
// src/lib/smoke.test.ts
import { describe, expect, it } from "vitest";
import { MAX_FILE_MB } from "@/lib/limits";

describe("vitest setup", () => {
  it("resolves the @/ alias", () => {
    expect(MAX_FILE_MB).toBe(3);
  });
});
```

Run: `npm test`
Expected: `1 passed`.

- [ ] **Step 5: Smoke-Test wieder löschen, tsc prüfen, committen**

Run: `rm src/lib/smoke.test.ts && npx tsc --noEmit`
Expected: keine Ausgabe (0 Fehler).

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore(test): vitest fuer Unit-Tests unter src/lib einrichten"
```

---

### Task 2: MOCK-Flag zentralisieren (Blocker 3)

**Files:**
- Create: `src/lib/mock.ts`, `src/lib/mock.test.ts`
- Modify: `src/lib/claude.ts:6-7`, `src/lib/kv.ts:39-41`, `src/app/api/analyze/route.ts:22`

- [ ] **Step 1: Failing Test schreiben**

```ts
// src/lib/mock.test.ts
import { describe, expect, it } from "vitest";
import { isMockEnabled } from "@/lib/mock";

describe("isMockEnabled", () => {
  it("is false when MOCK_ANALYSIS is unset", () => {
    expect(isMockEnabled({})).toBe(false);
  });
  it("is true when MOCK_ANALYSIS=true outside production", () => {
    expect(isMockEnabled({ MOCK_ANALYSIS: "true" })).toBe(true);
    expect(isMockEnabled({ MOCK_ANALYSIS: "true", VERCEL_ENV: "preview" })).toBe(true);
  });
  it("is ALWAYS false in Vercel production, even with MOCK_ANALYSIS=true", () => {
    expect(isMockEnabled({ MOCK_ANALYSIS: "true", VERCEL_ENV: "production" })).toBe(false);
  });
  it("ignores other values", () => {
    expect(isMockEnabled({ MOCK_ANALYSIS: "1" })).toBe(false);
    expect(isMockEnabled({ MOCK_ANALYSIS: "TRUE" })).toBe(false);
  });
});
```

- [ ] **Step 2: Test laufen lassen – muss fehlschlagen**

Run: `npm test`
Expected: FAIL, `Cannot find module '@/lib/mock'`.

- [ ] **Step 3: Modul implementieren**

```ts
// src/lib/mock.ts
/**
 * Einzige Quelle für den Testmodus. MOCK_ANALYSIS=true liefert Beispieldaten
 * ohne Claude-Aufruf UND öffnet die Paywall – deshalb ist das Flag in Vercel-
 * Production hart abgeschaltet: Ein versehentlich kopiertes Env darf die
 * Bezahlschranke nicht aushebeln.
 */
export function isMockEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.MOCK_ANALYSIS === "true" && env.VERCEL_ENV !== "production";
}

export const MOCK = isMockEnabled();
```

- [ ] **Step 4: Test laufen lassen – muss bestehen**

Run: `npm test`
Expected: `4 passed`.

- [ ] **Step 5: Verwendungen umstellen**

`src/lib/claude.ts` – Zeilen 6-7 ersetzen:

```ts
import { MOCK } from "./mock";
```

(den Kommentar „Testmodus: …" und die Zeile `const MOCK = process.env.MOCK_ANALYSIS === "true";` entfernen; die `import`-Zeile zu den anderen Imports oben.)

`src/lib/kv.ts` – Import ergänzen und `isUnlocked` ersetzen:

```ts
import { MOCK } from "./mock";

/**
 * Ob das volle Ergebnis ausgeliefert werden darf: nach Zahlung (`paid`) oder
 * im Testmodus (siehe mock.ts – in Production immer aus).
 */
export function isUnlocked(record: StoredAnalysis): boolean {
  return record.paid || MOCK;
}
```

`src/app/api/analyze/route.ts` – Import ergänzen, Zeile 22 ersetzen:

```ts
import { MOCK } from "@/lib/mock";
// …
    mock: MOCK,
```

- [ ] **Step 6: Restliche direkte Zugriffe suchen**

Run: `grep -rn "MOCK_ANALYSIS" src`
Expected: nur noch `src/lib/mock.ts` (und ggf. Kommentare). Jeden anderen Treffer auf `MOCK` aus `@/lib/mock` umstellen.

- [ ] **Step 7: tsc + Commit**

Run: `npx tsc --noEmit && npm test`
Expected: 0 Fehler, alle Tests grün.

```bash
git add src/lib/mock.ts src/lib/mock.test.ts src/lib/claude.ts src/lib/kv.ts src/app/api/analyze/route.ts
git commit -m "fix(security): MOCK_ANALYSIS in Vercel-Production hart abgeschaltet (kein Paywall-Bypass)"
```

---

### Task 3: KI-Antwort validieren (Blocker 6)

**Files:**
- Create: `src/lib/validateAnalysis.ts`, `src/lib/validateAnalysis.test.ts`
- Modify: `src/lib/claude.ts:64-67,113`, `src/app/api/analyze/route.ts:80-90`

- [ ] **Step 1: Failing Tests schreiben**

```ts
// src/lib/validateAnalysis.test.ts
import { describe, expect, it } from "vitest";
import { normalizeAnalysis } from "@/lib/validateAnalysis";

const valid = {
  summary: "Alles geprüft.",
  errors: [
    {
      title: "Verwaltungsgebühr",
      description: "Nicht umlagefähig.",
      confidence: "sicher",
      category: "direct",
      potentialEur: 45,
      legalBasis: "§ 1 Abs. 2 BetrKV",
      actionText: "Streichen lassen.",
      evidence: "Position 'Verwaltungsgebühr'.",
    },
  ],
  totalPotentialEur: 45,
  contactData: { tenantName: "Max", landlordName: "Vermieter GmbH" },
};

describe("normalizeAnalysis", () => {
  it("passes a valid result through", () => {
    const r = normalizeAnalysis(valid);
    expect(r).not.toBeNull();
    expect(r!.errors).toHaveLength(1);
    expect(r!.errors[0].potentialEur).toBe(45);
    expect(r!.contactData?.tenantName).toBe("Max");
  });

  it("rejects non-objects and missing summary", () => {
    expect(normalizeAnalysis(null)).toBeNull();
    expect(normalizeAnalysis("text")).toBeNull();
    expect(normalizeAnalysis([])).toBeNull();
    expect(normalizeAnalysis({ errors: [] })).toBeNull();
  });

  it("defaults unknown enum values instead of crashing the client", () => {
    const r = normalizeAnalysis({
      ...valid,
      errors: [{ ...valid.errors[0], confidence: "hoch", category: "sonstiges" }],
    });
    expect(r!.errors[0].confidence).toBe("unsicher");
    expect(r!.errors[0].category).toBe("needs_review");
  });

  it("coerces missing/invalid errors array to []", () => {
    expect(normalizeAnalysis({ summary: "x" })!.errors).toEqual([]);
    expect(normalizeAnalysis({ summary: "x", errors: "nope" })!.errors).toEqual([]);
  });

  it("drops error items without title or description", () => {
    const r = normalizeAnalysis({ summary: "x", errors: [{ title: "nur Titel" }, valid.errors[0]] });
    expect(r!.errors).toHaveLength(1);
  });

  it("nulls non-numeric or absurd amounts", () => {
    const r = normalizeAnalysis({
      ...valid,
      totalPotentialEur: "999",
      errors: [{ ...valid.errors[0], potentialEur: 1e9 }],
    });
    expect(r!.totalPotentialEur).toBeNull();
    expect(r!.errors[0].potentialEur).toBeNull();
  });

  it("caps list length and string length", () => {
    const many = Array.from({ length: 50 }, () => valid.errors[0]);
    const r = normalizeAnalysis({ summary: "s".repeat(5000), errors: many });
    expect(r!.errors.length).toBe(30);
    expect(r!.summary.length).toBe(2000);
  });

  it("strips unknown keys (prompt injection cannot add fields)", () => {
    const r = normalizeAnalysis({ ...valid, paid: true, evil: "<script>" }) as unknown as Record<string, unknown>;
    expect(r.paid).toBeUndefined();
    expect(r.evil).toBeUndefined();
  });
});
```

- [ ] **Step 2: Tests laufen lassen – müssen fehlschlagen**

Run: `npm test`
Expected: FAIL, `Cannot find module '@/lib/validateAnalysis'`.

- [ ] **Step 3: Validator implementieren**

```ts
// src/lib/validateAnalysis.ts
import { AnalysisResult, Confidence, ContactData, ErrorCategory, ErrorItem } from "@/types";

/**
 * Härtet die KI-Antwort, bevor sie gespeichert wird. Claude liest den
 * hochgeladenen Text – ein präpariertes PDF könnte beliebige Felder/Typen
 * ins JSON schmuggeln. Alles, was der Client oder die PDF-Renderer nicht
 * vertragen, wird hier auf sichere Defaults gezogen oder verworfen.
 */
const CONFIDENCES: ReadonlySet<string> = new Set<Confidence>(["sicher", "wahrscheinlich", "unsicher"]);
const CATEGORIES: ReadonlySet<string> = new Set<ErrorCategory>(["direct", "needs_review"]);
const MAX_ERRORS = 30;
const MAX_TEXT = 2000;
const MAX_SHORT = 300;
const MAX_EUR = 100_000;

function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().slice(0, max);
  return s.length ? s : null;
}

function eur(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > MAX_EUR) return null;
  return Math.round(v * 100) / 100;
}

function contact(v: unknown): ContactData | undefined {
  if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
  const o = v as Record<string, unknown>;
  return {
    tenantName: str(o.tenantName, MAX_SHORT),
    tenantAddress: str(o.tenantAddress, MAX_SHORT),
    landlordName: str(o.landlordName, MAX_SHORT),
    landlordAddress: str(o.landlordAddress, MAX_SHORT),
    contractNumber: str(o.contractNumber, MAX_SHORT),
    billingPeriod: str(o.billingPeriod, MAX_SHORT),
  };
}

function errorItem(v: unknown): ErrorItem | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const title = str(o.title, MAX_SHORT);
  const description = str(o.description, MAX_TEXT);
  if (!title || !description) return null;
  return {
    title,
    description,
    confidence: CONFIDENCES.has(o.confidence as string) ? (o.confidence as Confidence) : "unsicher",
    category: CATEGORIES.has(o.category as string) ? (o.category as ErrorCategory) : "needs_review",
    potentialEur: eur(o.potentialEur),
    legalBasis: str(o.legalBasis, MAX_SHORT),
    actionText: str(o.actionText, MAX_TEXT),
    evidence: str(o.evidence, MAX_TEXT),
  };
}

/** Gibt ein bereinigtes Ergebnis zurück – oder null, wenn die Antwort unbrauchbar ist. */
export function normalizeAnalysis(raw: unknown): AnalysisResult | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  const summary = str(r.summary, MAX_TEXT);
  if (!summary) return null;

  const rawErrors = Array.isArray(r.errors) ? r.errors.slice(0, MAX_ERRORS) : [];
  const errors = rawErrors.map(errorItem).filter((e): e is ErrorItem => e !== null);

  return {
    notAStatement: r.notAStatement === true,
    summary,
    errors,
    totalPotentialEur: eur(r.totalPotentialEur),
    totalPotentialLabel: str(r.totalPotentialLabel, MAX_SHORT),
    directPotentialEur: eur(r.directPotentialEur),
    reviewPotentialEur: eur(r.reviewPotentialEur),
    contactData: contact(r.contactData),
  };
}

/** Wird geworfen, wenn Claude kein brauchbares Ergebnis geliefert hat. */
export class InvalidAnalysisError extends Error {
  constructor() {
    super("Ungültige Analyse-Antwort");
    this.name = "InvalidAnalysisError";
  }
}
```

- [ ] **Step 4: Tests laufen lassen – müssen bestehen**

Run: `npm test`
Expected: alle `validateAnalysis`-Tests grün (8 passed) + `mock`-Tests.

- [ ] **Step 5: In claude.ts einbauen**

`src/lib/claude.ts` – Import ergänzen und Zeile 113 ersetzen:

```ts
import { InvalidAnalysisError, normalizeAnalysis } from "./validateAnalysis";
// …
  const parsed = normalizeAnalysis(extractJson(extractText(message)));
  if (!parsed) throw new InvalidAnalysisError();
  return parsed;
```

- [ ] **Step 6: analyze-Route: 502 statt 500 bei unbrauchbarer Antwort**

`src/app/api/analyze/route.ts` – Import ergänzen und den `catch`-Block (Zeilen 80-90) ersetzen:

```ts
import { InvalidAnalysisError } from "@/lib/validateAnalysis";
// …
  } catch (err: unknown) {
    if (err instanceof SyntaxError || err instanceof InvalidAnalysisError) {
      console.error("Analysis error: unbrauchbare KI-Antwort", err.message);
      return NextResponse.json(
        { error: "Die Analyse konnte nicht verarbeitet werden. Bitte erneut versuchen." },
        { status: 502 }
      );
    }
    const message = err instanceof Error ? err.message : "";
    console.error("Analysis error:", message);
    return NextResponse.json({ error: classifyError(message) }, { status: 500 });
  }
```

(Hinweis: `req.json()`-Fehler bei kaputtem Body landen ebenfalls im `SyntaxError`-Zweig – akzeptiert, nicht Teil dieses Blockers.)

- [ ] **Step 7: tsc + Commit**

Run: `npx tsc --noEmit && npm test`
Expected: 0 Fehler, alle Tests grün.

```bash
git add src/lib/validateAnalysis.ts src/lib/validateAnalysis.test.ts src/lib/claude.ts src/app/api/analyze/route.ts
git commit -m "fix(security): KI-Antwort validieren und normalisieren vor dem Speichern"
```

---

### Task 4: Zahlung und Speicherdauer absichern (Blocker 4 + 5)

**Files:**
- Create: `src/lib/stripe.ts`, `src/lib/stripe.test.ts`
- Modify: `src/lib/kv.ts:18,43-51`, `src/app/api/checkout/route.ts:1-9,25,40-41`, `src/app/api/stripe-webhook/route.ts`, `messages/*.json` (DSE-Satz)

- [ ] **Step 1: Failing Test für die Freischalt-Regel schreiben**

```ts
// src/lib/stripe.test.ts
import { describe, expect, it } from "vitest";
import { sessionUnlocksAnalysis } from "@/lib/stripe";

const base = {
  payment_status: "paid",
  metadata: { analysisId: "abc" },
  client_reference_id: "abc",
} as unknown as import("stripe").Stripe.Checkout.Session;

describe("sessionUnlocksAnalysis", () => {
  it("unlocks a paid session for its own analysis id", () => {
    expect(sessionUnlocksAnalysis(base, "abc")).toBe(true);
  });
  it("refuses unpaid sessions (Klarna/SEPA pending)", () => {
    expect(sessionUnlocksAnalysis({ ...base, payment_status: "unpaid" }, "abc")).toBe(false);
  });
  it("refuses a session that belongs to another analysis", () => {
    expect(sessionUnlocksAnalysis(base, "other")).toBe(false);
  });
  it("accepts client_reference_id when metadata is missing", () => {
    expect(sessionUnlocksAnalysis({ ...base, metadata: null }, "abc")).toBe(true);
  });
});
```

- [ ] **Step 2: Test laufen lassen – muss fehlschlagen**

Run: `npm test`
Expected: FAIL, `Cannot find module '@/lib/stripe'`.

- [ ] **Step 3: stripe.ts implementieren**

```ts
// src/lib/stripe.ts
import Stripe from "stripe";
import { markPaid } from "./kv";

// Lazy-Init wie bei kv/claude: Build darf ohne Env importieren.
let _stripe: Stripe | null = null;
export function stripe(): Stripe {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  return _stripe;
}

/** Stripe-Session-IDs sehen so aus: cs_test_… / cs_live_… */
const SESSION_ID_RE = /^cs_(test|live)_[A-Za-z0-9]{10,}$/;
export function isSessionId(v: unknown): v is string {
  return typeof v === "string" && SESSION_ID_RE.test(v);
}

/**
 * Reine Regel: Eine Session schaltet eine Analyse nur frei, wenn sie wirklich
 * bezahlt ist (Klarna/SEPA liefern `completed` auch bei `unpaid`) UND zu genau
 * dieser Analyse gehört.
 */
export function sessionUnlocksAnalysis(session: Stripe.Checkout.Session, analysisId: string): boolean {
  if (session.payment_status !== "paid") return false;
  const owner = session.metadata?.analysisId ?? session.client_reference_id;
  return owner === analysisId;
}

/**
 * Fallback zur Webhook-Freischaltung: Der Server fragt Stripe direkt nach der
 * Session (kein Client-Vertrauen nötig). Gibt true zurück, wenn freigeschaltet.
 */
export async function unlockFromStripeSession(analysisId: string, sessionId: string): Promise<boolean> {
  const session = await stripe().checkout.sessions.retrieve(sessionId);
  if (!sessionUnlocksAnalysis(session, analysisId)) return false;
  const email = session.customer_details?.email ?? session.customer_email ?? undefined;
  await markPaid(analysisId, email);
  return true;
}
```

- [ ] **Step 4: Test laufen lassen – muss bestehen**

Run: `npm test`
Expected: `stripe.test.ts` 4 passed.

- [ ] **Step 5: kv.ts – bezahlte Ergebnisse 7 Tage halten, fehlenden Record melden**

`src/lib/kv.ts` – Zeile 18 ergänzen und `markPaid` (Zeilen 43-51) ersetzen:

```ts
const TTL_SECONDS = 60 * 60 * 24; // 24 h Auto-Ablauf (unbezahlt)
/** Nach Zahlung: 7 Tage, damit der Bericht nicht kurz nach dem Kauf verschwindet. */
export const PAID_TTL_SECONDS = 60 * 60 * 24 * 7;
```

```ts
/**
 * Setzt das paid-Flag und verlängert die Lebensdauer auf PAID_TTL_SECONDS
 * (mindestens – eine längere Rest-TTL bleibt erhalten). Speichert optional die
 * Kunden-E-Mail. Gibt false zurück, wenn der Record bereits abgelaufen war –
 * dann hat jemand bezahlt, ohne dass ein Ergebnis existiert (Aufrufer loggt).
 */
export async function markPaid(id: string, customerEmail?: string): Promise<boolean> {
  const record = await getAnalysis(id);
  if (!record) return false;
  record.paid = true;
  if (customerEmail) record.customerEmail = customerEmail;
  const remaining = await redis().ttl(key(id));
  await redis().set(key(id), record, { ex: Math.max(remaining, PAID_TTL_SECONDS) });
  return true;
}
```

- [ ] **Step 6: Checkout – gemeinsamen Client nutzen, Session nach 30 min verfallen lassen**

`src/app/api/checkout/route.ts` – Zeilen 1-9 ersetzen durch:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getAnalysis } from "@/lib/kv";
import { stripe } from "@/lib/stripe";
```

und in `sessions.create` nach `mode: "payment",` einfügen:

```ts
      // Stripe-Minimum 30 min. Verhindert Zahlungen, nachdem der 24-h-Record
      // in Redis abgelaufen ist (Session lebt sonst standardmäßig 24 h).
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
```

- [ ] **Step 7: Webhook – nur wirklich bezahlte Sessions freischalten**

`src/app/api/stripe-webhook/route.ts` komplett ersetzen:

```ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, sessionUnlocksAnalysis } from "@/lib/stripe";
import { markPaid } from "@/lib/kv";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Keine Signatur." }, { status: 400 });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err: unknown) {
    console.error("Webhook signature error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Ungültige Signatur." }, { status: 400 });
  }

  // `completed` feuert bei Klarna/SEPA/Sofort auch mit payment_status "unpaid";
  // die echte Zahlung kommt dann später als `async_payment_succeeded`.
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const id = session.metadata?.analysisId ?? session.client_reference_id;
    if (id && sessionUnlocksAnalysis(session, id)) {
      const email = session.customer_details?.email ?? session.customer_email ?? undefined;
      const ok = await markPaid(id, email);
      if (!ok) {
        // Geld ist da, Ergebnis nicht mehr: muss auffallen (Refund manuell).
        console.error(`Webhook: Zahlung fuer abgelaufene Analyse ${id}, session ${session.id}`);
      }
    }
  } else if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.warn(`Webhook: asynchrone Zahlung fehlgeschlagen, session ${session.id}`);
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 8: Datenschutz-Satz zur Speicherdauer anpassen (alle 6 Sprachen)**

Run: `grep -n "24" messages/*.json`
Erwartet: Treffer in `legal.datenschutz` (de.json Zeile ~236 „…automatisch nach 24 Stunden gelöscht…") und ggf. FAQ. Jeden Treffer, der die Löschfrist beschreibt, so ändern, dass er der neuen Realität entspricht.

`messages/de.json` – Body von „Speicherung & Löschung" ersetzen:

```
Prüfergebnisse werden vorübergehend auf unseren Servern gespeichert und spätestens 24 Stunden nach dem Upload automatisch gelöscht. Nach einem Kauf bleibt der Prüfbericht bis zu 7 Tage abrufbar und wird danach automatisch gelöscht. Eine dauerhafte Speicherung Ihrer Abrechnung findet nicht statt.
```

`messages/en.json` – entsprechender Body:

```
Check results are stored temporarily on our servers and deleted automatically no later than 24 hours after upload. After a purchase, the report remains available for up to 7 days and is then deleted automatically. Your statement is never stored permanently.
```

`tr/ar/ru/uk.json`: denselben Satz sinngemäß übersetzen (Dateien tragen bereits `_meta.status: "ai-draft"`). FAQ-Antworten mit „24 Stunden" analog ergänzen („…nach dem Kauf bis zu 7 Tage").

Run: `node -e "for (const l of ['de','en','tr','ar','ru','uk']) JSON.parse(require('fs').readFileSync('messages/'+l+'.json','utf8')); console.log('JSON ok')"`
Expected: `JSON ok`.

- [ ] **Step 9: tsc, Tests, Commit**

Run: `npx tsc --noEmit && npm test`
Expected: 0 Fehler, alle Tests grün.

```bash
git add src/lib/stripe.ts src/lib/stripe.test.ts src/lib/kv.ts src/app/api/checkout/route.ts src/app/api/stripe-webhook/route.ts messages/
git commit -m "fix(payment): nur bezahlte Sessions freischalten, bezahlte Ergebnisse 7 Tage halten, Session-Ablauf 30 min"
```

---

### Task 5: Freischaltung ohne Webhook + Ergebnisseite (Blocker 7)

**Files:**
- Modify: `src/app/api/result/route.ts`, `src/app/[locale]/ergebnis/page.tsx`, `messages/{de,en,tr,ar,ru,uk}.json` (neuer Namespace `ergebnis`)

- [ ] **Step 1: result-Route mit Session-Fallback**

`src/app/api/result/route.ts` komplett ersetzen:

```ts
import { NextRequest, NextResponse } from "next/server";
import { getAnalysis, isUnlocked } from "@/lib/kv";
import { isSessionId, unlockFromStripeSession } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Fehlende ID." }, { status: 400 });

  let record = await getAnalysis(id);
  if (!record) {
    return NextResponse.json({ error: "Ergebnis abgelaufen oder nicht gefunden." }, { status: 404 });
  }

  // Fallback, falls der Webhook (noch) nicht durch ist: Stripe direkt fragen.
  // Die session_id kommt aus der success_url; verifiziert wird server-zu-Stripe.
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!isUnlocked(record) && isSessionId(sessionId)) {
    try {
      if (await unlockFromStripeSession(id, sessionId)) record = await getAnalysis(id);
    } catch (err: unknown) {
      console.error("Stripe session fallback failed:", err instanceof Error ? err.message : err);
    }
  }

  if (!record || !isUnlocked(record)) {
    return NextResponse.json({ error: "Nicht freigeschaltet." }, { status: 402 });
  }
  return NextResponse.json({ ...record.full, _customerEmail: record.customerEmail ?? null });
}
```

- [ ] **Step 2: i18n-Namespace `ergebnis` in allen 6 Dateien anlegen**

Nach dem `"report"`-Block einfügen (Position egal, Key-Parität zählt).

`messages/de.json`:

```json
"ergebnis": {
  "loading": "Dein Bericht wird geladen…",
  "noId": "Keine Ergebnis-ID gefunden.",
  "notFound": "Ergebnis nicht gefunden oder abgelaufen.",
  "pending": "Deine Zahlung wird noch verarbeitet. Das dauert normalerweise nur wenige Sekunden.",
  "retry": "Erneut prüfen",
  "home": "Zur Startseite"
}
```

`messages/en.json`:

```json
"ergebnis": {
  "loading": "Loading your report…",
  "noId": "No result ID found.",
  "notFound": "Result not found or expired.",
  "pending": "Your payment is still being processed. This usually takes only a few seconds.",
  "retry": "Check again",
  "home": "Back to home"
}
```

`tr/ar/ru/uk.json`: dieselben 6 Keys, übersetzt.

Run (Parität):
```bash
node -e "const flat=(o,p='')=>Object.entries(o).flatMap(([k,v])=>v&&typeof v==='object'&&!Array.isArray(v)?flat(v,p+k+'.'):[p+k]);const de=new Set(flat(require('./messages/de.json')).filter(k=>!k.startsWith('_meta')));for(const l of ['en','tr','ar','ru','uk']){const s=new Set(flat(require('./messages/'+l+'.json')).filter(k=>!k.startsWith('_meta')));const miss=[...de].filter(k=>!s.has(k));console.log(l+': '+(miss.length?('FEHLT '+miss.join(',')):'OK'));}"
```
Expected: 5× `OK`.

- [ ] **Step 3: Ergebnisseite – session_id durchreichen, Retry-Button, i18n**

`src/app/[locale]/ergebnis/page.tsx` komplett ersetzen:

```tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import ResultView from "@/components/ResultView";
import Logo from "@/components/Logo";
import { Link, useRouter } from "@/i18n/navigation";
import { AnalysisResult } from "@/types";

const POLL_ATTEMPTS = 5;
const POLL_DELAY_MS = 1500;

function ErgebnisInner() {
  const t = useTranslations("ergebnis");
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");
  const sessionId = params.get("session_id");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0); // Retry-Button erhöht → Effekt läuft erneut

  useEffect(() => {
    if (!id) {
      setError(t("noId"));
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPending(false);
    const query = new URLSearchParams({ id });
    if (sessionId) query.set("session_id", sessionId);

    // Webhook kann minimal verzögert sein → mehrfach mit kurzer Pause versuchen.
    // Die result-Route fragt bei session_id zusätzlich Stripe direkt (Fallback).
    (async () => {
      for (let i = 0; i < POLL_ATTEMPTS; i++) {
        const res = await fetch(`/api/result?${query}`);
        if (cancelled) return;
        if (res.ok) {
          setResult(await res.json());
          setLoading(false);
          return;
        }
        if (res.status !== 402) {
          setError(t("notFound"));
          setLoading(false);
          return;
        }
        await new Promise((r) => setTimeout(r, POLL_DELAY_MS));
      }
      if (!cancelled) {
        setPending(true);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // t ist stabil pro Locale; attempt triggert bewusst einen erneuten Lauf.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, sessionId, attempt]);

  if (loading) return <p className="text-center text-muted py-20">{t("loading")}</p>;

  if (pending) {
    return (
      <div className="text-center py-20 space-y-6">
        <p className="text-muted">{t("pending")}</p>
        <button
          onClick={() => setAttempt((a) => a + 1)}
          className="rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold py-3 px-6 text-sm transition-colors"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="text-center py-20 space-y-6">
        <p className="text-[#FCA5A5]">{error ?? t("notFound")}</p>
        <Link href="/" className="inline-block text-sm text-muted underline hover:text-fg">
          {t("home")}
        </Link>
      </div>
    );
  }

  return <ResultView result={result} id={id!} onReset={() => router.push("/")} />;
}

export default function ErgebnisPage() {
  const t = useTranslations("ergebnis");
  return (
    <main className="min-h-[100dvh] bg-ink">
      <nav className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b border-line bg-ink/90 backdrop-blur-sm">
        <Link href="/" aria-label={t("home")}>
          <Logo />
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <Suspense fallback={<p className="text-center text-muted py-20">{t("loading")}</p>}>
          <ErgebnisInner />
        </Suspense>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: tsc + Build + Commit**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: 0 Fehler, Tests grün, Build mit 43 statischen Seiten.

```bash
git add src/app/api/result/route.ts "src/app/[locale]/ergebnis/page.tsx" messages/
git commit -m "fix(payment): Freischaltung per Stripe-Session-Fallback, Ergebnisseite mit Retry und i18n"
```

---

### Task 6: send-pdf härten (Blocker 1)

**Files:**
- Create: `src/lib/email.ts`, `src/lib/email.test.ts`, `src/lib/letters.ts`, `src/lib/letters.test.ts`
- Modify: `src/lib/kv.ts` (storeLetter/getLetter), `src/lib/ratelimit.ts`, `src/lib/limits.ts`, `src/lib/mailer.ts`, `src/app/api/generate-letter/route.tsx`, `src/components/LetterModal.tsx:141-167`
- Rename: `src/app/api/send-pdf/route.ts` → `src/app/api/send-pdf/route.tsx`

- [ ] **Step 1: Failing Tests für E-Mail- und Typ-Validierung**

```ts
// src/lib/email.test.ts
import { describe, expect, it } from "vitest";
import { isValidEmail } from "@/lib/email";

describe("isValidEmail", () => {
  it("accepts one plain address", () => {
    expect(isValidEmail("max@example.de")).toBe(true);
    expect(isValidEmail("  first.last+tag@sub.example.co.uk ")).toBe(true);
  });
  it("rejects lists, headers and junk (no relay)", () => {
    expect(isValidEmail("a@x.de,b@y.de")).toBe(false);
    expect(isValidEmail("a@x.de; b@y.de")).toBe(false);
    expect(isValidEmail("Max <a@x.de>")).toBe(false);
    expect(isValidEmail("a@x.de\nBcc: b@y.de")).toBe(false);
    expect(isValidEmail("nope")).toBe(false);
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(42)).toBe(false);
    expect(isValidEmail("a@x.d")).toBe(false);
    expect(isValidEmail("a".repeat(250) + "@x.de")).toBe(false);
  });
});
```

```ts
// src/lib/letters.test.ts
import { describe, expect, it } from "vitest";
import { isLetterType, LETTER_FILENAMES } from "@/lib/letters";

describe("letters", () => {
  it("recognises the three letter types only", () => {
    expect(isLetterType("objection")).toBe(true);
    expect(isLetterType("document_review")).toBe(true);
    expect(isLetterType("combined")).toBe(true);
    expect(isLetterType("foo")).toBe(false);
    expect(isLetterType(undefined)).toBe(false);
  });
  it("maps every type to a fixed .pdf filename", () => {
    expect(LETTER_FILENAMES.objection).toBe("Widerspruch.pdf");
    expect(LETTER_FILENAMES.document_review).toBe("Belegeinsicht.pdf");
    expect(LETTER_FILENAMES.combined).toBe("Widerspruch_und_Belegeinsicht.pdf");
  });
});
```

- [ ] **Step 2: Tests laufen lassen – müssen fehlschlagen**

Run: `npm test`
Expected: FAIL, Module `@/lib/email` und `@/lib/letters` fehlen.

- [ ] **Step 3: email.ts und letters.ts implementieren**

```ts
// src/lib/email.ts
/**
 * Genau EINE Adresse, keine Listen (`,`/`;`), keine Anzeigenamen (`<>`),
 * keine Zeilenumbrüche (Header-Injection). Bewusst streng, weil der Server
 * sonst als Relay für beliebige Empfänger missbraucht werden könnte.
 */
const EMAIL_RE = /^[^\s@,;<>]+@[^\s@,;<>]+\.[A-Za-z]{2,}$/;
const MAX_LEN = 254;

export function isValidEmail(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const s = v.trim();
  return s.length > 0 && s.length <= MAX_LEN && EMAIL_RE.test(s);
}
```

```ts
// src/lib/letters.ts
import { LetterType } from "@/types";

export const LETTER_TYPES: readonly LetterType[] = ["objection", "document_review", "combined"];

export function isLetterType(v: unknown): v is LetterType {
  return typeof v === "string" && (LETTER_TYPES as readonly string[]).includes(v);
}

/** Feste Dateinamen – der Client darf keinen eigenen wählen. */
export const LETTER_FILENAMES: Record<LetterType, string> = {
  objection: "Widerspruch.pdf",
  document_review: "Belegeinsicht.pdf",
  combined: "Widerspruch_und_Belegeinsicht.pdf",
};

// Betreffzeilen gehen an den (deutschen) Vermieter → bewusst Deutsch.
export const MAIL_SUBJECTS: Record<LetterType, string> = {
  objection: "Widerspruch gegen die Nebenkostenabrechnung",
  document_review: "Aufforderung zur Belegeinsicht",
  combined: "Widerspruch und Belegeinsicht – Nebenkostenabrechnung",
};
```

- [ ] **Step 4: Tests laufen lassen – müssen bestehen**

Run: `npm test`
Expected: `email.test.ts` 2 passed, `letters.test.ts` 2 passed.

- [ ] **Step 5: kv.ts – Brief speichern/lesen**

Am Ende von `src/lib/kv.ts` anhängen (Import `LetterType` aus `@/types` ergänzen):

```ts
const letterKey = (id: string, type: LetterType) => `analysis:${id}:letter:${type}`;

/**
 * Legt den generierten Brieftext ab, damit send-pdf das PDF serverseitig neu
 * rendern kann statt Client-Bytes zu verschicken. Lebt genau so lange wie die
 * Analyse selbst.
 */
export async function storeLetter(id: string, type: LetterType, letter: string): Promise<void> {
  const remaining = await redis().ttl(key(id));
  await redis().set(letterKey(id, type), letter, { ex: remaining > 0 ? remaining : TTL_SECONDS });
}

export async function getLetter(id: string, type: LetterType): Promise<string | null> {
  return (await redis().get<string>(letterKey(id, type))) ?? null;
}
```

- [ ] **Step 6: ratelimit.ts – generischer Limiter**

`src/lib/ratelimit.ts` komplett ersetzen:

```ts
import { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./kv";
import { RATE_LIMIT_PER_HOUR, RATE_LIMIT_PER_DAY } from "./limits";

type Window = Parameters<typeof Ratelimit.slidingWindow>[1];

// Ein Limiter pro Prefix, lazy erzeugt (Build darf ohne Env importieren).
const _limiters = new Map<string, Ratelimit>();
function limiter(prefix: string, limit: number, window: Window): Ratelimit {
  let l = _limiters.get(prefix);
  if (!l) {
    l = new Ratelimit({
      redis: redis(),
      limiter: Ratelimit.slidingWindow(limit, window),
      analytics: false,
      prefix,
    });
    _limiters.set(prefix, l);
  }
  return l;
}

/** Generisches Sliding-Window-Limit. true = erlaubt. */
export async function checkLimit(prefix: string, limit: number, window: Window, key: string): Promise<boolean> {
  const res = await limiter(prefix, limit, window).limit(key);
  return res.success;
}

/** Ermittelt die Client-IP aus den von Vercel gesetzten Headern. */
export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Analyse-Limit: prüft beide Fenster (Stunde + Tag). true, wenn beide erlauben. */
export async function checkRateLimit(ip: string): Promise<boolean> {
  const [h, d] = await Promise.all([
    checkLimit("rl:analyze:h", RATE_LIMIT_PER_HOUR, "1 h", ip),
    checkLimit("rl:analyze:d", RATE_LIMIT_PER_DAY, "1 d", ip),
  ]);
  return h && d;
}
```

- [ ] **Step 7: limits.ts – Sende-Limits**

Am Ende von `src/lib/limits.ts` anhängen:

```ts
/** PDF-Mailversand: pro Analyse-ID und Tag (schützt die Absender-Reputation). */
export const SEND_PDF_PER_ID_PER_DAY = 5;

/** PDF-Mailversand: pro IP und Tag. */
export const SEND_PDF_PER_IP_PER_DAY = 20;
```

- [ ] **Step 8: mailer.ts – Buffer statt Base64**

`src/lib/mailer.ts` – Funktion `sendLetterPdf` ersetzen:

```ts
export async function sendLetterPdf(
  to: string,
  pdf: Buffer,
  filename: string,
  subject: string,
) {
  await transport().sendMail({
    from: `Nebenkostencheck <${process.env.SMTP_USER}>`,
    to,
    subject,
    text: `Anbei dein erstelltes Schreiben als PDF. Du kannst es ausdrucken oder an deinen Vermieter weiterleiten.\n\nViele Grüße\nNebenkostencheck`,
    attachments: [{ filename, content: pdf, contentType: "application/pdf" }],
  });
}
```

- [ ] **Step 9: generate-letter – Typ validieren, Brief speichern, Dateinamen teilen**

`src/app/api/generate-letter/route.tsx`:

Imports ergänzen/ersetzen:
```tsx
import { getAnalysis, isUnlocked, storeLetter } from "@/lib/kv";
import { isLetterType, LETTER_FILENAMES } from "@/lib/letters";
import { ContactData } from "@/types";
```
(`LetterType` aus dem Import entfernen, falls nicht mehr gebraucht.)

Zeilen 30-33 (Body-Parsing + Prüfung) ersetzen:
```tsx
    const body = (await req.json()) as { id?: unknown; type?: unknown; contact?: unknown };
    if (typeof body.id !== "string" || !body.id || !isLetterType(body.type)) {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }
    const { id, type } = body;
```
Danach im Rest der Funktion `body.id` → `id`, `body.type` → `type`, `body.contact` → `body.contact`.

Zeilen 58-63 (`const filename = …`) löschen. Die Rückgabe (Zeilen 65-72) ersetzen:
```tsx
    const letter = await generateLetter({ type, contact, errors });
    await storeLetter(id, type, letter);
    const pdf = await renderToBuffer(<LetterDoc letter={letter} />);

    return NextResponse.json({
      letter,
      pdfBase64: Buffer.from(pdf).toString("base64"),
      filename: LETTER_FILENAMES[type],
    });
```

- [ ] **Step 10: send-pdf neu schreiben (als .tsx wegen JSX)**

Run: `git mv src/app/api/send-pdf/route.ts src/app/api/send-pdf/route.tsx`

Inhalt komplett ersetzen:

```tsx
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
```

- [ ] **Step 11: LetterModal – neuen Vertrag nutzen**

`src/components/LetterModal.tsx`:

Zeilen 19-24 (`MAIL_SUBJECTS`) löschen und stattdessen importieren:
```tsx
import { MAIL_SUBJECTS } from "@/lib/letters";
```

In `sendToMyEmail` (Zeile 155) den Body ersetzen:
```tsx
        body: JSON.stringify({ id, email, type }),
```

- [ ] **Step 12: Verbleibende Aufrufer prüfen**

Run: `grep -rn "pdfBase64\|sendLetterPdf\|MAIL_SUBJECTS" src`
Expected: `pdfBase64` nur noch in `generate-letter` (Antwort), `types/index.ts` (`LetterPdfResponse`) und `LetterModal` (Download). `sendLetterPdf` nur in `mailer.ts` + `send-pdf`. `MAIL_SUBJECTS` in `letters.ts`, `LetterModal`, `send-pdf`.

- [ ] **Step 13: tsc, Tests, Build, Commit**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: 0 Fehler, alle Tests grün, Build ok.

```bash
git add src/lib/email.ts src/lib/email.test.ts src/lib/letters.ts src/lib/letters.test.ts src/lib/kv.ts src/lib/ratelimit.ts src/lib/limits.ts src/lib/mailer.ts src/app/api/generate-letter/route.tsx src/app/api/send-pdf src/components/LetterModal.tsx
git commit -m "fix(security): send-pdf rendert serverseitig, validiert Empfaenger und limitiert Versand (kein Mail-Relay)"
```

---

### Task 7: Betreiberdaten (manuell – Franz)

Kein Agent-Task. Vor dem Go-Live:
- [ ] Platzhalter `[Name des Betreibers]`, `[Straße & Hausnummer]` usw. in `messages/{de,en,tr,ar,ru,uk}.json` (Namespace `legal`) durch die echten Betreiberdaten ersetzen.
- [ ] `draftNotice`-Zeile in `src/components/LegalPage.tsx:17` entfernen und den Key `legal.draftNotice` aus allen 6 JSONs löschen.
- [ ] README-Checkbox „Betreiberdaten eingetragen" erst dann abhaken.

---

### Task 8: Abschluss-Verifikation (Smoke-Test mit MOCK)

**Files:** keine Änderungen – nur prüfen.

- [ ] **Step 1: Statische Checks**

Run: `npx tsc --noEmit && npm test && npm run build`
Expected: 0 Fehler, alle Tests grün, Build ok.

- [ ] **Step 2: Dev-Server mit MOCK starten**

`.env.local` muss `MOCK_ANALYSIS=true` und gültige `KV_REST_API_URL/TOKEN` enthalten (Rate-Limit + Letter-Store brauchen Redis). Server über das Preview-Tool bzw. `npm run dev` starten.

- [ ] **Step 3: Analyse + Brief erzeugen**

```bash
ID=$(curl -s -X POST http://localhost:3000/api/analyze -H 'Content-Type: application/json' \
  -d '{"base64":"JVBERi0xLjQK","mediaType":"application/pdf","fileName":"t.pdf"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).id'); echo $ID
curl -s -X POST http://localhost:3000/api/generate-letter -H 'Content-Type: application/json' \
  -d "{\"id\":\"$ID\",\"type\":\"objection\",\"contact\":{}}" | node -pe 'const j=JSON.parse(require("fs").readFileSync(0)); j.filename+" "+j.letter.length'
```
Expected: eine UUID; `Widerspruch.pdf <n>`.

- [ ] **Step 4: send-pdf-Härtung prüfen (ohne echten Mailversand)**

```bash
# Liste → 400
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/send-pdf -H 'Content-Type: application/json' -d "{\"id\":\"$ID\",\"email\":\"a@x.de,b@y.de\",\"type\":\"objection\"}"
# Fremder Typ → 400
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/send-pdf -H 'Content-Type: application/json' -d "{\"id\":\"$ID\",\"email\":\"a@x.de\",\"type\":\"foo\"}"
# pdfBase64/filename werden ignoriert, Typ ohne gespeicherten Brief → 404
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/send-pdf -H 'Content-Type: application/json' -d "{\"id\":\"$ID\",\"email\":\"a@x.de\",\"type\":\"combined\",\"pdfBase64\":\"QUJD\",\"filename\":\"x.exe\"}"
# Unbekannte ID → 404
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/api/send-pdf -H 'Content-Type: application/json' -d '{"id":"00000000-0000-0000-0000-000000000000","email":"a@x.de","type":"objection"}'
```
Expected: `400`, `400`, `404`, `404`.

- [ ] **Step 5: Ergebnisseite + ungültige session_id**

```bash
curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:3000/api/result?id=$ID&session_id=<script>"
curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:3000/en/ergebnis?id=$ID"
```
Expected: `200` (MOCK schaltet frei; ungültige session_id wird ignoriert, kein Stripe-Call), `200`.

- [ ] **Step 6: Ergebnis dokumentieren**

Kurze Zusammenfassung der geprüften Statuscodes in der Abschlussmeldung; keine Datei-Änderung nötig.
