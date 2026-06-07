# Native Android-App — Meilenstein 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine native Android-App (React Native + Expo) im Unterordner `mobile/`, die ein PDF/Foto wählt, an das bestehende Vercel-`/api/analyze` schickt und das Teaser-Ergebnis nativ im bestehenden Design anzeigt.

**Architecture:** Eigenständige Expo-App (TypeScript, Expo Router) als reiner Client zum unveränderten Vercel-Backend. Dev zeigt auf die Preview-URL mit `MOCK_ANALYSIS=true` → Testen ist kostenlos. Pure Logik (Größen-Guard, API-Client) wird per Jest (jest-expo) TDD-getestet; die UI-Screens werden im Emulator/Expo Go verifiziert.

**Tech Stack:** React Native, Expo (SDK aktuell), Expo Router, TypeScript, expo-document-picker, expo-image-picker, expo-file-system, expo-linear-gradient, react-native-svg, Jest (jest-expo).

**Spec:** `docs/superpowers/specs/2026-06-07-native-app-meilenstein-1-design.md`

**Arbeitsverzeichnis:** Alle Pfade relativ zu `E:\Neko-Check\nebenkostencheck\nebenkostencheck` (Repo-Root mit `.git`). Die App lebt unter `mobile/`. Befehle werden, sofern nicht anders angegeben, in `mobile/` ausgeführt.

---

## File Structure (mobile/)

```
mobile/
  app/
    _layout.tsx        # Expo-Router Stack, globales Theme
    index.tsx          # Home/Landing-Screen
    upload.tsx         # Upload-Screen (Picker, Größen-Guard, Senden)
    result.tsx         # Ergebnis-/Teaser-Screen
  api/
    analyze.ts         # analyzeDocument() — Request/Antwort/Fehler typisiert
    analyze.test.ts    # Unit-Tests (gemocktes fetch)
  lib/
    fileGuard.ts       # Größen-Guard (3 MB), pure Funktion
    fileGuard.test.ts  # Unit-Tests
  components/
    Logo.tsx           # Schutzschild + Häkchen (react-native-svg)
    LoadingIndicator.tsx # native Lade-Animation
  theme.ts             # Farben/Spacing/Radius (aus Web gespiegelt)
  config.ts            # API_BASE_URL aus EXPO_PUBLIC_API_BASE_URL
  types.ts             # PreviewData (aus Web-types gespiegelt)
  .env                 # EXPO_PUBLIC_API_BASE_URL (nicht geheim)
  package.json         # eigenständig, inkl. jest-Konfiguration
  babel.config.js      # vom Template (babel-preset-expo)
```

Routen (`app/`) sind die Screens; alle übrigen Module liegen außerhalb von `app/` und werden von Expo Router nicht als Routen behandelt.

---

## Task 1: Expo-App scaffolden & Abhängigkeiten installieren

**Files:**
- Create: `mobile/` (gesamtes Expo-Projekt durch das CLI)

- [ ] **Step 1: Expo-App im Unterordner `mobile/` erzeugen**

Im Repo-Root ausführen:

```bash
npx create-expo-app@latest mobile
```

Erwartung: Ordner `mobile/` mit Default-Template (Expo Router, TypeScript, `babel.config.js`, `package.json` mit `"main": "expo-router/entry"`).

- [ ] **Step 2: Verschachteltes Git-Repo entfernen**

`create-expo-app` legt evtl. `mobile/.git` an. Das darf nicht sein (es soll Teil des Eltern-Repos sein). Entfernen, falls vorhanden:

```powershell
if (Test-Path mobile/.git) { Remove-Item -Recurse -Force mobile/.git }
```

- [ ] **Step 3: Laufzeit-Abhängigkeiten installieren (versionskompatibel via expo)**

In `mobile/`:

```bash
npx expo install expo-document-picker expo-image-picker expo-file-system expo-linear-gradient react-native-svg
```

Erwartung: Pakete in `mobile/package.json` eingetragen, keine Versionswarnungen.

- [ ] **Step 4: Baseline einmal starten (Smoke-Test des Scaffolds)**

In `mobile/`:

```bash
npx expo start
```

