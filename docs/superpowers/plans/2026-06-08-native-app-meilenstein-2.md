# Native App – Meilenstein 2 (Bericht + Briefe) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **WICHTIG (mobile/AGENTS.md):** Vor JEDER Codeänderung an der App die versionierten Expo-Docs prüfen: https://docs.expo.dev/versions/v56.0.0/ — SDK 56 ist neuer als das Modellwissen.
>
> **Build/Run-Umgebung (dieser PC):** Dev-Build braucht **JDK 17** (`JAVA_HOME=E:\Java\jdk-17.0.13+11`, schon dauerhaft gesetzt). Emulator: `& E:\Android\emulator\emulator.exe -avd Pixel_7`. App-Start: in `mobile/` `npx expo run:android` (oder, wenn Build steht, `npx expo start`). `ANDROID_HOME=E:\Android`.

**Goal:** Nach dem Teaser zeigt die App den vollständigen Prüfbericht und erzeugt daraus Schreiben (Widerspruch/Belegeinsicht/kombiniert) als teilbares PDF — als native Screens.

**Architecture:** App bleibt reiner Client. Einzige Backend-Anpassung: die Bezahlschranke (`paid`) wird **nur im MOCK-Modus** geöffnet (Produktion bleibt gesperrt). Die App holt den vollen `AnalysisResult` per `id` von `/api/result`, erzeugt Briefe über `/api/generate-letter` und teilt PDFs über das native System-Sheet (`expo-sharing`).

**Tech Stack:** Expo SDK 56 (RN 0.85, React 19), Expo Router, react-native-svg, expo-file-system (legacy-Writer für base64), expo-sharing (neu), Jest (jest-expo). Backend: Next.js 15 (geteiltes Repo).

**Spec:** `docs/superpowers/specs/2026-06-08-native-app-meilenstein-2-design.md`

---

## File Structure

**Backend (Repo-Root, geteilt):**
- Modify: `src/lib/kv.ts` — Helper `isUnlocked(record)` (paid || MOCK).
- Modify: `src/app/api/result/route.ts` — `paid`→`isUnlocked`.
- Modify: `src/app/api/generate-letter/route.tsx` — `paid`→`isUnlocked`.
- Modify: `src/app/api/generate-report/route.tsx` — `paid`→`isUnlocked`.

**App (`mobile/src/`):**
- Modify: `types.ts` — Bericht-/Brief-Typen.
- Modify: `theme.ts` — Confidence-Farbsätze.
- Create: `api/report.ts` (+ `api/report.test.ts`) — fetchReport, generateLetter, reportPdfUrl.
- Create: `lib/pdf.ts` (+ `lib/pdf.test.ts`) — savePdfAndShare, downloadAndShare.
- Create: `components/ErrorCard.tsx` — eine Fehlerkarte.
- Create: `components/ContactForm.tsx` — editierbares Kontaktformular.
- Create: `app/report.tsx` — Bericht-Screen.
- Create: `app/letter.tsx` — Brief-Screen.
- Modify: `app/_layout.tsx` — Screens registrieren.
- Modify: `app/result.tsx` — Paywall-Karte → „Bericht anzeigen".

---

## Task 1: Backend – MOCK-Freigabe der Bezahlschranke

**Files:**
- Modify: `src/lib/kv.ts`
- Modify: `src/app/api/result/route.ts:12-14`
- Modify: `src/app/api/generate-letter/route.tsx:20`
- Modify: `src/app/api/generate-report/route.tsx:15`

- [ ] **Step 1: Helper in `src/lib/kv.ts` ergänzen**

Am Ende von `src/lib/kv.ts` anfügen:

```ts
/**
 * Demo-Freigabe: Im MOCK-Modus (Preview/Demo) ist der volle Bericht + Briefe
 * ohne Bezahlung zugänglich, damit die App end-to-end testbar ist.
 * In Produktion (MOCK_ANALYSIS aus) bleibt die Bezahlschranke voll aktiv.
 */
const MOCK_UNLOCK = process.env.MOCK_ANALYSIS === "true";
export function isUnlocked(record: StoredAnalysis): boolean {
  return record.paid || MOCK_UNLOCK;
}
```

- [ ] **Step 2: `src/app/api/result/route.ts` anpassen**

Import ergänzen und die `paid`-Prüfung ersetzen:

```ts
import { getAnalysis, isUnlocked } from "@/lib/kv";
```

```ts
  if (!isUnlocked(record)) {
    return NextResponse.json({ error: "Nicht freigeschaltet." }, { status: 402 });
  }
```

- [ ] **Step 3: `src/app/api/generate-letter/route.tsx` anpassen**

Import ergänzen und Zeile `if (!record.paid) ...` ersetzen:

```ts
import { getAnalysis, isUnlocked } from "@/lib/kv";
```

