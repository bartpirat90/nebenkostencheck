# Analyse-Verbesserung Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dokumentvalidierung (falsches Dokument → deutsche Fehlermeldung), erweiterter Fehlerkatalog (§ 7 HeizkV, § 1 BetrKV, § 259 BGB), nutzerfreundliche API-Fehlermeldungen auf Deutsch.

**Architecture:** Alle Änderungen in einem einzigen Gemini-Aufruf pro Upload (kein zweiter Validierungs-Request). Der bestehende SYSTEM_PROMPT wird um einen Pflicht-Schritt 0 (Dokumentprüfung) und neue Fehlerregeln erweitert. Die API-Routen bekommen verbesserte Fehlerbehandlung. Das Frontend zeigt bei `notAStatement: true` eine Info-Box statt der Ergebnisansicht.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v3, `@google/generative-ai` (Gemini 2.5 Flash)

---

## Dateiübersicht

| Aktion | Datei | Inhalt |
|---|---|---|
| Ändern | `src/types/index.ts` | `notAStatement?: boolean` zu `AnalysisResult` hinzufügen |
| Ändern | `src/app/api/analyze/route.ts` | Neuer SYSTEM_PROMPT + verbessertes Error-Handling |
| Ändern | `src/app/api/generate-letter/route.ts` | Verbessertes Error-Handling |
| Ändern | `src/app/page.tsx` | `notAStatement`-Info-Box statt ResultView |

---

## Task 1: Type-Erweiterung — `notAStatement`

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Schritt 1: `notAStatement` zu `AnalysisResult` hinzufügen**

Ersetze die `AnalysisResult`-Interface in `src/types/index.ts`:

```typescript
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
```

- [ ] **Schritt 2: TypeScript-Check**

```bash
npx tsc --noEmit
```

Erwartetes Ergebnis: keine Ausgabe (0 Fehler).

- [ ] **Schritt 3: Committen**

```bash
git add src/types/index.ts
git commit -m "feat: add notAStatement field to AnalysisResult type"
```

---

## Task 2: Analyze-Route — Neuer Prompt + Error-Handling

**Files:**
- Modify: `src/app/api/analyze/route.ts`

- [ ] **Schritt 1: Komplette Datei ersetzen**

Ersetze den gesamten Inhalt von `src/app/api/analyze/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `Du bist ein Experte für deutsches Mietrecht, speziell für Betriebskostenabrechnungen (Nebenkostenabrechnungen) nach BetrKV und HeizkV. Du prüfst Abrechnungen auf typische Fehler und Mängel.

Du gibst AUSSCHLIESSLICH valides JSON zurück, ohne Markdown-Umrahmung, ohne Erklärungen davor oder danach.

═══════════════════════════════════════════════════════
SCHRITT 0 – DOKUMENTPRÜFUNG (PFLICHT, VOR ALLEM ANDEREN)
═══════════════════════════════════════════════════════

Prüfe ZUERST ob dieses Dokument eine deutsche Nebenkostenabrechnung (Betriebskostenabrechnung) ist.
Erkennungsmerkmale: Abrechnungszeitraum, Mieteranteil, Kostenauflistung (Heizung, Wasser, Müll,
Hausmeister etc.), Vermieter/Mieter-Angaben.

Wenn NEIN → gib ausschließlich zurück:
{
  "notAStatement": true,
  "summary": "Das hochgeladene Dokument ist keine Nebenkostenabrechnung. Bitte lade deine Abrechnung als PDF oder Foto hoch.",
  "errors": [],
  "totalPotentialEur": 0,
  "directPotentialEur": 0,
  "reviewPotentialEur": 0,
  "contactData": {}
}

Wenn JA → fahre mit der vollständigen Analyse fort.

═══════════════════════════════════════════════════════
KRITISCHE ANTI-HALLUZINATIONS-REGELN – STRENG BEFOLGEN!
═══════════════════════════════════════════════════════

1. NUR ZAHLEN VERWENDEN, DIE WÖRTLICH IM DOKUMENT STEHEN.
   - Erfinde NIEMALS Zahlen oder berechne komplexe Diskrepanzen.
   - Wenn du eine Zahl angibst, muss sie EXAKT so im PDF stehen.
   - Bei Unsicherheit: Fehler NICHT melden.

