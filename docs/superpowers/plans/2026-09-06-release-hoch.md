# Release-Paket „Hoch" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die 🟠-Befunde des Release-Audits (Sicherheit, Datenschutz, i18n-Löcher, SEO, UX) schließen und die Doku auf den aktuellen Stand bringen, damit nach dem Betreiber-Blocker nichts Technisches mehr im Weg steht.

**Architecture:** Kleine, unabhängige Änderungen entlang bestehender Muster: Header in `next.config.mjs`; Rate-Limits über das bestehende `checkLimit`; Fehlercodes als additive Erweiterung der API-Antworten (`code` neben `error`), Client mappt auf `apiErrors.*`; SEO-Alternates über einen kleinen Helper `src/lib/seo.ts`; PDF-Font Noto Sans für Latin-Ext + Kyrillisch; alle sichtbaren Texte in allen 6 Locales (tr/ar/ru/uk bleiben `ai-draft`).

**Tech Stack:** Next.js 15 App Router, next-intl 4, vitest 5, Tailwind 3, @react-pdf/renderer 4, @upstash/ratelimit, Stripe SDK 22.

**Repo:** `E:\Neko-Check\nebenkostencheck\nebenkostencheck`, Branch `monetarisierung` (nie nach `main` mergen). Shell-cwd resettet zwischen Bash-Aufrufen → immer `cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && …`. Commit-Messages ohne Umlaute. Prüf-Trio vor jedem Commit: `npx tsc --noEmit && npm test && npm run build` (Build 43 Seiten). **Redis (Upstash) ist aktuell nicht erreichbar** → Redis-Pfade nur per Code/Tests prüfen, nicht live.

**Invarianten:** Generierte Briefe bleiben neutral (kein Branding). Analyse-Inhalte, Brieftexte, Mail-Betreffe bleiben Deutsch. Keine Secrets ausgeben. `messages/*.json`: de = Quelle, en hochwertig, tr/ar/ru/uk KI-Entwurf mit `_meta.status: "ai-draft"` (bereits vorhanden). Paritäts-Check nach jeder Message-Änderung:

```bash
node -e "const flat=(o,p='')=>Object.entries(o).flatMap(([k,v])=>v&&typeof v==='object'&&!Array.isArray(v)?flat(v,p+k+'.'):[p+k]);const de=new Set(flat(require('./messages/de.json')).filter(k=>!k.startsWith('_meta')));for(const l of ['en','tr','ar','ru','uk']){const s=new Set(flat(require('./messages/'+l+'.json')).filter(k=>!k.startsWith('_meta')));const miss=[...de].filter(k=>!s.has(k));console.log(l+': '+(miss.length?('FEHLT '+miss.join(',')):'OK'));}"
```

---

## Dateiübersicht

| Datei | Verantwortung |
|---|---|
| `security-headers.mjs` (neu, Root) | Reine Funktion `securityHeaders(isDev)` → Header-Liste; von `next.config.mjs` und Test importiert |
| `next.config.mjs` | `headers()` |
| `src/lib/limits.ts` | neue Grenzwerte für letter/checkout/report |
| `src/app/api/{generate-letter,checkout,generate-report}` | `checkLimit`-Gates |
| `src/lib/claude.ts` | `withRetry` mit Zeitbudget, Client-Timeout, exportiert für Test |
| `src/lib/errors.ts` | `classifyError` + Timeout-Meldung |
| `src/lib/apiErrors.ts` (neu) | `ApiErrorCode`-Union + `apiError(code, status)` Helper |
| `src/lib/clientErrors.ts` (neu) | `useApiErrorMessage()` → übersetzte Meldung aus `code`, Fallback `error` |
| `src/lib/seo.ts` (neu) | `pageAlternates(locale, path)` |
| `src/app/og.png/route.tsx` (neu) | OG-Bild als Route-Handler (kein Middleware-Redirect) |
| `src/app/[locale]/not-found.tsx`, `src/app/not-found.tsx` (neu) | 404 |
| `src/lib/pdf/fonts.ts` (neu) + `src/lib/pdf/fonts/NotoSans-{Regular,Bold}.ttf` | Font-Registrierung |
| `src/components/{LetterModal,PreviewView,UploadZone,ResultView,ContactForm}.tsx`, `src/app/[locale]/page.tsx` | UX/i18n |
| `messages/{de,en,tr,ar,ru,uk}.json` | neue Namespaces `apiErrors`, `notFound`; neue Keys in `upload`, `teaser`, `legal.datenschutz`, `meta` |
| `README.md`, `docs/ARCHITECTURE.md`, `docs/DIENSTE-UEBERSICHT.md`, `docs/ROADMAP.md` | Doku-Refresh |

---

### Task 1: Security-Header

**Files:**
- Create: `security-headers.mjs`
- Modify: `next.config.mjs`
- Test: `src/lib/securityHeaders.test.ts`

Hintergrund: `next.config.mjs` ist ESM-JS; ein `.mjs`-Modul im Root lässt sich sowohl von der Config als auch von vitest importieren. CSP ohne Nonces (Next injiziert Inline-Scripts, daher `'unsafe-inline'` bei script-src; im Dev zusätzlich `'unsafe-eval'` für HMR). Stripe wird per Redirect genutzt, `@stripe/stripe-js` ist unbenutzt → kein `js.stripe.com` nötig. Externe Ziele: keine (Fonts via next/font self-hosted, mailto ist kein CSP-Thema).

- [ ] **Step 1: Test schreiben**

```ts
// src/lib/securityHeaders.test.ts
import { describe, expect, it } from "vitest";
import { securityHeaders } from "../../security-headers.mjs";

function header(list: { key: string; value: string }[], key: string) {
  return list.find((h) => h.key === key)?.value;
}

describe("securityHeaders", () => {
  it("setzt die Basis-Header", () => {
    const h = securityHeaders(false);
    expect(header(h, "X-Frame-Options")).toBe("DENY");
    expect(header(h, "X-Content-Type-Options")).toBe("nosniff");
    expect(header(h, "Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(header(h, "Permissions-Policy")).toContain("camera=()");
    expect(header(h, "Strict-Transport-Security")).toContain("max-age=63072000");
  });
  it("CSP: Prod ohne unsafe-eval, Dev mit", () => {
    const prod = header(securityHeaders(false), "Content-Security-Policy")!;
    const dev = header(securityHeaders(true), "Content-Security-Policy")!;
    expect(prod).toContain("default-src 'self'");
    expect(prod).toContain("frame-ancestors 'none'");
    expect(prod).toContain("object-src 'none'");
    expect(prod).toContain("form-action 'self'");
    expect(prod).not.toContain("unsafe-eval");
    expect(dev).toContain("unsafe-eval");
  });
});
```