```ts
    if (!isUnlocked(record)) return NextResponse.json({ error: "Nicht freigeschaltet." }, { status: 402 });
```

- [ ] **Step 4: `src/app/api/generate-report/route.tsx` anpassen**

Import ergänzen und Zeile `if (!record.paid) ...` ersetzen:

```ts
import { getAnalysis, isUnlocked } from "@/lib/kv";
```

```ts
  if (!isUnlocked(record)) return NextResponse.json({ error: "Nicht freigeschaltet." }, { status: 402 });
```

- [ ] **Step 5: Web-Typecheck**

Run (Repo-Root): `npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 6: Commit**

```bash
git add src/lib/kv.ts src/app/api/result/route.ts src/app/api/generate-letter/route.tsx src/app/api/generate-report/route.tsx
git commit -m "feat(backend): MOCK-only Freigabe fuer Bericht/Briefe (prod bleibt gated)"
```

> **Deploy-Hinweis:** Die Preview (`MOCK_ANALYSIS=true`) zieht die Änderung beim nächsten Push automatisch. Produktion bleibt durch `isUnlocked` gesperrt.

---

## Task 2: App-Typen erweitern

**Files:**
- Modify: `mobile/src/types.ts`

- [ ] **Step 1: Typen anfügen**

In `mobile/src/types.ts` UNTER der bestehenden `PreviewData` anfügen:

```ts
export type ErrorCategory = "direct" | "needs_review";
export type Confidence = "sicher" | "wahrscheinlich" | "unsicher";

export interface ErrorItem {
  title: string;
  description: string;
  confidence: Confidence;
  category: ErrorCategory;
  potentialEur?: number | null;
  legalBasis?: string | null;
  actionText?: string | null;
  evidence?: string | null;
}

export interface ContactData {
  tenantName?: string | null;
  tenantAddress?: string | null;
  landlordName?: string | null;
  landlordAddress?: string | null;
  contractNumber?: string | null;
  billingPeriod?: string | null;
}

export interface AnalysisResult {
  notAStatement?: boolean;
  summary: string;
  errors: ErrorItem[];
  totalPotentialEur?: number | null;
  totalPotentialLabel?: string | null;
  directPotentialEur?: number | null;
  reviewPotentialEur?: number | null;
  contactData?: ContactData;
}

export type LetterType = "objection" | "document_review" | "combined";

export interface LetterPdfResponse {
  letter: string;
  pdfBase64: string;
  filename: string;
}
```

- [ ] **Step 2: Typecheck**

Run (in `mobile/`): `npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/types.ts
git commit -m "feat(mobile): Bericht-/Brief-Typen ergaenzt"
```

---

## Task 3: Theme – Confidence-Farben

**Files:**
- Modify: `mobile/src/theme.ts`

- [ ] **Step 1: Confidence-Farbsätze anfügen**

In `mobile/src/theme.ts` ganz **oben** (vor `export const colors`) den Import ergänzen:

```ts
import type { Confidence } from "./types";
```

Dann **nach** dem `radius`-Export anfügen:

```ts
/** Farbsätze je Erfolgsaussicht – gespiegelt aus dem Web-Design. */
export const confidence: Record<
  Confidence,
  { label: string; bg: string; border: string; text: string; dot: string }
> = {
  sicher: { label: "Sicher", bg: "#0F2B1F", border: "#166534", text: "#4ADE80", dot: "#22C55E" },
  wahrscheinlich: { label: "Wahrscheinlich", bg: "#1C1A0E", border: "#92400E", text: "#FCD34D", dot: "#F59E0B" },
  unsicher: { label: "Unsicher", bg: "#1C0F0F", border: "#991B1B", text: "#FCA5A5", dot: "#EF4444" },
};
```

- [ ] **Step 2: Typecheck**

Run (in `mobile/`): `npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/theme.ts
git commit -m "feat(mobile): Confidence-Farben im Theme"
```

---

## Task 4: API-Client `report.ts` (TDD)

**Files:**
- Create: `mobile/src/api/report.ts`
- Test: `mobile/src/api/report.test.ts`

- [ ] **Step 1: Failing-Test schreiben**

`mobile/src/api/report.test.ts`:

```ts
import { fetchReport, generateLetter, reportPdfUrl } from "./report";
import type { AnalysisResult, LetterPdfResponse } from "../types";

const report: AnalysisResult = {
  summary: "S",
  errors: [
    { title: "A", description: "d", confidence: "sicher", category: "direct", potentialEur: 10 },
  ],
  totalPotentialEur: 10,
};

afterEach(() => jest.restoreAllMocks());

