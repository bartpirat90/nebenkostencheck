# Monetarisierung & Go-Live — Design (Spec)

**Datum:** 2026-05-29
**Projekt:** Nebenkostencheck (Next.js 15, React 19, TypeScript, Tailwind v3, Anthropic Claude)
**Ziel:** Die App vom kostenlosen Prototyp zu einem rechtssicher betreibbaren, monetarisierten Produkt machen — mit minimaler Reibung für den Kunden.

---

## 1. Geschäftsmodell (entschieden)

- **Einmalzahlung 9,90 €** pro Freischaltung. Kein Abo, kein Login.
- **Kostenlose Teaser-Vorschau** als Köder:
  - Anzahl gefundener Auffälligkeiten
  - Gesamt-Erstattungspotenzial in €
  - Fehler-**Titel** als Liste (ohne Details)
  - Verschwommene **generische** Brief-Layout-Vorschau mit „VORSCHAU"-Wasserzeichen (statisches Mockup, **nicht** der echte personalisierte Brief — der wird erst nach Zahlung generiert; so vermeiden wir einen teuren zweiten Claude-Call vor der Zahlung und geben keinen nutzbaren Inhalt preis)
- **Nach Zahlung freigeschaltet** (das vollständige Paket):
  1. Detailbericht: alle Fehler mit Beschreibung, Beleg (`evidence`), Rechtsgrundlage, Handlungsempfehlung, €-Potenzial — immer enthalten
  2. **Widerspruchsbrief** als sauberes PDF — **nur wenn mindestens ein `direct`-Fehler** (sofort angreifbar) vorliegt
  3. **Belegeinsicht-Brief** (§ 259 BGB) als sauberes PDF — **nur wenn mindestens ein `needs_review`-Fehler** vorliegt (Belegeinsicht ist sonst gegenstandslos)

  Das Bezahl-Paket besteht also immer aus dem Detailbericht plus den situativ passenden Briefen. Fehlt eine Kategorie komplett, wird der entsprechende Brief weder generiert noch angeboten.

**Marktkontext:** NebenkostenPro (direktester Wettbewerber) fährt dasselbe Modell für 7,90–14,90 €. Mineko (49 €) und Anwaltsdienste (64 €+) arbeiten mit menschlicher Prüfung. 9,90 € positioniert uns als günstigste sofortige Lösung mit Impulskauf-Schwelle.

**Margen-Überschlag:** 9,90 € − ~0,55 € Stripe − wenige Cent Claude (mit Prompt-Caching) − anteilig KV/Vercel ≈ **~9 € Deckungsbeitrag** pro Verkauf.

---

## 2. Kernarchitektur: serverseitige Paywall

**Problem:** Heute liefert `/api/analyze` das vollständige Ergebnis an den Browser. Eine reine Frontend-Sperre wäre über den Netzwerk-Tab trivial umgehbar. Bezahlinhalt **muss serverseitig zurückgehalten** werden.

**Neuer Ablauf:**

1. **Upload** → `/api/analyze` → Claude liefert volles Ergebnis → Server speichert es unter einer zufälligen ID (`crypto.randomUUID()`) in Vercel KV → schickt dem Browser **nur die Teaser-Daten** + die ID.
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
| **Claude (Anthropic)** | **Bezahltes Konto in der Anthropic Console**; Rate-Limit-Tier steigt automatisch mit Verbrauch | Standard-Tier reicht für den Start. **Prompt-Caching** für den langen System-Prompt senkt Kosten und Latenz deutlich. Kosten pro Analyse (wenige Cent) bei 9,90 €/Verkauf vernachlässigbar |
| **Code** | **Retry mit exponential Backoff** (2–3 Versuche) bei 429/529/Überlast | Aktuell gibt die App sofort auf. Backoff fängt transiente Lastspitzen ab, ohne dass der Kunde es merkt |
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

