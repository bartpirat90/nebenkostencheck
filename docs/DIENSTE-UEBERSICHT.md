# Dienste-Übersicht — Nebenkostencheck

**Stand:** 2026-05-30 · Wer macht was, damit die App läuft. (Enthält **keine** Passwörter/Keys — die liegen nur in `.env.local` bzw. in Vercel.)

---

## Auf einen Blick

| # | Dienst | Website | Wofür | Status |
|---|--------|---------|-------|--------|
| 1 | **Anthropic (Claude)** | console.anthropic.com | Die KI-Analyse der Abrechnung | ✅ Konto + Karte + API-Key |
| 2 | **Upstash (Redis/KV)** | upstash.com | Zwischenspeicher für Ergebnisse (24 h) | ✅ Datenbank angelegt |
| 3 | **Stripe** | dashboard.stripe.com | Zahlungsabwicklung (9,90 €) | ✅ Testmodus · ⏳ Live offen |
| 4 | **Stripe CLI** | (lokal installiert) | Webhook-Tests auf dem PC | ✅ installiert (nur Entwicklung) |
| 5 | **IONOS** | ionos.de | Domain + geschäftliche E-Mail | ⏳ Domain registriert, Postfach offen |
| 6 | **Vercel** | vercel.com | Hosting der Website + Auto-Deploy | ⏳ Hobby aktiv, Pro + Config offen |
| 7 | **GitHub** | github.com/bartpirat90/nebenkostencheck | Code-Speicher, löst Deploy aus | ✅ vorhanden |

---

## Details pro Dienst

### 1. Anthropic — die KI
- **Zweck:** Prüft die hochgeladene Abrechnung, erstellt Bericht + Briefe.
- **Liefert:** `ANTHROPIC_API_KEY`
- **Kosten:** Pay-as-you-go, ~14 Cent pro Analyse / ~3 Cent pro Brief (bei 9,90 € Verkauf vernachlässigbar).
- **Status:** Konto erstellt, Karte hinterlegt, API-Key erzeugt. Für Live ggf. Guthaben aufstocken.

### 2. Upstash — der Zwischenspeicher
- **Zweck:** Speichert das volle Analyse-Ergebnis serverseitig unter einer ID (24 h, dann Auto-Löschung). Macht die Paywall sicher.
- **Liefert:** `KV_REST_API_URL`, `KV_REST_API_TOKEN`
- **Kosten:** Kostenloser Tarif reicht locker.
- **Status:** Datenbank „nebenkostencheck" (Region Frankfurt) angelegt.

### 3. Stripe — die Bezahlung
- **Zweck:** Wickelt die 9,90-€-Zahlung ab (Karte, Klarna, Apple/Google Pay …).
- **Liefert:** `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Kosten:** ~0,55 € Gebühr pro Transaktion.
- **Status:** **Testmodus** eingerichtet (Test-Keys). **Offen:** Live-Modus (Geschäftsdaten + Auszahlungskonto hinterlegen), Live-Keys, Live-Webhook registrieren.
- **Merke:** Test- und Live-Modus haben **getrennte** Keys und Einstellungen.

### 4. Stripe CLI — nur zum Testen
- **Zweck:** Leitet Stripe-Ereignisse lokal an `localhost:3000` weiter (`stripe listen`), damit Zahlungen beim lokalen Testen funktionieren.
- **Kosten:** kostenlos. Nur auf deinem PC, nicht in Produktion nötig.
- **Status:** installiert.

### 5. IONOS — Domain & E-Mail
- **Zweck:** Domain **nebenkostencheck24.de** + geschäftliches Postfach **kontakt@nebenkostencheck24.de**.
- **Liefert:** die Domain (später `NEXT_PUBLIC_BASE_URL` + Custom Domain in Vercel) und die E-Mail (steht im Impressum/Datenschutz).
- **Kosten:** ~1 €/Monat Einstieg (Folgepreis nach 12 Monaten beachten).
- **Status:** Domain registriert (provisioniert gerade). **Offen:** E-Mail-Postfach „Mail Basic" anlegen; später DNS-Einträge auf Vercel zeigen lassen.
- **Wichtig:** Paket „E-Mail" gewählt — **kein** Webhosting/Homepage-Baukasten (die Seite läuft auf Vercel).

### 6. Vercel — das Hosting
- **Zweck:** Hostet die Next.js-App; jeder Push auf `main` deployt automatisch.
- **Liefert:** nichts (bekommt die Env-Variablen). Hier werden alle obigen Keys hinterlegt.
- **Kosten:** **Pro ~20 $/Monat zwingend für kommerziellen Betrieb** (Hobby verbietet das).
- **Status:** Hobby-Projekt mit der alten (kostenlosen) Version aktiv. **Offen:** Pro-Upgrade, Env-Variablen setzen, Custom Domain verbinden.

### 7. GitHub — der Code
- **Zweck:** Speichert den Quellcode; Push auf `main` löst den Vercel-Deploy aus.
- **Kosten:** kostenlos.
- **Status:** Repository vorhanden. Aktueller Arbeitsstand liegt im Branch `monetarisierung` (noch nicht gemergt).

---

## Welche Zugangsdaten gehören wohin?

Alle Keys stehen lokal in `.env.local` (gitignored) und müssen später **identisch in Vercel** (Settings → Environment Variables) hinterlegt werden — mit **Live**-Stripe-Keys statt Test:

| Variable | Kommt von | Lokal | In Vercel (Live) |
|----------|-----------|:---:|:---:|
| `ANTHROPIC_API_KEY` | Anthropic | ✅ | ⏳ |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash | ✅ | ⏳ |
| `STRIPE_SECRET_KEY` | Stripe | Test ✅ | Live ⏳ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe | Test ✅ | Live ⏳ |
| `STRIPE_WEBHOOK_SECRET` | Stripe (Webhook) | Test ✅ | Live ⏳ |
| `NEXT_PUBLIC_BASE_URL` | deine Domain | localhost ✅ | https://nebenkostencheck24.de ⏳ |
| `MOCK_ANALYSIS` | — (nur Testschalter) | ✅ true | **weglassen / false** |

---

## Was noch zu tun ist (Reihenfolge)

1. **IONOS:** E-Mail-Postfach `kontakt@nebenkostencheck24.de` anlegen (sobald Domain bereit)
2. **Rechtstexte** prüfen (lassen) → Entwurf-Banner entfernen
3. **Gewerbe/Steuer** klären (Voraussetzung für Stripe Live)
4. **Stripe:** Live-Modus aktivieren (Geschäftsdaten + Auszahlungskonto)
5. **Vercel:** Pro abonnieren, Env-Variablen (Live) setzen, Custom Domain verbinden
6. **Stripe:** Live-Webhook auf `https://nebenkostencheck24.de/api/stripe-webhook` registrieren
7. **Code:** Branch `monetarisierung` → `main` mergen → automatischer Deploy
8. **Live-Test** mit einer echten Mini-Zahlung
