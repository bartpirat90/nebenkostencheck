# Native Android-App — Meilenstein 2: Voller Bericht + Briefe (Design)

**Datum:** 2026-06-08
**Status:** Entwurf zur Freigabe
**Vorgänger:** `docs/superpowers/specs/2026-06-07-native-app-meilenstein-1-design.md` (M1: Home → Upload → Teaser, abgeschlossen & verifiziert)
**Code:** App in `mobile/`, Backend (geteilt) am Repo-Root.

---

## 1. Ziel & Kontext

Die App (Expo SDK 56) zeigt nach dem kostenlosen **Teaser** (M1) den **vollständigen
Prüfbericht** und erzeugt daraus **Schreiben** (Widerspruch / Belegeinsicht /
kombiniert) als teilbares PDF — als native Screens.

**Projektkontext:** Der öffentliche Launch (Web wie App) ist weiterhin durch die
offene Betreiber-/LLC-Frage blockiert. M2 nutzt diese Wartezeit, um die App
inhaltlich **vollständig und vorzeigbar** zu machen und gleichzeitig die echte
Daten-Pipeline (Analyse → `id` → Bericht → Brief) zu bauen, vor die später nur noch
die Bezahlung gesetzt werden muss.

**Nicht-Ziele (YAGNI, spätere Meilensteine):**
- Echte Bezahlung (Google Play Billing) — eigener Meilenstein, hängt am Play-Console-/Betreiber-Konto.
- „PDF an meine E-Mail" per Server-SMTP (wird durch das native Teilen-Sheet abgedeckt).
- Push-Benachrichtigungen, iOS, Play-Store-Veröffentlichung.

---

## 2. Ausgangslage (bestehendes Backend)

Alle Pfade existieren bereits und sind unverändert in Betrieb:

- `POST /api/analyze` → speichert bei echter Abrechnung den vollen `AnalysisResult`
  in Vercel KV unter einer `id` und gibt nur den Teaser (`PreviewData`, **inkl. `id`**)
  zurück. Im MOCK-Modus liefert die Analyse fixe Beispieldaten (0 Cent).
- `GET /api/result?id=` → voller `AnalysisResult` **nur wenn `record.paid`** (sonst 402).
- `POST /api/generate-letter {id,type,contact}` → erzeugt Brieftext (im MOCK fix,
  0 Cent) + gerendertes PDF, gibt `{letter, pdfBase64, filename}` zurück. **Nur wenn `paid`.**
- `GET /api/generate-report?id=` → Bericht-PDF (Bytes, `application/pdf`). **Nur wenn `paid`.**

Die App hat aus M1 bereits die `id` im Teaser (`PreviewData.id`).

**Datenmodelle** (aus `src/types/index.ts`, in die App zu spiegeln):
`AnalysisResult { notAStatement?, summary, errors: ErrorItem[], totalPotentialEur?,
totalPotentialLabel?, directPotentialEur?, reviewPotentialEur?, contactData? }`,
`ErrorItem { title, description, confidence, category, potentialEur?, legalBasis?,
actionText?, evidence? }`, `Confidence = "sicher"|"wahrscheinlich"|"unsicher"`,
`ErrorCategory = "direct"|"needs_review"`, `ContactData { tenantName?, tenantAddress?,
landlordName?, landlordAddress?, contractNumber?, billingPeriod? }`,
`LetterType = "objection"|"document_review"|"combined"`,
`LetterPdfResponse { letter, pdfBase64, filename }`.

---

## 3. Architektur & Datenfluss

```
Teaser (app/result.tsx) — hat PreviewData inkl. id
   │  CTA „Vollständigen Bericht anzeigen"  (Demo: statt Bezahlung; später Paywall davor)
   ▼
Bericht (app/report.tsx)  ── GET {API}/api/result?id ──►  AnalysisResult
   │   Summary-Card · Sektion A „Sofort angreifbar" · Sektion B „Belegeinsicht"
   │   · Farblegende · Rechtshinweis
   │   Aktionen: Widerspruch | Belegeinsicht | Kombiniert | (optional) Bericht als PDF teilen
   ▼
Brief (app/letter.tsx)  ── ContactForm ──►  POST /api/generate-letter {id,type,contact}
   ◄── {letter, pdfBase64, filename} ──  Brieftext-Vorschau + „Als PDF teilen" (System-Sheet)
```

- Die App bleibt **reiner Client**; die einzige Backend-Anpassung ist eine
  prod-sichere, MOCK-begrenzte Lockerung der Bezahlschranke (Abschnitt 4).
