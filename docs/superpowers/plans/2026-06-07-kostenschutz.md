# Kostenschutz für die Analyse — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Übergroße Dokumente und Gratis-Check-Missbrauch abfangen, bevor teure Claude-Token verbraucht werden.

**Architecture:** Vier Gates in `/api/analyze`, von billig nach präzise: IP-Rate-Limit → MIME → Dateigröße → kostenlose Token-Zählung → echte Analyse. Grenzwerte zentral in `src/lib/limits.ts`. Rate-Limit über `@upstash/ratelimit` auf der vorhandenen Upstash-Redis-Instanz. Token-Zählung über Anthropics kostenlosen `messages.countTokens`-Endpoint.

**Tech Stack:** Next.js 15 App Router, TypeScript, `@anthropic-ai/sdk` (^0.100.1), `@upstash/redis` (^1.38.0, vorhanden), `@upstash/ratelimit` (neu).

**Hinweis zur Verifikation:** Das Projekt hat **kein** Unit-Test-Framework. Pro Task ist die harte Gate-Verifikation `npx tsc --noEmit` (Typen grün) plus bei Routen-/Build-relevanten Änderungen `npm run build`. Eine abschließende manuelle End-to-End-Verifikation mit curl steht in Task 6. Alle Befehle im Projektordner `E:\Neko-Check\nebenkostencheck\nebenkostencheck` ausführen.

---

### Task 1: Zentrale Limit-Konstanten

**Files:**
- Create: `src/lib/limits.ts`

- [ ] **Step 1: Datei mit den Grenzwerten anlegen**

`src/lib/limits.ts`:

```ts
// Zentrale Grenzwerte für den Kostenschutz der Analyse.
// Großzügig gewählt (~2,5x über dem Normalfall einer Abrechnung mit ~31k Token).

/** Maximale Dateigröße eines Uploads in Bytes (15 MB). */
export const MAX_FILE_BYTES = 15 * 1024 * 1024;

/** Maximale Input-Token, die ein Dokument an Claude kosten darf. */
export const MAX_INPUT_TOKENS = 80_000;

/** Maximale kostenlose Analysen pro IP und Stunde. */
export const RATE_LIMIT_PER_HOUR = 5;

/** Maximale kostenlose Analysen pro IP und Tag. */
export const RATE_LIMIT_PER_DAY = 15;
```

- [ ] **Step 2: Typen prüfen**

Run: `npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 3: Commit**

```bash
git add src/lib/limits.ts
git commit -m "feat: add central cost-protection limit constants"
```

---

### Task 2: Rate-Limit-Modul

**Files:**
- Modify: `package.json` (Dependency `@upstash/ratelimit`)
- Create: `src/lib/ratelimit.ts`

- [ ] **Step 1: Dependency installieren**

Run: `npm install @upstash/ratelimit`
Expected: `@upstash/ratelimit` erscheint in `package.json` unter `dependencies`, Installation ohne Fehler.

- [ ] **Step 2: Rate-Limit-Modul anlegen**

`src/lib/ratelimit.ts`:

```ts
import { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { RATE_LIMIT_PER_HOUR, RATE_LIMIT_PER_DAY } from "./limits";

// Lazy-Init wie in kv.ts: Build ohne Env-Vars darf nicht werfen.
let _redis: Redis | null = null;
function redis(): Redis {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
  }
  return _redis;
}

let _hourly: Ratelimit | null = null;
function hourly(): Ratelimit {
  if (!_hourly) {
    _hourly = new Ratelimit({
      redis: redis(),
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_PER_HOUR, "1 h"),
      analytics: false,
      prefix: "rl:analyze:h",
    });
  }
  return _hourly;
}

let _daily: Ratelimit | null = null;
function daily(): Ratelimit {
  if (!_daily) {
    _daily = new Ratelimit({
      redis: redis(),
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_PER_DAY, "1 d"),
      analytics: false,
      prefix: "rl:analyze:d",
    });
  }
  return _daily;
}

/** Ermittelt die Client-IP aus den von Vercel gesetzten Headern. */
export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Prüft beide Fenster (Stunde + Tag). Gibt true zurück, wenn beide erlauben. */
export async function checkRateLimit(ip: string): Promise<boolean> {
  const [h, d] = await Promise.all([hourly().limit(ip), daily().limit(ip)]);
  return h.success && d.success;
}
```

- [ ] **Step 3: Typen prüfen**

Run: `npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 4: Build prüfen (Lazy-Init darf den Build nicht brechen)**

