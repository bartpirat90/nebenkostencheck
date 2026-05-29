# Architektur-Dokumentation — Nebenkostencheck

**Stand:** 2026-05-29 (Branch `monetarisierung`)

---

## Überblick

Nebenkostencheck ist eine Next.js-App mit **serverseitiger Paywall**. Der Nutzer lädt ein Dokument hoch; es wird von Anthropic Claude analysiert. Das **vollständige** Ergebnis wird serverseitig in Vercel KV (Upstash Redis) zwischengespeichert (24 h TTL) — der Browser erhält vor der Zahlung nur eine **Teaser-Vorschau**. Erst nach per Stripe-Webhook bestätigter Zahlung gibt der Server den vollen Bericht und die PDFs frei.

```
Browser                                  Server (Next.js API Routes)
  │
  ├─ Upload (base64 PDF/Bild)
  │        └─ POST /api/analyze ───────▶ Claude (Dokument + System-Prompt, gecacht)
  │                                          │  AnalysisResult (JSON)
  │                                          ├─ storeAnalysis() ▶ Vercel KV  [id, full, paid=false, 24h TTL]
  │        ◀── PreviewData (nur Teaser) ─────┘
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
           └─ POST /api/generate-letter       ▶ KV(paid) ▶ Claude → LetterDoc → PDF
```

**Kein Login, keine Nutzer-Accounts.** Der einzige persistente Zustand ist der kurzlebige KV-Eintrag pro Analyse (Auto-Löschung nach 24 h).

---

## Paywall-Sicherheitsmodell (zentral)

Das wichtigste Designprinzip: **Bezahlinhalte erreichen den Browser nie vor der Zahlung.**

1. `/api/analyze` gibt ausschließlich `PreviewData` zurück — Anzahl, Potenzial, Fehler-**Titel**, zwei Booleans. Keine Beschreibungen, Belege, Rechtsgrundlagen, Kontaktdaten oder Briefe.
2. Das volle `AnalysisResult` liegt nur serverseitig in KV unter einer zufälligen `id` (`crypto.randomUUID()`).
3. **Alle** Voll-Daten-Routen (`/api/result`, `/api/generate-report`, `/api/generate-letter`) prüfen `record.paid` und antworten sonst mit `402`.
4. Das `paid`-Flag wird **ausschließlich** von `markPaid()` gesetzt, und das wird **nur** aus dem Stripe-Webhook nach erfolgreicher Signaturprüfung aufgerufen. Kein clientseitiger Pfad kann es setzen.
5. Die Rückkehr-URL (`success_url` mit `session_id`) wird **nicht** als Zahlungsnachweis vertraut — die Erfolgsseite pollt `/api/result`, das nur bei `paid` ausliefert.

Briefinhalte werden zusätzlich serverseitig aus `record.full.errors` bezogen (nach Kategorie gefiltert), nicht aus Client-Input.

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

`/api/checkout` erstellt eine Checkout-Session (9,90 €, `allow_promotion_codes: true`, `metadata.analysisId`). Der Webhook verifiziert die Signatur (`constructEventAsync` über den rohen Body) und ruft bei `checkout.session.completed` → `markPaid(id)`.

### 5. Ergebnis (`/ergebnis` → `/api/result` → `ResultView`)

Die Erfolgsseite pollt `/api/result?id=…` (bis zu 5×, da der Webhook minimal verzögert sein kann). `ResultView` teilt die Fehler in **Sofort angreifbar** (`direct`) und **Belegeinsicht erforderlich** (`needs_review`), zeigt Potenzial-Summen, Farblegende und Buttons für Bericht-PDF und Schreiben.

### 6. PDFs (`generate-report`, `generate-letter`, `LetterModal`)

- **Detailbericht:** `GET /api/generate-report?id=…` rendert `ReportDoc` aus `record.full`.
- **Brief:** `LetterModal` postet `{ id, type, contact }`; die Route bezieht die passenden Fehler serverseitig, generiert den Text via `generateLetter()` (Claude) und rendert `LetterDoc`.
- **Brieftypen** (`LetterType`): `objection` (Widerspruch, nur bei `direct`-Fehlern), `document_review` (Belegeinsicht § 259 BGB, nur bei `needs_review`), `combined` (beides in **einem** Schreiben — Button nur, wenn beide Kategorien vorliegen).
- Beide PDF-Routen: `runtime = "nodejs"`, `maxDuration = 60` (react-pdf benötigt Node).

