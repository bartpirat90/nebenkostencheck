# Native Android-App — Dokumentation

**Stand:** 2026-06-08 · Meilenstein 1 abgeschlossen & auf Emulator verifiziert — **Bild- UND PDF-Pfad** (PDF im echten Dev-Build)
**Code:** Unterordner [`mobile/`](../mobile) · auf `monetarisierung` gemergt + zu GitHub gepusht

---

## 1. Überblick

Die Nebenkostencheck-Web-App bekommt eine **echte native Android-App**. Sie ist
ein eigenständiges **React-Native-Projekt (Expo)** im Ordner `mobile/` und spricht
als reiner Client das **bestehende Vercel-Backend** an — es gibt **keine**
Backend-Änderungen.

**Warum React Native + Expo (statt PWA oder Kotlin)?**
- Rendert echte native Komponenten (native Kamera, Push, Play-Store-Binary) — für
  diese Art App (Upload → Analyse → Ergebnis) kein für Endnutzer spürbarer
  Unterschied zu Kotlin.
- Nutzt das vorhandene React-/TypeScript-Wissen und die bestehenden API-Verträge.
- Android-first; iOS bliebe später nahezu geschenkt.

Entscheidung und Begründung im Detail:
`docs/superpowers/specs/2026-06-07-native-app-meilenstein-1-design.md`.

---

## 2. Tech-Stack

| | |
|---|---|
| Framework | React Native via **Expo SDK 56** |
| Sprache | TypeScript (strict) |
| Navigation | Expo Router (datei-basiert, `typedRoutes`) |
| Laufzeit | React 19.2, React Native 0.85 |
| Tests | Jest (`jest-expo`) |
| Native Module | `expo-document-picker`, `expo-image-picker`, `expo-file-system`, `expo-linear-gradient`, `react-native-svg` |

> ⚠️ **SDK 56 ist neu.** Vor Codeänderungen die versionierten Docs prüfen:
> https://docs.expo.dev/versions/v56.0.0/ (siehe auch `mobile/AGENTS.md`).

---

## 3. Architektur

```
┌─────────────────────────┐         HTTPS POST {base64,mediaType,fileName}
│  Android-App (mobile/)  │ ───────────────────────────────────────────────┐
│  React Native / Expo    │                                                 ▼
│  Home → Upload → Ergebnis│                          ┌──────────────────────────────┐
└─────────────────────────┘ ◄─── PreviewData (JSON) ──│  Vercel-Backend (unverändert) │
                                                       │  /api/analyze  (Next.js)      │
                                                       └──────────────────────────────┘
```

- Die App enthält **keine** Geschäftslogik der Analyse — sie schickt das Dokument
  (base64) an `/api/analyze` und zeigt die zurückgegebenen Teaser-Daten an.
- **API-Basis-URL** ist konfigurierbar (`src/config.ts` / `EXPO_PUBLIC_API_BASE_URL`).
  Standard = die **Preview mit `MOCK_ANALYSIS=true`** → Entwicklung/Tests kosten
  **0 Cent** (keine KI-Aufrufe). Produktion später: `https://nebenkostencheck24.de`.
- **Vercel ignoriert `mobile/`**: Der Web-Build läuft am Repo-Root (`next build`),
  der Unterordner wird nicht gebaut. Die Web-App ist unberührt.

---

## 4. Projektstruktur (`mobile/src/`)

```
src/
  app/                 # Expo-Router-Routen = Screens
    _layout.tsx        # Stack-Navigator + globales Dark-Theme
    index.tsx          # Home/Landing (Logo, Nutzenversprechen, CTA)
    upload.tsx         # Upload (PDF/Foto-Picker, Auswahl entfernbar, Größen-Guard, Analyse-Aufruf)
    result.tsx         # Ergebnis-Teaser (Fehleranzahl, €-Potenzial, Paywall-Platzhalter)
  api/
    analyze.ts         # analyzeDocument() — Request/Antwort/Fehler typisiert
    analyze.test.ts    # Unit-Tests (gemocktes fetch)
  components/
    Logo.tsx           # Schutzschild + Häkchen (SVG, aus Web übernommen)
    Icon.tsx           # Line-Icons (Dokument/Bild/Kamera/×) im Logo-Stil, react-native-svg — statt System-Emojis
    LoadingIndicator.tsx # native Lade-Animation mit wechselnden Texten
  lib/
    fileGuard.ts       # 3-MB-Größen-Guard (pure Funktion)
    fileGuard.test.ts  # Unit-Tests
  theme.ts             # Farben/Spacing/Radius (1:1 aus dem Web-Design)
  config.ts            # API_BASE_URL
  types.ts             # PreviewData (gespiegelt aus dem Web-Typ)
```

Design-System-Farben (aus dem Web): BG `#0F172A`, Cards `#1E293B`, Border `#334155`,
Text `#F1F5F9`/`#94A3B8`, Accent-Gradient `#6366F1 → #8B5CF6`.