2. KEINE "RECHNERISCHEN DISKREPANZEN" KONSTRUIEREN.
   - Wenn ein Wert an verschiedenen Stellen unterschiedlich erscheint, prüfe SEHR sorgfältig ob es sich um den gleichen Wert handelt.
   - Posten wie "Anteilige Heizkosten" können Zwischensummen enthalten (z.B. mit/ohne CO2, mit/ohne Umlageausfallwagnis). Das sind KEINE Fehler.
   - Im Zweifel: NICHT als Fehler melden.

3. JEDER FEHLER BRAUCHT EINEN ZITIERBAREN BELEG.
   - Im Feld "evidence" muss ein wörtliches Zitat oder eine konkrete Stelle aus dem Dokument stehen.
   - Ohne klaren Beleg: Fehler NICHT melden.

4. § 9 ABS. 2 HEIZKV – NUR DIESER PUNKT IST RELEVANT:
   - Der Verstoß besteht ALLEIN darin, dass die Wärmemenge für Warmwasser PER FORMEL BERECHNET statt mit einem WÄRMEMENGENZÄHLER GEMESSEN wird.
   - NICHT die Temperatur in der Formel ist das Problem (die Werte 10°C/50°C/60°C sind in der Formel Q = 2,5 × V / 1,15 × (tw-10) per Definition korrekt: tw=60°C ergibt Faktor 50).
   - NICHT die Berechnungsmethode an sich (die ist gesetzlich vorgeschrieben WENN kein Zähler vorhanden).
   - DER FEHLER: Seit 31.12.2013 schreibt § 9 Abs. 2 HeizkV die INSTALLATION eines Wärmemengenzählers vor. Wenn die Abrechnung die Formel-Berechnung zeigt, fehlt der Zähler → § 12 HeizkV: 15 % Kürzungsrecht der Heizkosten.

═══════════════════════════════════════════════════════
KATEGORISIERUNG
═══════════════════════════════════════════════════════

Jeder Fehler erhält ZWEI Klassifikationen:

A) "category" – Vorgehen für den Mieter:
   - "direct" = sofort angreifbar (eindeutig aus Dokument hervorgehend)
   - "needs_review" = Belegeinsicht beim Vermieter erforderlich (§ 259 BGB)

B) "confidence" – Sicherheit der Erstattung:
   - "sicher" = klare Rechtsverletzung mit eindeutiger Rechtsgrundlage und unstrittiger Erstattungsfolge (z.B. § 12 HeizkV 15 % Kürzung, BGH-Urteile)
   - "wahrscheinlich" = überwiegende Erfolgsaussicht, aber Auslegung möglich (z.B. Position wirkt nicht umlagefähig, Belegprüfung notwendig)
   - "unsicher" = Verdacht der nur mit Belegen aufgeklärt werden kann oder bei dem die Rechtslage nicht eindeutig ist

═══════════════════════════════════════════════════════
TYPISCHE FEHLER (NUR MELDEN WENN BELEGT!)
═══════════════════════════════════════════════════════

SOFORT ANGREIFBAR + SICHER:
- § 9 Abs. 2 HeizkV: Warmwasser-Wärmemenge per Formel berechnet (kein Wärmemengenzähler) → 15 % Kürzungsrecht nach § 12 HeizkV
- § 7 Abs. 1 HeizkV: Heizkosten werden zu 100 % nach Wohnfläche verteilt (0 % Verbrauchsanteil erkennbar) → mindestens 50 % müssen nach Verbrauch umgelegt werden → 15 % Kürzungsrecht nach § 12 HeizkV. NUR melden wenn der Verteilerschlüssel wörtlich im Dokument steht und explizit 0 % Verbrauchsanteil zeigt.
- § 1 Abs. 2 BetrKV: Positionen mit wörtlichem Titel "Reparatur", "Instandhaltung" oder "Instandsetzung" (z.B. "Reparatur Aufzug", "Instandhaltung Heizungsanlage") → nie umlagefähig. NUR wenn der Begriff wörtlich im Positionstitel steht.
- § 259 BGB: Gesamtkosten des Gebäudes fehlen vollständig (keinerlei Gesamtkostenspalte oder -zeile erkennbar) → Abrechnung formell unwirksam. NUR melden wenn wirklich keine Gesamtkosten vorhanden sind, nicht wenn schwer lesbar.
- Pauschale Vorauszahlungserhöhungen ("+10 %", "+20 %" wegen "erwarteter Kostensteigerung") → BGH VIII ZR 78/12 verbietet das
- Abrechnungsfrist überschritten (§ 556 Abs. 3 BGB: 12 Monate nach Ende des Abrechnungszeitraums)
- Doppelt abgerechnete Positionen
- Fehlende Vorauszahlungen als Abzugsposten