describe("fetchReport", () => {
  it("gibt bei 200 den AnalysisResult zurück", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => report }) as unknown as typeof fetch;
    const res = await fetchReport("abc");
    expect(res).toEqual({ ok: true, data: report });
  });

  it("reicht die deutsche Server-Fehlermeldung durch", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, json: async () => ({ error: "Abgelaufen." }) }) as unknown as typeof fetch;
    const res = await fetchReport("abc");
    expect(res).toEqual({ ok: false, message: "Abgelaufen." });
  });

  it("liefert eine Netzwerk-Meldung, wenn fetch wirft", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("net")) as unknown as typeof fetch;
    const res = await fetchReport("abc");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toMatch(/Verbindung fehlgeschlagen/);
  });
});

describe("generateLetter", () => {
  it("gibt bei 200 die LetterPdfResponse zurück", async () => {
    const letter: LetterPdfResponse = { letter: "Text", pdfBase64: "AAAA", filename: "Widerspruch.pdf" };
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => letter }) as unknown as typeof fetch;
    const res = await generateLetter("abc", "objection", {});
    expect(res).toEqual({ ok: true, data: letter });
  });

  it("reicht Server-Fehler durch", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, json: async () => ({ error: "Keine Punkte." }) }) as unknown as typeof fetch;
    const res = await generateLetter("abc", "objection", {});
    expect(res).toEqual({ ok: false, message: "Keine Punkte." });
  });
});

describe("reportPdfUrl", () => {
  it("baut die URL mit id", () => {
    expect(reportPdfUrl("abc")).toMatch(/\/api\/generate-report\?id=abc$/);
  });
});
```

- [ ] **Step 2: Test ausführen (muss fehlschlagen)**

Run (in `mobile/`): `npx jest src/api/report.test.ts`
Expected: FAIL („Cannot find module './report'").

- [ ] **Step 3: Implementierung schreiben**

`mobile/src/api/report.ts`:

```ts
import { API_BASE_URL } from "../config";
import type { AnalysisResult, ContactData, LetterPdfResponse, LetterType } from "../types";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; message: string };

const NETWORK_MSG =
  "Verbindung fehlgeschlagen. Bitte prüfe deine Internetverbindung und versuche es erneut.";
const PARSE_MSG = "Die Antwort konnte nicht verarbeitet werden. Bitte versuche es erneut.";
const GENERIC_MSG = "Es ist ein Fehler aufgetreten. Bitte versuche es erneut.";

async function parseJson(res: Response): Promise<unknown | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchReport(id: string): Promise<ApiResult<AnalysisResult>> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/result?id=${encodeURIComponent(id)}`);
  } catch {
    return { ok: false, message: NETWORK_MSG };
  }
  const json = await parseJson(res);
  if (json === null) return { ok: false, message: PARSE_MSG };
  if (!res.ok) {
    return { ok: false, message: (json as { error?: string }).error ?? GENERIC_MSG };
  }
  return { ok: true, data: json as AnalysisResult };
}

export async function generateLetter(
  id: string,
  type: LetterType,
  contact: ContactData,
): Promise<ApiResult<LetterPdfResponse>> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/generate-letter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type, contact }),
    });
  } catch {
    return { ok: false, message: NETWORK_MSG };
  }
  const json = await parseJson(res);
  if (json === null) return { ok: false, message: PARSE_MSG };
  if (!res.ok) {
    return { ok: false, message: (json as { error?: string }).error ?? GENERIC_MSG };
  }
  return { ok: true, data: json as LetterPdfResponse };
}

export function reportPdfUrl(id: string): string {
  return `${API_BASE_URL}/api/generate-report?id=${encodeURIComponent(id)}`;
}
```

- [ ] **Step 4: Test ausführen (muss bestehen)**

Run (in `mobile/`): `npx jest src/api/report.test.ts`
Expected: PASS (6 Tests grün).

- [ ] **Step 5: Commit**

```bash
git add mobile/src/api/report.ts mobile/src/api/report.test.ts
git commit -m "feat(mobile): report-API-Client (fetchReport/generateLetter) mit TDD"
```

---

## Task 5: `expo-sharing` + `lib/pdf.ts` (TDD)

**Files:**
- Modify: `mobile/package.json` (via expo install)
- Create: `mobile/src/lib/pdf.ts`
- Test: `mobile/src/lib/pdf.test.ts`

- [ ] **Step 1: expo-sharing installieren**

Run (in `mobile/`): `npx expo install expo-sharing`
Expected: `expo-sharing` erscheint in `package.json` dependencies.

> Vor der Implementierung kurz die v56-Docs prüfen: `expo-sharing` (`Sharing.isAvailableAsync`, `Sharing.shareAsync`) und der **Legacy-Writer** `expo-file-system/legacy` (`writeAsStringAsync` mit `EncodingType.Base64`, `downloadAsync`, `cacheDirectory`). Base64→Datei läuft bewusst über den Legacy-Writer (App-eigenes Cache-Verzeichnis → unproblematisch, kein Scoped-Read wie beim DocumentPicker).

- [ ] **Step 2: Failing-Test schreiben**

`mobile/src/lib/pdf.test.ts`:

```ts
import { savePdfAndShare } from "./pdf";

jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "file:///cache/",
  EncodingType: { Base64: "base64" },
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  downloadAsync: jest.fn().mockResolvedValue({ status: 200, uri: "file:///cache/x.pdf" }),
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

afterEach(() => jest.clearAllMocks());

describe("savePdfAndShare", () => {
  it("schreibt das base64-PDF und öffnet das Teilen-Sheet", async () => {
    await savePdfAndShare("AAAA", "Brief.pdf");
    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      "file:///cache/Brief.pdf",
      "AAAA",
      { encoding: "base64" },
    );
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      "file:///cache/Brief.pdf",
      expect.objectContaining({ mimeType: "application/pdf" }),
    );
  });

  it("wirft eine deutsche Meldung, wenn Teilen nicht verfügbar ist", async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
    await expect(savePdfAndShare("AAAA", "Brief.pdf")).rejects.toThrow(/nicht verfügbar/);
  });
});
```

- [ ] **Step 3: Test ausführen (muss fehlschlagen)**

Run (in `mobile/`): `npx jest src/lib/pdf.test.ts`
Expected: FAIL („Cannot find module './pdf'").

- [ ] **Step 4: Implementierung schreiben**

`mobile/src/lib/pdf.ts`:

```ts
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

const PDF_OPTS = { mimeType: "application/pdf", UTI: "com.adobe.pdf" as const };

/** Schreibt ein base64-PDF in den App-Cache und öffnet das native Teilen-Sheet. */
export async function savePdfAndShare(base64: string, filename: string): Promise<void> {
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Teilen ist auf diesem Gerät nicht verfügbar.");
  }
  await Sharing.shareAsync(uri, PDF_OPTS);
}

/** Lädt ein PDF von einer URL in den Cache und öffnet das native Teilen-Sheet. */
export async function downloadAndShare(url: string, filename: string): Promise<void> {
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  const { status } = await FileSystem.downloadAsync(url, uri);
  if (status !== 200) {
    throw new Error("Das PDF konnte nicht geladen werden. Bitte versuche es erneut.");
  }
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Teilen ist auf diesem Gerät nicht verfügbar.");
  }
  await Sharing.shareAsync(uri, PDF_OPTS);
}
```

- [ ] **Step 5: Test ausführen (muss bestehen)**

Run (in `mobile/`): `npx jest src/lib/pdf.test.ts`
Expected: PASS (2 Tests grün).

- [ ] **Step 6: Commit**

```bash
git add mobile/package.json mobile/package-lock.json mobile/src/lib/pdf.ts mobile/src/lib/pdf.test.ts
git commit -m "feat(mobile): PDF speichern + natives Teilen (expo-sharing) mit TDD"
```

---

## Task 6: `ErrorCard`-Komponente

**Files:**
- Create: `mobile/src/components/ErrorCard.tsx`

- [ ] **Step 1: Komponente schreiben**

`mobile/src/components/ErrorCard.tsx`:

```tsx
import { View, Text, StyleSheet } from "react-native";
import type { ErrorItem } from "../types";
import { confidence, spacing, radius } from "../theme";

function formatEur(value: number): string {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

export function ErrorCard({ error }: { error: ErrorItem }) {
  const c = confidence[error.confidence];
  return (
    <View style={[styles.card, { backgroundColor: c.bg, borderColor: c.border }]}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: c.dot }]} />
        <View style={styles.body}>
          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <Text style={[styles.title, { color: c.text }]}>{error.title}</Text>
              <Text style={[styles.confLabel, { color: c.text }]}>{c.label.toUpperCase()}</Text>
            </View>
            {error.potentialEur != null && (
              <Text style={[styles.eur, { color: c.text }]}>~{formatEur(error.potentialEur)}</Text>
            )}
          </View>
          <Text style={styles.desc}>{error.description}</Text>
          {error.legalBasis ? (
            <Text style={styles.meta}>Rechtsgrundlage: {error.legalBasis}</Text>
          ) : null}
          {error.evidence ? (
            <Text style={styles.evidence}>Beleg im Dokument: „{error.evidence}"</Text>
          ) : null}
          {error.actionText ? (
            <Text style={styles.action}>
              <Text style={styles.actionStrong}>Empfehlung: </Text>
              {error.actionText}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  row: { flexDirection: "row", gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  body: { flex: 1 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  titleWrap: { flex: 1 },
  title: { fontSize: 14, fontWeight: "700" },
  confLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1, marginTop: 2, opacity: 0.7 },
  eur: { fontSize: 13, fontWeight: "700" },
  desc: { color: "#94A3B8", fontSize: 14, marginTop: spacing.sm, lineHeight: 20 },
  meta: { color: "#64748B", fontSize: 12, marginTop: spacing.sm },
  evidence: { color: "#475569", fontSize: 12, marginTop: 4, fontStyle: "italic" },
  action: { color: "#94A3B8", fontSize: 12, marginTop: spacing.sm, lineHeight: 18 },
  actionStrong: { color: "#CBD5E1", fontWeight: "700" },
});
```

- [ ] **Step 2: Typecheck**

Run (in `mobile/`): `npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/components/ErrorCard.tsx
git commit -m "feat(mobile): ErrorCard-Komponente"
```

---

## Task 7: `ContactForm`-Komponente

**Files:**
- Create: `mobile/src/components/ContactForm.tsx`

- [ ] **Step 1: Komponente schreiben**

`mobile/src/components/ContactForm.tsx`:

```tsx
import { View, Text, TextInput, StyleSheet } from "react-native";
import type { ContactData } from "../types";
import { colors, spacing, radius } from "../theme";

type Props = { contact: ContactData; onChange: (next: ContactData) => void };

const FIELDS: { key: keyof ContactData; label: string; placeholder: string }[] = [
  { key: "tenantName", label: "Dein Name", placeholder: "Max Mustermann" },
  { key: "tenantAddress", label: "Deine Adresse", placeholder: "Musterstraße 1, 12345 Musterstadt" },
  { key: "landlordName", label: "Vermieter", placeholder: "Vermietung Beispiel GmbH" },
  { key: "landlordAddress", label: "Adresse Vermieter", placeholder: "Hauptstraße 99, 12345 Musterstadt" },
  { key: "contractNumber", label: "Vertragsnummer (optional)", placeholder: "MV-2024-0815" },
  { key: "billingPeriod", label: "Abrechnungszeitraum", placeholder: "01.01.2024 - 31.12.2024" },
];

export function ContactForm({ contact, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      {FIELDS.map((f) => (
        <View key={f.key}>
          <Text style={styles.label}>{f.label}</Text>
          <TextInput
            style={styles.input}
            value={contact[f.key] ?? ""}
            onChangeText={(t) => onChange({ ...contact, [f.key]: t })}
            placeholder={f.placeholder}
            placeholderTextColor={colors.border}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: "600", marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 15,
  },
});
```

- [ ] **Step 2: Typecheck**

Run (in `mobile/`): `npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/components/ContactForm.tsx
git commit -m "feat(mobile): ContactForm-Komponente"
```

---

## Task 8: Bericht-Screen `app/report.tsx`

**Files:**
- Create: `mobile/src/app/report.tsx`

- [ ] **Step 1: Screen schreiben**

`mobile/src/app/report.tsx`:

```tsx
import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { AnalysisResult, ErrorItem, LetterType } from "../types";
import { fetchReport, reportPdfUrl } from "../api/report";
import { downloadAndShare } from "../lib/pdf";
import { ErrorCard } from "../components/ErrorCard";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { colors, spacing, radius } from "../theme";

function formatEur(value: number): string {
  return `${value.toFixed(2).replace(".", ",")} €`;
}
function sumPotential(errors: ErrorItem[]): number {
  return errors.reduce((s, e) => s + (e.potentialEur ?? 0), 0);
}

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setData(null);
    const res = await fetchReport(id);
    if (res.ok) setData(res.data);
    else setError(res.message);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{error}</Text>
        <Pressable style={styles.retry} onPress={load}>
          <Text style={styles.retryText}>Erneut versuchen</Text>
        </Pressable>
      </View>
    );
  }
  if (!data) {
    return (
      <View style={styles.center}>
        <LoadingIndicator />
      </View>
    );
  }

  const directErrors = data.errors.filter((e) => e.category === "direct");
  const reviewErrors = data.errors.filter((e) => e.category === "needs_review");
  const directTotal = data.directPotentialEur ?? sumPotential(directErrors);
  const reviewTotal = data.reviewPotentialEur ?? sumPotential(reviewErrors);
  const total = data.totalPotentialEur ?? directTotal + reviewTotal;
  const hasErrors = data.errors.length > 0;

  const goLetter = (type: LetterType) =>
    router.push({
      pathname: "/letter",
      params: { id, type, contact: JSON.stringify(data.contactData ?? {}) },
    });

  const shareReportPdf = async () => {
    try {
      await downloadAndShare(reportPdfUrl(id), "Pruefbericht.pdf");
    } catch (e) {
      Alert.alert("Hinweis", e instanceof Error ? e.message : "Aktion fehlgeschlagen.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Geschätztes Erstattungspotenzial</Text>
        <Text style={styles.summaryValue}>{hasErrors ? formatEur(total) : "0 €"}</Text>
        {hasErrors && (
          <View style={styles.splitRow}>
            <View style={styles.splitCol}>
              <Text style={styles.splitLabel}>Sofort angreifbar</Text>
              <Text style={[styles.splitValue, { color: colors.green }]}>{formatEur(directTotal)}</Text>
              <Text style={styles.splitCount}>{directErrors.length} Punkt{directErrors.length !== 1 ? "e" : ""}</Text>
            </View>
            <View style={styles.splitCol}>
              <Text style={styles.splitLabel}>Nach Belegeinsicht</Text>
              <Text style={[styles.splitValue, { color: colors.yellow }]}>{formatEur(reviewTotal)}</Text>
              <Text style={styles.splitCount}>{reviewErrors.length} Punkt{reviewErrors.length !== 1 ? "e" : ""}</Text>
            </View>
          </View>
        )}
        {data.summary ? <Text style={styles.summaryText}>{data.summary}</Text> : null}
      </View>

      <Pressable style={styles.outlineBtn} onPress={shareReportPdf}>
        <Text style={styles.outlineBtnText}>Bericht als PDF teilen</Text>
      </Pressable>

      {/* Section A */}
      {directErrors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sofort angreifbar</Text>
          <Text style={styles.sectionSub}>Eindeutige Rechtsverstöße – direkter Widerspruch möglich</Text>
          {directErrors.map((e, i) => (
            <ErrorCard key={`d-${i}`} error={e} />
          ))}
          <Pressable style={styles.primaryBtn} onPress={() => goLetter("objection")}>
            <Text style={styles.primaryBtnText}>Widerspruch erstellen</Text>
          </Pressable>
        </View>
      )}

      {/* Section B */}
      {reviewErrors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Belegeinsicht erforderlich</Text>
          <Text style={styles.sectionSub}>Verdacht auf Fehler – Belege beim Vermieter anfordern</Text>
          {reviewErrors.map((e, i) => (
            <ErrorCard key={`r-${i}`} error={e} />
          ))}
          <Pressable style={styles.secondaryBtn} onPress={() => goLetter("document_review")}>
            <Text style={styles.secondaryBtnText}>Belegeinsicht anfordern</Text>
          </Pressable>
        </View>
      )}

      {/* Combined */}
      {directErrors.length > 0 && reviewErrors.length > 0 && (
        <Pressable style={styles.outlineAccentBtn} onPress={() => goLetter("combined")}>
          <Text style={styles.outlineAccentText}>Kombiniertes Schreiben erstellen</Text>
        </Pressable>
      )}

      {!hasErrors && (
        <View style={styles.okBox}>
          <Text style={styles.okTitle}>Keine offensichtlichen Fehler gefunden</Text>
          <Text style={styles.okText}>
            Das bedeutet nicht, dass die Abrechnung fehlerfrei ist – bei Zweifeln lohnt sich eine rechtliche Prüfung.
          </Text>
        </View>
      )}

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>
        Hinweis: Diese Analyse ist eine automatisierte Einschätzung ohne Rechtsverbindlichkeit und ersetzt keine
        anwaltliche Beratung. Beträge sind Schätzungen. Generierte Briefe sind Vorlagen und sollten vor dem
        Versand geprüft werden.
      </Text>

      <Pressable style={styles.outlineBtn} onPress={() => router.navigate("/")}>
        <Text style={styles.outlineBtnText}>Neue Abrechnung prüfen</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.md, backgroundColor: colors.bg, flexGrow: 1 },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", padding: spacing.xl, gap: spacing.md },
  muted: { color: colors.textMuted, fontSize: 15, textAlign: "center", lineHeight: 22 },
  retry: { backgroundColor: colors.accentFrom, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryText: { color: "#fff", fontWeight: "700" },
  summary: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  summaryLabel: { color: colors.textMuted, fontSize: 13 },
  summaryValue: { color: colors.accentTo, fontSize: 34, fontWeight: "800", marginTop: 4 },
  splitRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md, paddingTop: spacing.md, borderTopColor: colors.border, borderTopWidth: 1 },
  splitCol: { flex: 1 },
  splitLabel: { color: colors.textMuted, fontSize: 12 },
  splitValue: { fontSize: 18, fontWeight: "800", marginTop: 2 },
  splitCount: { color: "#475569", fontSize: 12 },
  summaryText: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: spacing.md, paddingTop: spacing.md, borderTopColor: colors.border, borderTopWidth: 1 },
  section: { gap: spacing.sm, marginTop: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  sectionSub: { color: "#64748B", fontSize: 12, marginBottom: spacing.xs },
  primaryBtn: { backgroundColor: colors.accentFrom, borderRadius: radius.md, padding: spacing.md, alignItems: "center", marginTop: spacing.xs },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  secondaryBtn: { backgroundColor: colors.border, borderRadius: radius.md, padding: spacing.md, alignItems: "center", marginTop: spacing.xs },
  secondaryBtnText: { color: "#CBD5E1", fontSize: 15, fontWeight: "700" },
  outlineAccentBtn: { borderColor: colors.accentFrom, borderWidth: 2, borderRadius: radius.md, padding: spacing.md, alignItems: "center" },
  outlineAccentText: { color: colors.accentTo, fontSize: 15, fontWeight: "700" },
  outlineBtn: { borderColor: colors.border, borderWidth: 2, borderRadius: radius.md, padding: spacing.md, alignItems: "center" },
  outlineBtnText: { color: colors.textMuted, fontSize: 15, fontWeight: "700" },
  okBox: { backgroundColor: "#0F2B1F", borderColor: "#166534", borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  okTitle: { color: colors.green, fontSize: 16, fontWeight: "700" },
  okText: { color: "#86EFAC", fontSize: 14, lineHeight: 20 },
  disclaimer: { color: "#64748B", fontSize: 12, lineHeight: 18, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
});
```

- [ ] **Step 2: Typecheck**

Run (in `mobile/`): `npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/app/report.tsx
git commit -m "feat(mobile): Bericht-Screen (report.tsx)"
```

---

## Task 9: Brief-Screen `app/letter.tsx`

**Files:**
- Create: `mobile/src/app/letter.tsx`

- [ ] **Step 1: Screen schreiben**

`mobile/src/app/letter.tsx`:

```tsx
import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import type { ContactData, LetterType, LetterPdfResponse } from "../types";
import { generateLetter } from "../api/report";
import { savePdfAndShare } from "../lib/pdf";
import { ContactForm } from "../components/ContactForm";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { colors, spacing, radius } from "../theme";

function parseContact(raw?: string): ContactData {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ContactData;
  } catch {
    return {};
  }
}

export default function LetterScreen() {
  const params = useLocalSearchParams<{ id: string; type: string; contact?: string }>();
  const id = params.id;
  const type = params.type as LetterType;

  const [contact, setContact] = useState<ContactData>(parseContact(params.contact));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LetterPdfResponse | null>(null);

  const create = async () => {
    setLoading(true);
    const res = await generateLetter(id, type, contact);
    setLoading(false);
    if (!res.ok) {
      Alert.alert("Hinweis", res.message);
      return;
    }
    setResult(res.data);
  };

  const share = async () => {
    if (!result) return;
    try {
      await savePdfAndShare(result.pdfBase64, result.filename);
    } catch (e) {
      Alert.alert("Hinweis", e instanceof Error ? e.message : "Teilen fehlgeschlagen.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <LoadingIndicator />
      </View>
    );
  }

  if (result) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Dein Schreiben ist fertig</Text>
        <View style={styles.preview}>
          <Text style={styles.previewText}>{result.letter}</Text>
        </View>
        <Pressable style={styles.primaryBtn} onPress={share}>
          <Text style={styles.primaryBtnText}>Als PDF teilen / speichern</Text>
        </Pressable>
        <Text style={styles.hint}>
          Über das Teilen-Menü kannst du das PDF per Mail senden, drucken oder speichern.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Kontaktdaten prüfen</Text>
      <Text style={styles.muted}>
        Diese Angaben erscheinen im Schreiben. Bitte ergänze fehlende Felder.
      </Text>
      <ContactForm contact={contact} onChange={setContact} />
      <Pressable style={styles.primaryBtn} onPress={create}>
        <Text style={styles.primaryBtnText}>PDF erstellen</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.md, backgroundColor: colors.bg, flexGrow: 1 },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: "center" },
  heading: { color: colors.text, fontSize: 22, fontWeight: "800" },
  muted: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  preview: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  previewText: { color: colors.text, fontSize: 13, lineHeight: 20 },
  primaryBtn: { backgroundColor: colors.accentFrom, borderRadius: radius.lg, padding: spacing.md, alignItems: "center", marginTop: spacing.sm },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  hint: { color: colors.textMuted, fontSize: 13, textAlign: "center", lineHeight: 18 },
});
```

- [ ] **Step 2: Typecheck**

Run (in `mobile/`): `npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 3: Commit**

```bash
git add mobile/src/app/letter.tsx
git commit -m "feat(mobile): Brief-Screen (letter.tsx)"
```

---

## Task 10: Navigation verdrahten (`_layout.tsx`, `result.tsx`)

**Files:**
- Modify: `mobile/src/app/_layout.tsx:19`
- Modify: `mobile/src/app/result.tsx`

- [ ] **Step 1: Screens registrieren**

In `mobile/src/app/_layout.tsx` nach der `result`-Zeile einfügen:

```tsx
        <Stack.Screen name="result" options={{ title: "Ergebnis" }} />
        <Stack.Screen name="report" options={{ title: "Prüfbericht" }} />
        <Stack.Screen name="letter" options={{ title: "Schreiben erstellen" }} />
```

- [ ] **Step 2: Teaser-Karte zur Bericht-Aktion machen**

In `mobile/src/app/result.tsx`: Imports oben ergänzen (`Pressable` zu react-native, `useRouter`):

```tsx
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
```

In der Komponente nach `const { data } = useLocalSearchParams...` ergänzen:

```tsx
  const router = useRouter();
```

Den Paywall-Block ersetzen durch:

```tsx
      {/* Im Demo führt diese Aktion direkt zum Bericht.
          Hier kommt später die Bezahlung dazwischen (Google Play Billing). */}
      <Pressable
        style={styles.paywall}
        onPress={() => router.push({ pathname: "/report", params: { id: preview.id } })}
      >
        <Text style={styles.paywallTitle}>Vollständigen Bericht anzeigen</Text>
        <Text style={styles.muted}>
          Detaillierte Begründung je Fehler, rechtliche Grundlage und fertige
          Schreiben zum Teilen.
        </Text>
      </Pressable>
```

- [ ] **Step 3: Typecheck**

Run (in `mobile/`): `npx tsc --noEmit`
Expected: keine Fehler.

- [ ] **Step 4: Commit**

```bash
git add mobile/src/app/_layout.tsx mobile/src/app/result.tsx
git commit -m "feat(mobile): Navigation Teaser -> Bericht -> Brief verdrahtet"
```

---

## Task 11: Verifikation (tsc, jest, Emulator-E2E)

**Files:** keine (nur Prüfung)

- [ ] **Step 1: Voller Typecheck + alle Tests**

Run (in `mobile/`): `npx tsc --noEmit && npx jest`
Expected: tsc fehlerfrei; Jest alle grün (M1 + neue report/pdf-Tests).

- [ ] **Step 2: Dev-Build starten**

Emulator starten (falls nicht laufend): `& E:\Android\emulator\emulator.exe -avd Pixel_7`
Dann (in `mobile/`, mit `JAVA_HOME=E:\Java\jdk-17.0.13+11`): `npx expo run:android`
Expected: App startet auf dem Pixel_7.

> Wenn UI-Änderungen nicht erscheinen: App hart neu starten — `adb shell am force-stop com.anonymous.nebenkostencheck` + neu öffnen (Metro-Watcher auf E: ist unzuverlässig).

- [ ] **Step 3: End-to-End manuell prüfen (MOCK, 0 Cent)**

Ablauf auf dem Emulator (PDF `test_abrechnung.pdf` liegt in `/sdcard/Download/`):
1. Home → „Abrechnung prüfen" → Upload → PDF auswählen → „Prüfen" → Teaser.
2. Teaser → „Vollständigen Bericht anzeigen" → **Bericht** lädt (Summary 132,5 €, Sektion A mit 2 Karten, Sektion B mit 1 Karte, Legende/Disclaimer).
3. „Widerspruch erstellen" → **Brief**-Screen → Kontaktformular (vorbefüllt Mustermann) → „PDF erstellen" → Brieftext-Vorschau.
4. „Als PDF teilen / speichern" → natives Teilen-Sheet öffnet sich.
5. Zurück → „Kombiniertes Schreiben erstellen" → erzeugt ebenfalls.
6. Bericht → „Bericht als PDF teilen" → Teilen-Sheet.

Expected: alle Schritte ohne Absturz, deutsche Texte, PDFs teilbar.

- [ ] **Step 4: Doku + Memory aktualisieren**

- `docs/MOBILE-APP.md`: Abschnitt 7 (Stand) um Bericht-/Brief-Flow ergänzen; Projektstruktur (Abschnitt 4) um `report.tsx`, `letter.tsx`, `ErrorCard.tsx`, `ContactForm.tsx`, `api/report.ts`, `lib/pdf.ts` erweitern; Abschnitt 9 (offene Punkte) anpassen; neue Dependency `expo-sharing` nennen; Backend-MOCK-Freigabe dokumentieren.
- Memory `project-mobile-app.md`: M2-Stand + MOCK-Freigabe-Mechanismus festhalten.

- [ ] **Step 5: Commit + Push**

```bash
git add docs/MOBILE-APP.md
git commit -m "docs: Meilenstein 2 (Bericht + Briefe) dokumentiert"
git push origin monetarisierung
```

---

## Self-Review-Notiz (Plan ↔ Spec)

- **Spec §4 (MOCK-Freigabe)** → Task 1. **§5 (Bausteine)** → Tasks 2–9. **§6 (Navigation)** → Task 10. **§7 (Teilen)** → Tasks 5 + 9. **§8 (Fehler)** → in report/letter/pdf enthalten. **§9 (Tests)** → Tasks 4, 5, 11. **§10 (expo-sharing)** → Task 5. **§12 (DoD)** → Task 11.
- Typen konsistent: `ApiResult<T>` (Task 4) wird in report.tsx/letter.tsx genutzt; `AnalysisResult`/`ErrorItem`/`ContactData`/`LetterType`/`LetterPdfResponse` (Task 2) durchgehend; `confidence` (Task 3) in ErrorCard (Task 6).
- Kein Platzhalter; jede Code-Datei vollständig.