Erwartung: Metro-Bundler startet, QR-Code erscheint. Mit `Strg+C` wieder beenden. (Falls ein Android-Gerät/Emulator bereit ist: `a` öffnet die Beispiel-App — optional.)

- [ ] **Step 5: Beispiel-Routen des Templates entfernen**

Wir definieren eigene Routen. Lösche den kompletten Inhalt von `mobile/app/` (z. B. `(tabs)/`, `_layout.tsx`, `+not-found.tsx`) sowie die Template-Beispielordner, falls vorhanden (`components/`, `hooks/`, `constants/`, `scripts/`):

```powershell
Remove-Item -Recurse -Force mobile/app/*
if (Test-Path mobile/components) { Remove-Item -Recurse -Force mobile/components }
if (Test-Path mobile/hooks) { Remove-Item -Recurse -Force mobile/hooks }
if (Test-Path mobile/constants) { Remove-Item -Recurse -Force mobile/constants }
if (Test-Path mobile/scripts) { Remove-Item -Recurse -Force mobile/scripts }
```

(Unsere eigenen `app/`-Dateien und `components/` entstehen in den folgenden Tasks.)

- [ ] **Step 6: Commit**

```bash
git add mobile
git commit -m "feat(mobile): scaffold Expo app + install native deps"
```

---

## Task 2: Jest (jest-expo) einrichten

**Files:**
- Modify: `mobile/package.json`
- Create: `mobile/lib/fileGuard.smoke.test.ts` (temporärer Smoke-Test, danach gelöscht)

- [ ] **Step 1: Test-Abhängigkeiten installieren**

In `mobile/`:

```bash
npx expo install jest-expo jest --dev
npm install --save-dev @types/jest
```

- [ ] **Step 2: Jest-Konfiguration + Test-Script in `mobile/package.json` ergänzen**

Füge das `"test"`-Script und den `"jest"`-Block hinzu (im bestehenden `scripts`-Objekt ergänzen, `jest`-Block auf oberster Ebene):

```json
{
  "scripts": {
    "test": "jest"
  },
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))"
    ]
  }
}
```

- [ ] **Step 3: Smoke-Test schreiben**

`mobile/lib/fileGuard.smoke.test.ts`:

```ts
describe("jest setup", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 4: Test ausführen**

In `mobile/`:

```bash
npx jest fileGuard.smoke
```

Erwartung: PASS (1 Test).

- [ ] **Step 5: Smoke-Test löschen & Commit**

```powershell
Remove-Item mobile/lib/fileGuard.smoke.test.ts
```

```bash
git add mobile/package.json mobile/package-lock.json
git commit -m "test(mobile): set up jest-expo"
```

---

## Task 3: Theme-Konstanten

**Files:**
- Create: `mobile/theme.ts`

- [ ] **Step 1: Theme schreiben (aus Web gespiegelt)**

`mobile/theme.ts`:

```ts
export const colors = {
  bg: "#0F172A",
  card: "#1E293B",
  border: "#334155",
  text: "#F1F5F9",
  textMuted: "#94A3B8",
  accentFrom: "#6366F1",
  accentTo: "#8B5CF6",
  green: "#22C55E",
  yellow: "#EAB308",
  red: "#EF4444",
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { md: 12, lg: 16, xl: 24 } as const;
```

- [ ] **Step 2: Commit**

```bash
git add mobile/theme.ts
git commit -m "feat(mobile): add theme constants mirrored from web"
```

---

## Task 4: API-Basis-URL-Konfiguration

**Files:**
- Create: `mobile/config.ts`
- Create: `mobile/.env`

- [ ] **Step 1: Config schreiben**

`mobile/config.ts`:

```ts
// API-Basis-URL. Dev zeigt auf die Preview mit MOCK_ANALYSIS=true (kostenlos),
// Prod später auf https://nebenkostencheck24.de. Override via EXPO_PUBLIC_API_BASE_URL.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  "https://nebenkostencheck-git-monetarisierung-bartpirat-s-projects.vercel.app";
```

- [ ] **Step 2: `.env` schreiben (nicht geheim — EXPO_PUBLIC_ ist clientseitig)**

`mobile/.env`:

```
EXPO_PUBLIC_API_BASE_URL=https://nebenkostencheck-git-monetarisierung-bartpirat-s-projects.vercel.app
```

- [ ] **Step 3: Commit**

```bash
git add mobile/config.ts mobile/.env
git commit -m "feat(mobile): configurable API base URL (preview/MOCK by default)"
```

---

## Task 5: Typen (PreviewData aus Web gespiegelt)

**Files:**
- Create: `mobile/types.ts`

- [ ] **Step 1: Typen schreiben**

`mobile/types.ts` (exakte Spiegelung der relevanten Felder aus dem Web-`src/types/index.ts`):

```ts
/** Reduzierte Teaser-Daten, die der Client vor der Zahlung erhält. */
export interface PreviewData {
  id: string;
  notAStatement?: boolean;
  errorCount: number;
  totalPotentialEur?: number | null;
  totalPotentialLabel?: string | null;
  errorTitles: string[];
  hasDirect: boolean;
  hasReview: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/types.ts
git commit -m "feat(mobile): add PreviewData type mirrored from web"
```

---

## Task 6: Datei-Größen-Guard (TDD)

**Files:**
- Create: `mobile/lib/fileGuard.ts`
- Test: `mobile/lib/fileGuard.test.ts`

- [ ] **Step 1: Failing test schreiben**

`mobile/lib/fileGuard.test.ts`:

```ts
import { isFileTooLarge, MAX_FILE_BYTES, MAX_FILE_MB } from "./fileGuard";

describe("isFileTooLarge", () => {
  it("erlaubt genau die Grenze", () => {
    expect(isFileTooLarge(MAX_FILE_BYTES)).toBe(false);
  });
  it("lehnt einen Byte über der Grenze ab", () => {
    expect(isFileTooLarge(MAX_FILE_BYTES + 1)).toBe(true);
  });
  it("erlaubt kleine Dateien", () => {
    expect(isFileTooLarge(1000)).toBe(false);
  });
  it("Grenze entspricht 3 MB", () => {
    expect(MAX_FILE_MB).toBe(3);
    expect(MAX_FILE_BYTES).toBe(3 * 1024 * 1024);
  });
});
```

- [ ] **Step 2: Test laufen lassen → muss fehlschlagen**

```bash
npx jest fileGuard.test
```

Erwartung: FAIL ("Cannot find module './fileGuard'").

- [ ] **Step 3: Minimale Implementierung**

`mobile/lib/fileGuard.ts`:

```ts
export const MAX_FILE_MB = 3;
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

export function isFileTooLarge(byteSize: number): boolean {
  return byteSize > MAX_FILE_BYTES;
}
```

- [ ] **Step 4: Test laufen lassen → muss bestehen**

```bash
npx jest fileGuard.test
```

Erwartung: PASS (4 Tests).

- [ ] **Step 5: Commit**

```bash
git add mobile/lib/fileGuard.ts mobile/lib/fileGuard.test.ts
git commit -m "feat(mobile): add 3 MB file-size guard (TDD)"
```

---

## Task 7: API-Client `analyzeDocument` (TDD)

**Files:**
- Create: `mobile/api/analyze.ts`
- Test: `mobile/api/analyze.test.ts`

- [ ] **Step 1: Failing test schreiben**

`mobile/api/analyze.test.ts`:

```ts
import { analyzeDocument } from "./analyze";
import type { PreviewData } from "../types";

const preview: PreviewData = {
  id: "abc",
  errorCount: 2,
  totalPotentialEur: 120,
  totalPotentialLabel: null,
  errorTitles: ["A", "B"],
  hasDirect: true,
  hasReview: false,
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("analyzeDocument", () => {
  it("gibt bei 200 die PreviewData zurück", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => preview }) as unknown as typeof fetch;
    const res = await analyzeDocument("Zm9v", "application/pdf", "a.pdf");
    expect(res).toEqual({ ok: true, data: preview });
  });

  it("reicht die deutsche Server-Fehlermeldung durch", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, json: async () => ({ error: "Datei zu groß." }) }) as unknown as typeof fetch;
    const res = await analyzeDocument("x", "application/pdf", "a.pdf");
    expect(res).toEqual({ ok: false, message: "Datei zu groß." });
  });

  it("liefert eine Netzwerk-Meldung, wenn fetch wirft", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network")) as unknown as typeof fetch;
    const res = await analyzeDocument("x", "application/pdf", "a.pdf");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toMatch(/Verbindung fehlgeschlagen/);
  });
});
```

- [ ] **Step 2: Test laufen lassen → muss fehlschlagen**

```bash
npx jest analyze.test
```

Erwartung: FAIL ("Cannot find module './analyze'").

- [ ] **Step 3: Minimale Implementierung**

`mobile/api/analyze.ts`:

```ts
import { API_BASE_URL } from "../config";
import type { PreviewData } from "../types";