SOFORT ANGREIFBAR + WAHRSCHEINLICH:
- § 1 Abs. 2 BetrKV: Verwaltungskosten als explizite Position (wörtlich "Verwaltungsgebühr", "Hausverwaltungskosten" oder "Verwalterhonorar" im Positionstitel) → nie umlagefähig. actionText: "Falls als Sammelbegriff für Hausmeister/Treppenhausreinigung: nicht relevant"
- Umlageausfallwagnis bei freifinanziertem Wohnraum (zulässig nur bei öffentlich gefördertem Wohnraum, § 25a NMV) – wenn kein Hinweis auf öffentliche Förderung erkennbar. actionText: "Falls Mietvertrag öffentlich gefördert: nicht relevant"
- Nicht umlagefähige Verwaltungs-/Instandhaltungskosten

BELEGEINSICHT + WAHRSCHEINLICH:
- Auffällig hohe Versicherungsbeiträge (könnte nicht umlagefähige Elementarversicherung enthalten)
- Hauswartleistungen ohne Aufschlüsselung (Verwaltung/Instandhaltung wäre nicht umlagefähig)
- Leerstandskosten: Wenn Gesamtfläche und Mieteranteil erkennbar sind und die Verhältnisse deutlich nicht mit der Wohnfläche des Mieters übereinstimmen → Vermieter könnte Leerstandskosten auf Mieter umgelegt haben (BGH VIII ZR 167/03). NUR melden bei deutlichem, rechnerisch belegbarem Widerspruch mit konkreten Zahlen aus dem Dokument.

BELEGEINSICHT + UNSICHER:
- Sperrmüllkosten (nur wenn regelmäßig anfallend umlagefähig)
- Wartung Rauchwarnmelder (Wartung ja, Anschaffung/Miete nein)
- Verbrauchserfassung-Kosten (Ablesung umlagefähig, Geräte-Anschaffung nicht)
- Auffällige Kostensteigerungen zum Vorjahr

═══════════════════════════════════════════════════════
JSON-FORMAT
═══════════════════════════════════════════════════════

{
  "summary": "Kurze Zusammenfassung der Abrechnung und Prüfung (2-3 Sätze)",
  "errors": [
    {
      "title": "Kurzer Fehlertitel",
      "description": "Genaue Erklärung des Fehlers, warum er relevant ist und welche Rechtsfolge greift",
      "confidence": "sicher|wahrscheinlich|unsicher",
      "category": "direct|needs_review",
      "potentialEur": 123.45,
      "legalBasis": "§ X BGB / BetrKV / HeizkV oder null",
      "actionText": "Konkrete Handlungsempfehlung für den Mieter",
      "evidence": "Wörtliches Zitat oder konkrete Stelle aus dem Dokument als Beleg"
    }
  ],
  "totalPotentialEur": 234.56,
  "directPotentialEur": 100.00,
  "reviewPotentialEur": 134.56,
  "totalPotentialLabel": "Nur wenn kein konkreter Betrag berechenbar: hoch, mittel oder niedrig",
  "contactData": {
    "tenantName": "Name des Mieters falls erkennbar",
    "tenantAddress": "Vollständige Adresse des Mieters falls erkennbar",
    "landlordName": "Name/Firma des Vermieters falls erkennbar",
    "landlordAddress": "Adresse des Vermieters/Verwalters falls erkennbar",
    "contractNumber": "Vertrags-/Mietnummer falls erkennbar",
    "billingPeriod": "Abrechnungszeitraum z.B. '01.01.2024 - 31.12.2024'"
  }
}

WICHTIG:
- Lieber WENIGER Fehler melden als FALSCHE Fehler erfinden.
- Setze potentialEur auf null wenn unsicher.
- Berechne directPotentialEur/reviewPotentialEur als Summen der jeweiligen Kategorien.
- Wenn keine Fehler gefunden werden, gib leeres errors-Array zurück.
- contactData-Felder auf null wenn nicht eindeutig erkennbar.

