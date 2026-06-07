# Kostenschutz für die Analyse — Design

**Datum:** 2026-06-07
**Status:** Design freigegeben, Implementierung ausstehend

## Problem

Die `/api/analyze`-Route schickt jedes hochgeladene Dokument **ungeprüft und vollständig** an
Claude. Zwei Missbrauchs-/Kostenrisiken:

1. **Übergroße Dokumente:** Ein 1000-seitiger Roman (statt einer Abrechnung) wird komplett an
   Claude gesendet, bevor dessen `notAStatement`-Erkennung greift — die Token sind dann bereits
   verbrannt. Eine normale Abrechnung liegt bei ~31.000 Input-Token; ein Roman kann ein
   Vielfaches kosten.
2. **Kein Rate-Limiting:** Da es keinen Login gibt, kann jeder den kostenlosen Teaser-Check
   beliebig oft hintereinander auslösen und so Token verbrennen, ohne je das PDF zu kaufen.

## Lösung

Eine Kette von Gates **vor** dem teuren Claude-Aufruf in `/api/analyze`, von billig nach präzise.
Serverseitig ist die eigentliche Sicherheitsgrenze; clientseitige Checks dienen nur der UX.

### Gate-Reihenfolge (serverseitig)

1. **Rate-Limit (IP)** — zuerst, am billigsten. Schützt auch die nachgelagerten (kostenlosen)
   Token-Zähl-Calls vor Spam. Bei Überschreitung → `429`.
2. **MIME-Check** — wie bisher: nur PDF und Bilder. Word/sonstiges → `400` mit klarer Meldung
   „Bitte als PDF oder Bild hochladen". (Word bleibt bewusst unsupported — außerhalb dieses Tasks.)
3. **Dateigröße** — base64 dekodiert → Byte-Größe. Über Limit → `413`.
4. **Token-Zählung** — Anthropics kostenloser `messages.countTokens`-Call mit demselben
   Doc-Block + System-Prompt. Über Limit → `422`.
5. **Echte Analyse** — wie bisher.

### Grenzwerte (großzügig — Sicherheitspuffer ~2,5× über dem Normalfall)

| Limit | Wert |
|---|---|
| Max. Dateigröße | 15 MB |
| Max. Input-Token | 80.000 |
| Rate-Limit (Stunde) | 5 pro IP |
| Rate-Limit (Tag) | 15 pro IP |

Seitenzahl-Prüfung wurde bewusst **weggelassen** (YAGNI): Dateigröße + Token-Zählung fangen den
Roman bereits zuverlässig ab; eine eigene PDF-Bibliothek nur für eine schönere Fehlermeldung
lohnt nicht.

## Komponenten

### `src/lib/limits.ts` (neu)
Eine zentrale Stelle für alle Grenzwerte als Konstanten:
```ts
export const MAX_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_INPUT_TOKENS = 80_000;
export const RATE_LIMIT_PER_HOUR = 5;
export const RATE_LIMIT_PER_DAY = 15;
```

### `src/lib/ratelimit.ts` (neu)
- Lazy-Init wie `kv.ts` (Build ohne Env-Vars darf nicht werfen).
- Nutzt `@upstash/ratelimit` auf der vorhandenen Upstash-Redis-Instanz.
- Zwei Sliding-Window-Limiter: stündlich + täglich. Beide werden geprüft; blockt einer, ist die
  Anfrage blockiert.
- `analytics: false` (spart Redis-Writes).
- IP aus `x-forwarded-for` (von Vercel gesetzt), Fallback auf eine Konstante.
- Export z.B. `checkRateLimit(ip: string): Promise<{ success: boolean }>`.

### `src/lib/claude.ts` (geändert)
- Neuer Helfer `countDocumentTokens(base64, mediaType, fileName): Promise<number>` — baut denselben
  Doc-Block wie `analyzeStatement` und ruft `client().messages.countTokens(...)` auf, gibt
  `input_tokens` zurück.
- **MOCK-Modus:** gibt einen kleinen Fixwert (z.B. 1000) zurück, **ohne** echten API-Call — die
  Demo bleibt bei 0 Cent.

### `src/app/api/analyze/route.ts` (geändert)
- Die 4 Gates der Reihe nach vor `analyzeStatement`.
- Alle Fehler als deutsches `{ error }`-JSON mit passendem Statuscode (das Frontend zeigt
  `{error}` bereits korrekt an).
- Fehlermeldungen:
  - `429`: „Zu viele Anfragen. Bitte versuche es später noch einmal."
  - `413`: „Die Datei ist zu groß (max. 15 MB). Bitte lade nur die Nebenkostenabrechnung hoch."
  - `422` (Token): „Das Dokument ist zu umfangreich für die Prüfung. Bitte lade nur die
    Nebenkostenabrechnung hoch."

### `src/app/page.tsx` (geändert)
- Clientseitiger Dateigrößen-Check **vor** dem base64-Upload (gleiches 15-MB-Limit), damit nicht
  erst 15 MB hochgeladen werden. Reine UX — der Server bleibt die echte Grenze.

## MOCK-Modus (Preview/Demo)

- Dateigröße + Rate-Limit laufen weiter (lokal/Redis, gratis, realistisch — 5/h reicht zum
  Vorführen locker).
- Nur die Token-Zählung wird übersprungen (Fixwert), damit die Demo keinen Claude-Call auslöst.

## Abhängigkeiten

- Neu: `@upstash/ratelimit`.
- `@upstash/redis` ist bereits vorhanden.

## Verifikation

Kein Test-Suite im Projekt (wie gehabt) → `tsc --noEmit` + `next build` müssen grün sein. Zusätzlich
manueller Check:
- Gültige Abrechnungs-PDF läuft normal durch.
- Übergroße Datei (>15 MB) → `413`, kein Claude-Call.
- „Roman"-PDF unter 15 MB aber >80k Token → `422` nach der (gratis) Token-Zählung, kein teurer Call.
- Schnelles Dauerfeuer derselben IP → ab dem 6. Versuch/Stunde `429`.
