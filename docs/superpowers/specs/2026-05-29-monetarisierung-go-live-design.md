# Monetarisierung & Go-Live — Design (Spec)

**Datum:** 2026-05-29
**Projekt:** Nebenkostencheck (Next.js 15, React 19, TypeScript, Tailwind v3, Gemini 2.5 Flash)
**Ziel:** Die App vom kostenlosen Prototyp zu einem rechtssicher betreibbaren, monetarisierten Produkt machen — mit minimaler Reibung für den Kunden.

---

## 1. Geschäftsmodell (entschieden)

- **Einmalzahlung 9,90 €** pro Freischaltung. Kein Abo, kein Login.
- **Kostenlose Teaser-Vorschau** als Köder:
  - Anzahl gefundener Auffälligkeiten
  - Gesamt-Erstattungspotenzial in €
  - Fehler-**Titel** als Liste (ohne Details)
  - Verschwommene **generische** Brief-Layout-Vorschau mit „VORSCHAU"-Wasserzeichen (statisches Mockup, **nicht** der echte personalisierte Brief — der wird erst nach Zahlung generiert; so vermeiden wir einen teuren zweiten Gemini-Call vor der Zahlung und geben keinen nutzbaren Inhalt preis)
- **Nach Zahlung freigeschaltet** (das vollständige Paket):
  1. Detailbericht: alle Fehler mit Beschreibung, Beleg (`evidence`), Rechtsgrundlage, Handlungsempfehlung, €-Potenzial
  2. Widerspruchsbrief als sauberes PDF
  3. Belegeinsicht-Brief (§ 259 BGB) als sauberes PDF

**Marktkontext:** NebenkostenPro (direktester Wettbewerber) fährt dasselbe Modell für 7,90–14,90 €. Mineko (49 €) und Anwaltsdienste (64 €+) arbeiten mit menschlicher Prüfung. 9,90 € positioniert uns als günstigste sofortige KI-Lösung mit Impulskauf-Schwelle.

**Margen-Überschlag:** 9,90 € − ~0,55 € Stripe − Bruchteile Cent Gemini − anteilig KV/Vercel ≈ **9 € Deckungsbeitrag** pro Verkauf.

---

## 2. Kernarchitektur: serverseitige Paywall

**Problem:** Heute liefert `/api/analyze` das vollständige Ergebnis an den Browser. Eine reine Frontend-Sperre wäre über den Netzwerk-Tab trivial umgehbar. Bezahlinhalt **muss serverseitig zurückgehalten** werden.

**Neuer Ablauf:**

1. **Upload** → `/api/analyze` → Gemini liefert volles Ergebnis → Server speichert es unter einer zufälligen ID (`crypto.randomUUID()`) in Vercel KV → schickt dem Browser **nur die Teaser-Daten** + die ID.
2. **„Freischalten"-Klick** → `/api/checkout` erzeugt Stripe-Checkout-Session (Analyse-ID als `metadata` + `client_reference_id`) → Redirect zu Stripe.
3. **Zahlung** → Stripe-Webhook (`checkout.session.completed`) setzt in KV `paid: true` für die ID.
4. **Rückkehr auf Erfolgsseite** → `/api/result?id=…` prüft das `paid`-Flag → gibt bei `true` das volle Ergebnis frei.

**Speicher: Vercel KV (Upstash Redis)** mit **24 h TTL** (Auto-Ablauf).
- Schlank, kostenloser Tarif trägt hunderte Analysen/Tag, Pay-as-you-go bei Wachstum.
- Auto-Löschung nach 24 h ist DSGVO-freundlich und stützt das Datenschutzversprechen.
- ~2–3 Operationen pro Analyse (`set` Ergebnis, `set` paid-Flag via Webhook, `get` beim Abruf).

**KV-Datensatz pro ID:**
```
{
  preview:  { errorCount, totalPotentialEur, errorTitles[], notAStatement },
  full:     <komplettes AnalysisResult>,
  paid:     boolean,
  createdAt: ISO-Timestamp
}
```
Der `full`-Teil wird über `/api/result` **nur** bei `paid === true` herausgegeben.

---

## 3. Skalierung & Robustheit

