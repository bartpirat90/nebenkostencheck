# Roadmap & Projektstand

**Stand:** 2026-09-28 · Branch `monetarisierung` (auf GitHub, NICHT nach `main` gemergt). Demo voll funktionsfähig & teilbar:
`https://nebenkostencheck-git-monetarisierung-bartpirat-s-projects.vercel.app`

---

## ✅ Erledigt

**Produkt & Monetarisierung**
- Komplette App: Upload → Claude-Analyse → Teaser-Paywall → Stripe-Zahlung (9,90 €) → voller Bericht + PDFs
- Serverseitige Paywall (Vercel KV, 24 h TTL unbezahlt / 7 Tage nach Kauf / 14 Tage bei offener SEPA-Zahlung); Stripe Checkout + Webhook (Zahlungs-Wahrheit)
- PDF-Generierung (Detailbericht, Widerspruch, Belegeinsicht, kombiniertes Schreiben)
- **Mail-Versand:** „Per Mail an Vermieter" (mailto) + „PDF an meine E-Mail" (IONOS-SMTP)
- Lade-Animationen (Analyse + PDF-Erstellung)
- `MOCK_ANALYSIS`-Testmodus (Beispieldaten ohne KI-Kosten)

**Infrastruktur**
- KI: Anthropic Claude · Speicher: Upstash KV · Zahlung: Stripe (Testmodus) · Hosting: Vercel (Preview) · Mail: IONOS
- Domain `nebenkostencheck24.de` mit Vercel verbunden (A-Record, SSL aktiv; Mail/MX intakt)
- Rechtsseiten (Impressum/Datenschutz/AGB) als Entwurf, Geschäftsform Einzelunternehmer/Kleinunternehmer § 19 UStG hinterlegt (Name/Anschrift noch Platzhalter, s. u.)

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

**Blocker-Runde nach Sicherheits-Audit** (2026-09-06, Commits `a0309ae`…`5cb865f`)
- `MOCK_ANALYSIS` in Vercel-Production hart abgeschaltet (`VERCEL_ENV=production`) — kein Paywall-Bypass durch versehentlich gesetztes Flag
- KI-Antwort wird vor dem Speichern validiert/normalisiert (`normalizeAnalysis`), sonst `ANALYSIS_UNUSABLE`
- Vitest-Setup für Unit-Tests unter `src/lib`
- Zahlungs-Nachbesserungen: bezahlte Ergebnisse 7 Tage TTL, offene SEPA-Zahlungen 14 Tage TTL, Stripe-Session-Fallback limitiert pro Analyse-ID (nicht pro IP), 100-%-Gutscheine schalten korrekt frei, Checkout liefert `404` bei verschwundenem und `410` bei knapp ablaufendem Record
- `send-pdf` rendert das PDF serverseitig aus dem gespeicherten Brieftext (kein Mail-Relay für Fremdanhänge), E-Mail-Eingabe ohne Steuerzeichen
- Ergebnisseite: Netzwerkfehler beim Polling führt zu Retry statt Endlos-Laden

**Release-Paket Hoch** (2026-09-06, Commits ab `e7a281e`)
- Security-Header (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) über `next.config.mjs`
- Dependency-Updates: Next.js 15.5, nodemailer 10, next-intl/upstash/react Patches (`npm audit` 0 High)
- Rate-Limits für Brief-Versand, Checkout und Bericht-PDF (zusätzlich zum bestehenden Analyse-Limit)
- Claude-Client: vorausschauendes Retry-Budget + Timeouts, damit ein zweiter Versuch nie über das Vercel-`maxDuration` (60 s) hinausläuft
- Datenschutzerklärung um Vercel/Upstash/IONOS/IP-Schutz ergänzt (6 Sprachen) + Upload-Datenschutzhinweis
- API-Fehlercodes (`{ error, code }`) mit im Client übersetzten Meldungen (6 Sprachen), Server-Text als Fallback
- Stripe-Checkout-Sprache je Locale (Ukrainisch/Arabisch fallen auf Stripes `auto` zurück, da Stripe diese Locales nicht kennt) + Vorschau-Wiederherstellung nach Zahlungsabbruch
- Noto-Sans-Fonts für Brief-/Bericht-PDFs (Latin-Ext + Kyrillisch); Arabisch wird im PDF weiterhin nicht dargestellt (offener Punkt, s. u.)
- Canonical/hreflang je Seite, `/og.png` als eigene Route (kein Redirect), lokalisierte 404-Seite