- [ ] **Step 2: Test laufen lassen → FAIL** (`npx vitest run src/lib/securityHeaders.test.ts`, Modul fehlt)

- [ ] **Step 3: Implementieren**

```js
// security-headers.mjs
// Reine Funktion, damit next.config.mjs und vitest dieselbe Liste sehen.
export function securityHeaders(isDev) {
  const csp = [
    "default-src 'self'",
    // Next.js injiziert Inline-Bootstrap-Scripts; HMR braucht im Dev eval.
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
  return [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    // Ergebnis-URL trägt ?id=<uuid> – nie an Dritte durchreichen.
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  ];
}
```

```js
// next.config.mjs
import createNextIntlPlugin from "next-intl/plugin";
import { securityHeaders } from "./security-headers.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders(process.env.NODE_ENV !== "production") }];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
```

Falls tsc über den `.mjs`-Import meckert (`allowJs` fehlt): in `tsconfig.json` `"allowJs": true` ist bei Next-Standard bereits gesetzt – prüfen, sonst eine `security-headers.d.mts` mit `export function securityHeaders(isDev: boolean): { key: string; value: string }[];` anlegen.

- [ ] **Step 4: Test grün, dann live prüfen.** Dev-Server starten (`env -u ANTHROPIC_API_KEY npm run dev` in Background), dann:

```bash
curl -sI http://localhost:3000/ | grep -iE "content-security|x-frame|referrer|permissions|strict-transport"
```
Erwartet: alle 5 Header. Zusätzlich Seite im Browser öffnen (Startseite + `/en` + `/ergebnis?id=x`): keine CSP-Verstöße in der Konsole (Browser-Tool `read_console_messages`). Falls next/font oder Inline-Styles blocken → CSP anpassen, nicht die Prüfung.

- [ ] **Step 5: Commit** `feat(security): Security-Header inkl. CSP, HSTS, Referrer-Policy`

---

### Task 2: Dependency-Updates (Audit „High")

**Files:** `package.json`, `package-lock.json`

Befund: `npm audit --omit=dev` → 4 High: `next@15.3.9` (27 Advisories, Fix 15.5.25), `nodemailer@8` (Fix 10.0.0, Major), `postcss`/`sharp` (über next-Update). `@types/nodemailer` gibt es nur bis 8.0.1 – nodemailer 10 liefert eigene Typen? Prüfen mit `npm view nodemailer@10.0.0 types`; wenn ja `@types/nodemailer` entfernen, sonst behalten (Typen kompatibel genug, Nutzung ist nur `createTransport`/`sendMail`).

- [ ] **Step 1: Updates einspielen**

```bash
npm install next@^15.5.25 nodemailer@^10.0.0 @upstash/redis@^1.38.4 next-intl@^4.14.2 react@^19.2.8 react-dom@^19.2.8
npm view nodemailer@10.0.0 types   # leer → @types/nodemailer behalten
npm audit --omit=dev               # Erwartung: 0 vulnerabilities
```

- [ ] **Step 2: Breaking Changes prüfen.** nodemailer 10 Changelog lesen (`node_modules/nodemailer/CHANGELOG.md`, Abschnitte 9.0.0 und 10.0.0). Bekannt: `raw`-Option/`disableFileAccess`-Verhalten – wir nutzen nur `attachments[].content` als Buffer → unkritisch. Next 15.5: `next lint` deprecated (Warnung ok), Turbopack-Hinweise ignorieren.

- [ ] **Step 3: Prüf-Trio** `npx tsc --noEmit && npm test && npm run build`. Dev-Server: Startseite, `/en`, `/ar` (RTL) laden, Konsole ohne Fehler. `mailer.ts` per Node-Snippet importierbar: `node -e "import('nodemailer').then(m=>console.log(typeof m.default.createTransport))"` → `function`.

- [ ] **Step 4: Commit** `chore(deps): next 15.5, nodemailer 10, upstash/next-intl/react Patch-Updates (npm audit 0 High)`

---

### Task 3: Rate-Limits für generate-letter, checkout, generate-report

**Files:**
- Modify: `src/lib/limits.ts`, `src/app/api/generate-letter/route.tsx`, `src/app/api/checkout/route.ts`, `src/app/api/generate-report/route.tsx`
- Test: `src/lib/limits.test.ts` (Konstanten-Sanity)

Muster: `checkLimit(prefix, limit, window, key)` aus `src/lib/ratelimit.ts` (siehe `send-pdf/route.tsx` als Vorlage). Gates erst NACH Validierung/402 (abgelehnte Requests zählen nicht), aber VOR dem teuren Call.

- [ ] **Step 1: Konstanten**

```ts
// src/lib/limits.ts (anhängen)
/** Brief-Generierung (je ein Claude-Call): pro Analyse-ID und Tag – 3 Typen × Korrekturen. */
export const LETTER_PER_ID_PER_DAY = 12;
/** Brief-Generierung pro IP und Tag. */
export const LETTER_PER_IP_PER_DAY = 40;
/** Checkout-Sessions (je ein Stripe-Call) pro IP und Stunde. */
export const CHECKOUT_PER_IP_PER_HOUR = 20;
/** Bericht-PDF-Render pro IP und Stunde (CPU-lastig). */
export const REPORT_PER_IP_PER_HOUR = 30;
```

Test `src/lib/limits.test.ts`: alle exportierten Limits sind positive Integer und `LETTER_PER_ID_PER_DAY < LETTER_PER_IP_PER_DAY`.

- [ ] **Step 2: generate-letter** – nach dem 402-Check und dem „keine passenden Punkte"-400, vor `generateLetter`:

```ts
const ip = getClientIp(req);
const [okId, okIp] = await Promise.all([
  checkLimit("rl:letter:id", LETTER_PER_ID_PER_DAY, "24 h", id),
  checkLimit("rl:letter:ip", LETTER_PER_IP_PER_DAY, "24 h", ip),
]);
if (!okId || !okIp) {
  return NextResponse.json(
    { error: "Zu viele Schreiben erstellt. Bitte lade das vorhandene PDF herunter oder versuche es morgen erneut." },
    { status: 429 }
  );
}
```

- [ ] **Step 3: checkout** – nach dem 410-Check, vor `stripe().checkout.sessions.create`: `checkLimit("rl:checkout:ip", CHECKOUT_PER_IP_PER_HOUR, "1 h", getClientIp(req))` → 429 `"Zu viele Zahlungsversuche. Bitte in ein paar Minuten erneut versuchen."`.

- [ ] **Step 4: generate-report** – nach 402: `checkLimit("rl:report:ip", REPORT_PER_IP_PER_HOUR, "1 h", getClientIp(req))` → 429 `"Zu viele Downloads. Bitte kurz warten."`. Route in try/catch hüllen (aktuell fehlt es): 500 mit `classifyError`.

- [ ] **Step 5: Prüf-Trio, Commit** `feat(security): Rate-Limits fuer Brief, Checkout und Bericht-PDF`

---

### Task 4: Retry-/Timeout-Budget unter maxDuration

**Files:**
- Modify: `src/lib/claude.ts`, `src/lib/errors.ts`
- Test: `src/lib/claude.test.ts` (nur `withRetry`), `src/lib/errors.test.ts`

Befund: SDK-Default (2 Retries, 10 min Timeout) × eigenes `withRetry` (3×) sprengt `maxDuration = 60` → Vercel liefert HTML-504 statt JSON-Fehler.

- [ ] **Step 1: Tests**

```ts
// src/lib/claude.test.ts
import { describe, expect, it, vi } from "vitest";
import { withRetry } from "@/lib/claude";

const fail = (status: number) => Object.assign(new Error(`HTTP ${status}`), { status });

describe("withRetry", () => {
  it("wiederholt 429/503/529 und gibt das Ergebnis zurück", async () => {
    let n = 0;
    const fn = vi.fn(async () => { n++; if (n < 3) throw fail(529); return "ok"; });
    await expect(withRetry(fn, { attempts: 3, baseDelayMs: 1, budgetMs: 10_000 })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });
  it("wirft andere Status sofort", async () => {
    const fn = vi.fn(async () => { throw fail(400); });
    await expect(withRetry(fn, { attempts: 3, baseDelayMs: 1, budgetMs: 10_000 })).rejects.toThrow("HTTP 400");
    expect(fn).toHaveBeenCalledTimes(1);
  });
  it("bricht ab, wenn das Zeitbudget aufgebraucht ist", async () => {
    const fn = vi.fn(async () => { await new Promise((r) => setTimeout(r, 30)); throw fail(503); });
    await expect(withRetry(fn, { attempts: 5, baseDelayMs: 1, budgetMs: 20 })).rejects.toThrow("HTTP 503");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```

`src/lib/errors.test.ts`: `classifyError("Request timed out.")` enthält „zu lange gedauert"; `classifyError("529 overloaded")` enthält „ausgelastet"; unbekannt → „unbekannter Fehler".

- [ ] **Step 2: Implementieren**

```ts
// claude.ts – Client mit knappem Timeout, Retries nur bei uns (ein Ort, ein Budget)
const REQUEST_TIMEOUT_MS = 45_000;      // unter maxDuration=60 s
const RETRY_BUDGET_MS = 15_000;         // nur „schnelle" Fehler (429/529) werden wiederholt

function client(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 0, timeout: REQUEST_TIMEOUT_MS });
  return _client;
}

export interface RetryOptions { attempts?: number; baseDelayMs?: number; budgetMs?: number }

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
      if (i === attempts - 1 || Date.now() - start > budgetMs) break;
      await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** i));
    }
  }
  throw lastErr;
}
```

`errors.ts`: vor dem „network"-Zweig: `if (msg.includes("timed out") || msg.includes("timeout")) return "Die Prüfung hat zu lange gedauert. Bitte erneut versuchen – bei großen Scans hilft eine kleinere Datei.";` (und `timeout` aus dem network-Zweig entfernen).

- [ ] **Step 3: Prüf-Trio, Commit** `fix(claude): Retry-Budget und 45s-Timeout unter Vercel maxDuration`

---

### Task 5: Datenschutzerklärung vervollständigen + Upload-Hinweis

**Files:**
- Modify: `messages/de.json`, `messages/en.json` (sorgfältig), `messages/{tr,ar,ru,uk}.json` (KI-Entwurf)
- Modify: `src/components/UploadZone.tsx`

Befund: DSE nennt nur Anthropic + Stripe. Fehlen: Hosting (Vercel), Zwischenspeicher (Upstash), E-Mail-Versand (IONOS), IP-Verarbeitung fürs Rate-Limit, Kontaktdaten im Brief-Formular. Upload-Zone hat keinen Hinweis auf die Drittland-Übermittlung.

- [ ] **Step 1: de.json `legal.datenschutz.sections`** – bestehende Abschnitte behalten, folgende **einfügen** (Reihenfolge: Verantwortlicher · Welche Daten · Hosting · Anthropic · Zwischenspeicher · Speicherung & Löschung · Zahlung · E-Mail-Versand · Rate-Limit/IP · Rechtsgrundlage · Ihre Rechte):

