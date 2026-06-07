# Native Android-App — Meilenstein 1 (Design)

**Datum:** 2026-06-07
**Status:** Freigegeben (Brainstorming abgeschlossen)
**Technologie-Entscheidung:** React Native + Expo (TypeScript)

---

## Kontext & Ziel

Die bestehende Web-App (Next.js 15, deployed auf Vercel) soll eine **echte native
Android-App** bekommen. Begründung des Betreibers: Kamera-/Scan-Erlebnis,
Glaubwürdigkeit/Vertrauen, natives Gefühl/Performance und der Eigenanspruch einer
echten App. Langfristig ist denkbar, den Hauptkanal vom Web zur App zu verlagern
(gesteuert nach Nutzerverhalten).

**Technologie-Wahl:** React Native + Expo. RN rendert echte native Android-
Komponenten (kein WebView), erfüllt damit alle vier Treiber, erlaubt
Wiederverwendung des React-/TypeScript-Wissens und der bestehenden API-Verträge,
ist Android-first (iOS später nahezu geschenkt) und hat den besten Dev-Loop auf
Windows. Für diese Art App (Upload → Analyse → Ergebnis → PDF) gibt es **keinen
für den Endnutzer wahrnehmbaren Unterschied** zu Kotlin/Compose.

**Android-first.** Apple/iOS ist bewusst zunächst ausgeklammert.

---

## Architektur & Repo-Layout

- Neue Expo-App (React Native, TypeScript) im **Unterordner `mobile/`** des
  bestehenden Repos (`E:\Neko-Check\nebenkostencheck\nebenkostencheck`).
- Eigenes `package.json`, vollständig **unabhängig** von der Next.js-App. Keine
  Monorepo-Tooling nötig (zwei getrennte Projekte im selben Git-Repo).
- **Vercel ignoriert `mobile/`**: Der Vercel-Build läuft am Web-Root (`next build`)
  und fasst den Unterordner nicht an. Kein Risiko fürs bestehende Deployment.
- Die App ist ein **reiner Client** zum bestehenden Vercel-Backend. Für
  Meilenstein 1 sind **keine Backend-Änderungen** nötig — `/api/analyze` liefert
  bereits exakt die benötigten Teaser-Daten.

### API-Basis-URL (konfigurierbar)

- Konfiguration über `app.config.ts` / `.env` (Expo `extra` bzw.
  `EXPO_PUBLIC_*`-Variablen).
- **Dev:** zeigt auf die **Preview-URL mit `MOCK_ANALYSIS=true`**
  (`https://nebenkostencheck-git-monetarisierung-bartpirat-s-projects.vercel.app`).
  → Testen kostet **0 Cent** (kein Claude-Call), der echte Flow inkl. Gates 1–3 +
  IP-Rate-Limit läuft trotzdem.
- **Prod (später):** `https://nebenkostencheck24.de`.
- **Kein CORS-Thema:** native `fetch` unterliegt nicht der Browser-Origin-Prüfung.

---

## Umfang Meilenstein 1 — drei Screens

1. **Home / Landing**
   - Branding: Logo (Schutzschild + Häkchen), Nutzenversprechen, Primär-CTA
     „Abrechnung prüfen".

2. **Upload**
   - PDF **oder Foto** wählen: `expo-document-picker` (PDF) +
     `expo-image-picker` (Galerie/Kamera).
   - Auswahl anzeigen (Dateiname/Vorschau), client-seitige **Größenprüfung
     (3 MB)** analog Web, bevor gesendet wird.
   - „Prüfen"-Button mit **nativer Lade-Animation** (Analyse-Schritt).

3. **Ergebnis (Teaser)**
   - Anzeige der `PreviewData`: Fehleranzahl, €-Potenzial (Wert + Label),
     Titel-Liste der Fehler, Wasserzeichen-Mockup.
   - CTA „Vollständigen Bericht freischalten" als **Platzhalter** (Bezahlung =
     späterer Meilenstein).
   - `notAStatement === true` → freundlicher Hinweis (kein Fehler), analog Web.

---

## Datenfluss

```
Datei wählen → base64-Kodierung → POST <base>/api/analyze
   { base64, mediaType, fileName }
        → 200: PreviewData  → Teaser-Screen rendern
        → notAStatement     → Hinweis-Screen
        → 400/413/422/429/500: { error } → deutsche Server-Meldung anzeigen
        → Netzwerkfehler    → eigene deutsche Meldung
```

**API-Vertrag (bestehend, unverändert):**