export type AnalyzeResult =
  | { ok: true; data: PreviewData }
  | { ok: false; message: string };

export async function analyzeDocument(
  base64: string,
  mediaType: string,
  fileName: string,
): Promise<AnalyzeResult> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64, mediaType, fileName }),
    });
  } catch {
    return {
      ok: false,
      message:
        "Verbindung fehlgeschlagen. Bitte prüfe deine Internetverbindung und versuche es erneut.",
    };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return {
      ok: false,
      message: "Die Analyse konnte nicht verarbeitet werden. Bitte versuche es erneut.",
    };
  }

  if (!res.ok) {
    const message =
      (json as { error?: string }).error ??
      "Es ist ein Fehler aufgetreten. Bitte versuche es erneut.";
    return { ok: false, message };
  }

  return { ok: true, data: json as PreviewData };
}
```

- [ ] **Step 4: Test laufen lassen → muss bestehen**

```bash
npx jest analyze.test
```

Erwartung: PASS (3 Tests).

- [ ] **Step 5: Commit**

```bash
git add mobile/api/analyze.ts mobile/api/analyze.test.ts
git commit -m "feat(mobile): add analyzeDocument API client (TDD)"
```

---

## Task 8: Logo-Komponente

**Files:**
- Create: `mobile/components/Logo.tsx`

- [ ] **Step 1: Logo schreiben (SVG-Pfade exakt aus dem Web-Logo)**

`mobile/components/Logo.tsx`:

```tsx
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

export function Logo({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="nk-grad" x1="0" y1="0" x2="24" y2="24">
          <Stop offset="0" stopColor="#6366F1" />
          <Stop offset="1" stopColor="#8B5CF6" />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z"
        fill="url(#nk-grad)"
      />
      <Path
        d="M8.5 12l2.5 2.5 4.5-4.5"
        stroke="#fff"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add mobile/components/Logo.tsx
git commit -m "feat(mobile): add Logo (shield + check) from web SVG"
```

---

## Task 9: Lade-Indikator

**Files:**
- Create: `mobile/components/LoadingIndicator.tsx`

- [ ] **Step 1: LoadingIndicator schreiben**

`mobile/components/LoadingIndicator.tsx`:

```tsx
import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { colors, spacing } from "../theme";

const STEPS = [
  "Dokument wird gelesen…",
  "Posten werden geprüft…",
  "Mögliche Fehler werden bewertet…",
];

export function LoadingIndicator() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % STEPS.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={colors.accentTo} />
      <Text style={styles.text}>{STEPS[i]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xl },
  text: { color: colors.textMuted, fontSize: 16 },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/components/LoadingIndicator.tsx
git commit -m "feat(mobile): add sequential loading indicator"
```

---

## Task 10: Root-Layout & Home-Screen

**Files:**
- Create: `mobile/app/_layout.tsx`
- Create: `mobile/app/index.tsx`

- [ ] **Step 1: Root-Layout schreiben**

`mobile/app/_layout.tsx`:

```tsx
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors } from "../theme";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: "Nebenkostencheck" }} />
        <Stack.Screen name="upload" options={{ title: "Abrechnung hochladen" }} />
        <Stack.Screen name="result" options={{ title: "Ergebnis" }} />
      </Stack>
    </>
  );
}
```

- [ ] **Step 2: Home-Screen schreiben**

`mobile/app/index.tsx`:

```tsx
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Logo } from "../components/Logo";
import { colors, spacing, radius } from "../theme";