```json
{ "heading": "Hosting (Vercel)", "body": "Die Website wird bei Vercel Inc. (440 N Barranca Ave #4133, Covina, CA 91723, USA) gehostet. Beim Aufruf werden technisch notwendige Verbindungsdaten (IP-Adresse, Zeitpunkt, aufgerufene Seite, Browser) in Server-Logs verarbeitet. Mit Vercel besteht ein Auftragsverarbeitungsvertrag; die Übermittlung in die USA stützt sich auf die EU-Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO). Weitere Informationen: https://vercel.com/legal/privacy-policy." },
{ "heading": "Zwischenspeicher (Upstash)", "body": "Prüfergebnisse, die von Ihnen im Brief-Formular eingegebenen Kontaktdaten (Name, Anschrift, Vertragsnummer) sowie erstellte Schreiben werden vorübergehend in einer Datenbank von Upstash, Inc. (2261 Market Street #4032, San Francisco, CA 94114, USA) gespeichert. Grundlage sind ein Auftragsverarbeitungsvertrag und die EU-Standardvertragsklauseln. Die Daten werden automatisch gelöscht (siehe „Speicherung & Löschung")." },
{ "heading": "E-Mail-Versand (IONOS)", "body": "Wenn Sie sich ein erstelltes Schreiben per E-Mail zusenden lassen, wird die von Ihnen angegebene E-Mail-Adresse zusammen mit dem PDF über den Mailserver der IONOS SE (Elgendorfer Str. 57, 56410 Montabaur, Deutschland) versendet. Die Adresse wird nicht für andere Zwecke verwendet." },
{ "heading": "Missbrauchsschutz (IP-Adresse)", "body": "Zum Schutz vor automatisierten Massenanfragen speichern wir Ihre IP-Adresse für maximal 24 Stunden in einem Zähler (Art. 6 Abs. 1 lit. f DSGVO – berechtigtes Interesse am Betrieb des Dienstes)." }
```

Im Abschnitt „Anthropic" den Satz ergänzen: „Die Übermittlung erfolgt auf Grundlage der EU-Standardvertragsklauseln, die Teil des Anthropic Data Processing Addendum sind." Im Abschnitt „Speicherung & Löschung" ergänzen: „Erstellte Schreiben werden zusammen mit dem Prüfbericht gelöscht." **Platzhalter `[Name des Betreibers]` unverändert lassen** (Blocker 7, manuell).

- [ ] **Step 2: Upload-Hinweis.** `upload.privacyHint` (de): „Mit dem Upload wird die Datei zur Prüfung an Anthropic (USA) übermittelt und spätestens nach 24 Stunden gelöscht. Details in der {link}." – `{link}` = Datenschutzerklärung als `<Link href="/datenschutz">`. In `UploadZone.tsx` unter der Dropzone (vor dem Fehler-Block):

```tsx
<p className="text-xs text-faint text-center leading-relaxed">
  {t.rich("privacyHint", {
    link: (chunks) => <Link href="/datenschutz" className="underline hover:text-fg">{chunks}</Link>,
  })}
</p>
```
mit `import { Link } from "@/i18n/navigation"` und `upload.privacyLink` = „Datenschutzerklärung" (`{link}` bekommt als Inhalt `t("privacyLink")` – oder direkt in den String einbetten: `"… Details in der <link>Datenschutzerklärung</link>."`, dann `t.rich` mit Tag `link`; letzteres bevorzugen).

- [ ] **Step 3: en.json** vollwertig übersetzen; **tr/ar/ru/uk** übersetzen (Rechtsvokabular sorgfältig, Firmen-/Adressangaben unverändert). Paritäts-Check OK.

- [ ] **Step 4: Prüfen.** Dev: `/datenschutz` und `/en/datenschutz` rendern 11 Abschnitte; Startseite zeigt Hinweis mit funktionierendem Link (auch `/ar` – Link geht nach `/ar/datenschutz`). Prüf-Trio, Commit `docs(legal): DSE um Vercel, Upstash, IONOS, IP-Schutz ergaenzt; Upload-Datenschutzhinweis (6 Sprachen)`

---

### Task 6: Stripe-Redirects und Zahlungsabbruch locale-fest

**Files:**
- Modify: `src/app/api/checkout/route.ts`, `src/components/PreviewView.tsx`, `src/app/[locale]/page.tsx`, `messages/*.json` (`teaser.canceled`)
- Test: `src/lib/checkoutLocale.test.ts` (neu, Helper)

- [ ] **Step 1: Helper + Test.** `src/lib/checkoutLocale.ts`:

```ts
import { routing, type Locale } from "@/i18n/routing";

/** Stripe-Checkout-Sprachen (Stripe kennt kein Ukrainisch → auto). */
const STRIPE_LOCALES: Partial<Record<Locale, string>> = { de: "de", en: "en", tr: "tr", ar: "ar", ru: "ru" };

export function toLocale(v: unknown): Locale {
  return typeof v === "string" && (routing.locales as readonly string[]).includes(v) ? (v as Locale) : routing.defaultLocale;
}
/** URL-Präfix wie next-intl `as-needed`: de → "", sonst "/<locale>". */
export function localePrefix(locale: Locale): string {
  return locale === routing.defaultLocale ? "" : `/${locale}`;
}
export function stripeLocale(locale: Locale): string {
  return STRIPE_LOCALES[locale] ?? "auto";
}
```
Tests: `toLocale("xx")` → "de"; `toLocale("ar")` → "ar"; `localePrefix("de")` → ""; `localePrefix("en")` → "/en"; `stripeLocale("uk")` → "auto".

- [ ] **Step 2: checkout-Route.** Body `{ id, locale }`; `const locale = toLocale(body.locale); const prefix = localePrefix(locale);` → `success_url: \`${base}${prefix}/ergebnis?id=${id}&session_id={CHECKOUT_SESSION_ID}\``, `cancel_url: \`${base}${prefix}/?canceled=1&id=${id}\``, Session-Option `locale: stripeLocale(locale) as Stripe.Checkout.SessionCreateParams.Locale`.

- [ ] **Step 3: PreviewView** sendet `locale` (`useLocale()` aus next-intl) mit; vor dem Redirect Vorschau sichern: `sessionStorage.setItem("nkc:preview", JSON.stringify(preview))` (try/catch).

- [ ] **Step 4: Landing (`page.tsx`)**: bei Mount `useSearchParams()`: wenn `canceled=1` → `sessionStorage.getItem("nkc:preview")` lesen, wenn `id` übereinstimmt → `setPreview(parsed)` und `setNotice(t("teaser.canceled"))`; URL per `router.replace("/")` (aus `@/i18n/navigation`) bereinigen. Notice über dem Teaser als dezenter Kasten (`border-line`, `text-muted`). `useSearchParams` erfordert Suspense-Boundary → Landing-Inhalt in `<Suspense>` hüllen (Fallback `null`). Text de: „Die Zahlung wurde abgebrochen. Deine Vorschau ist noch da – du kannst jederzeit freischalten." + 5 Übersetzungen.