```ts
// Request
{ base64: string; mediaType: string; fileName: string }

// Response 200 (PreviewData)
{
  id: string;
  notAStatement?: boolean;
  errorCount: number;
  totalPotentialEur?: number | null;
  totalPotentialLabel?: string | null;
  errorTitles: string[];
  hasDirect: boolean;
  hasReview: boolean;
}

// Response Fehler
{ error: string }   // Status 400 | 413 | 422 | 429 | 500
```

Der `id`-Wert wird für den späteren Bezahl-/Ergebnis-Abruf (`/api/result`)
gebraucht — in Meilenstein 1 nur entgegennehmen und vorhalten.

---

## Design-System (Übernahme aus Web)

Zentrale Theme-Konstanten in der App (eine Theme-Datei), gespiegelt aus dem Web:

| Rolle | Wert |
|-------|------|
| Hintergrund | `#0F172A` |
| Cards | `#1E293B` |
| Borders | `#334155` |
| Primärtext | `#F1F5F9` |
| Sekundärtext | `#94A3B8` |
| Accent-Gradient | `#6366F1 → #8B5CF6` |
| Confidence | sicher = grün, wahrscheinlich = gelb, unsicher = rot |

Styling über React Native `StyleSheet` + Theme-Datei. **Kein schweres
UI-Framework** in Meilenstein 1 (YAGNI). Gradient via `expo-linear-gradient`.

---

## Komponenten / Bausteine (je eine klare Aufgabe)

- **`theme.ts`** — Farb-/Spacing-Konstanten (gespiegelt aus Web).
- **`config.ts`** — API-Basis-URL aus Expo-Config lesen.
- **`api/analyze.ts`** — `analyzeDocument(base64, mediaType, fileName)`:
  Request bauen, Antwort/Fehler typisiert zurückgeben (`PreviewData | ApiError`).
  Typen aus dem Web-`types/index.ts` gespiegelt (kleine lokale Kopie der für die
  App relevanten Interfaces).
- **`screens/HomeScreen.tsx`** — Landing + CTA.
- **`screens/UploadScreen.tsx`** — Datei-/Foto-Auswahl, Größen-Guard, Senden.
- **`screens/ResultScreen.tsx`** — Teaser-Darstellung.
- **`components/Logo.tsx`** — Schutzschild + Häkchen (native nachgebaut).
- **`components/LoadingIndicator.tsx`** — native Lade-Animation.
- **Navigation** — Expo Router (datei-basiert) für die drei Screens.

---

## Fehlerbehandlung

- Server-Fehler (`{ error }`): die **bereits deutschen** Meldungen 1:1 anzeigen.
- Netzwerk-/Timeout-Fehler: eigene deutsche Meldung („Verbindung
  fehlgeschlagen…").
- Datei zu groß: client-seitig vor dem Senden abfangen (3 MB), deutsche Meldung —
  spart einen unnötigen Request.

---

## Test-Loop auf dem PC

Zwei Wege, nacheinander einzurichten:

1. **Expo Go (sofort, null Setup):** Expo-Go-App aus dem Play Store auf einem
   echten Android-Handy. `npx expo start` → QR scannen → Live-Reload. Schnellster
   Weg zu „läuft".
2. **Android-Emulator (die „VM" auf dem PC):** Android Studio + ein AVD
   (virtuelles Gerät). Läuft auf Windows mit Hardware-Beschleunigung; einmaliger
   ~mehrere-GB-Download. Als zweiter Schritt.

---

## Bewusst NICHT in Meilenstein 1 (YAGNI / spätere Meilensteine)

- Bezahlung (Stripe / Google Play Billing — Play nimmt ~15 % bei digitalen
  Verkäufen; eigener Meilenstein).
- Voller Bericht nach Zahlung (`/api/result`), Brief-PDFs, Mailversand.
- Push-Notifications, Offline-Modus.
- iOS.
- Veröffentlichung im Play Store.

---

## Erfolgskriterien Meilenstein 1

- Expo-App startet auf Android (Expo Go und/oder Emulator).
- Nutzer kann PDF/Foto wählen, App sendet an die (MOCK-)Preview-API.
- Teaser-Ergebnis wird nativ und im bestehenden Design angezeigt.
- Alle Fehlerpfade (falscher Typ, zu groß, Rate-Limit, Netzwerk) zeigen
  verständliche deutsche Meldungen.
- Keine Änderung am bestehenden Web-/Vercel-Deployment.