- Daten werden **per `id`** vom Backend geholt (nicht im Teaser durchgereicht) — das
  ist der echte, später bezahl-gegatete Pfad.

---

## 4. Backend-Änderung (MOCK-only, produktionssicher)

Einzige Backend-Anpassung. In den drei lesenden/erzeugenden Routen wird die
`paid`-Prüfung durch eine Freigabe-Bedingung ersetzt, die im Echtbetrieb identisch
bleibt:

```ts
const MOCK = process.env.MOCK_ANALYSIS === "true";
const isUnlocked = (record: StoredAnalysis) => record.paid || MOCK;
```

- Betrifft: `GET /api/result`, `POST /api/generate-letter`, `GET /api/generate-report`.
- **Produktion (MOCK aus): unverändert voll gesperrt** — kein Bezahl-Bypass, keine
  Auswirkung auf den Echtbetrieb oder die Zahlungs-/KV-Logik.
- Im Demo-/Preview-Deployment (`MOCK_ANALYSIS=true`) ist der volle Pfad ohne Zahlung
  nutzbar → App end-to-end testbar, 0 Cent.
- Klar kommentiert: „Demo-Freigabe nur im MOCK-Modus; Produktion verlangt Bezahlung."
- Verifikation: Web-`tsc` + `build` müssen grün bleiben; Web-Verhalten in Produktion
  unverändert (manuell: ohne MOCK weiterhin 402).

---

## 5. Neue App-Bausteine (`mobile/src/`)

| Datei | Zweck |
|---|---|
| `types.ts` (erweitern) | `AnalysisResult`, `ErrorItem`, `Confidence`, `ErrorCategory`, `ContactData`, `LetterType`, `LetterPdfResponse` — 1:1 aus dem Web gespiegelt. |
| `api/report.ts` | `fetchReport(id): Promise<Result<AnalysisResult>>`, `generateLetter(id, type, contact): Promise<Result<LetterPdfResponse>>`, `fetchReportPdf(id): Promise<Result<{base64, filename}>>`. Deutsche Netzwerk-/Server-Fehlertexte. (TDD) |
| `lib/pdf.ts` | `savePdfAndShare(base64, filename): Promise<void>` — base64 in Cache-Datei schreiben (`expo-file-system`), dann `Sharing.shareAsync(uri)`. Fängt „Teilen nicht verfügbar" ab. (TDD mit gemockten Modulen) |
| `components/ErrorCard.tsx` | Eine Fehlerkarte: Confidence-Punkt + -Farbe, Titel, Confidence-Label, `~€`, Beschreibung, Rechtsgrundlage, Beleg (kursiv), Empfehlung. |
| `components/ContactForm.tsx` | Editierbare, vorbefüllte Felder: Mieter Name+Adresse, Vermieter Name+Adresse, Vertragsnr., Zeitraum. Controlled über `contact`/`onChange`. |
| `app/report.tsx` | Bericht-Screen: Summary-Card (Gesamtpotenzial + Direct/Review-Split + Summary), Sektion A/B mit `ErrorCard`-Listen, Brief-CTAs, optional „Bericht als PDF teilen", Farblegende, Rechtshinweis, „Neue Abrechnung prüfen". Lädt `fetchReport(id)` beim Mount (Lade-/Fehlerzustand). |
| `app/letter.tsx` | Brief-Screen: `ContactForm` → „PDF erstellen" → Lade-Animation → Brieftext-Vorschau + „Als PDF teilen". Params: `id`, `type`. Kontakt vorbefüllt aus den übergebenen Bericht-Daten. |
| `theme.ts` (erweitern) | Confidence-Farbsätze (Hintergrund/Border/Text/Punkt) für `sicher`/`wahrscheinlich`/`unsicher`, abgeleitet aus den bestehenden `green/yellow/red`. |

Wiederverwendet aus M1: `Icon.tsx`, `LoadingIndicator.tsx`, `theme.ts`, `config.ts`,
`api/analyze.ts`-Muster (Result-Typ, Fehler-Mapping).

---

## 6. Navigation

Stack (Expo Router) erweitert: `index → upload → result → report → letter`.

- `app/_layout.tsx`: Screens `report` und `letter` registrieren (Dark-Theme,
  Titel „Prüfbericht" bzw. „Schreiben erstellen").
- `app/result.tsx`: Die Paywall-Platzhalter-Karte wird zur Aktion
  **„Vollständigen Bericht anzeigen"** → `router.push({ pathname: "/report", params: { id } })`.
  Code-Kommentar: *Hier kommt später die Bezahlung dazwischen (Google Play Billing).*
