# Architektur-Dokumentation — Nebenkostencheck

**Stand:** 2026-09-06 (Branch `monetarisierung`)

---

## Überblick

Nebenkostencheck ist eine Next.js-App (App Router, next-intl) mit **serverseitiger Paywall**. Der Nutzer lädt ein Dokument hoch; es wird von Anthropic Claude analysiert. Das **vollständige** Ergebnis wird serverseitig in Vercel KV (Upstash Redis) zwischengespeichert — 24 h TTL unbezahlt, 7 Tage nach Kauf, 14 Tage bei einer noch offenen (z. B. SEPA-)Zahlung — der Browser erhält vor der Zahlung nur eine **Teaser-Vorschau**. Erst nach per Stripe-Webhook bestätigter Zahlung gibt der Server den vollen Bericht und die PDFs frei.

```
Browser                                  Server (Next.js API Routes)
  │
  ├─ Upload (base64 PDF/Bild)
  │        └─ POST /api/analyze ───────▶ Claude (Dokument + System-Prompt, gecacht)
  │                                          │  AnalysisResult (JSON)
  │                                          ├─ storeAnalysis() ▶ Vercel KV  [id, full, paid=false, 24h TTL]
  │        ◀── PreviewData (nur Teaser) ─────┘
  │                                          (KI-Antwort wird vor dem Speichern validiert/normalisiert)
  │
  ├─ "Für 9,90 € freischalten"
  │        └─ POST /api/checkout ──────▶ Stripe Checkout Session (metadata: analysisId)
  │        ◀── { url } ── Redirect ─────▶ [Stripe-Bezahlseite]
  │                                          │
  │                          Stripe ─▶ POST /api/stripe-webhook (Signatur verifiziert)
  │                                          └─ markPaid(id) ▶ KV [paid=true]
  │
  ├─ Rückkehr /ergebnis?id=…
  │        └─ GET /api/result?id=… ────▶ KV: paid? ── ja ▶ voller AnalysisResult
  │                                                  └ nein ▶ 402
  │
  └─ PDF-Download
           ├─ GET  /api/generate-report?id=…  ▶ KV(paid) ▶ ReportDoc → PDF
           ├─ POST /api/generate-letter       ▶ KV(paid) ▶ Claude → LetterDoc → PDF
           └─ POST /api/send-pdf              ▶ KV(paid) ▶ gespeicherter Brieftext → LetterDoc → PDF → Mail
```

**Kein Login, keine Nutzer-Accounts.** Der einzige persistente Zustand ist der KV-Eintrag pro Analyse (24 h TTL unbezahlt, 7 Tage nach Kauf, 14 Tage bei offener Zahlung — danach Auto-Löschung).

---

## Paywall-Sicherheitsmodell (zentral)

Das wichtigste Designprinzip: **Bezahlinhalte erreichen den Browser nie vor der Zahlung.**

1. `/api/analyze` gibt ausschließlich `PreviewData` zurück — Anzahl, Potenzial, Fehler-**Titel**, zwei Booleans. Keine Beschreibungen, Belege, Rechtsgrundlagen, Kontaktdaten oder Briefe.
2. Das volle `AnalysisResult` liegt nur serverseitig in KV unter einer zufälligen `id` (`crypto.randomUUID()`).
3. **Alle** Voll-Daten-Routen (`/api/result`, `/api/generate-report`, `/api/generate-letter`, `/api/send-pdf`) prüfen `record.paid`/`isUnlocked()` und antworten sonst mit `402` (`NOT_UNLOCKED`).
4. Das `paid`-Flag wird **ausschließlich** von `markPaid()` gesetzt, und das wird **nur** aus dem Stripe-Webhook nach erfolgreicher Signaturprüfung aufgerufen (oder serverseitig über den Session-Fallback in `/api/result`, s. u.). Kein clientseitiger Pfad kann es setzen.
5. Die Rückkehr-URL (`success_url` mit `session_id`) wird **nicht** als Zahlungsnachweis vertraut — die Erfolgsseite pollt `/api/result`, das nur bei `paid` ausliefert. Ist der Webhook noch nicht durch, fragt `/api/result` bei vorhandener `session_id` einmalig direkt bei Stripe nach (`unlockFromStripeSession`), begrenzt auf `RESULT_FALLBACK_PER_ID_PER_HOUR` Aufrufe pro Analyse-ID (nicht pro IP, da die Seite bis zu 5× pollt und sich Nutzer hinter CGNAT sonst gegenseitig aussperren würden).