Run: `npm run build`
Expected: Build „Compiled successfully", kein Werfen wegen fehlender Env-Vars.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/lib/ratelimit.ts
git commit -m "feat: add IP-based rate limiter (hourly + daily sliding windows)"
```

---

### Task 3: Token-Zähl-Helfer in claude.ts

**Files:**
- Modify: `src/lib/claude.ts`

Hintergrund: `analyzeStatement` baut aktuell den Doc-Block inline (Zeilen 65–81). Wir ziehen das in eine Helferfunktion `buildDocBlock`, damit `countDocumentTokens` denselben Block verwendet (DRY).

- [ ] **Step 1: Doc-Block-Helfer extrahieren und in analyzeStatement nutzen**

In `src/lib/claude.ts` den Block-Aufbau vor `analyzeStatement` als Funktion einfügen:

```ts
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
```

Dann in `analyzeStatement` die bestehende `const isPdf = ...`-Zeile und den inline `docBlock`-Ausdruck (aktuell Zeilen 63–81) ersetzen durch:

```ts
  const docBlock = buildDocBlock(base64, mediaType);
```

- [ ] **Step 2: countDocumentTokens hinzufügen**

Unter `analyzeStatement` einfügen:

```ts
const ANALYSIS_USER_TEXT = (fileName: string) =>
  `Bitte analysiere diese Nebenkostenabrechnung (Dateiname: ${
    fileName || "unbekannt"
  }) und gib deine Prüfung als JSON zurück.`;

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
```

Optional (Konsistenz, kein Muss): den inline-Text in `analyzeStatement` ebenfalls durch `ANALYSIS_USER_TEXT(fileName)` ersetzen.

- [ ] **Step 3: Typen prüfen**

Run: `npx tsc --noEmit`
Expected: keine Fehler. Falls `messages.countTokens` nicht existiert, ist die SDK-Version zu alt — dann `npm install @anthropic-ai/sdk@latest` und erneut prüfen.

- [ ] **Step 4: Commit**

```bash
git add src/lib/claude.ts
git commit -m "feat: add free token-count preflight helper (MOCK-safe)"
```

---

### Task 4: Gates in die analyze-Route einbauen

**Files:**
- Modify: `src/app/api/analyze/route.ts`

- [ ] **Step 1: Imports ergänzen**

Oben in `src/app/api/analyze/route.ts` die bestehenden Imports erweitern:

```ts
import { analyzeStatement, countDocumentTokens } from "@/lib/claude";
import { storeAnalysis } from "@/lib/kv";
import { classifyError } from "@/lib/errors";
import { checkRateLimit, getClientIp } from "@/lib/ratelimit";
import { MAX_FILE_BYTES, MAX_INPUT_TOKENS } from "@/lib/limits";
import { AnalysisResult, PreviewData } from "@/types";
```

- [ ] **Step 2: Die vier Gates in den POST-Handler einbauen**

Den Anfang des `try`-Blocks (bis vor `const result = await analyzeStatement(...)`) ersetzen durch:

```ts
    // Gate 1: Rate-Limit pro IP (zuerst — schützt auch die kostenlose Token-Zählung)
    const ip = getClientIp(req);
    if (!(await checkRateLimit(ip))) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte versuche es später noch einmal." },
        { status: 429 },
      );
    }

    const { base64, mediaType, fileName } = await req.json();
    if (!base64 || !mediaType) {
      return NextResponse.json({ error: "Keine Datei übermittelt." }, { status: 400 });
    }

    // Gate 2: MIME-Typ
    const isImage = mediaType.startsWith("image/");
    const isPdf = mediaType === "application/pdf";
    if (!isImage && !isPdf) {
      return NextResponse.json(
        { error: "Nur PDF und Bilder werden unterstützt. Bitte lade deine Abrechnung als PDF oder Foto hoch." },
        { status: 400 },
      );
    }

    // Gate 3: Dateigröße (aus base64-Länge rekonstruiert)
    const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
    const byteSize = (base64.length * 3) / 4 - padding;
    if (byteSize > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "Die Datei ist zu groß (max. 15 MB). Bitte lade nur die Nebenkostenabrechnung hoch." },
        { status: 413 },
      );
    }

    // Gate 4: Token-Zählung (kostenlos) — fängt den „Roman" präzise ab
    const tokenCount = await countDocumentTokens(base64, mediaType, fileName);
    if (tokenCount > MAX_INPUT_TOKENS) {
      return NextResponse.json(
        { error: "Das Dokument ist zu umfangreich für die Prüfung. Bitte lade nur die Nebenkostenabrechnung hoch." },
        { status: 422 },
      );
    }

    const result = await analyzeStatement(base64, mediaType, fileName);