export default function HomeScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Logo size={72} />
      <Text style={styles.title}>Nebenkosten{"\n"}schnell geprüft</Text>
      <Text style={styles.subtitle}>
        Lade deine Abrechnung hoch und finde mögliche Fehler — geprüft nach
        aktuellem Mietrecht (BetrKV, HeizkV) und höchstrichterlicher
        BGH-Rechtsprechung.
      </Text>
      <Pressable onPress={() => router.push("/upload")} style={styles.ctaWrap}>
        <LinearGradient
          colors={[colors.accentFrom, colors.accentTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>Abrechnung prüfen</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  ctaWrap: { width: "100%", marginTop: spacing.md },
  cta: {
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
```

- [ ] **Step 3: Im Emulator/Expo Go verifizieren**

In `mobile/`: `npx expo start`, App auf Android öffnen (Expo Go per QR oder Emulator mit `a`).
Erwartung: Dunkler Home-Screen, Logo (Schild + Häkchen), Titel, Untertitel, Gradient-Button „Abrechnung prüfen". Tippen navigiert zum (noch leeren) Upload-Screen ohne Absturz.

- [ ] **Step 4: Commit**

```bash
git add mobile/app/_layout.tsx mobile/app/index.tsx
git commit -m "feat(mobile): add root layout and home screen"
```

---

## Task 11: Upload-Screen

**Files:**
- Create: `mobile/app/upload.tsx`

- [ ] **Step 1: Upload-Screen schreiben**

`mobile/app/upload.tsx`:

```tsx
import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { analyzeDocument } from "../api/analyze";
import { isFileTooLarge, MAX_FILE_MB } from "../lib/fileGuard";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { colors, spacing, radius } from "../theme";

type Picked = { uri: string; mediaType: string; fileName: string; size?: number };

export default function UploadScreen() {
  const router = useRouter();
  const [picked, setPicked] = useState<Picked | null>(null);
  const [loading, setLoading] = useState(false);

  async function pickPdf() {
    const res = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    if (res.canceled) return;
    const a = res.assets[0];
    setPicked({
      uri: a.uri,
      mediaType: a.mimeType ?? "application/pdf",
      fileName: a.name,
      size: a.size ?? undefined,
    });
  }

  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (res.canceled) return;
    const a = res.assets[0];
    setPicked({
      uri: a.uri,
      mediaType: a.mimeType ?? "image/jpeg",
      fileName: a.fileName ?? "foto.jpg",
      size: a.fileSize ?? undefined,
    });
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Kamera", "Bitte erlaube den Kamerazugriff, um ein Foto aufzunehmen.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (res.canceled) return;
    const a = res.assets[0];
    setPicked({
      uri: a.uri,
      mediaType: a.mimeType ?? "image/jpeg",
      fileName: a.fileName ?? "foto.jpg",
      size: a.fileSize ?? undefined,
    });
  }

  async function submit() {
    if (!picked) return;
    const info = await FileSystem.getInfoAsync(picked.uri, { size: true });
    const byteSize =
      info.exists && "size" in info ? info.size : picked.size ?? 0;
    if (isFileTooLarge(byteSize)) {
      Alert.alert(
        "Datei zu groß",
        `Die Datei ist zu groß (max. ${MAX_FILE_MB} MB). Bitte lade nur die Nebenkostenabrechnung hoch.`,
      );
      return;
    }
    setLoading(true);
    const base64 = await FileSystem.readAsStringAsync(picked.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const result = await analyzeDocument(base64, picked.mediaType, picked.fileName);
    setLoading(false);
    if (!result.ok) {
      Alert.alert("Hinweis", result.message);
      return;
    }
    router.push({
      pathname: "/result",
      params: { data: JSON.stringify(result.data) },
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <LoadingIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Abrechnung auswählen</Text>
      <Text style={styles.hint}>PDF oder Foto deiner Nebenkostenabrechnung (max. {MAX_FILE_MB} MB).</Text>

      <Pressable style={styles.choice} onPress={pickPdf}>
        <Text style={styles.choiceText}>📄  PDF auswählen</Text>
      </Pressable>
      <Pressable style={styles.choice} onPress={pickPhoto}>
        <Text style={styles.choiceText}>🖼️  Foto aus Galerie</Text>
      </Pressable>
      <Pressable style={styles.choice} onPress={takePhoto}>
        <Text style={styles.choiceText}>📷  Foto aufnehmen</Text>
      </Pressable>

      {picked && (
        <View style={styles.selected}>
          <Text style={styles.selectedText} numberOfLines={1}>
            Ausgewählt: {picked.fileName}
          </Text>
        </View>
      )}

      <Pressable
        onPress={submit}
        disabled={!picked}
        style={[styles.submit, !picked && styles.submitDisabled]}
      >
        <Text style={styles.submitText}>Prüfen</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.md, backgroundColor: colors.bg, flexGrow: 1 },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: "center" },
  heading: { color: colors.text, fontSize: 24, fontWeight: "800" },
  hint: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.sm },
  choice: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  choiceText: { color: colors.text, fontSize: 16 },
  selected: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  selectedText: { color: colors.textMuted, fontSize: 14 },
  submit: {
    backgroundColor: colors.accentFrom,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
```

- [ ] **Step 2: Im Emulator/Expo Go verifizieren**

App öffnen → „Abrechnung prüfen" → Upload-Screen. Erwartung: drei Auswahl-Buttons (PDF/Galerie/Kamera), „Prüfen" ist deaktiviert bis eine Datei gewählt ist. Nach Auswahl zeigt sich der Dateiname; „Prüfen" zeigt die Lade-Animation. (Voller Durchlauf folgt in Task 13.)

- [ ] **Step 3: Commit**

```bash
git add mobile/app/upload.tsx
git commit -m "feat(mobile): add upload screen (picker, size guard, analyze call)"
```

---

## Task 12: Ergebnis-/Teaser-Screen

**Files:**
- Create: `mobile/app/result.tsx`

- [ ] **Step 1: Result-Screen schreiben**

`mobile/app/result.tsx`:

```tsx
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import type { PreviewData } from "../types";
import { colors, spacing, radius } from "../theme";

export default function ResultScreen() {
  const { data } = useLocalSearchParams<{ data: string }>();
  let preview: PreviewData | null = null;
  try {
    preview = JSON.parse(data);
  } catch {
    preview = null;
  }

  if (!preview) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Kein Ergebnis vorhanden.</Text>
      </View>
    );
  }

  if (preview.notAStatement) {
    return (
      <View style={styles.center}>
        <Text style={styles.notice}>Das sieht nicht nach einer Nebenkostenabrechnung aus</Text>
        <Text style={styles.muted}>
          Bitte lade die eigentliche Abrechnung als PDF oder Foto hoch.
        </Text>
      </View>
    );
  }

  const eur =
    preview.totalPotentialLabel ??
    (preview.totalPotentialEur != null ? `≈ ${preview.totalPotentialEur} €` : "—");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{preview.errorCount}</Text>
          <Text style={styles.statLabel}>mögliche Fehler</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{eur}</Text>
          <Text style={styles.statLabel}>Sparpotenzial</Text>
        </View>
      </View>

      <Text style={styles.heading}>Gefundene Punkte</Text>
      {preview.errorTitles.map((title, idx) => (
        <View key={idx} style={styles.item}>
          <Text style={styles.itemText}>• {title}</Text>
        </View>
      ))}

      <View style={styles.paywall}>
        <Text style={styles.paywallTitle}>Vollständigen Bericht freischalten</Text>
        <Text style={styles.muted}>
          Detaillierte Begründung je Fehler, rechtliche Grundlage und fertige
          Schreiben — in Kürze in der App verfügbar.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.md, backgroundColor: colors.bg, flexGrow: 1 },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  statRow: { flexDirection: "row", gap: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
  },
  statValue: { color: colors.text, fontSize: 26, fontWeight: "800" },
  statLabel: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  heading: { color: colors.text, fontSize: 20, fontWeight: "700", marginTop: spacing.md },
  item: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  itemText: { color: colors.text, fontSize: 15 },
  paywall: {
    marginTop: spacing.lg,
    borderColor: colors.accentFrom,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  paywallTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  notice: { color: colors.yellow, fontSize: 20, fontWeight: "700", textAlign: "center" },
  muted: { color: colors.textMuted, fontSize: 15, textAlign: "center", lineHeight: 22 },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/result.tsx
git commit -m "feat(mobile): add result/teaser screen"
```

---

## Task 13: End-to-End-Verifikation (Emulator/Expo Go)

**Files:** keine (manuelle Verifikation)

- [ ] **Step 1: Gesamte Testsuite laufen lassen**

In `mobile/`:

```bash
npx jest
```

Erwartung: alle Tests PASS (fileGuard 4, analyze 3).

- [ ] **Step 2: TypeScript-Check**

In `mobile/`:

```bash
npx tsc --noEmit
```

Erwartung: keine Fehler.

- [ ] **Step 3: App auf Android starten**

In `mobile/`: `npx expo start` → auf Android öffnen (Expo Go per QR oder Emulator `a`).

- [ ] **Step 4: Happy Path durchspielen**

Home → „Abrechnung prüfen" → „PDF auswählen" (eine kleine echte Nebenkosten-PDF wählen) → „Prüfen".
Erwartung: Lade-Animation, dann Ergebnis-Screen mit Fehleranzahl, Sparpotenzial, Titel-Liste und Paywall-Platzhalter. (Da Dev auf die MOCK-Preview zeigt, kommen Beispiel-Teaserdaten zurück — Kosten 0 Cent.)

- [ ] **Step 5: Fehlerpfade prüfen**

- Falscher Typ: eine `.docx` über „PDF auswählen" lässt sich gar nicht erst wählen (Filter `application/pdf`); über Galerie nur Bilder → ok.
- Zu groß: eine > 3 MB große Datei wählen → deutsche „Datei zu groß"-Meldung **vor** dem Senden.
- Netzwerk: Flugmodus an, „Prüfen" → „Verbindung fehlgeschlagen"-Meldung.

Erwartung: Alle drei zeigen verständliche deutsche Meldungen, kein Absturz.

- [ ] **Step 6: Abschluss-Commit (falls noch Uncommitted)**

```bash
git status
```

Erwartung: working tree clean. Andernfalls offene Änderungen committen.

---

## Hinweise zur Ausführung

- **Emulator-Voraussetzung:** Für den PC-Emulator muss Android Studio + ein AVD installiert sein (einmaliger großer Download). Schnellster Sofort-Test ohne Setup: Expo Go aus dem Play Store auf einem echten Android-Handy.
- **Windows/PowerShell:** `Remove-Item -Recurse -Force` statt `rm -rf`.
- **Kein Backend-Eingriff:** Diese App ändert nichts am Web-/Vercel-Deployment. `mobile/` wird von Vercel nicht gebaut.
- **MOCK = 0 Cent:** Solange `API_BASE_URL` auf die Preview mit `MOCK_ANALYSIS=true` zeigt, entstehen keine KI-Kosten.
- **Expo-SDK-Versions-Gotchas (in Task 11 prüfen):**
  - `expo-file-system`: Ab SDK 54 ist die klassische API (`readAsStringAsync`, `getInfoAsync`, `EncodingType`) nach `expo-file-system/legacy` umgezogen. Falls der Import `import * as FileSystem from "expo-file-system"` diese Funktionen nicht hat (TypeScript-Fehler / Laufzeit-`undefined`), stattdessen `import * as FileSystem from "expo-file-system/legacy"` verwenden — der restliche Code bleibt identisch.
  - `expo-image-picker`: `ImagePicker.MediaTypeOptions.Images` ist in neueren SDKs deprecated. Falls eine Deprecation-Warnung/Fehler auftritt, durch `mediaTypes: ["images"]` ersetzen (String-Array statt Enum).
  - Die installierte SDK-Version steht nach Task 1 in `mobile/package.json` (`"expo": "~XX..."`) — bei 54+ direkt die obigen Varianten nehmen.