═══════════════════════════════════════════════════════
FINALER SELBST-CHECK VOR DER ANTWORT
═══════════════════════════════════════════════════════
Gehe vor der Ausgabe jeden Fehler durch und prüfe:
1. Steht die genannte Zahl WÖRTLICH im Dokument? Falls nein → entfernen.
2. Habe ich einen klaren Beleg im Dokument für diesen Fehler? Falls nein → entfernen.
3. Bei § 9 HeizkV: Habe ich nur die fehlende Wärmemengenzähler-Messung kritisiert (nicht die Temperaturwerte in der Formel)? Falls nein → korrigieren.`;

function classifyError(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("503") || msg.includes("service unavailable") || msg.includes("high demand")) {
    return "Die KI ist gerade stark ausgelastet. Bitte in einem Moment erneut versuchen.";
  }
  if (msg.includes("fetch failed") || msg.includes("network") || msg.includes("timeout") || msg.includes("econnrefused")) {
    return "Verbindung unterbrochen. Bitte erneut versuchen.";
  }
  return "Ein unbekannter Fehler ist aufgetreten. Bitte erneut versuchen.";
}

export async function POST(req: NextRequest) {
  try {
    const { base64, mediaType, fileName } = await req.json();

    if (!base64 || !mediaType) {
      return NextResponse.json({ error: "Keine Datei übermittelt." }, { status: 400 });
    }

    const isImage = mediaType.startsWith("image/");
    const isPdf = mediaType === "application/pdf";

    if (!isImage && !isPdf) {
      return NextResponse.json({ error: "Nur PDF und Bilder werden unterstützt." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mediaType,
          data: base64,
        },
      },
      `${SYSTEM_PROMPT}\n\nBitte analysiere diese Nebenkostenabrechnung (Dateiname: ${fileName || "unbekannt"}) und gib deine Prüfung als JSON zurück.`,
    ]);

    const rawText = result.response.text();
    const cleaned = rawText.replace(/```json\n?|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    console.error("Analysis error:", err);

    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Die Analyse konnte nicht verarbeitet werden. Bitte erneut versuchen." },
        { status: 500 }
      );
    }

    const message = err instanceof Error ? err.message : "";
    return NextResponse.json({ error: classifyError(message) }, { status: 500 });
  }
}
```

- [ ] **Schritt 2: TypeScript-Check**

```bash
npx tsc --noEmit
```

Erwartetes Ergebnis: keine Ausgabe (0 Fehler).

- [ ] **Schritt 3: Committen**

```bash
git add src/app/api/analyze/route.ts
git commit -m "feat: add document validation and expand error catalog in analyze route"
```

---

## Task 3: Generate-Letter-Route — Error-Handling

**Files:**
- Modify: `src/app/api/generate-letter/route.ts`

- [ ] **Schritt 1: `classifyError`-Hilfsfunktion hinzufügen und catch-Block ersetzen**

Ersetze den gesamten Inhalt von `src/app/api/generate-letter/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { LetterRequest } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

function classifyError(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes("503") || msg.includes("service unavailable") || msg.includes("high demand")) {
    return "Die KI ist gerade stark ausgelastet. Bitte in einem Moment erneut versuchen.";
  }
  if (msg.includes("fetch failed") || msg.includes("network") || msg.includes("timeout") || msg.includes("econnrefused")) {
    return "Verbindung unterbrochen. Bitte erneut versuchen.";
  }
  return "Ein unbekannter Fehler ist aufgetreten. Bitte erneut versuchen.";
}