---

## 5. App lokal ausführen

### Variante A — Echtes Android-Handy (kein Setup)
1. „**Expo Go**" aus dem Play Store installieren.
2. Handy und PC ins **gleiche WLAN**.
3. Im Ordner `mobile/`: `npx expo start` → QR-Code mit Expo Go scannen.

### Variante B — Android-Emulator auf dem PC
Einmaliges Setup (auf diesem PC bereits erledigt):
- **Android Studio** installiert; **Android SDK liegt auf `E:\Android`** (nicht am
  Windows-Default-Ort).
- Umgebungsvariablen (dauerhaft, User-Scope): `ANDROID_HOME` = `ANDROID_SDK_ROOT` =
  `E:\Android`; PATH ergänzt um `E:\Android\platform-tools` und `E:\Android\emulator`.
- **AVD liegt auf `E:\Android\avd`** (`ANDROID_AVD_HOME=E:\Android\avd`) — bewusst
  verlagert, weil `C:` zu wenig frei hatte (die userdata-Partition braucht ~12 GB;
  `E:` hat reichlich Platz). Gerät: `Pixel_7`, Android 17 / API 37, x86_64.

Starten:
```powershell
# 1) Emulator hochfahren
& E:\Android\emulator\emulator.exe -avd Pixel_7

# 2) Dev-Server starten (im Ordner mobile/)
npx expo start
#    Beim ersten Mal installiert sich „Expo Go" automatisch auf dem Emulator.
#    Im Terminal 'a' drücken, um auf Android zu öffnen.
```

Nützlich beim Testen (App neu laden über adb):
```powershell
$ip = "<LAN-IP-des-PC>"   # z.B. 192.168.2.182, steht im expo-start-Log
adb shell am force-stop host.exp.exponent
adb shell am start -a android.intent.action.VIEW -d "exp://$ip:8081" host.exp.exponent
```

### Variante C — Echter Dev-Build (nativ, `expo run:android`)
Nötig, sobald native Module/Dateizugriffe getestet werden, die Expo Go nicht kann
(z. B. **PDF-Upload** via `new File(uri).base64()` — siehe Abschnitt 8). Baut eine
echte `app-debug.apk` und installiert sie auf den Emulator/das Gerät.

> ⚠️ **JDK-17-Pflicht!** RN 0.85 / Expo SDK 56 bauen mit **Gradle 9**, das aber ein
> **JDK 17** als Toolchain erwartet. Mit dem von Android Studio gebündelten **JBR 21**
> bricht der Build ab (`JvmVendorSpec … IBM_SEMERU` — siehe Abschnitt 8). Auf diesem PC
> liegt ein Temurin **JDK 17** unter `E:\Java\jdk-17.0.13+11`; `JAVA_HOME` ist dauerhaft
> (User-Scope) darauf gesetzt.

```powershell
$env:JAVA_HOME = "E:\Java\jdk-17.0.13+11"   # bereits dauerhaft gesetzt
# Emulator muss laufen (siehe Variante B), dann im Ordner mobile/:
npx expo run:android
#   → erzeugt beim ersten Mal android/ (prebuild), baut, installiert, startet die App
#     und hängt Metro an. Erstbuild ~8 min, danach inkrementell deutlich schneller.
```

Der native Ordner `android/` ist **gitignored** (Expo „Continuous Native Generation" —
wird bei Bedarf aus `app.json` regeneriert, nicht eingecheckt).

---

## 6. Tests & Checks

Im Ordner `mobile/`:
```bash
npx tsc --noEmit   # Typprüfung (muss fehlerfrei sein)
npx jest           # Unit-Tests (aktuell 7/7 grün)
```
Getestet werden die puren Logikmodule (`fileGuard`, `analyzeDocument` inkl.
Netzwerk-/Server-Fehlerpfade). Die Screens werden auf dem Gerät/Emulator visuell
verifiziert.

---

## 7. Stand Meilenstein 1 — was funktioniert (auf Emulator verifiziert)

| Funktion | Status |
|---|---|
| Home-Screen (Logo, Titel, CTA, Dark-Design) | ✅ |
| Navigation Home → Upload | ✅ |
| Upload-UI; „Prüfen" gesperrt, solange keine Datei gewählt | ✅ |
| **Bild wählen → base64 → MOCK-`/api/analyze` → Teaser** (3 Fehler, 132,5 €) | ✅ |
| **PDF wählen → `File.base64()` → MOCK-`/api/analyze` → Teaser** (im echten Dev-Build) | ✅ |
| Fehlerbehandlung (deutsche Meldung statt Absturz) | ✅ |
| `tsc` sauber, `jest` 7/7, Code-Review APPROVE | ✅ |

**Bewusst NICHT in Meilenstein 1** (spätere Meilensteine): Bezahlung in der App
(Google Play Billing ~15 %), voller Bericht nach Zahlung, Brief-PDFs/Mailversand,
Push-Benachrichtigungen, iOS, Play-Store-Veröffentlichung.