**Test-Zugang ohne echte Zahlung** (für eigene Funktionsprüfung + Freunde):
- **Stripe-Testmodus:** Mit Test-Schlüsseln durchläuft man den kompletten Flow mit Test-Karte (`4242 4242 4242 4242`) — kein echtes Geld. Für die eigene Entwicklung/Verifikation.
- **100 %-Gutscheincode** (z.B. `FREUNDE`): in Stripe als Coupon hinterlegt, im Checkout aktivierbar (`allow_promotion_codes: true`). Tester zahlen 0 €, durchlaufen aber den **realen** Flow inkl. Webhook + Freischaltung. Bevorzugter Weg für Freunde im Live-Betrieb — kein Code-Bypass, kein Sicherheitsleck.
- Ein geheimer Bypass-Link wird **bewusst nicht** gebaut (zusätzliche Angriffsfläche auf die Paywall); der Gutscheincode deckt den Bedarf sauberer ab.

---

## 5. PDF-Generierung

**`@react-pdf/renderer`, serverseitig** in einer API-Route.
- Kontrolliertes, professionelles Layout ohne Headless-Browser (Puppeteer auf Vercel bewusst verworfen: schwergewichtig, kaltstart-anfällig).
- Erzeugt: (1) Detailbericht-PDF (immer), (2) Widerspruchsbrief-PDF (nur bei `direct`-Fehlern), (3) Belegeinsicht-Brief-PDF (nur bei `needs_review`-Fehlern).
- **Teaser-Wasserzeichen:** ein statisches, generisches Brief-Layout-Bild mit „VORSCHAU"-Overlay (kein echter Inhalt) — als Köder im Frontend, ohne Server-Roundtrip.

**Route:** Die bestehende `generate-letter`-Route wird zu `generate-pdf` erweitert: Sie generiert weiterhin den Brieftext (Claude), rendert ihn aber zusätzlich als PDF und gibt das Paket **nur bei bezahltem Status** (KV-`paid`-Flag) frei. So bleibt es bei **einem** Brief-Generierungspfad statt zwei.

---

## 6. Rechtliche Pflichten (DE)

Ich entwerfe **Roh-Vorlagen** für die Pflichttexte und baue die technische Einbindung. **Alle Rechtstexte müssen vom Betreiber rechtlich geprüft werden — sie sind ohne Gewähr und keine Rechtsberatung.**

| Pflicht | Umsetzung |
|---------|-----------|
| **Impressum** (§ 5 DDG) | Eigene Seite `/impressum`, Footer-Link. Roh-Vorlage mit Platzhaltern (Anschrift, Kontakt, USt-IdNr.) |
| **Datenschutzerklärung** (DSGVO) | Eigene Seite `/datenschutz`. Muss offenlegen: Upload, **Weitergabe an Anthropic (Claude, USA = Drittlandtransfer)**, KV-Speicherung 24 h, Stripe-Zahlungsdaten |
| **AGB + Haftungsausschluss** | Eigene Seite `/agb`. „Automatisiertes Werkzeug, **keine Rechtsberatung**" (schützt vor RDG-Pflicht) |
| **Widerrufsrecht-Erlöschen** | **Geschäftskritisch:** Pflicht-Checkbox **vor** der Zahlung: Kunde stimmt der sofortigen Ausführung zu und bestätigt das Erlöschen seines 14-tägigen Widerrufsrechts mit vollständiger Bereitstellung. Ohne aktivierte Checkbox kein Checkout |
| **Datenschutz-Angabe korrigieren** | Footer/Texte: „Keine Datenspeicherung" → „Automatische Löschung nach 24 Stunden" |

---

## 7. Branding & Tonalität

**Logo:** Schutzschild mit Häkchen als Bildzeichen + Wortmarke „Nebenkostencheck", im bestehenden Indigo-Violett-Gradient. Ersetzt das aktuelle „NK"-Badge in der Navigation. Als eigene SVG-Komponente (`src/components/Logo.tsx`), damit es überall (Nav, Footer, evtl. PDF-Briefkopf) wiederverwendbar ist.

**Wording — „KI" aus dem sichtbaren Marketing entfernen.** Viele Nutzer sind skeptisch, sobald sie „KI" lesen. Wir formulieren ergebnis- und rechtsbezogen statt technologiebezogen:

| Stelle | Alt | Neu (Richtung) |
|--------|-----|----------------|
| `layout.tsx` Titel/Description | „KI-gestützte Abrechnungsprüfung", „Unsere KI prüft…" | „Nebenkostenabrechnung prüfen & Geld zurückholen", „…wird in Sekunden auf typische Fehler geprüft" |
| `LandingHero` | „unsere KI prüft sie in Sekunden" | „…wird in Sekunden auf typische Fehler geprüft – nach BetrKV, HeizkV und aktueller Rechtsprechung" |
| `HowItWorks` Schritt 2 | „KI analysiert in Sekunden" | „Automatische Prüfung in Sekunden" |
| `UploadZone` Ladezustand | „KI analysiert deine Abrechnung…" | „Deine Abrechnung wird geprüft…" |

Grundsatz: ehrlich bleiben (kein Vortäuschen menschlicher Prüfung), aber den Fokus auf **Rechtsgrundlage, Geschwindigkeit und Ergebnis** legen.

**Vertrauens-Claim — prominent platzieren** (z.B. im Hero und/oder als Badge):

> „Geprüft nach aktuellem Mietrecht (BetrKV, HeizkV) und höchstrichterlicher BGH-Rechtsprechung."

Bewusst **kein** absoluter Claim wie „immer aktuellste Rechtsprechung" — eine solche Tatsachenbehauptung wäre als irreführende Werbung (UWG) abmahnfähig und technisch nicht haltbar (jedes Sprachmodell hat einen Wissensstichtag; Aktualität entsteht durch gepflegte Prüfregeln, nicht durch das Modell selbst). Die gewählte Formulierung ist konkret, kompetent und haltbar.

**Wichtig — Transparenzpflicht bleibt:** In der **Datenschutzerklärung** wird die Verarbeitung durch **Anthropic (Claude)** vollständig offengelegt. Die Wording-Entschärfung betrifft ausschließlich das Marketing, nicht die rechtliche Transparenz.

**Claims an das neue Modell anpassen** (heute irreführend):
- StatsBar „100 % Kostenlos" → z.B. „Vorschau kostenlos" oder durch eine andere Kennzahl ersetzen.
- LandingHero-Badge „Datei wird nicht gespeichert" → „Automatische Löschung nach 24 h".

---

## 8. Frontend-Anpassungen

- **`ResultView`** aufteilen in **`PreviewView`** (Teaser) und **`FullResultView`** (nach Zahlung).
- `PreviewView`: Fehleranzahl, €-Potenzial, Titel-Liste, Wasserzeichen-PDF-Vorschau, prominenter „Für 9,90 € freischalten"-CTA + Widerrufs-Checkbox.
- Neue **Erfolgsseite** (z.B. `/ergebnis?id=…`), die nach Stripe-Rückkehr das volle Ergebnis + PDF-Downloads zeigt.
- **Footer** mit Logo + Links zu Impressum / Datenschutz / AGB auf allen Seiten.
- Bestehendes Design-System (Dark-Theme, Indigo-Violett-Gradient) durchgängig beibehalten.

---

## 9. Komponenten- & Dateiübersicht (Soll)

| Aktion | Datei | Zweck |
|--------|-------|-------|
| Neu | `src/lib/kv.ts` | KV-Client + Helfer (`storeAnalysis`, `getAnalysis`, `markPaid`) |
| Neu | `src/lib/claude.ts` | Anthropic-Aufruf mit Retry/Backoff + Prompt-Caching (ersetzt Gemini-SDK) |
| Ändern | `src/app/api/analyze/route.ts` | Nutzt Claude (statt Gemini), speichert Ergebnis in KV, liefert nur Teaser + ID |
| Neu | `src/app/api/checkout/route.ts` | Stripe-Checkout-Session |
| Neu | `src/app/api/stripe-webhook/route.ts` | Webhook → paid-Flag |
| Neu | `src/app/api/result/route.ts` | Volles Ergebnis bei bezahltem Status |
| Ändern | `src/app/api/generate-letter/route.ts` | Brieftext (Claude) + PDF-Rendering (react-pdf), Freigabe nur bei bezahltem Status |
| Neu | `src/components/PreviewView.tsx` | Teaser-Ansicht + CTA + Widerrufs-Checkbox |
| Ändern | `src/components/ResultView.tsx` | Wird zur `FullResultView` (nach Zahlung) |
| Neu | `src/app/ergebnis/page.tsx` | Erfolgsseite nach Stripe-Rückkehr |
| Neu | `src/app/impressum`, `/datenschutz`, `/agb` | Rechtsseiten (Roh-Vorlagen) |
| Neu | `src/components/Footer.tsx` | Footer mit Logo + Rechtslinks |
| Neu | `src/components/Logo.tsx` | Schutzschild-Häkchen-SVG + Wortmarke, wiederverwendbar |
| Ändern | `src/app/page.tsx` | Preview/Full-Logik, Footer einbinden, Logo in Nav, Datenschutz-Text korrigieren |
| Ändern | `src/app/layout.tsx` | Titel/Description ohne „KI" |
| Ändern | `src/components/LandingHero.tsx` | Wording ohne „KI", Badge-Claim „Löschung nach 24 h" |
| Ändern | `src/components/HowItWorks.tsx` | Schritt-2-Wording ohne „KI" |
| Ändern | `src/components/StatsBar.tsx` | Claim „100 % Kostenlos" anpassen |
| Ändern | `src/components/UploadZone.tsx` | Ladezustand-Text ohne „KI" |
| Ändern | `src/components/LandingHero.tsx` o.ä. | Rechts-Claim prominent platzieren (siehe Abschnitt 7) |
| Ändern | `src/types/index.ts` | `PreviewData`-Typ, KV-Datensatz-Typ |