Briefinhalte werden zusätzlich serverseitig aus `record.full.errors` bezogen (nach Kategorie gefiltert), nicht aus Client-Input. `/api/send-pdf` erhält vom Client nur `{ id, email, type }` und rendert das PDF serverseitig aus dem in KV gespeicherten Brieftext neu — der Client kann weder Bytes noch Dateinamen liefern (kein Mail-Relay für Fremdanhänge).

---

## Datenfluss im Detail

### 1. Upload (`UploadZone → page.tsx → /api/analyze`)

Der Browser konvertiert die Datei mit `FileReader` zu Base64 und sendet `{ base64, mediaType, fileName }`. Die Route validiert den MIME-Type (`application/pdf` oder `image/*`).

### 2. Analyse (`/api/analyze/route.ts` → `lib/claude.ts`)

`analyzeStatement()` sendet das Dokument als `document`- (PDF) bzw. `image`-Content-Block plus den `ANALYSIS_SYSTEM_PROMPT` als gecachten System-Prompt (`cache_control: ephemeral`) in einem einzigen Call. Modell: `claude-sonnet-4-6`, `max_tokens: 4096`.

- **Schritt 0 – Dokumentprüfung:** Ist es keine Nebenkostenabrechnung, gibt Claude `{"notAStatement": true, …}` zurück. Die Route liefert dann einen Teaser mit `notAStatement: true` (ohne KV-Speicherung); das Frontend zeigt die Hinweisbox.
- **Retry/Backoff:** Bei `429/503/529` (Überlast) bis zu 3 Versuche mit exponentiellem Backoff (500 ms, 1 s, 2 s).
- **JSON-Extraktion:** etwaige ```` ```json ````-Fences werden entfernt, dann `JSON.parse`.
- Bei Erfolg → `storeAnalysis(result)` (KV) → `toPreview(id, result)` an den Browser.

`maxDuration = 60` auf der Route (Vercel-Timeout-Grenze, auf Pro nutzbar).

### 3. Vorschau (`PreviewView`)

Zeigt Auffälligkeiten-Anzahl, Potenzial, Fehler-Titel (gesperrt), eine verschwommene „VORSCHAU"-Briefattrappe und den CTA „Für 9,90 € freischalten". Eine **Pflicht-Checkbox** (Widerrufsrecht-Erlöschen, § 356 Abs. 5 BGB) muss gesetzt sein, sonst ist der Button deaktiviert.

### 4. Zahlung (`/api/checkout` → Stripe → `/api/stripe-webhook`)

`/api/checkout` erstellt eine Checkout-Session (9,90 €, `allow_promotion_codes: true`, `metadata.analysisId`, Ablauf nach 30 min + Puffer). Der Webhook verifiziert die Signatur (`constructEventAsync` über den rohen Body) und ruft bei `checkout.session.completed` → `markPaid(id)`.

Die Session trägt zusätzlich `locale` (`stripeLocale()` aus `lib/checkoutLocale.ts`) und locale-präfixierte `success_url`/`cancel_url`, damit die Rückkehr in der Sprache des Nutzers landet. Stripe kennt weder Ukrainisch noch Arabisch (Stand SDK-Enum) — für `uk`/`ar` wird `"auto"` übergeben, Stripe entscheidet dann nach Browser-Sprache. Bricht der Nutzer bei Stripe ab, holt das Frontend die zuvor in `sessionStorage` abgelegte Vorschau zurück (`lib/previewStorage.ts`, Schlüssel `nkc:preview`), statt eine zweite kostenpflichtige Analyse zu erzwingen; die Daten werden vor Gebrauch auf Formkonformität geprüft (`isPreviewData`), da `sessionStorage` clientseitig manipulierbar ist.

### 5. Ergebnis (`/ergebnis` → `/api/result` → `ResultView`)

Die Erfolgsseite pollt `/api/result?id=…` (bis zu 5×, da der Webhook minimal verzögert sein kann). `ResultView` teilt die Fehler in **Sofort angreifbar** (`direct`) und **Belegeinsicht erforderlich** (`needs_review`), zeigt Potenzial-Summen, Farblegende und Buttons für Bericht-PDF und Schreiben.

### 6. PDFs (`generate-report`, `generate-letter`, `LetterModal`)

- **Detailbericht:** `GET /api/generate-report?id=…` rendert `ReportDoc` aus `record.full`.
- **Brief:** `LetterModal` postet `{ id, type, contact }`; die Route bezieht die passenden Fehler serverseitig, generiert den Text via `generateLetter()` (Claude) und rendert `LetterDoc`.
- **Brieftypen** (`LetterType`): `objection` (Widerspruch, nur bei `direct`-Fehlern), `document_review` (Belegeinsicht § 259 BGB, nur bei `needs_review`), `combined` (beides in **einem** Schreiben — Button nur, wenn beide Kategorien vorliegen).
- **Mailversand:** `POST /api/send-pdf` mit `{ id, email, type }` rendert das PDF serverseitig aus dem bereits generierten Brieftext neu und verschickt es per Mail (`runtime = "nodejs"`, `maxDuration = 30`).
- Beide PDF-Generierungs-Routen: `runtime = "nodejs"`, `maxDuration = 60` (react-pdf benötigt Node).
- **Schriftarten:** `lib/pdf/fonts.ts` registriert Noto Sans (Regular + Bold, OFL-lizenziert) für Latin-Ext und Kyrillisch, da Helvetica/WinAnsi z. B. türkische Sonderzeichen (ş/ğ/İ) oder Kyrillisch nicht darstellen kann. Die TTFs müssen über `outputFileTracingIncludes` in `next.config.mjs` explizit ins Vercel-Bundle der drei PDF-Routen aufgenommen werden, sonst fehlen sie im Serverless-Deployment. **Einschränkung:** Arabisch wird aktuell **nicht** unterstützt — Briefe/Berichte auf Arabisch fehlen im PDF-Export.

---

## API-Routen & Rate-Limits

Alle Routen liegen unter `src/app/api/*` (nicht unter `[locale]/` — API-Routen sind sprachneutral, nur die Fehlermeldungen im JSON sind Deutsch/Fallback und werden clientseitig übersetzt, s. u.). Zusätzlich zu den Paywall-Gates aus jeder Route greift ein IP- bzw. Analyse-ID-basiertes Sliding-Window-Limit (`@upstash/ratelimit`, `lib/ratelimit.ts`, Grenzwerte zentral in `lib/limits.ts`):

| Route | Methode | Zweck | Limit |
|---|---|---|---|
| `/api/analyze` | POST | Dokument → Claude → KV, liefert nur `PreviewData` | `RATE_LIMIT_PER_HOUR` (10/h) + `RATE_LIMIT_PER_DAY` (30/d) pro IP |
| `/api/checkout` | POST | Stripe-Checkout-Session erstellen | `CHECKOUT_PER_IP_PER_HOUR` (20/h) pro IP |
| `/api/stripe-webhook` | POST | Zahlungsbestätigung, setzt `paid` | ungegrenzt (Stripe-Signatur-geprüft) |
| `/api/result` | GET | Voller Bericht bei `paid`; sonst Stripe-Session-Fallback | `RESULT_FALLBACK_PER_ID_PER_HOUR` (20/h) pro Analyse-ID (nur für den Fallback-Call) |
| `/api/generate-letter` | POST | Brief (Claude) → PDF, paid-gated | `LETTER_PER_ID_PER_DAY` (12/d) + `LETTER_PER_IP_PER_DAY` (40/d) |
| `/api/generate-report` | GET | Detailbericht → PDF, paid-gated | `REPORT_PER_IP_PER_HOUR` (30/h) pro IP |
| `/api/send-pdf` | POST | Gespeichertes Schreiben per Mail versenden, paid-gated | `SEND_PDF_PER_ID_PER_DAY` (5/d) + `SEND_PDF_PER_IP_PER_DAY` (20/d) |

Alle Fenster sind Sliding-Windows: ein Schlüssel kann durch die Fenster-Interpolation in Grenzfällen bis zu knapp dem doppelten Limit im Fenster nachwirken — bewusst in Kauf genommen, da die Limits ohnehin großzügig gegen Kostenmissbrauch (nicht gegen einzelne Nutzer) gesetzt sind.

---

## Security-Header

`security-headers.mjs` definiert die Header, `next.config.mjs` hängt sie über `headers()` an jede Route (`source: "/(.*)"`):

- **Content-Security-Policy** — `default-src 'self'`, `script-src 'self' 'unsafe-inline'` (zusätzlich `'unsafe-eval'`, aber **nur in Dev** für Next-HMR), `frame-ancestors 'none'`, `object-src 'none'`, `upgrade-insecure-requests` u. a.
- **X-Frame-Options: DENY**, **X-Content-Type-Options: nosniff**
- **Referrer-Policy: strict-origin-when-cross-origin** — die Ergebnis-URL trägt `?id=<uuid>`, die nie an Dritte durchgereicht werden soll
- **Permissions-Policy** — sperrt Kamera/Mikrofon/Geolocation/Payment
- **Strict-Transport-Security** — `max-age=63072000; includeSubDomains`

---

## Mehrsprachigkeit (i18n) & Seitenstruktur

Next-intl mit sechs Locales (`src/i18n/routing.ts`): `de` (Standard, ohne URL-Präfix), `en`, `tr`, `ar`, `ru`, `uk`. Seiten liegen unter `src/app/[locale]/...`; **API-Routen bleiben unpräfixiert** unter `src/app/api/*`, ebenso `src/app/og.png/route.tsx`. Übersetzungsstatus: `messages/{tr,ar,ru,uk}.json` tragen `_meta.status: "ai-draft"` (KI-Erstübersetzung, Review durch Muttersprachler vor Launch ausstehend), `de`/`en` sind manuell gepflegt.

**404-Handling:** Ein unbekannter Pfad *innerhalb* einer gültigen Locale (z. B. `/en/gibtsnicht`) läuft über den Catch-all `src/app/[locale]/[...rest]/page.tsx` in `notFound()` und rendert die lokalisierte `src/app/[locale]/not-found.tsx`. Ein Pfad *außerhalb* jeder gültigen Locale (z. B. `/xx/foo`) trifft dagegen `src/app/not-found.tsx` — das Root-Layout (`src/app/layout.tsx`) rendert kein `<html>` (das liegt im `[locale]`-Layout), weshalb diese Root-404 ihr eigenes `<html>`/`<body>`-Grundgerüst mitbringt und ohne next-intl auskommt (fest auf Deutsch).

**SEO:** `lib/seo.ts` liefert `pageAlternates()`/`pageMetadata()` — Canonical + hreflang (inkl. `x-default` = `de`) für jede Seite über alle sechs Locales. Das OG-Bild liegt unter `/og.png` als eigene Route (`src/app/og.png/route.tsx`), nicht als Redirect. `/ergebnis` ist bewusst `noindex`/`nofollow` ohne Canonical (`robots: { index: false, follow: false }`, `alternates: { canonical: null }`) — die URL trägt eine personenbezogene Analyse-ID.

---

## Module & Lazy-Initialisierung

Externe Clients (Anthropic, Stripe, Redis) werden **lazy** initialisiert (erst beim ersten Aufruf, nicht auf Modulebene). Grund: `npm run build` importiert die Route-Module ohne gesetzte Env-Variablen — eine Instanziierung wie `new Stripe(process.env.X!)` auf Modulebene würde den Build sofort zum Absturz bringen.

| Modul | Verantwortung |
|---|---|
| `lib/claude.ts` | `analyzeStatement`, `generateLetter`, `countDocumentTokens`, `withRetry` (vorausschauendes Retry-Budget), Mock-Weiche |
| `lib/mock.ts` | `isMockEnabled`/`MOCK` — einzige Quelle für den Testmodus, hart `false` bei `VERCEL_ENV=production` |
| `lib/prompts.ts` | `ANALYSIS_SYSTEM_PROMPT`, `buildLetterPrompt` (inkl. `combined`) |
| `lib/kv.ts` | `storeAnalysis`, `getAnalysis`, `markPaid` (Redis; 24 h TTL unbezahlt, 7 Tage nach Kauf, 14 Tage bei offener Zahlung) |
| `lib/limits.ts` | Zentrale Grenzwerte (Datei-/Token-Limits, alle Rate-Limits) |
| `lib/ratelimit.ts` | `checkLimit`, `checkRateLimit`, `getClientIp` (Sliding-Window über `@upstash/ratelimit`) |
| `lib/apiErrors.ts` | `apiError(code, status?)` — Fehlercode-Konvention, s. u. |
| `lib/errors.ts` | `classifyErrorCode` (technische Fehler → passender `ApiErrorCode`) |
| `lib/checkoutLocale.ts` | `toLocale`, `localePrefix`, `stripeLocale` — Locale-Mapping für Stripe-Checkout |
| `lib/previewStorage.ts` | `savePreview`/`loadPreview` — Teaser-Zwischenspeicher in `sessionStorage` für Checkout-Abbruch |
| `lib/seo.ts` | `pageAlternates`, `pageMetadata`, `OG_LOCALES` — Canonical/hreflang je Seite |
| `lib/mockData.ts` | Beispiel-`AnalysisResult` + Beispielbrief für `MOCK_ANALYSIS` |
| `lib/pdf/fonts.ts` | Registriert Noto Sans (Latin-Ext + Kyrillisch) für react-pdf |
| `lib/pdf/*` | react-pdf-Layouts |
| `security-headers.mjs` | CSP/HSTS/weitere Security-Header, eingebunden über `next.config.mjs` → `headers()` |

---

## Testmodus (`MOCK_ANALYSIS`)

Ist `MOCK_ANALYSIS=true`, geben `analyzeStatement` und `generateLetter` Beispieldaten aus `lib/mockData.ts` zurück (mit kurzer künstlicher Verzögerung für die Lade-Animation) — **ohne** Claude-Aufruf. Das Beispiel enthält bewusst beide Fehlerkategorien, sodass der komplette UI-Flow inkl. kombiniertem Schreiben getestet werden kann. Stripe/KV laufen dabei real (Testmodus). Kosten: 0 Cent.

`lib/mock.ts` ist die einzige Stelle, die das Flag auswertet: `isMockEnabled()` liefert **immer** `false`, sobald `VERCEL_ENV === "production"` gesetzt ist — unabhängig vom Wert von `MOCK_ANALYSIS`. Das verhindert, dass ein versehentlich in die Produktions-Umgebung kopiertes `MOCK_ANALYSIS=true` die Paywall aushebelt (Mock-Analysen setzen `paid` faktisch frei, da keine echte Zahlung nötig ist, um sie zu sehen).

> **KI-Kostenhinweis:** Eine echte Analyse hat ~31 k Input-Tokens (Dokument als Bild gerastert) → **~14 Cent**; ein Brief ~3 Cent. Bei 9,90 € Verkauf ≈ 92 % Marge — fürs *Testen* lohnt der Mock-Modus.

---

## KI-Prompt-Design

### Anti-Halluzinations-Regeln

Das größte Risiko juristischer KI-Analysen ist das Erfinden von Fehlern. Der System-Prompt erzwingt:

1. **Nur dokumentierte Zahlen** — jede genannte Zahl muss wörtlich im Dokument stehen.
2. **Kein Konstruieren von Diskrepanzen** — Zwischensummen/verschiedene Darstellungen desselben Werts sind keine Fehler.
3. **Zitierbarer Beleg Pflicht** — `evidence` muss ein wörtliches Zitat / eine konkrete Dokumentstelle enthalten.
4. **Finaler Selbst-Check** — vor der Antwort wird jeder Fehler erneut auf Beleg geprüft.

Philosophie: Lieber einen echten Fehler übersehen als einen nicht existenten melden.

### Fehlerregeln

#### Sofort angreifbar — sicher

| Rechtsgrundlage | Verstoß | Folge |
|---|---|---|
| § 9 Abs. 2 HeizkV | Warmwasser-Wärmemenge per Formel statt Wärmemengenzähler (Pflicht seit 31.12.2013) | 15 % Kürzungsrecht (§ 12 HeizkV) |
| § 7 Abs. 1 HeizkV | Heizkosten zu 100 % nach Wohnfläche (0 % Verbrauchsanteil, wörtlich belegt) | 15 % Kürzungsrecht (§ 12 HeizkV) |
| § 1 Abs. 2 BetrKV | Positionstitel enthält wörtlich „Reparatur"/„Instandhaltung"/„Instandsetzung" | Position streichen |
| § 259 BGB | Gesamtkosten des Gebäudes fehlen vollständig | Abrechnung formell unwirksam |
| § 556 Abs. 3 BGB | Abrechnungsfrist überschritten (> 12 Monate) | Nachforderung ausgeschlossen |
| BGH VIII ZR 78/12 | Pauschale Vorauszahlungserhöhungen ohne Einzelabrechnung | Erhöhung unwirksam |

#### Sofort angreifbar — wahrscheinlich

| Rechtsgrundlage | Verstoß |
|---|---|
| § 1 Abs. 2 BetrKV | Positionstitel „Verwaltungsgebühr"/„Hausverwaltungskosten"/„Verwalterhonorar" |
| § 25a NMV | Umlageausfallwagnis bei nicht öffentlich gefördertem Wohnraum |

#### Belegeinsicht erforderlich

- Auffällig hohe Versicherungsbeiträge (Elementarversicherung nicht umlagefähig)
- Hauswartleistungen ohne Aufschlüsselung (Verwaltungsanteil nicht umlagefähig)
- Leerstandskosten: Flächenschlüssel weicht deutlich von Mieterfläche ab (BGH VIII ZR 167/03)
- (unsicher) Sperrmüll, Rauchwarnmelder-Anschaffung/-Miete, Verbrauchserfassungsgeräte, auffällige Vorjahressteigerungen

---

## TypeScript-Typen (Auszug)

```typescript
type ErrorCategory = "direct" | "needs_review";
type Confidence = "sicher" | "wahrscheinlich" | "unsicher";
type LetterType = "objection" | "document_review" | "combined";

interface ErrorItem {
  title: string;
  description: string;
  confidence: Confidence;
  category: ErrorCategory;
  potentialEur?: number | null;
  legalBasis?: string | null;
  actionText?: string | null;
  evidence?: string | null;       // wörtliches Zitat als Beleg
}

interface AnalysisResult {
  notAStatement?: boolean;
  summary: string;
  errors: ErrorItem[];
  totalPotentialEur?: number | null;
  directPotentialEur?: number | null;
  reviewPotentialEur?: number | null;
  totalPotentialLabel?: string | null;
  contactData?: ContactData;
}

// Was der Browser vor der Zahlung sieht:
interface PreviewData {
  id: string;
  notAStatement?: boolean;
  errorCount: number;
  totalPotentialEur?: number | null;
  totalPotentialLabel?: string | null;
  errorTitles: string[];
  hasDirect: boolean;   // → Widerspruch verfügbar
  hasReview: boolean;   // → Belegeinsicht verfügbar
}

// Was serverseitig in KV liegt:
interface StoredAnalysis {
  full: AnalysisResult;
  paid: boolean;
  createdAt: string;
}
```

---

## Fehlercode-Konvention

Jede API-Route antwortet im Fehlerfall über `apiError(code, status?)` (`lib/apiErrors.ts`) mit `{ error: "<deutscher Fallback-Text>", code }`. Die Codes (`ApiErrorCode`, aktuell 22 Stück — u. a. `RATE_LIMITED`, `NOT_UNLOCKED`, `ANALYSIS_EXPIRED`, `ANALYSIS_EXPIRING`, `LETTER_RATE_LIMITED`, `SEND_RATE_LIMITED`, `CHECKOUT_RATE_LIMITED`, `OVERLOADED`, `TIMEOUT`, `NETWORK`, `UNKNOWN`) sind zentral in `API_ERRORS` definiert; jeder Eintrag legt Default-Status und deutschen Text fest.

Der Client übersetzt anhand des `code` über `apiErrors.*` in `messages/*.json` (6 Sprachen); der vom Server mitgeschickte deutsche Text ist nur der Fallback, falls ein Client einen (neuen) Code noch nicht kennt — er muss deshalb für sich allein verständlich sein (`lib/clientErrors.ts` übernimmt das Mapping im Frontend).

`classifyErrorCode` (`lib/errors.ts`) ordnet technische Fehler (Anthropic-Überlast, Netzwerk/Timeout, JSON-Parse-Fehler etc.) dem passenden `ApiErrorCode` zu, bevor die Route `apiError(...)` aufruft. Das Frontend fängt zusätzlich non-JSON-Antworten (z. B. Vercel-HTML-Fehlerseiten bei Timeout) ab.

---

## Bekannte Einschränkungen & Eigenheiten

| Punkt | Details |
|---|---|
| Vercel Hobby | Verbietet kommerzielle Nutzung → **Pro erforderlich**. Pro hebt auch das Function-Timeout (`maxDuration = 60`) an. |
| KI-Kosten | ~14 Cent/Analyse, ~3 Cent/Brief (s. o.). Pro Verkauf vernachlässigbar. |
| Datenpersistenz | Nur kurzlebiger KV-Eintrag (24 h unbezahlt, 7 Tage nach Kauf, 14 Tage bei offener Zahlung), keine History, kein Account. |
| Tests | Vitest (`npm test`, aktuell 15 Dateien / 80 Tests) + `tsc --noEmit` + `npm run build`. |
| Lokale env-Eigenheit | Eine bereits in der Shell gesetzte (auch leere) `ANTHROPIC_API_KEY` überschattet `.env.local`, da dotenv existierende Variablen nicht überschreibt. Lokaler Workaround: `env -u ANTHROPIC_API_KEY npm run dev`. Betrifft nicht Vercel. |
| Rechtstexte | Impressum/Datenschutz/AGB sind unverbindliche Roh-Vorlagen mit Platzhaltern (Betreibername/-anschrift) — vor Live-Betrieb prüfen lassen. |
| Arabisch im PDF | Noto Sans deckt Latin-Ext + Kyrillisch ab, aber kein Arabisch — Briefe/Berichte auf Arabisch werden im PDF-Export nicht korrekt dargestellt. |
| Übersetzungsstand | `tr`/`ar`/`ru`/`uk` sind KI-Erstübersetzungen (`_meta.status: "ai-draft"`), Muttersprachler-Review vor Launch aussteht. |

---

## Referenzen

- Spec: `docs/superpowers/specs/2026-05-29-monetarisierung-go-live-design.md`
- Plan: `docs/superpowers/plans/2026-05-29-monetarisierung-go-live.md`