| Komponente | Maßnahme | Begründung |
|------------|----------|------------|
| **Vercel** | Upgrade **Hobby → Pro (~20 $/Mo), zwingend** | Hobby verbietet kommerzielle Nutzung; Pro bringt höhere Limits, mehr Bandbreite, längere Timeouts |
| **Gemini** | **Cloud Billing aktivieren → Tier 1** (~150–300 RPM) | Free-Tier nur ~10 RPM (Dez. 2025 um 50–80 % gekürzt) → bei Traffic garantierte 429-Fehler. Tier 1 sofort verfügbar, automatisches Hochstufen. Kosten pro Analyse vernachlässigbar |
| **Code** | **Retry mit exponential Backoff** (2–3 Versuche) bei 429/503 | Aktuell gibt die App sofort auf. Backoff fängt transiente Lastspitzen ab, ohne dass der Kunde es merkt |
| **KV** | Kein Engpass; skaliert, Auto-Ablauf | ~2–3 Ops/Analyse |

---

## 4. Zahlung (Stripe)

- **Stripe Checkout** (gehostete Bezahlseite): Gast-Checkout ohne Login, Stripe erfasst E-Mail für Quittung.
- **Zahlarten:** Karte, PayPal, Apple/Google Pay, Klarna — out-of-the-box.
- **PCI-konform:** Kartendaten berühren nie unseren Server.
- **Verifikation fälschungssicher:** Webhook `checkout.session.completed` ist die „Quelle der Wahrheit" und setzt `paid: true` in KV. Die Rückkehr-URL allein wird **nicht** als Zahlungsnachweis akzeptiert.
- **Secrets:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` als Vercel-Env-Variablen (nie committen).

**Neue Routen:**
- `POST /api/checkout` — erstellt Checkout-Session
- `POST /api/stripe-webhook` — verifiziert Signatur, setzt paid-Flag
- `GET /api/result?id=…` — gibt volles Ergebnis bei bezahltem Status frei

---

## 5. PDF-Generierung

**`@react-pdf/renderer`, serverseitig** in einer API-Route.
- Kontrolliertes, professionelles Layout ohne Headless-Browser (Puppeteer auf Vercel bewusst verworfen: schwergewichtig, kaltstart-anfällig).
- Erzeugt: (1) Detailbericht-PDF, (2) Widerspruchsbrief-PDF, (3) Belegeinsicht-Brief-PDF.
- **Teaser-Wasserzeichen:** ein statisches, generisches Brief-Layout-Bild mit „VORSCHAU"-Overlay (kein echter Inhalt) — als Köder im Frontend, ohne Server-Roundtrip.

**Route:** Die bestehende `generate-letter`-Route wird zu `generate-pdf` erweitert: Sie generiert weiterhin den Brieftext (Gemini), rendert ihn aber zusätzlich als PDF und gibt das Paket **nur bei bezahltem Status** (KV-`paid`-Flag) frei. So bleibt es bei **einem** Brief-Generierungspfad statt zwei.

---

## 6. Rechtliche Pflichten (DE)

Ich entwerfe **Roh-Vorlagen** für die Pflichttexte und baue die technische Einbindung. **Alle Rechtstexte müssen vom Betreiber rechtlich geprüft werden — sie sind ohne Gewähr und keine Rechtsberatung.**

| Pflicht | Umsetzung |
|---------|-----------|
| **Impressum** (§ 5 DDG) | Eigene Seite `/impressum`, Footer-Link. Roh-Vorlage mit Platzhaltern (Anschrift, Kontakt, USt-IdNr.) |
| **Datenschutzerklärung** (DSGVO) | Eigene Seite `/datenschutz`. Muss offenlegen: Upload, **Weitergabe an Google Gemini (USA = Drittlandtransfer)**, KV-Speicherung 24 h, Stripe-Zahlungsdaten |
| **AGB + Haftungsausschluss** | Eigene Seite `/agb`. „Automatisiertes Werkzeug, **keine Rechtsberatung**" (schützt vor RDG-Pflicht) |
| **Widerrufsrecht-Erlöschen** | **Geschäftskritisch:** Pflicht-Checkbox **vor** der Zahlung: Kunde stimmt der sofortigen Ausführung zu und bestätigt das Erlöschen seines 14-tägigen Widerrufsrechts mit vollständiger Bereitstellung. Ohne aktivierte Checkbox kein Checkout |
| **Datenschutz-Angabe korrigieren** | Footer/Texte: „Keine Datenspeicherung" → „Automatische Löschung nach 24 Stunden" |

---

## 7. Frontend-Anpassungen

- **`ResultView`** aufteilen in **`PreviewView`** (Teaser) und **`FullResultView`** (nach Zahlung).
- `PreviewView`: Fehleranzahl, €-Potenzial, Titel-Liste, Wasserzeichen-PDF-Vorschau, prominenter „Für 9,90 € freischalten"-CTA + Widerrufs-Checkbox.
- Neue **Erfolgsseite** (z.B. `/ergebnis?id=…`), die nach Stripe-Rückkehr das volle Ergebnis + PDF-Downloads zeigt.
- **Footer** mit Links zu Impressum / Datenschutz / AGB auf allen Seiten.
- Bestehendes Design-System (Dark-Theme, Indigo-Violett-Gradient) durchgängig beibehalten.

---

## 8. Komponenten- & Dateiübersicht (Soll)

| Aktion | Datei | Zweck |
|--------|-------|-------|
| Neu | `src/lib/kv.ts` | KV-Client + Helfer (`storeAnalysis`, `getAnalysis`, `markPaid`) |
| Neu | `src/lib/gemini.ts` | Gemini-Aufruf mit Retry/Backoff (aus `analyze`-Route extrahiert) |
| Ändern | `src/app/api/analyze/route.ts` | Speichert Ergebnis in KV, liefert nur Teaser + ID |
| Neu | `src/app/api/checkout/route.ts` | Stripe-Checkout-Session |
| Neu | `src/app/api/stripe-webhook/route.ts` | Webhook → paid-Flag |
| Neu | `src/app/api/result/route.ts` | Volles Ergebnis bei bezahltem Status |
| Ändern | `src/app/api/generate-letter/route.ts` | Brieftext (Gemini) + PDF-Rendering (react-pdf), Freigabe nur bei bezahltem Status |
| Neu | `src/components/PreviewView.tsx` | Teaser-Ansicht + CTA + Widerrufs-Checkbox |
| Ändern | `src/components/ResultView.tsx` | Wird zur `FullResultView` (nach Zahlung) |
| Neu | `src/app/ergebnis/page.tsx` | Erfolgsseite nach Stripe-Rückkehr |
| Neu | `src/app/impressum`, `/datenschutz`, `/agb` | Rechtsseiten (Roh-Vorlagen) |
| Neu | `src/components/Footer.tsx` | Footer mit Rechtslinks |
| Ändern | `src/app/page.tsx` | Preview/Full-Logik, Footer einbinden, Datenschutz-Text korrigieren |
| Ändern | `src/types/index.ts` | `PreviewData`-Typ, KV-Datensatz-Typ |

**Neue Dependencies:** `stripe`, `@stripe/stripe-js`, `@vercel/kv` (oder `@upstash/redis`), `@react-pdf/renderer`.

---

## 9. Erfolgskriterien

- [ ] Vorschau zeigt Fehleranzahl + €-Potenzial + Titel + Wasserzeichen-PDF; Details/Briefe sind serverseitig gesperrt (nicht im Netzwerk-Tab auslesbar)
- [ ] „Freischalten" → Stripe-Checkout → erfolgreiche Zahlung → volles Ergebnis + PDF-Downloads
- [ ] Zahlung wird ausschließlich über Webhook-`paid`-Flag verifiziert (manipulierte Rückkehr-URL gibt nichts frei)
- [ ] Drei PDFs (Detailbericht, Widerspruch, Belegeinsicht) werden sauber generiert
- [ ] Gemini-Aufruf hat Retry/Backoff; 429/503 führen nicht sofort zum Abbruch
- [ ] KV-Einträge laufen nach 24 h ab
- [ ] Widerrufs-Checkbox ist Pflicht vor Checkout
- [ ] Impressum / Datenschutz / AGB als Roh-Vorlagen erreichbar, im Footer verlinkt, mit Prüf-Hinweis
- [ ] Datenschutz-Angabe auf „Löschung nach 24 h" korrigiert
- [ ] `npm run build` + `npx tsc --noEmit` ohne Fehler

---

## 10. Offene Betreiber-Aufgaben (außerhalb des Codes)

Diese muss der Betreiber selbst erledigen (kein Code):
- Vercel Pro abonnieren
- Gemini Cloud Billing aktivieren
- Stripe-Konto anlegen, Produkte/Keys konfigurieren, Webhook-Endpoint registrieren
- Vercel KV / Upstash-Integration einrichten, Env-Variablen setzen
- Rechtstexte anwaltlich/über Generator prüfen lassen
- Gewerbe/Umsatzsteuer klären (Kleinunternehmerregelung etc.)