**Neue Dependencies:** `@anthropic-ai/sdk` (ersetzt `@google/generative-ai`), `stripe`, `@stripe/stripe-js`, `@vercel/kv` (oder `@upstash/redis`), `@react-pdf/renderer`.

---

## 10. Erfolgskriterien

- [ ] Vorschau zeigt Fehleranzahl + €-Potenzial + Titel + Wasserzeichen-PDF; Details/Briefe sind serverseitig gesperrt (nicht im Netzwerk-Tab auslesbar)
- [ ] „Freischalten" → Stripe-Checkout → erfolgreiche Zahlung → volles Ergebnis + PDF-Downloads
- [ ] Zahlung wird ausschließlich über Webhook-`paid`-Flag verifiziert (manipulierte Rückkehr-URL gibt nichts frei)
- [ ] Detailbericht-PDF immer; Widerspruchs-PDF nur bei `direct`-Fehlern; Belegeinsicht-PDF nur bei `needs_review`-Fehlern
- [ ] Logo (Schutzschild + Häkchen) in Nav und Footer; eigene `Logo`-Komponente
- [ ] Kein „KI" mehr im sichtbaren Marketing; Datenschutz legt Anthropic-Claude-Verarbeitung dennoch offen
- [ ] Rechts-Claim „Geprüft nach aktuellem Mietrecht (BetrKV, HeizkV) und höchstrichterlicher BGH-Rechtsprechung" prominent platziert
- [ ] Irreführende Claims korrigiert („100 % Kostenlos", „Datei wird nicht gespeichert")
- [ ] Analyse läuft über Claude (Anthropic) mit Retry/Backoff + Prompt-Caching; 429/529 führen nicht sofort zum Abbruch
- [ ] Test-Zugang funktioniert: Stripe-Testmodus + 100 %-Gutscheincode schalten ohne echte Zahlung frei
- [ ] KV-Einträge laufen nach 24 h ab
- [ ] Widerrufs-Checkbox ist Pflicht vor Checkout
- [ ] Impressum / Datenschutz / AGB als Roh-Vorlagen erreichbar, im Footer verlinkt, mit Prüf-Hinweis
- [ ] Datenschutz-Angabe auf „Löschung nach 24 h" korrigiert
- [ ] `npm run build` + `npx tsc --noEmit` ohne Fehler

---

## 11. Offene Betreiber-Aufgaben (außerhalb des Codes)

Diese muss der Betreiber selbst erledigen (kein Code):
- Vercel Pro abonnieren
- Anthropic-Konto anlegen, bezahltes API-Guthaben einrichten, `ANTHROPIC_API_KEY` setzen (ersetzt `GEMINI_API_KEY`)
- Stripe-Konto anlegen, Produkte/Keys konfigurieren, Webhook-Endpoint registrieren, 100 %-Gutscheincode für Tester anlegen
- Vercel KV / Upstash-Integration einrichten, Env-Variablen setzen
- Rechtstexte anwaltlich/über Generator prüfen lassen
- Gewerbe/Umsatzsteuer klären (Kleinunternehmerregelung etc.)
