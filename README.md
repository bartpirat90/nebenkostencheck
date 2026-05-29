# Nebenkostencheck

Automatisierte Prüfung deutscher Nebenkostenabrechnungen: Abrechnung hochladen, Rechtsverstöße erkennen, Widerspruch- und Belegeinsicht-Schreiben als PDF erhalten.

> **Stand dieser Doku:** 2026-05-29 · Branch `monetarisierung` (lokal end-to-end getestet, noch nicht auf `main` gemergt/deployed).
> Die produktive Live-Version unter [nebenkostencheck-six.vercel.app](https://nebenkostencheck-six.vercel.app) entspricht noch dem **vorherigen, kostenlosen** Stand (Gemini, ohne Bezahlung).

---

## Geschäftsmodell

- **Kostenlose Vorschau** (Teaser): Anzahl gefundener Auffälligkeiten, geschätztes Erstattungspotenzial in €, Fehler-Titel und eine Wasserzeichen-Briefvorschau.
- **Einmalzahlung 9,90 €** schaltet das vollständige Paket frei: Detailbericht (alle Fehler mit Begründung, Beleg, Rechtsgrundlage, Handlungsempfehlung) + Schreiben als PDF.
- **Kein Abo, kein Login.** Zahlung über Stripe Checkout (Karte, Klarna, Apple/Google Pay u. a.).

Die Bezahlinhalte werden **serverseitig** zurückgehalten, bis die Zahlung per Stripe-Webhook bestätigt ist — die Vorschau kann die Details nicht umgehen (siehe [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)).

---

## Features

- **Upload** — PDF oder Foto der Abrechnung per Drag-and-drop oder Klick
- **Analyse** — Anthropic Claude prüft auf typische Rechtsverstöße nach BetrKV, HeizkV und BGB
- **Dokumentvalidierung** — kein passendes Dokument → freundliche Hinweisbox (kein Bezahlvorgang)
- **Teaser-Vorschau** — Auffälligkeiten + Potenzial sichtbar, Details hinter Paywall
- **Detailbericht** — gefundene Fehler mit Rechtsgrundlage, Erstattungspotenzial, Handlungsempfehlung; als PDF herunterladbar
- **Briefgenerator (PDF)** — Widerspruch, Belegeinsicht-Aufforderung (§ 259 BGB) oder **beides kombiniert in einem Schreiben**
- **Lade-Animationen** — sequenzielle Aktivitätsanzeige bei Analyse und PDF-Erstellung
- **Testmodus** — `MOCK_ANALYSIS=true` liefert Beispieldaten ohne KI-Aufruf (0 Cent), für UI-/Flow-Tests
- **Rechtsseiten** — Impressum, Datenschutz, AGB (Roh-Vorlagen, vor Live-Betrieb prüfen lassen)

---

## Tech Stack

| Bereich | Technologie |
|---|---|
| Framework | Next.js 15 (App Router), React 19 |
| Sprache | TypeScript |
| Styling | Tailwind CSS v3 |
| KI | Anthropic Claude (`claude-sonnet-4-6`) via `@anthropic-ai/sdk`, mit Prompt-Caching + Retry/Backoff |
| Speicher | Vercel KV / Upstash Redis (`@upstash/redis`), 24 h TTL |
| Zahlung | Stripe Checkout + Webhook (`stripe`, `@stripe/stripe-js`) |
| PDF | `@react-pdf/renderer` (serverseitig) |
| Deployment | Vercel (Pro für kommerziellen Betrieb erforderlich) |

---

## Lokales Setup

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren

```bash
cp .env.local.example .env.local
```

In `.env.local` eintragen:

```
# Anthropic Claude — https://console.anthropic.com (API Keys)
ANTHROPIC_API_KEY=sk-ant-...

# Vercel KV / Upstash Redis — https://upstash.com (Datenbank → REST API)
KV_REST_API_URL=https://...upstash.io
KV_REST_API_TOKEN=...

# Stripe (Testmodus) — https://dashboard.stripe.com (Entwickler → API-Schlüssel)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...                  # aus `stripe listen`, siehe Schritt 4
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Basis-URL für Stripe-Weiterleitungen
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Testmodus: true = Beispieldaten ohne Claude-Aufruf (0 Cent)
MOCK_ANALYSIS=false
```

Upstash- und Stripe-Konten sind kostenlos; Stripe im **Testmodus** verlangt keine Aktivierung. Anthropic ist Pay-as-you-go (Karte/Debitkarte erforderlich).

### 3. Stripe CLI installieren (für lokale Webhooks)

```bash
winget install Stripe.StripeCLI    # Windows; macOS: brew install stripe/stripe-cli/stripe
```

### 4. Webhook-Weiterleitung starten

In einem eigenen Terminal:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

Das ausgegebene `whsec_…` als `STRIPE_WEBHOOK_SECRET` in `.env.local` eintragen. Terminal während des Tests laufen lassen.

### 5. Entwicklungsserver starten

```bash
npm run dev
```

→ App läuft auf `http://localhost:3000`

> **Hinweis für Tests via Claude Code / Umgebungen mit gesetztem `ANTHROPIC_API_KEY`:** Ist in der Shell bereits eine (auch leere) `ANTHROPIC_API_KEY`-Variable gesetzt, überschreibt dotenv den `.env.local`-Wert nicht. Dann mit `env -u ANTHROPIC_API_KEY npm run dev` starten. In einer normalen Nutzer-Shell und auf Vercel tritt das nicht auf.

### Testkarte / Gutschein

- Stripe-Testkarte: `4242 4242 4242 4242`, beliebiges zukünftiges Datum, beliebiger CVC.
- 100 %-Gutscheincode (für eigene Tester ohne Zahlung): im Stripe-Dashboard unter *Produkte → Coupons* anlegen, im Checkout über „Promo-Code" einlösen.

---

## Go-Live-Checkliste (Betreiber-Aufgaben, kein Code)

Vor dem echten Launch erforderlich:

- [ ] **Vercel Pro** abonnieren — der Hobby-Plan verbietet kommerzielle Nutzung
- [ ] **Anthropic** produktiv: bezahltes Guthaben, `ANTHROPIC_API_KEY` in Vercel
- [ ] **Stripe Live-Modus**: Konto aktivieren, Live-Keys, Webhook-Endpoint (`/api/stripe-webhook`) registrieren, Zahlungsmethoden im Dashboard prüfen (z. B. PayPal aktivieren, exotische abschalten)
- [ ] **Upstash/Vercel KV** Produktiv-Instanz, Env-Variablen in Vercel
- [ ] **Rechtstexte** (Impressum/Datenschutz/AGB) anwaltlich oder über Generator prüfen lassen — die mitgelieferten sind unverbindliche Entwürfe
- [ ] **Gewerbe / Umsatzsteuer** klären (Kleinunternehmerregelung etc.)
- [ ] `MOCK_ANALYSIS` in Produktion **nicht** setzen (bzw. `false`)

---

## Deployment auf Vercel

1. Branch nach `main` mergen und pushen (löst Auto-Deploy aus)
2. Unter **Settings → Environment Variables** alle Werte aus `.env.local` setzen (ohne `MOCK_ANALYSIS` bzw. `false`); `NEXT_PUBLIC_BASE_URL` auf die echte Domain
3. Stripe-Webhook-Endpoint in Stripe auf `https://<domain>/api/stripe-webhook` registrieren und dessen `whsec_…` als `STRIPE_WEBHOOK_SECRET` hinterlegen

---

## Projektstruktur

```
src/
  app/
    page.tsx                    # Startseite: Landing, Upload, Teaser-Vorschau
    layout.tsx                  # Root-Layout + Metadata
    globals.css                 # Tailwind-Basis + Dark-Background
    ergebnis/page.tsx           # Erfolgsseite nach Zahlung (lädt vollen Bericht)
    impressum|datenschutz|agb/  # Rechtsseiten (Roh-Vorlagen)
    api/
      analyze/route.ts          # POST: Dokument → Claude → KV, gibt nur Teaser zurück
      checkout/route.ts         # POST: Stripe-Checkout-Session (9,90 €)
      stripe-webhook/route.ts   # POST: verifiziert Zahlung, setzt paid-Flag in KV
      result/route.ts           # GET:  voller Bericht – nur bei bezahltem Status
      generate-letter/route.tsx # POST: Brief (Claude) → PDF, paid-gated
      generate-report/route.tsx # GET:  Detailbericht → PDF, paid-gated

  components/
    LandingHero · StatsBar · HowItWorks   # Landing-Sektionen
    UploadZone                            # Drag-and-drop Upload + Lade-Animation
    PreviewView                           # Teaser + Widerrufs-Checkbox + Checkout-CTA
    ResultView                            # Voller Bericht + PDF-/Brief-Buttons
    ContactForm · LetterModal             # Brieferstellung (PDF-Download)
    Logo · Footer                         # Schutzschild-Logo, Footer mit Rechtslinks
    ActivityIndicator                     # Geteilte Lade-Animation (Balken + Phasen)

  lib/
    claude.ts                   # Anthropic-Client: analyzeStatement, generateLetter (+Mock)
    prompts.ts                  # System-Prompt (Analyse) + buildLetterPrompt
    kv.ts                       # KV-Store: storeAnalysis, getAnalysis, markPaid (24h TTL)
    errors.ts                   # classifyError: technische Fehler → deutsche Meldungen
    mockData.ts                 # Beispieldaten für MOCK_ANALYSIS
    pdf/LetterDoc.tsx           # PDF-Layout: Brief
    pdf/ReportDoc.tsx           # PDF-Layout: Detailbericht

  types/index.ts                # Shared TypeScript-Typen

docs/
  ARCHITECTURE.md               # Technische Architektur (Datenfluss, Paywall, KI)
  superpowers/specs/            # Design-Spezifikationen
  superpowers/plans/            # Implementierungspläne
```

---

## Verifikation

Kein automatisiertes Test-Framework. Verifikation über:

```bash
npx tsc --noEmit     # Typprüfung (0 Fehler erwartet)
npm run build        # Production-Build (✓ Compiled successfully)
```

---

## Unterstützte Dateitypen

PDF (empfohlen, beste Erkennung) · JPG/JPEG · PNG · WebP · max. 10 MB

---

## Geprüfte Rechtsverstöße

Die Analyse prüft u. a. § 9/§ 7 HeizkV (Wärmemengenzähler, Verbrauchsanteil), § 1 BetrKV (Reparatur-/Verwaltungskosten), § 259 BGB (fehlende Gesamtkosten), § 556 BGB (Abrechnungsfrist), Umlageausfallwagnis, Versicherungs-/Hauswart-/Leerstandskosten u. a. Vollständiger Katalog und Anti-Halluzinations-Regeln: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