**Upload-Vorbereitung & Modellwechsel** (2026-09-28, Commits `2fb68db`, `d4a5d18` und folgende)
- **Website:** Quellgrenzen PDF 100 MB / Bild 40 MB. Der Browser rendert Seiten und Fotos exakt auf Claudes Bildgröße (A4 → 924×1307) und hält den Upload so unter 4 MB (gemessen: 38-MB-Farbscan → 2,2 MB)
- **Seitenauswahl** ab 5 Seiten mit Vorschaubildern; leere Seiten (auch durchscheinende Duplex-Rückseiten) sind vorab abgewählt; max. 45 Seiten je Prüfung
- **App:** Fotos werden vor dem Upload verkleinert und als JPEG kodiert (50-MP-Foto 16 MB → 148 KB, EXIF-Drehung korrekt); neue Dependency `expo-image-manipulator`. Löst nebenbei das HEIC-Problem für Fotos
- **Modell: Claude Sonnet 5** statt Sonnet 4.6, mit adaptivem Denken (`effort: medium` für die Prüfung, `low` für Briefe). Gemessen an einer vierseitigen Abrechnung: gleiche Kosten (~9 Cent), Antwort nach ~40 s statt ~30 s. Zeitbudget der Routen auf 120 s angehoben, Token-Gate auf 100.000 (neuer Tokenizer zählt Text 15–30 % höher; in Dollar trotzdem unter der alten Grenze)

---

## ⚠️ Offene Punkte vor dem Launch

- **⛔ Betreiber/Impressum:** Der bisherige Entwickler arbeitet bei Vonovia (Großvermieter) → Interessenkonflikt mit einem Mieter-Tool, kann nicht selbst ins Impressum (Compliance). Anonymes Impressum ist in DE unzulässig. Lösung in Arbeit: Gründung einer LLC als Betreiber; bis dahin nur private Demo, kein öffentlicher kommerzieller Launch. Technisch: `[Name des Betreibers]` ist in Impressum, Datenschutz und AGB noch ein Platzhalter (Texte aktuell als Einzelunternehmer/Kleinunternehmer § 19 UStG formuliert — bei LLC-Betrieb anzupassen); Name/Anschrift werden manuell eingetragen.
- **Upstash-Produktiv-Datenbank:** muss neu angelegt werden (aktueller Host ist nicht erreichbar); danach `KV_REST_API_URL`/`KV_REST_API_TOKEN` in Vercel setzen.
- **Stripe-Test mit 100-%-Gutschein** vor Live-Schaltung einmal end-to-end durchspielen.
- **Muttersprachler-Review** für Türkisch, Arabisch, Russisch, Ukrainisch — aktuell KI-Erstübersetzungen (`_meta.status: "ai-draft"` in `messages/{tr,ar,ru,uk}.json`).
- **404-Seite (lokalisiert):** Die 404 *innerhalb* einer gültigen Sprache (`/en/nixda`) rendert weiterhin erst im Browser — das `notFound()` aus `[locale]/[...rest]` erreicht die Not-Found-Boundary erst nach dem Server-Render, Next liefert dafür seine Fehler-Shell und der 404-Baum steckt nur im Flight-Payload. Ohne JS bleibt die Seite leer; für Suchmaschinen (Status 404 + noindex) unkritisch. Die 404 *außerhalb* gültiger Locales ist seit `global-not-found.tsx` + `dynamicParams = false` serverseitig gerendert und gestylt.
- **Arabisch im PDF:** Noto Sans (Latin-Ext + Kyrillisch) deckt kein Arabisch ab — Briefe/Berichte auf Arabisch fehlen im PDF-Export bislang.

---

## 📱 Native Android-App (Entscheidung getroffen 2026-06-07)

**Entscheidung:** Echte native App mit **React Native + Expo** (Android-first; iOS später). Nicht PWA, nicht Kotlin — RN bietet native Komponenten/Kamera/Push bei React-/TS-Wiederverwendung; für diese App-Art kein für Endnutzer spürbarer Unterschied zu Kotlin. App-Code im Unterordner `mobile/` (reiner Client zum bestehenden Backend, keine Backend-Änderung). Spec/Plan: `docs/superpowers/{specs,plans}/2026-06-07-native-app-meilenstein-1*`.

**Stand 2026-09-28:** Meilenstein 1 (Upload → Teaser) und 2 (Bericht, Briefe, PDF-Teilen) fertig und auf dem Emulator end-to-end geprüft, Details in `docs/MOBILE-APP.md`.