- [ ] **Step 5: Prüfen (ohne Redis nur bis 500).** Unit-Tests grün; Dev: `/en` laden, in der Konsole `sessionStorage.setItem("nkc:preview", JSON.stringify({id:"t",errorCount:2,errorTitles:["a","b"],hasDirect:true,hasReview:false}))`, dann `/en/?canceled=1&id=t` öffnen → Teaser + englischer Hinweis, URL wird zu `/en`. Prüf-Trio, Commit `feat(i18n): Stripe-Redirects und Checkout-Sprache je Locale, Vorschau nach Zahlungsabbruch erhalten`

---

### Task 7: API-Fehlercodes → übersetzte Meldungen

**Files:**
- Create: `src/lib/apiErrors.ts`, `src/lib/clientErrors.ts`
- Modify: alle Routen in `src/app/api/*`, `src/components/{PreviewView,LetterModal,UploadZone}.tsx`, `src/app/[locale]/page.tsx`, `src/app/[locale]/ergebnis/page.tsx`, `messages/*.json` (`apiErrors`)
- Test: `src/lib/apiErrors.test.ts`

Prinzip: Antwort bleibt `{ error: "<deutsch>" }` (Mobile-App + Kompatibilität) **plus** `code`. Client zeigt `t(\`apiErrors.${code}\`)` wenn der Key existiert, sonst `error`.

- [ ] **Step 1: Codes**

```ts
// src/lib/apiErrors.ts
import { NextResponse } from "next/server";

export const API_ERRORS = {
  MISSING_ID: [400, "Fehlende ID."],
  INVALID_REQUEST: [400, "Ungültige Anfrage."],
  NO_FILE: [400, "Keine Datei übermittelt."],
  UNSUPPORTED_TYPE: [400, "Nur PDF und Bilder werden unterstützt. Bitte lade deine Abrechnung als PDF oder Foto hoch."],
  FILE_TOO_LARGE: [413, "Die Datei ist zu groß. Bitte lade nur die Nebenkostenabrechnung hoch."],
  RATE_LIMITED: [429, "Zu viele Anfragen. Bitte versuche es später noch einmal."],
  DOCUMENT_TOO_LONG: [422, "Das Dokument ist zu umfangreich für die Prüfung. Bitte lade nur die Nebenkostenabrechnung hoch."],
  ANALYSIS_UNUSABLE: [502, "Die Analyse konnte nicht verarbeitet werden. Bitte erneut versuchen."],
  ANALYSIS_EXPIRED: [404, "Analyse abgelaufen. Bitte lade die Abrechnung erneut hoch."],
  ANALYSIS_EXPIRING: [410, "Analyse läuft gleich ab. Bitte lade die Abrechnung erneut hoch."],
  NOT_UNLOCKED: [402, "Nicht freigeschaltet."],
  NO_MATCHING_ERRORS: [400, "Für dieses Schreiben liegen keine passenden Punkte vor."],
  LETTER_NOT_FOUND: [404, "Schreiben nicht gefunden. Bitte erstelle es erneut."],
  LETTER_RATE_LIMITED: [429, "Zu viele Schreiben erstellt. Bitte lade das vorhandene PDF herunter oder versuche es morgen erneut."],
  SEND_RATE_LIMITED: [429, "Zu viele Sendungen. Bitte lade das PDF stattdessen herunter."],
  CHECKOUT_RATE_LIMITED: [429, "Zu viele Zahlungsversuche. Bitte in ein paar Minuten erneut versuchen."],
  CHECKOUT_FAILED: [500, "Zahlung konnte nicht gestartet werden."],
  REPORT_RATE_LIMITED: [429, "Zu viele Downloads. Bitte kurz warten."],
  OVERLOADED: [503, "Der Prüfdienst ist gerade stark ausgelastet. Bitte in einem Moment erneut versuchen."],
  TIMEOUT: [504, "Die Prüfung hat zu lange gedauert. Bitte erneut versuchen – bei großen Scans hilft eine kleinere Datei."],
  NETWORK: [502, "Verbindung unterbrochen. Bitte erneut versuchen."],
  UNKNOWN: [500, "Ein unbekannter Fehler ist aufgetreten. Bitte erneut versuchen."],
} as const satisfies Record<string, readonly [number, string]>;

export type ApiErrorCode = keyof typeof API_ERRORS;

export function apiError(code: ApiErrorCode, status?: number) {
  const [defaultStatus, message] = API_ERRORS[code];
  return NextResponse.json({ error: message, code }, { status: status ?? defaultStatus });
}
```

`classifyError` in `errors.ts` gibt künftig einen **Code** zurück (`classifyErrorCode(message): ApiErrorCode` → OVERLOADED | TIMEOUT | NETWORK | UNKNOWN); die Routen antworten mit `apiError(classifyErrorCode(msg), 500)` (Status 500 beibehalten, damit die Ergebnisseite ihre 5xx-Logik behält). Signatur-Fehler im Webhook (`Keine Signatur`/`Ungültige Signatur`) bleiben roh – kein Client-Text.

Test: jeder Eintrag hat Status 400–599 und nicht-leeren Text; `apiError("NOT_UNLOCKED")` → Status 402, Body `{error, code:"NOT_UNLOCKED"}`.

- [ ] **Step 2: Routen umstellen** (jede `NextResponse.json({ error: "…" }, { status })` → `apiError(CODE)`; die Datei-zu-groß-Meldung mit MB bleibt als Text, aber mit `code: "FILE_TOO_LARGE"` – der Client formatiert die MB-Zahl selbst).

- [ ] **Step 3: Client-Helper**

```ts
// src/lib/clientErrors.ts
"use client";
import { useTranslations } from "next-intl";
import { MAX_FILE_MB } from "@/lib/limits";

/** Übersetzt eine API-Fehlerantwort; unbekannte Codes fallen auf den Server-Text zurück. */
export function useApiErrorMessage() {
  const t = useTranslations("apiErrors");
  return (body: { error?: string; code?: string } | null | undefined, fallback: string): string => {
    const code = body?.code;
    if (code && t.has(code)) return t(code, { mb: MAX_FILE_MB });
    return body?.error || fallback;
  };
}
```
Einsatz in `page.tsx` (analyze), `PreviewView` (checkout), `LetterModal` (generate-letter, send-pdf), `ergebnis/page.tsx` (notFound bleibt clientseitig). Muster: `const e = await res.json().catch(() => null); throw new Error(apiMessage(e, t("errors.analyzeFailed")));`