---

## 8. SDK-56-Besonderheiten & gelöste Stolpersteine

1. **`src/`-Layout:** Quellcode liegt unter `mobile/src/`, Routen unter
   `mobile/src/app/`. Alias `@/*`→`./src/*` existiert, wir nutzen aber durchgängig
   **relative Imports** (kein Jest-`moduleNameMapper` nötig).
2. **Neue `expo-file-system`-API:** `import { File }`, `new File(uri).base64()` /
   `.size`. Die klassischen Funktionen (`readAsStringAsync`) liegen unter
   `expo-file-system/legacy`.
3. **`expo-image-picker`:** `mediaTypes: ["images"]` (String-Array); das alte
   `MediaTypeOptions` ist deprecated.
4. **Datei → base64 in Expo Go:** `new File(uri).base64()` auf einer
   DocumentPicker-Cachedatei scheitert **in Expo Go** mit „Missing READ permission"
   (Sandbox des neuen, scoped FileSystem). In einem echten Dev-/Standalone-Build
   greift das nicht. **Lösung im Code:**
   - **Bilder:** ImagePicker mit `base64: true` → base64 kommt direkt, kein
     Dateilesen → läuft auch in Expo Go (und ist robuster).
   - **PDF:** offizielles `new File(uri).base64()` (greift im echten Build).
   - `submit()` ist mit `try/catch` + deutscher Meldung abgesichert.

   ✅ **Im echten Dev-Build (`expo run:android`) am 2026-06-08 verifiziert:** PDF aus
   dem System-Picker wählen → `File.base64()` liest fehlerfrei (kein „Missing READ
   permission" mehr in logcat) → MOCK-`/api/analyze` → Teaser rendert (3 Fehler,
   132,5 €). Der Expo-Go-Fehler war also wie vermutet reine Sandbox-Limitierung.
5. **JDK 17 für den nativen Build (Gradle 9 / Foojay-Falle):** RN 0.85 / SDK 56 bauen mit
   **Gradle 9.3.1**, das ein **JDK 17** als Toolchain erwartet. Das von Android Studio
   gebündelte **JBR 21** lässt Gradle versuchen, per Foojay-Resolver (gepinnte alte
   Version 0.5.0 im RN-Plugin) ein JDK herunterzuladen — und der crasht auf Gradle 9 mit
   `Class JvmVendorSpec does not have member field 'IBM_SEMERU'`. **Fix:** ein lokales
   **JDK 17** bereitstellen (Temurin 17 unter `E:\Java\jdk-17.0.13+11`, `JAVA_HOME`
   dauerhaft gesetzt). Dann ist die Toolchain lokal erfüllt, Foojay wird nie aufgerufen,
   Build läuft sauber.

---

## 9. Offene Punkte / Nächste Schritte

- ~~PDF-Pfad im echten Build gegentesten~~ ✅ **erledigt (2026-06-08)** — im Dev-Build
  end-to-end verifiziert (siehe Abschnitt 7/8).
- **Android-`package` final festlegen:** aktuell domain-basierter Default
  `de.nebenkostencheck24.app` (in `app.json`). Vor dem Play-Store-Release einmal final
  bestätigen — der Name ist nach Veröffentlichung **permanent** und hängt am noch
  offenen Betreiber-/Play-Store-Konto (vgl. LLC-Blocker im Hauptprojekt).
- **Meilenstein 2 (designt & geplant, Umsetzung offen):** Bericht-Screen (voller
  `AnalysisResult`) + Brief-Flow (Widerspruch/Belegeinsicht/kombiniert) als teilbares
  PDF (natives Teilen-Sheet), editierbares Kontaktformular. Datenquelle = echter Pfad
  (`/api/result?id`), Bezahlschranke nur im MOCK/Demo offen (Produktion bleibt
  gesperrt). Neue Dependency: `expo-sharing`.
  - Spec: `docs/superpowers/specs/2026-06-08-native-app-meilenstein-2-design.md`
  - Plan (11 TDD-Tasks): `docs/superpowers/plans/2026-06-08-native-app-meilenstein-2.md`
  - **Nächster Schritt:** Ausführungsmodus wählen (Subagent-Driven empfohlen) und Plan abarbeiten.
- **Spätere Meilensteine:** echte Bezahlung in der App (Google Play Billing ~15 %),
  echte Analyse (MOCK aus), Push, iOS, Play-Store-Release.

---

## 10. Referenzen

- Spec: `docs/superpowers/specs/2026-06-07-native-app-meilenstein-1-design.md`
- Plan (inkl. SDK-56-Nachträgen): `docs/superpowers/plans/2026-06-07-native-app-meilenstein-1.md`
- Roadmap: `docs/ROADMAP.md`
- Web-Projekt & Dienste: `docs/ARCHITECTURE.md`, `docs/DIENSTE-UEBERSICHT.md`