```

Der Rest des Handlers (`if (result.notAStatement) ...`, `storeAnalysis`, `catch`) bleibt unverändert.

- [ ] **Step 3: Typen prüfen**

Run: `npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 4: Build prüfen**

Run: `npm run build`
Expected: „Compiled successfully", `/api/analyze` wird gebaut.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/analyze/route.ts
git commit -m "feat: enforce rate-limit, file-size and token gates in analyze route"
```

---

### Task 5: Clientseitiger Dateigrößen-Check (UX)

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Limit importieren**

In `src/app/page.tsx` unter die bestehenden Imports ergänzen:

```ts
import { MAX_FILE_BYTES } from "@/lib/limits";
```

- [ ] **Step 2: Größencheck vor dem Upload einbauen**

In `handleFileUpload` ganz am Anfang (vor `setLoading(true)`) einfügen:

```ts
    if (file.size > MAX_FILE_BYTES) {
      setError("Die Datei ist zu groß (max. 15 MB). Bitte lade nur die Nebenkostenabrechnung hoch.");
      setPreview(null);
      return;
    }
```

- [ ] **Step 3: Typen prüfen**

Run: `npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 4: Build prüfen (limits.ts muss client-importierbar sein — reine Konstanten, kein server-only)**

Run: `npm run build`
Expected: „Compiled successfully", keine „server-only"-Fehler beim Client-Import von `@/lib/limits`.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: client-side file-size guard before upload"
```

---

### Task 6: Manuelle End-to-End-Verifikation

**Files:** keine (nur Verifikation).

Voraussetzung: lokaler Dev-Server mit echten Env-Vars (`.env.local` mit KV_REST_API_URL/TOKEN, ANTHROPIC_API_KEY). Dev-Server starten mit der bekannten Eigenheit:

`env -u ANTHROPIC_API_KEY npm run dev`

(Claude Code setzt ein leeres `ANTHROPIC_API_KEY` in der Tool-Shell; ohne `env -u` schlägt der Auth fehl.)

Für reine Gate-Tests ohne Token-Kosten kann auch `MOCK_ANALYSIS=true` in `.env.local` gesetzt werden — dann zählt Gate 4 mit Fixwert 1000 (immer unter dem Limit), Gates 1–3 wirken trotzdem.

- [ ] **Step 1: Gültiger kleiner Upload läuft durch**

```bash
curl -s -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"base64":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==","mediaType":"image/png","fileName":"test.png"}'
```
Expected (MOCK an): JSON mit `errorCount` / `errorTitles` (keine Fehlermeldung).

- [ ] **Step 2: Übergroße Datei → 413**

```bash
node -e 'const b="A".repeat(21*1024*1024); console.log(JSON.stringify({base64:b,mediaType:"application/pdf",fileName:"big.pdf"}))' > /tmp/big.json
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" --data @/tmp/big.json
```
Expected: `413`.

- [ ] **Step 3: Rate-Limit greift**

```bash
for i in $(seq 1 7); do
  curl -s -o /dev/null -w "Versuch $i: %{http_code}\n" -X POST http://localhost:3000/api/analyze \
    -H "Content-Type: application/json" \
    -d '{"base64":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==","mediaType":"image/png","fileName":"test.png"}'
done
```
Expected: Versuch 1–5 → `200`, ab Versuch 6 → `429`. (Stündliches Limit greift; Redis-Keys `rl:analyze:h`/`rl:analyze:d` ggf. vorher leeren, falls schon Verbräuche existieren.)

- [ ] **Step 4: Token-Gate (nur mit MOCK aus, kostet echte ~Cent-Token-Zählung — optional)**

Eine reale, sehr lange PDF (>80k Token, unter 15 MB) hochladen → Expected `422`. Dieser Schritt ist optional, weil er einen echten (wenn auch nur Zähl-) API-Call braucht; Gate-Logik ist durch Code-Review + Schritt 1–3 abgedeckt.

- [ ] **Step 5: Abschluss-Build**

Run: `npm run build`
Expected: „Compiled successfully".

---

## Nach der Implementierung

Optionaler Deploy auf die Preview zum Live-Test (Branch `monetarisierung` ist mit Vercel verknüpft, Auto-Deploy bei Push):

```bash
git push origin monetarisierung
```

Danach die Gate-Tests aus Task 6 gegen die Preview-URL wiederholen. **Hinweis:** Die Preview läuft mit `MOCK_ANALYSIS=true`, daher ist Gate 4 dort effektiv deaktiviert (Fixwert) — Gate 1–3 sind aber voll testbar.