- [ ] **Step 4: Messages.** Namespace `apiErrors` mit allen 22 Codes in de (Texte = obige deutschen), en, tr, ar, ru, uk. `FILE_TOO_LARGE` mit `{mb}`-Platzhalter. Paritäts-Check OK.

- [ ] **Step 5: Prüfen.** Unit-Tests; Dev: `curl -s -X POST localhost:3000/api/analyze -H 'content-type: application/json' -d '{}'` → `{"error":"Keine Datei übermittelt.","code":"NO_FILE"}`; `curl -s -X POST localhost:3000/api/generate-letter -H 'content-type: application/json' -d '{"id":"x","type":"nope"}'` → `INVALID_REQUEST`. Auf `/en` eine `.docx` hochladen → englische Meldung (Client-Validierung) – und via Konsole `fetch("/api/analyze",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({base64:"AAAA",mediaType:"text/plain"})})` → Antwort enthält `UNSUPPORTED_TYPE`. Prüf-Trio, Commit `feat(i18n): API-Fehlercodes mit uebersetzten Client-Meldungen (6 Sprachen)`

---

### Task 8: Schriften – PDF (Noto Sans) und Web (Subsets, RTL-Tracking)

**Files:**
- Create: `src/lib/pdf/fonts.ts`, `src/lib/pdf/fonts/NotoSans-Regular.ttf`, `src/lib/pdf/fonts/NotoSans-Bold.ttf`, `src/lib/pdf/fonts/OFL.txt`
- Modify: `src/lib/pdf/LetterDoc.tsx`, `src/lib/pdf/ReportDoc.tsx`, `src/app/[locale]/layout.tsx`, `src/app/globals.css`
- Test: `src/lib/pdf/fonts.test.ts`

Befund: Helvetica (WinAnsi) kennt weder ş/ğ/İ (Türkisch) noch Kyrillisch → Mieter-Namen im Brief kaputt. Arabische Schrift kann @react-pdf nicht shapen → bewusst nicht abgedeckt (Doku-Hinweis). Web: Geist nur `latin` → tr/ru/uk fallen auf System-Font.

- [ ] **Step 1: Fonts holen** (OFL-lizenziert, aus dem offiziellen Noto-Repo):

```bash
mkdir -p src/lib/pdf/fonts && cd src/lib/pdf/fonts
curl -sL -o NotoSans-Regular.ttf https://github.com/notofonts/latin-greek-cyrillic/raw/main/fonts/NotoSans/googlefonts/ttf/NotoSans-Regular.ttf
curl -sL -o NotoSans-Bold.ttf    https://github.com/notofonts/latin-greek-cyrillic/raw/main/fonts/NotoSans/googlefonts/ttf/NotoSans-Bold.ttf
curl -sL -o OFL.txt https://github.com/notofonts/latin-greek-cyrillic/raw/main/OFL.txt
ls -la   # je ~500-700 KB, OFL.txt vorhanden
```
Falls die Pfade 404 liefern: im Repo `notofonts/latin-greek-cyrillic` unter `fonts/NotoSans/` den aktuellen Pfad nachsehen (nicht Google-Fonts-API scrapen).

- [ ] **Step 2: Registrierung + Test**

```ts
// src/lib/pdf/fonts.ts
import path from "node:path";
import { Font } from "@react-pdf/renderer";

export const PDF_FONT = "NotoSans";
const dir = path.join(process.cwd(), "src/lib/pdf/fonts");
let registered = false;
/** Einmalig registrieren (Modul kann mehrfach importiert werden). */
export function registerPdfFonts(): void {
  if (registered) return;
  Font.register({
    family: PDF_FONT,
    fonts: [
      { src: path.join(dir, "NotoSans-Regular.ttf"), fontWeight: "normal" },
      { src: path.join(dir, "NotoSans-Bold.ttf"), fontWeight: "bold" },
    ],
  });
  Font.registerHyphenationCallback((w) => [w]); // keine Silbentrennung in Briefen
  registered = true;
}
```
Test (`fonts.test.ts`): rendert `renderToBuffer(<LetterDoc letter={"Sehr geehrte Frau Şçğüİ Іваненко,\nBetreff: Test\nЖ"} />)` → Buffer beginnt mit `%PDF`, Länge > 10 kB (Font eingebettet). Dateiendung `.test.tsx`, vitest-Include auf `src/**/*.test.{ts,tsx}` erweitern (vitest.config.ts) – JSX braucht `esbuild.jsx: "automatic"` oder `@vitejs/plugin-react`; einfachste Variante: `React.createElement` im Test, kein JSX.

Wichtig für Vercel: die TTFs müssen im Serverless-Bundle landen. In `next.config.mjs`: `outputFileTracingIncludes: { "/api/generate-letter": ["./src/lib/pdf/fonts/*"], "/api/generate-report": ["./src/lib/pdf/fonts/*"], "/api/send-pdf": ["./src/lib/pdf/fonts/*"] }` (Next 15: Top-Level-Option, nicht mehr `experimental`).

- [ ] **Step 3: Docs umstellen.** `LetterDoc`/`ReportDoc`: `registerPdfFonts()` beim Modul-Load aufrufen; `fontFamily: "Helvetica"` → `PDF_FONT`, `"Helvetica-Bold"` → `fontFamily: PDF_FONT, fontWeight: "bold"`. Optik prüfen: PDF lokal rendern (Node-Snippet via `tsx`/`vitest` – im Test zusätzlich `fs.writeFileSync` in den Scratchpad und mit dem Read-Tool ansehen).

- [ ] **Step 4: Web-Font.** `layout.tsx`: `Geist({ subsets: ["latin", "latin-ext"] })` (Geist hat kein Kyrillisch – Fallback via CSS). `globals.css`:

```css
/* Kyrillisch/Arabisch: Geist deckt sie nicht ab → saubere System-Fallbacks. */
html[lang="ru"] body, html[lang="uk"] body { font-family: var(--font-geist), "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
html[lang="ar"] body { font-family: "Segoe UI", "Noto Sans Arabic", Tahoma, Arial, sans-serif; }
/* Negatives/positives Tracking zerreißt arabische Ligaturen. */
html[dir="rtl"] [class*="tracking-"] { letter-spacing: 0 !important; }
```
Dafür Geist mit `variable: "--font-geist"` laden und `className={geist.className}` beibehalten (Fallback greift nur, wenn Geist Glyphen fehlen – per `font-family`-Kette).