---

## Module & Lazy-Initialisierung

Externe Clients (Anthropic, Stripe, Redis) werden **lazy** initialisiert (erst beim ersten Aufruf, nicht auf Modulebene). Grund: `npm run build` importiert die Route-Module ohne gesetzte Env-Variablen — eine Instanziierung wie `new Stripe(process.env.X!)` auf Modulebene würde den Build sofort zum Absturz bringen.

| Modul | Verantwortung |
|---|---|
| `lib/claude.ts` | `analyzeStatement`, `generateLetter`, `withRetry`, Mock-Weiche |
| `lib/prompts.ts` | `ANALYSIS_SYSTEM_PROMPT`, `buildLetterPrompt` (inkl. `combined`) |
| `lib/kv.ts` | `storeAnalysis`, `getAnalysis`, `markPaid` (Redis, 24 h TTL) |
| `lib/errors.ts` | `classifyError` (technische Fehler → deutsche Meldungen) |
| `lib/mockData.ts` | Beispiel-`AnalysisResult` + Beispielbrief für `MOCK_ANALYSIS` |
| `lib/pdf/*` | react-pdf-Layouts |

---

## Testmodus (`MOCK_ANALYSIS`)

Ist `MOCK_ANALYSIS=true`, geben `analyzeStatement` und `generateLetter` Beispieldaten aus `lib/mockData.ts` zurück (mit kurzer künstlicher Verzögerung für die Lade-Animation) — **ohne** Claude-Aufruf. Das Beispiel enthält bewusst beide Fehlerkategorien, sodass der komplette UI-Flow inkl. kombiniertem Schreiben getestet werden kann. Stripe/KV laufen dabei real (Testmodus). Kosten: 0 Cent.

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

## Error-Handling

`classifyError` übersetzt technische Fehler in deutsche Klartexte:

| Fehlerfall | Deutsche Meldung |
|---|---|
| Überlast (503 / 529 / „overloaded" / „high demand") | „Der Prüfdienst ist gerade stark ausgelastet. Bitte in einem Moment erneut versuchen." |
| Netzwerk / Timeout | „Verbindung unterbrochen. Bitte erneut versuchen." |
| JSON-Parse-Fehler | „Die Analyse konnte nicht verarbeitet werden. Bitte erneut versuchen." |
| Sonstige | „Ein unbekannter Fehler ist aufgetreten. Bitte erneut versuchen." |

Das Frontend fängt zusätzlich non-JSON-Antworten (z. B. Vercel-HTML-Fehlerseiten bei Timeout) ab.

---

## Bekannte Einschränkungen & Eigenheiten

| Punkt | Details |
|---|---|
| Vercel Hobby | Verbietet kommerzielle Nutzung → **Pro erforderlich**. Pro hebt auch das Function-Timeout (`maxDuration = 60`) an. |
| KI-Kosten | ~14 Cent/Analyse, ~3 Cent/Brief (s. o.). Pro Verkauf vernachlässigbar. |
| Datenpersistenz | Nur kurzlebiger KV-Eintrag (24 h), keine History, kein Account. |
| Keine automatischen Tests | Verifikation per `tsc --noEmit` + `npm run build`. |
| Lokale env-Eigenheit | Eine bereits in der Shell gesetzte (auch leere) `ANTHROPIC_API_KEY` überschattet `.env.local`, da dotenv existierende Variablen nicht überschreibt. Lokaler Workaround: `env -u ANTHROPIC_API_KEY npm run dev`. Betrifft nicht Vercel. |
| Rechtstexte | Impressum/Datenschutz/AGB sind unverbindliche Roh-Vorlagen mit Platzhaltern — vor Live-Betrieb prüfen lassen. |

---

## Referenzen

- Spec: `docs/superpowers/specs/2026-05-29-monetarisierung-go-live-design.md`
- Plan: `docs/superpowers/plans/2026-05-29-monetarisierung-go-live.md`
