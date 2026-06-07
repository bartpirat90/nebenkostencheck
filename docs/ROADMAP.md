# Roadmap & Projektstand

**Stand:** 2026-06-07 · Branch `monetarisierung` (auf GitHub, NICHT nach `main` gemergt). Demo voll funktionsfähig & teilbar:
`https://nebenkostencheck-git-monetarisierung-bartpirat-s-projects.vercel.app`

---

## ✅ Erledigt

**Produkt & Monetarisierung**
- Komplette App: Upload → Claude-Analyse → Teaser-Paywall → Stripe-Zahlung (9,90 €) → voller Bericht + PDFs
- Serverseitige Paywall (Vercel KV, 24 h TTL); Stripe Checkout + Webhook (Zahlungs-Wahrheit)
- PDF-Generierung (Detailbericht, Widerspruch, Belegeinsicht, kombiniertes Schreiben)
- **Mail-Versand:** „Per Mail an Vermieter" (mailto) + „PDF an meine E-Mail" (IONOS-SMTP)
- Lade-Animationen (Analyse + PDF-Erstellung)
- `MOCK_ANALYSIS`-Testmodus (Beispieldaten ohne KI-Kosten)

**Infrastruktur**
- KI: Anthropic Claude · Speicher: Upstash KV · Zahlung: Stripe (Testmodus) · Hosting: Vercel (Preview) · Mail: IONOS
- Domain `nebenkostencheck24.de` mit Vercel verbunden (A-Record, SSL aktiv; Mail/MX intakt)
- Rechtsseiten (Impressum/Datenschutz/AGB) als Entwurf mit Betreiberdaten, Kleinunternehmer-Hinweis

**Mobile-Optimierung** (2026-05-30)
- Alle Screens in Handy-Größe geprüft (Landing, Teaser, Ergebnis, Brief-Modal, Impressum) — kein Overflow
- Gefixt: Hero-Headline (responsive Größe) + Nav-Badge (auf Mobile ausgeblendet)
- → solides **responsives** Fundament; PWA/Native kann darauf aufsetzen

**Kostenschutz für die Analyse** (2026-06-07)
- 4 Gates vor jedem Claude-Call in `/api/analyze`: MIME → Dateigröße → IP-Rate-Limit → Token-Zählung
- **Rate-Limit:** 10/Stunde + 30/Tag pro IP (Upstash); sitzt hinter MIME/Größe → abgelehnte Uploads zählen nicht
- **Token-Gate:** Anthropics kostenloser `countTokens`, max 80.000 Token → fängt „1000-Seiten-Roman" ab, bevor teure Token fließen
- **Dateigröße:** max 3 MB (Vercel kappt Function-Body bei ~4,5 MB; base64 ×1,33 ⇒ ~3 MB Nutzdatei). Frontend fängt auch Vercels Roh-413 mit deutscher Meldung ab
- Grenzwerte zentral in `src/lib/limits.ts`; MOCK-sicher (Demo bleibt 0 Cent). Spec/Plan unter `docs/superpowers/{specs,plans}/2026-06-07-kostenschutz*`

---

## ⛔ Launch-Blocker

**Betreiber/Impressum:** Der bisherige Entwickler arbeitet bei Vonovia (Großvermieter) → Interessenkonflikt mit einem Mieter-Tool. Kann nicht selbst ins Impressum (Compliance). Anonymes Impressum ist in DE unzulässig.
→ **Lösung in Arbeit: Gründung einer LLC als Betreiber.** Die Seite wird dann dort implementiert/betrieben. Bis dahin nur private Demo, kein öffentlicher kommerzieller Launch.

---

## ⏭️ Nächstes Mal: Entscheidung Mobile-Strategie

**Frage: Port auf Mobil nativ — oder nicht?**

| Option | Aufwand | Vor-/Nachteile |
|--------|---------|----------------|
| **A) Bei Web bleiben + PWA** *(empfohlen)* | gering | Bestehende App installierbar machen (Homescreen-Icon, Vollbild). Kostenlos, kein App-Store, **kein Apple-30%-IAP-Problem**, Code 1:1. |
| **B) Native Store-App** (Capacitor-Wrapper) | hoch | App Store/Play Store. **Aber: Apple verlangt bei digitalen Verkäufen oft In-App-Purchase → 30 % Gebühr**; Developer-Accounts; Store-Review; Pflege zweier Plattformen. Belastet das 9,90-€-Modell. |
| **C) Responsive-only belassen** | keiner | Aktueller Stand. Läuft im Handy-Browser einwandfrei. |

**Empfehlung:** A (PWA) — bestes App-Gefühl ohne Store-Gebühren/IAP-Konflikt. B nur erwägen, wenn Store-Präsenz strategisch wichtig ist (dann Zahlungsmodell-Frage vorher klären).
→ **To-do nächste Session: Diese Entscheidung treffen, dann umsetzen.**

---

## 💡 Offene Verbesserungen (nicht blockierend)

- **Große Uploads (>3 MB) unterstützen:** Vercel kappt Serverless-Function-Bodies bei ~4,5 MB → echte Datei-Obergrenze aktuell ~3 MB. Für Nutzer mit großen mehrseitigen Scans/Fotos: **Direkt-Upload zu Vercel Blob** im Browser (umgeht die Body-Grenze), API bekommt nur die URL und lädt serverseitig. Eigenes Feature (brainstorming → plan), noch nicht gebaut. Bis dahin zeigt das Frontend bei zu großen Dateien eine freundliche deutsche Meldung.

---

## 🚀 Roll-Out-Restschritte (nach LLC-Gründung)

1. Betreiberdaten (LLC) in Rechtstexte · Rechtstexte final prüfen lassen → Entwurf-Banner entfernen
2. **Stripe Live** aktivieren · **Vercel Pro** · Anthropic-Guthaben
3. Production-Env-Vars (Live-Keys, `MOCK_ANALYSIS` aus, `NEXT_PUBLIC_BASE_URL` = echte Domain)
4. Stripe-**Live**-Webhook auf `https://nebenkostencheck24.de/api/stripe-webhook`
5. Echte Analyse-Qualität testen (MOCK aus) · Branch `monetarisierung → main` mergen · Live-Mini-Zahlung

*(Details & gelöste Deployment-Stolpersteine: siehe `docs/DIENSTE-UEBERSICHT.md` und Projekt-Memory.)*