- [ ] **Step 5: Prüfen.** Prüf-Trio; Dev `/ar` Screenshot: keine zerrissenen Ligaturen in Badges/Überschriften; `/uk` Screenshot: Kyrillisch in einer sans-serif, kein Serif-Fallback. Commit `feat(pdf): Noto Sans fuer Briefe/Bericht (Latin-Ext + Kyrillisch), Web-Font-Fallbacks und RTL-Tracking`

---

### Task 9: SEO – Canonicals je Seite, OG-Bild ohne Redirect, 404

**Files:**
- Create: `src/lib/seo.ts`, `src/app/og.png/route.tsx`, `src/app/[locale]/not-found.tsx`, `src/app/not-found.tsx`
- Modify: `src/app/[locale]/layout.tsx`, `src/app/[locale]/{impressum,datenschutz,agb}/page.tsx`, `src/app/[locale]/ergebnis/layout.tsx`, `src/app/[locale]/opengraph-image.tsx` (löschen), `src/middleware.ts`, `messages/*.json` (`notFound`, `meta.ogAlt`)
- Test: `src/lib/seo.test.ts`

- [ ] **Step 1: Helper + Test**

```ts
// src/lib/seo.ts
import { routing, type Locale } from "@/i18n/routing";
import { SITE_URL } from "@/lib/constants";

export function localeUrl(locale: string, path = ""): string {
  return locale === routing.defaultLocale ? `${SITE_URL}${path}` : `${SITE_URL}/${locale}${path}`;
}
/** canonical + hreflang (inkl. x-default) für eine Seite. */
export function pageAlternates(locale: Locale, path = "") {
  const languages: Record<string, string> = { "x-default": localeUrl(routing.defaultLocale, path) };
  for (const l of routing.locales) languages[l] = localeUrl(l, path);
  return { canonical: localeUrl(locale, path), languages };
}
```
Tests: `pageAlternates("de", "/impressum").canonical === SITE_URL + "/impressum"`; `pageAlternates("en", "/agb").languages.ar === SITE_URL + "/ar/agb"`; `x-default` zeigt auf de. `sitemap.ts` auf `localeUrl` aus `seo.ts` umstellen (Duplikat entfernen).