- `report.tsx` → Brief-CTAs: `router.push({ pathname: "/letter", params: { id, type, contact: JSON.stringify(contactData) } })`.

---

## 7. Brief-Auslieferung (natives Teilen)

- Nach erfolgreicher Generierung zeigt `letter.tsx` den **Brieftext** (scrollbare
  Vorschau) und einen primären Button **„Als PDF teilen / speichern"**.
- `savePdfAndShare(pdfBase64, filename)` schreibt das PDF in eine Cache-Datei und
  öffnet das **System-Teilen-Sheet** (`expo-sharing`). Damit deckt der Nutzer Mail an
  den Vermieter, Drucken, „in Dateien speichern", Messenger usw. in einem ab.
- Optional analog im Bericht-Screen: **„Bericht als PDF teilen"** → `fetchReportPdf(id)`
  (binäre Antwort → base64) → `savePdfAndShare`.

---

## 8. Fehlerbehandlung

- `fetchReport`: Netzwerkfehler / 404 (abgelaufen) → deutsche Meldung + „Zurück".
  402 (sollte im MOCK nie auftreten) defensiv mit Hinweis behandelt.
- `generateLetter`: Fehler → deutsche Meldung, erneuter Versuch möglich;
  Lade-Animation während der Generierung (wie M1 `LoadingIndicator`).
- `savePdfAndShare`: Teilen nicht verfügbar / Schreibfehler → deutsche Meldung.
- Grundsatz wie M1: niemals roher Fehler/Absturz, immer freundlicher deutscher Text.

---

## 9. Tests

- **TDD (pure Logik):**
  - `api/report.ts` — gemocktes `fetch`: Erfolgs- und Fehlerpfade (Netzwerk, Nicht-OK-Status, ungültiges JSON) für `fetchReport` und `generateLetter`.
  - `lib/pdf.ts` — gemockte `expo-file-system`/`expo-sharing`: Datei wird geschrieben, `shareAsync` aufgerufen; „nicht verfügbar"-Pfad.
- **Visuell (Emulator):** Bericht-Screen (Summary, Sektion A/B, Karten, Legende),
  Brief-Flow (Formular → Erstellen → Teilen-Sheet). End-to-end im echten Dev-Build
  (`expo run:android`), MOCK an → 0 Cent.
- `npx tsc --noEmit` grün; bestehende Jest-Tests bleiben grün.

---

## 10. Abhängigkeiten

- **Neu:** `expo-sharing` (via `npx expo install expo-sharing`, SDK-56-kompatibel).
- Vorhanden: `expo-file-system` (neue `File`-API), `react-native-svg`, Expo Router.
- Vor Codeänderungen die versionierten Docs prüfen (`mobile/AGENTS.md`,
  https://docs.expo.dev/versions/v56.0.0/).

---

## 11. Abgrenzung & Risiken

- **Backend-Prinzip „reiner Client":** M2 macht **eine** bewusste, minimale Ausnahme
  (MOCK-only Freigabe). Risiko für Produktion = null (Gate bleibt aktiv, wenn MOCK
  aus). Wird im Code und in der Doku als Demo-Mechanismus markiert.
- **Bezahl-Naht:** Der Übergang Teaser → Bericht ist die spätere Paywall-Stelle;
  bewusst als ein klar markierter `router.push` isoliert, damit Billing später ohne
  Umbau davorgesetzt werden kann.
- **PDF-Größe/Teilen:** Cache-Datei wird nach dem Teilen vom System verwaltet; keine
  dauerhafte Ablage nötig.

---

## 12. Definition of Done

1. Backend: MOCK-only Freigabe in `result`/`generate-letter`/`generate-report`; Web
   `tsc`+`build` grün; Produktion (ohne MOCK) weiterhin 402.
2. App: Bericht-Screen rendert vollen `AnalysisResult` (Summary, Sektionen, Karten,
   Legende, Disclaimer).
3. App: Brief-Flow erzeugt PDF und teilt es über das System-Sheet; Kontaktformular
   editierbar & vorbefüllt.
4. Optional: Bericht-als-PDF teilbar.
5. TDD-Module grün, `tsc` grün, end-to-end auf dem Emulator (MOCK, 0 Cent) verifiziert.
6. Doku (`docs/MOBILE-APP.md`) + Memory aktualisiert; auf `monetarisierung` gepusht.