**🔜 Nächster Umbau: höhere Uploadlimits in der App.** Die App ist heute bei PDFs auf 3 MB begrenzt (sie schickt base64-JSON, das die Datei um ein Drittel aufbläht) und nimmt nur ein Foto pro Prüfung an. Fotos werden inzwischen verkleinert; für PDFs und mehrseitige Abrechnungen reicht das nicht. Bausteine:
- **Rohbytes statt base64** hochladen, wie die Website: 3 → 4 MB sofort, der Server nimmt Rohbytes schon an (`readUpload`)
- **PDFs auf dem Gerät aufbereiten** wie im Web (Seitenauswahl, Leerseiten, Rasterung auf Claudes Bildgröße): braucht einen PDF-Renderer, z. B. Androids `PdfRenderer` über ein eigenes Expo-Modul oder pdf.js in einer WebView
- **Mehrere Fotos pro Prüfung**, damit abfotografierte mehrseitige Abrechnungen vollständig geprüft werden; Server und Prompt müssen dafür mehrere Bilder annehmen
- Alternative für sehr große Dateien: **Direkt-Upload in einen Speicher** (z. B. Vercel Blob), umgeht die 4,5-MB-Grenze komplett; kostet eine neue Dependency und Zwischenspeicherung (Datenschutztext)

**Meilenstein 1 — historisch** (damals Branch `mobile-app`, heute Teil von `monetarisierung`):
- Drei Screens: Home → Upload (PDF/Foto-Picker, 3-MB-Größen-Guard) → Ergebnis-Teaser. `tsc` sauber, `jest` 7/7 grün, Code-Review APPROVE.
- Expo **SDK 56**, `src/`-Layout; Dev zeigt auf die MOCK-Preview → Gerätetest kostenlos.
- **Offen:** Test auf echtem Android (Expo Go = null Setup, oder Android-Studio-Emulator), dann Branch-Merge.
- Später (eigene Meilensteine): Bezahlung in der App (**Google Play Billing ~15 %**), voller Bericht/PDF/Mail nativ, Push, iOS, Play-Store-Release.

---

## 💡 Offene Verbesserungen (nicht blockierend)

- **Client-Payload weiter verkleinern:** `legal`/`notFound` sind seit 2026-09-06 aus dem `NextIntlClientProvider` raus (`src/i18n/serverOnly.ts`, ~8 KB pro Seite). Der größere Hebel ist noch offen: `src/app/[locale]/page.tsx` trägt `"use client"` für die ganze Startseite, dadurch wandern auch `faq`, `howItWorks`, `hero`, `meta` usw. (~6 KB) in jedes HTML. Lösung: Upload/Preview-State in eine Client-Insel ziehen und die Startseite als Server-Komponente rendern; zusätzlich den Provider pro Route-Segment scopen, damit die Rechtsseiten (die keine Client-Übersetzungen brauchen) gar keinen Message-Block mehr bekommen (~15 KB je Rechtsseite).
- **Qualitätsvergleich Sonnet 5 an echten Abrechnungen:** Umstellung ist mit synthetischen Dokumenten gemessen (Kosten, Dauer, gültiges JSON). Offen: 3–5 echte, anonymisierte Abrechnungen durch Sonnet 5 laufen lassen und die Befunde fachlich prüfen; bei Bedarf `effort` in `src/lib/claude.ts` anpassen. Der Systemprompt stammt aus Sonnet-4-Zeiten (viele GROSSBUCHSTABEN, „im Zweifel nicht melden“) – Sonnet 5 befolgt Anweisungen wörtlicher, ein Prompt-Audit kann Recall und Kosten verbessern.

---

## 🚀 Roll-Out-Restschritte (nach Klärung des Betreibers)

1. Betreiberdaten (Name/Anschrift) in Rechtstexte eintragen (Platzhalter ersetzen) · Rechtstexte final prüfen lassen → Entwurf-Banner entfernen
2. **Stripe Live** aktivieren · **Vercel Pro** · Anthropic-Guthaben
3. Production-Env-Vars (Live-Keys, `MOCK_ANALYSIS` aus, `NEXT_PUBLIC_BASE_URL` = echte Domain)
4. Stripe-**Live**-Webhook auf `https://nebenkostencheck24.de/api/stripe-webhook`
5. Echte Analyse-Qualität testen (MOCK aus) · Branch `monetarisierung → main` mergen · Live-Mini-Zahlung

*(Details & gelöste Deployment-Stolpersteine: siehe `docs/DIENSTE-UEBERSICHT.md` und Projekt-Memory.)*