- [ ] **Step 2: Layout + Rechtsseiten.** `layout.tsx`: `alternates: pageAlternates(locale)`, `openGraph.url: localeUrl(locale)`, `openGraph.locale` in `de_DE`/`en_US`/`tr_TR`/`ar_AR`/`ru_RU`/`uk_UA` (Map), `openGraph.images: [{ url: "/og.png", width: 1200, height: 630, alt: t("ogAlt") }]`, `twitter.images: ["/og.png"]`. `meta.ogAlt` in 6 Sprachen (de: „Nebenkostencheck – Nebenkostenabrechnung prüfen & Geld zurückholen"). Rechtsseiten: `generateMetadata` → `{ title, description: t("metaDescription"), alternates: pageAlternates(locale as Locale, "/impressum"), openGraph: { url: localeUrl(locale, "/impressum") } }`; `legal.{impressum,datenschutz,agb}.metaDescription` je Seite eigen (6 Sprachen, ≤ 155 Zeichen).

- [ ] **Step 3: Ergebnisseite raus aus Canonical/hreflang.** `ergebnis/layout.tsx`: `metadata = { robots: { index: false, follow: false }, alternates: { canonical: null, languages: {} } }` – wenn `canonical: null` vom Typ nicht akzeptiert wird: `alternates: { languages: {} }` und `canonical` weglassen → im gerenderten HTML per curl prüfen, dass **kein** `rel="canonical"` und kein `hreflang` auf `/ergebnis?id=x` steht (Next mergt `alternates` als Ganzes).

- [ ] **Step 4: OG-Bild als Route.** `src/app/[locale]/opengraph-image.tsx` → nach `src/app/og.png/route.tsx` verschieben:

```tsx
import { ImageResponse } from "next/og";
export const runtime = "nodejs";
export const dynamic = "force-static";
export function GET() { return new ImageResponse(/* bisheriges JSX */, { width: 1200, height: 630 }); }
```
Middleware-Matcher braucht keine Änderung (`og.png` enthält einen Punkt). Prüfung: `curl -sI localhost:3000/og.png` → `200`, `content-type: image/png`, kein `location`. `curl -s localhost:3000/ | grep -o 'og:image[^>]*'` → `/og.png` absolut mit SITE_URL. Gleiches für `/en`.

- [ ] **Step 5: 404-Seiten.** `src/app/[locale]/not-found.tsx` (Server-Komponente, `getTranslations("notFound")`): Logo-Nav wie `ergebnis/page.tsx`, Titel `notFound.title` („Seite nicht gefunden"), Text `notFound.body`, Link `notFound.home` → `/`. `src/app/not-found.tsx` (Root, greift bei ungültiger Locale – Root-Layout rendert kein `<html>`): eigenes `<html lang="de"><body>` mit demselben Inhalt auf Deutsch (Literale, kein next-intl-Kontext). Prüfen: `curl -s -o /dev/null -w "%{http_code}" localhost:3000/en/gibtsnicht` → 404 und HTML enthält `<html`; `/xx/foo` → 404.

- [ ] **Step 6: Prüf-Trio (Build bleibt 43 Seiten ± not-found), Commit** `feat(seo): Canonical/hreflang je Seite, OG-Bild als /og.png ohne Redirect, lokalisierte 404`

---

### Task 10: UX – Modal-A11y, Kontrast, Konfidenz-Farbe, Platzhalter

**Files:**
- Modify: `src/components/LetterModal.tsx`, `tailwind.config.js`, `src/components/{UploadZone,ResultView,ContactForm}.tsx`, `src/app/globals.css`, `messages/*.json` (`report.confidence.unsicher.*` nur wenn Wortlaut angepasst wird – nicht nötig)

- [ ] **Step 1: LetterModal.** (a) `Escape` schließt, außer während `loading`: `useEffect` mit `keydown`-Listener auf `document`, nur wenn `open`. (b) Backdrop-Klick schließt **nicht**, wenn `result` vorhanden oder `loading` (fertiger Brief darf nicht durch Fehlklick verloren gehen; Schließen nur über „Fertig"/X). (c) Focus-Trap: bei `Tab`/`Shift+Tab` innerhalb `modalRef` zyklisch zwischen erstem und letztem fokussierbaren Element (`button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])`). (d) beim Schließen Fokus auf das zuvor aktive Element zurück (`document.activeElement` beim Öffnen merken).

- [ ] **Step 2: Kontrast.** `tailwind.config.js`: `accent.DEFAULT` → `#047857` (emerald-700, Weiß darauf ≈ 5,4:1), `accent.hover` → `#065F46`, `line` → `#243040` (≈ 1,8:1 auf ink – Haarlinie bleibt dezent), neues `line-strong: "#34415A"` (≥ 3:1 auf ink) für interaktive Rahmen: Dropzone (`UploadZone` `border-line` → `border-line-strong`), Inputs in `LetterModal`/`ContactForm` (`border-line` → `border-line-strong`). `accent.border` bleibt. Rechnen mit `node -e` (Luminanz-Formel) und die Werte im Commit-Text belegen.

- [ ] **Step 3: Konfidenz „unsicher".** In `ResultView.tsx` `CONFIDENCE_COLORS.unsicher` von Rot auf Neutral-Grau: `{ bg: "bg-[#161B23]", border: "border-[#3A4556]", text: "text-[#B8C2CF]", dot: "bg-[#8A96A6]" }`. Rot bleibt Fehlerzuständen vorbehalten.

- [ ] **Step 4: Platzhalter.** `ContactForm.tsx`: `"Vonovia Kundenservice GmbH"` → `"Muster Hausverwaltung GmbH"`, `"Universitätsstr. 133, 44803 Bochum"` → `"Verwaltungsweg 5, 12345 Musterstadt"`.

- [ ] **Step 5: `focus-visible`.** `globals.css`: `:focus-visible { outline: 2px solid #34D399; outline-offset: 2px; }` (projektweit, ersetzt das fehlende Fokus-Styling).

- [ ] **Step 6: Prüfen.** Browser (Dev, `MOCK_ANALYSIS=true` hilft nicht ohne Redis → Modal per Storybook-artigem Aufruf nicht vorhanden; stattdessen: `LetterModal` in einer temporären Test-Route `src/app/[locale]/_modal-test/page.tsx` rendern, prüfen, Route wieder löschen). Tastatur: Tab bleibt im Modal, Escape schließt, Backdrop-Klick mit Ergebnis ignoriert. Screenshots Startseite + Dropzone (sichtbarer Rahmen). Prüf-Trio, Commit `feat(ux): Modal-Tastaturbedienung, AA-Kontraste, neutrale Unsicher-Konfidenz, Platzhalter`

---

### Task 11: Doku-Refresh

**Files:** `README.md`, `docs/ARCHITECTURE.md`, `docs/DIENSTE-UEBERSICHT.md`, `docs/ROADMAP.md`

Drift-Liste (Zeilen gemäß aktuellem Stand, vorher `grep` wiederholen):
- „24 h TTL" → „24 h unbezahlt, 7 Tage nach Kauf, 14 Tage bei offener SEPA-Zahlung" (README:42/174, ARCHITECTURE:9/17/36/100/229, DIENSTE:12/30, ROADMAP:12)
- `MOCK_ANALYSIS`: ergänzen „in Vercel-Production hart aus (`VERCEL_ENV=production`)" (README:29/132/139, ARCHITECTURE:107-109, DIENSTE:79)
- README:12 „Wasserzeichen-Briefvorschau" → existiert nicht mehr (Teaser = Anzahl, €-Potenzial, Titel, nächste Schritte)
- README:203 „max. 10 MB" → 3 MB
- send-pdf-Contract: `{ id, email, type }`, serverseitiges Re-Rendering aus Redis, Limits 5/ID + 20/IP pro Tag; generate-letter/checkout/report-Limits (Task 3); Fehlercodes (Task 7); Security-Header (Task 1); `/og.png`; Noto-Sans-PDF-Font + Arabisch-Einschränkung (Task 8); `/api/result` Stripe-Session-Fallback (20/ID/h)
- Tests: `npm test` (vitest) in README „Entwicklung" aufnehmen; Vorschlag `vitest.config.ts` → `.mts` **nicht** umsetzen (läuft), nur erwähnen wenn nötig
- ARCHITECTURE: Routen-Tabelle um `send-pdf` (POST), Fehlercode-Konvention, Header ergänzen; Struktur mit `[locale]`
- ROADMAP: Blocker-Runde 2026-09-06 + dieses Paket als erledigt eintragen; offen: Betreiber/Impressum, Upstash-DB neu, Muttersprachler-Review, 🟡-Liste

- [ ] **Step 1:** Änderungen einarbeiten, keine neuen Behauptungen ohne Code-Beleg (jede Zahl per `grep` in `src/lib/{limits,kv}.ts` gegenprüfen).
- [ ] **Step 2:** Commit `docs: README/ARCHITECTURE/DIENSTE/ROADMAP auf Stand Release-Runde 2026-09-06`

---

### Task 12: Gesamt-Verifikation

- [ ] `npx tsc --noEmit && npm test && npm run build` grün; `npm audit --omit=dev` = 0.
- [ ] Paritäts-Check aller 6 Message-Dateien OK; `_meta.status` in tr/ar/ru/uk unverändert `ai-draft`.
- [ ] Dev-Server: Header (curl), `/og.png` 200, `/en/impressum` canonical = `/en/impressum`, `/ergebnis?id=x` ohne canonical/hreflang, 404 lokalisiert, Startseite `/`, `/en`, `/ar`, `/uk` ohne Konsolenfehler, Upload-Datenschutzhinweis sichtbar, Modal-Tastaturbedienung.
- [ ] Push `origin monetarisierung`.
- [ ] Offen bleibt (nicht Teil dieses Plans): Betreiberdaten (Blocker 7), Upstash-DB neu anlegen + Env, Stripe-Test mit 100 %-Gutschein, Muttersprachler-Review.