function buildPrompt(req: LetterRequest): string {
  const { type, contact, errors } = req;
  const today = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const errorList = errors
    .map((e, i) => {
      const parts = [`${i + 1}. ${e.title}`];
      parts.push(`   Beschreibung: ${e.description}`);
      if (e.legalBasis) parts.push(`   Rechtsgrundlage: ${e.legalBasis}`);
      if (e.potentialEur != null) parts.push(`   Geschätztes Potenzial: ${e.potentialEur.toFixed(2)} €`);
      return parts.join("\n");
    })
    .join("\n\n");

  const tenant = `${contact.tenantName || "[Name Mieter]"}\n${contact.tenantAddress || "[Adresse Mieter]"}`;
  const landlord = `${contact.landlordName || "[Name Vermieter]"}\n${contact.landlordAddress || "[Adresse Vermieter]"}`;
  const contract = contact.contractNumber || "[Vertragsnummer]";
  const period = contact.billingPeriod || "[Abrechnungszeitraum]";

  if (type === "objection") {
    return `Erstelle einen formellen, höflichen aber bestimmten Widerspruch gegen eine Nebenkostenabrechnung.

ABSENDER (Mieter):
${tenant}

EMPFÄNGER (Vermieter):
${landlord}

Datum: ${today}
Vertragsnummer: ${contract}
Abrechnungszeitraum: ${period}

KONKRETE WIDERSPRUCHSPUNKTE (alle sind sofort angreifbare Rechtsverstöße):
${errorList}

ANFORDERUNGEN AN DEN BRIEF:
- Formaler deutscher Geschäftsbrief mit Briefkopf, Anrede, Betreff
- Betreff: "Widerspruch gegen die Nebenkostenabrechnung für den Zeitraum ${period}"
- Einleitung: kurzer Bezug auf die erhaltene Abrechnung
- Hauptteil: jeden Widerspruchspunkt einzeln nummerieren mit konkretem Verweis auf die Rechtsgrundlage
- Forderung: konkrete Korrektur der Abrechnung und Erstattung der zu Unrecht abgerechneten Beträge
- Fristsetzung: 14 Tage zur schriftlichen Stellungnahme
- Höfliche Schlussformel
- KEIN juristisches Übermaß, klar und nachvollziehbar
- Tonfall: bestimmt, sachlich, nicht aggressiv

Gib AUSSCHLIESSLICH den fertigen Brief zurück, ohne Erklärungen, ohne Markdown-Formatierung. Der Brief soll direkt kopierbar sein.`;
  }

  return `Erstelle ein formelles Schreiben zur Aufforderung der Belegeinsicht nach § 259 BGB.

ABSENDER (Mieter):
${tenant}

EMPFÄNGER (Vermieter):
${landlord}

Datum: ${today}
Vertragsnummer: ${contract}
Abrechnungszeitraum: ${period}

POSITIONEN, ZU DENEN BELEGEINSICHT GEFORDERT WIRD:
${errorList}

ANFORDERUNGEN AN DEN BRIEF:
- Formaler deutscher Geschäftsbrief mit Briefkopf, Anrede, Betreff
- Betreff: "Aufforderung zur Belegeinsicht – Nebenkostenabrechnung ${period}"
- Einleitung: Bezug auf die erhaltene Abrechnung und das Recht auf Belegeinsicht nach § 259 BGB
- Hauptteil: jede Position nummeriert mit konkreter Begründung warum Belegeinsicht erforderlich ist
- Forderung: Einsicht in die Originalbelege (Rechnungen, Verträge, Aufschlüsselungen) – wahlweise vor Ort oder durch Übersendung von Kopien
- Hinweis auf Vorbehalt der Anfechtung der entsprechenden Positionen bis zur Belegeinsicht
- Fristsetzung: 4 Wochen zur Terminvereinbarung bzw. Übersendung der Kopien
- Höfliche Schlussformel
- Tonfall: bestimmt, sachlich, kooperativ

Gib AUSSCHLIESSLICH den fertigen Brief zurück, ohne Erklärungen, ohne Markdown-Formatierung. Der Brief soll direkt kopierbar sein.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LetterRequest;

    if (!body.type || !body.errors || body.errors.length === 0) {
      return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(buildPrompt(body));
    const letter = result.response.text().trim();

    return NextResponse.json({ letter });
  } catch (err: unknown) {
    console.error("Letter generation error:", err);
    const message = err instanceof Error ? err.message : "";
    return NextResponse.json({ error: classifyError(message) }, { status: 500 });
  }
}
```

- [ ] **Schritt 2: TypeScript-Check**

```bash
npx tsc --noEmit
```

Erwartetes Ergebnis: keine Ausgabe (0 Fehler).

- [ ] **Schritt 3: Committen**

```bash
git add src/app/api/generate-letter/route.ts
git commit -m "fix: user-friendly German error messages in generate-letter route"
```

---

## Task 4: page.tsx — `notAStatement`-Info-Box

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Schritt 1: `NotAStatementBox`-Komponente und bedingte Renderlogik einbauen**

Ersetze den gesamten Inhalt von `src/app/page.tsx`:

```tsx
"use client";

import { useState, useCallback } from "react";
import UploadZone from "@/components/UploadZone";
import ResultView from "@/components/ResultView";
import LandingHero from "@/components/LandingHero";
import StatsBar from "@/components/StatsBar";
import HowItWorks from "@/components/HowItWorks";
import { AnalysisResult } from "@/types";

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const base64 = await fileToBase64(file);
      const mediaType = file.type || "application/pdf";

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, mediaType, fileName: file.name }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Analyse fehlgeschlagen");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <main className="min-h-screen bg-[#0F172A]">
      {/* Navigation */}
      <nav className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b border-[#1E293B] bg-[#0F172A]/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-black">NK</span>
          </div>
          <span className="font-black text-[#F1F5F9] tracking-tight text-lg">
            Nebenkostencheck
          </span>
        </div>
        <span className="text-xs text-[#64748B] bg-[#1E293B] px-3 py-1 rounded-full border border-[#334155]">
          Kostenlos & ohne Anmeldung
        </span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 pb-12">
        {/* Landing sections – nur vor der Analyse */}
        {!result && !loading && (
          <>
            <LandingHero />
            <StatsBar />
            <HowItWorks />
          </>
        )}

        {/* Upload oder Ergebnis */}
        <div id="upload">
          {!result ? (
            <UploadZone onUpload={handleFileUpload} loading={loading} error={error} />
          ) : result.notAStatement ? (
            <NotAStatementBox onReset={handleReset} />
          ) : (
            <ResultView result={result} onReset={handleReset} />
          )}
        </div>

        {/* Footer-Disclaimer */}
        {!result && !loading && (
          <p className="mt-8 text-center text-xs text-[#334155] leading-relaxed">
            © 2026 Nebenkostencheck · DSGVO-konform · Keine Datenspeicherung
          </p>
        )}
      </div>
    </main>
  );
}

function NotAStatementBox({ onReset }: { onReset: () => void }) {
  return (
    <div className="bg-[#1C1A0E] border border-[#92400E] rounded-2xl p-8 text-center">
      <div className="w-12 h-12 bg-[#451a03] rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-[#FCD34D]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <p className="font-bold text-[#FCD34D] text-lg mb-2">Kein passendes Dokument erkannt</p>
      <p className="text-sm text-[#D97706] leading-relaxed mb-6">
        Das sieht nicht wie eine Nebenkostenabrechnung aus.<br />
        Bitte lade deine Abrechnung als PDF oder Foto hoch.
      </p>
      <button
        onClick={onReset}
        className="rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold py-3 px-6 text-sm hover:opacity-90 transition-opacity"
      >
        Andere Datei hochladen
      </button>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

- [ ] **Schritt 2: Build-Check**

```bash
npm run build
```

Erwartetes Ergebnis: `✓ Compiled successfully` ohne TypeScript-Fehler.

- [ ] **Schritt 3: Manuell testen**

Dev-Server starten: `npm run dev`

Auf `http://localhost:3000` prüfen:
1. Ein Bild (kein Dokument, z.B. ein Foto) hochladen → gelbe Info-Box mit "Kein passendes Dokument erkannt" erscheint
2. Button "Andere Datei hochladen" → Reset, Landing Page erscheint wieder
3. Echte Nebenkostenabrechnung hochladen → normale Analyse wie bisher

- [ ] **Schritt 4: Committen**

```bash
git add src/app/page.tsx
git commit -m "feat: show info box for non-statement uploads"
```

---

## Abschließend: GitHub pushen

- [ ] **Alle Änderungen auf GitHub pushen**

```bash
git push origin main
```

Vercel deployed automatisch. Nach ~1-2 Minuten sind alle Änderungen live unter der Vercel-URL.

---

## Erfolgskriterien

- [ ] Upload einer Nicht-Nebenkostenabrechnung → gelbe Info-Box, kein Analyse-Ergebnis
- [ ] Upload einer gültigen Abrechnung → Analyse läuft wie bisher durch
- [ ] § 7 HeizkV, § 1 Abs. 2 BetrKV (Reparatur/Verwaltung), § 259 BGB im Prompt enthalten
- [ ] 503-Fehler beim Brief-Erstellen → „Die KI ist gerade stark ausgelastet…" statt englischem Stack-Trace
- [ ] `npm run build` läuft ohne Fehler
