# Redesign, Landing Page & Deployment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Das bestehende MVP bekommt ein Dark & Premium-Design (Violett-Akzent), eine vollständige Landing Page (Hero, Stats, How-it-works), und wird auf Vercel deployed.

**Architecture:** Single-Page Next.js App (`page.tsx` als Orchestrator). Drei neue Landing-Komponenten (`LandingHero`, `StatsBar`, `HowItWorks`) werden vor dem Upload-Flow eingebaut. Alle Komponenten werden im neuen Farbsystem (`#0F172A` Hintergrund, Violett-Akzent `#6366F1`→`#8B5CF6`) neu gestaltet. Login und Payment sind explizit Out of Scope.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS 3, TypeScript, `@google/generative-ai`

---

## Dateiübersicht

| Aktion | Datei | Inhalt |
|---|---|---|
| Erstellen | `src/components/LandingHero.tsx` | Hero mit Pill, H1-Gradient, CTA-Button, Trust-Signale |
| Erstellen | `src/components/StatsBar.tsx` | Drei-Spalten-Statistikleiste |
| Erstellen | `src/components/HowItWorks.tsx` | 3-Schritt-Erklärung mit Nummernicons |
| Ändern | `src/app/globals.css` | Dark-Body-Background |
| Keine Änderung | `src/app/layout.tsx` | Metadata bereits korrekt; Dark-Background via globals.css abgedeckt |
| Ändern | `src/app/page.tsx` | Dark Nav, Landing-Komponenten integrieren, Upload-Anker |
| Ändern | `src/components/UploadZone.tsx` | Dark-Theme, Violett-Akzent |
| Ändern | `src/components/ResultView.tsx` | Dark-Theme, Gradient-Betrag, dunkle Fehler-Karten |
| Ändern | `src/components/LetterModal.tsx` | Dark-Theme, Monospace-Vorschau |
| Ändern | `src/components/ContactForm.tsx` | Dark-Theme, Input-Styling |

---

## Task 1: Git initialisieren & globale Dark-Styles

**Files:**
- Run: `git init` im Projektverzeichnis `nebenkostencheck/nebenkostencheck`
- Modify: `src/app/globals.css`

- [ ] **Schritt 1: Git-Repository initialisieren**

Alle Befehle im Verzeichnis `nebenkostencheck/nebenkostencheck` ausführen (dort wo `package.json` liegt):

```bash
git init
git add .
git commit -m "chore: init git repository with existing MVP"
```

Hinweis: `node_modules/` und `.env.local` sind bereits in `.gitignore` eingetragen — sie werden nicht commitet.

- [ ] **Schritt 2: globals.css auf Dark-Background umstellen**

Ersetze den Inhalt von `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

body {
  -webkit-font-smoothing: antialiased;
  background-color: #0F172A;
  color: #F1F5F9;
}
```

- [ ] **Schritt 3: Dev-Server starten und Hintergrundfarbe prüfen**

```bash
npm run dev
```

Erwartetes Ergebnis: Browser auf `http://localhost:3000` — Hintergrund ist jetzt dunkel (`#0F172A`). Upload-Bereich ist noch im alten Beige-Design.

- [ ] **Schritt 4: Committen**

```bash
git add src/app/globals.css
git commit -m "style: dark background in globals.css"
```

---

## Task 2: LandingHero-Komponente erstellen

**Files:**
- Create: `src/components/LandingHero.tsx`

- [ ] **Schritt 1: Komponente erstellen**

Erstelle `src/components/LandingHero.tsx`:

```tsx
export default function LandingHero() {
  return (
    <section className="text-center pt-16 pb-10">
      <div className="inline-block bg-[#1E1B4B] text-[#A78BFA] text-xs font-bold px-3 py-1.5 rounded-full mb-5 border border-[#3730A3]">
        🏆 Bereits 2.400+ Abrechnungen geprüft
      </div>
      <h1 className="text-4xl font-black leading-tight mb-4 tracking-tight text-[#F1F5F9]">
        Steckt Geld in deiner<br />
        <span className="bg-gradient-to-r from-[#818CF8] via-[#A78BFA] to-[#C084FC] bg-clip-text text-transparent">
          Nebenkostenabrechnung?
        </span>
      </h1>
      <p className="text-[#94A3B8] text-lg leading-relaxed mb-8 max-w-lg mx-auto">
        Lade deine Abrechnung hoch – unsere KI prüft sie in Sekunden auf typische
        Fehler und berechnet dein Erstattungspotenzial.
      </p>
      <a
        href="#upload"
        className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]
          text-white font-bold text-base px-7 py-3.5 rounded-xl hover:opacity-90 transition-opacity"
      >
        Abrechnung jetzt prüfen <span aria-hidden>→</span>
      </a>
      <div className="flex justify-center flex-wrap gap-5 mt-6">
        {["Datei wird nicht gespeichert", "DSGVO-konform", "Kein Account nötig"].map((item) => (
          <span key={item} className="flex items-center gap-1.5 text-sm text-[#64748B]">
            <span className="text-[#818CF8]">✓</span> {item}
          </span>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Schritt 2: Committen (wird in Task 9 in page.tsx eingebunden)**

```bash
git add src/components/LandingHero.tsx
git commit -m "feat: add LandingHero component"
```

---

## Task 3: StatsBar-Komponente erstellen

**Files:**
- Create: `src/components/StatsBar.tsx`

- [ ] **Schritt 1: Komponente erstellen**

Erstelle `src/components/StatsBar.tsx`:

```tsx
const STATS = [
  { value: "Ø 187 €", label: "Erstattungspotenzial" },
  { value: "15 Sek.", label: "Analyse-Dauer" },
  { value: "100 %", label: "Kostenlos" },
];

export default function StatsBar() {
  return (
    <div className="flex rounded-2xl border border-[#334155] bg-[#1E293B] overflow-hidden mb-10">
      {STATS.map((stat, i) => (
        <div
          key={stat.label}
          className={`flex-1 text-center py-5 px-4 ${i > 0 ? "border-l border-[#334155]" : ""}`}
        >
          <div className="text-2xl font-black bg-gradient-to-r from-[#818CF8] to-[#C084FC] bg-clip-text text-transparent">
            {stat.value}
          </div>
          <div className="text-xs text-[#64748B] mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Schritt 2: Committen**

```bash
git add src/components/StatsBar.tsx
git commit -m "feat: add StatsBar component"
```

---

## Task 4: HowItWorks-Komponente erstellen

**Files:**
- Create: `src/components/HowItWorks.tsx`

- [ ] **Schritt 1: Komponente erstellen**

Erstelle `src/components/HowItWorks.tsx`:

```tsx
const STEPS = [
  {
    title: "Abrechnung hochladen",
    description:
      "PDF oder Foto deiner Nebenkostenabrechnung – einfach ablegen oder auswählen.",
  },
  {
    title: "KI analysiert in Sekunden",
    description:
      "Prüft auf HeizkV-Verstöße, falsche Umlagen, Fristfehler und mehr.",
  },
  {
    title: "Widerspruch mit einem Klick",
    description: "Fertiger Brief direkt kopierbar oder als .txt-Download.",
  },
];

export default function HowItWorks() {
  return (
    <section className="mb-10">
      <p className="text-xs font-bold text-[#6366F1] tracking-widest uppercase mb-2">
        So funktioniert&apos;s
      </p>
      <h2 className="text-xl font-black text-[#F1F5F9] mb-5">
        In 3 Schritten zu deiner Erstattung
      </h2>
      <div className="flex flex-col gap-3">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="flex items-start gap-4 bg-[#1E293B] border border-[#334155] rounded-xl p-4"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-xs font-black text-white flex-shrink-0 mt-0.5">
              {i + 1}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F1F5F9] mb-1">{step.title}</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Schritt 2: Committen**

```bash
git add src/components/HowItWorks.tsx
git commit -m "feat: add HowItWorks component"
```

---

## Task 5: UploadZone redesignen

**Files:**
- Modify: `src/components/UploadZone.tsx`

- [ ] **Schritt 1: Komplette Datei ersetzen**

Ersetze den gesamten Inhalt von `src/components/UploadZone.tsx`:

```tsx
"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";

interface Props {
  onUpload: (file: File) => void;
  loading: boolean;
  error: string | null;
}

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 10;

export default function UploadZone({ onUpload, loading, error }: Props) {
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validate = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) return "Nur PDF, JPG, PNG oder WebP erlaubt.";
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return `Datei zu groß (max. ${MAX_SIZE_MB} MB).`;
    return null;
  };

  const handleFile = (file: File) => {
    const err = validate(file);
    if (err) { setFileError(err); return; }
    setFileError(null);
    onUpload(file);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const displayError = fileError || error;

  return (
    <div className="space-y-4">
      <div
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`
          relative rounded-2xl border-2 border-dashed transition-all cursor-pointer
          flex flex-col items-center justify-center
          min-h-[220px] p-8 text-center
          ${dragging
            ? "border-[#6366F1] bg-[#1E1B4B]/30"
            : "border-[#334155] bg-[#1E293B] hover:border-[#6366F1] hover:bg-[#1E1B4B]/20"
          }
          ${loading ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={onInputChange}
          className="hidden"
        />

        {loading ? (
          <LoadingState />
        ) : (
          <>
            <div className="w-14 h-14 bg-[#1E1B4B] rounded-full flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-[#818CF8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="font-semibold text-[#F1F5F9] text-base mb-1">
              Abrechnung hier ablegen
            </p>
            <p className="text-sm text-[#64748B] mb-4">oder klicken zum Auswählen</p>
            <span className="text-xs bg-[#1E293B] border border-[#334155] text-[#475569] px-3 py-1 rounded-full">
              PDF, JPG, PNG · max. 10 MB
            </span>
          </>
        )}
      </div>

      {displayError && (
        <div className="flex items-start gap-2 bg-[#1C0F0F] border border-[#991B1B] rounded-xl p-4 text-sm text-[#FCA5A5]">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {displayError}
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-2 border-[#334155] border-t-[#6366F1] animate-spin" />
      <div className="space-y-1 text-center">
        <p className="font-semibold text-[#F1F5F9]">KI analysiert deine Abrechnung…</p>
        <p className="text-sm text-[#64748B]">Das dauert meist 10–20 Sekunden</p>
      </div>
      <div className="flex flex-col gap-1.5 w-full max-w-xs text-xs text-[#64748B]">
        {[
          "Dokument wird gelesen",
          "Positionen werden extrahiert",
          "Fehler werden geprüft",
          "Gutschriftpotenzial wird berechnet",
        ].map((step, i) => (
          <div
            key={step}
            className="flex items-center gap-2 animate-pulse"
            style={{ animationDelay: `${i * 400}ms` }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#6366F1] opacity-60" />
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Schritt 2: Visuell prüfen**

Dev-Server läuft noch auf `http://localhost:3000`. Upload-Zone sollte jetzt dunkel mit Violett-Akzent erscheinen. Drag-Over testen: Datei über die Zone ziehen — Border wird violett. Fehlerfall testen: Datei mit falscher Endung hochladen — rote Fehlermeldung erscheint.

- [ ] **Schritt 3: Committen**

```bash
git add src/components/UploadZone.tsx
git commit -m "style: dark theme for UploadZone"
```

---

## Task 6: ResultView redesignen

**Files:**
- Modify: `src/components/ResultView.tsx`

- [ ] **Schritt 1: CONFIDENCE_CONFIG aktualisieren**

Ersetze in `src/components/ResultView.tsx` den `CONFIDENCE_CONFIG`-Block:

```tsx
const CONFIDENCE_CONFIG = {
  sicher: {
    label: "Sicher",
    bg: "bg-[#0F2B1F]",
    border: "border-[#166534]",
    text: "text-[#4ADE80]",
    dot: "bg-[#22C55E]",
  },
  wahrscheinlich: {
    label: "Wahrscheinlich",
    bg: "bg-[#1C1A0E]",
    border: "border-[#92400E]",
    text: "text-[#FCD34D]",
    dot: "bg-[#F59E0B]",
  },
  unsicher: {
    label: "Unsicher",
    bg: "bg-[#1C0F0F]",
    border: "border-[#991B1B]",
    text: "text-[#FCA5A5]",
    dot: "bg-[#EF4444]",
  },
};
```

- [ ] **Schritt 2: Gesamtes JSX von ResultView ersetzen**

Ersetze den `return`-Block der `ResultView`-Funktion (Zeile 48 bis 195):

```tsx
  return (
    <div className="space-y-6">
      {/* Summary card */}
      <div className="bg-[#1E293B] rounded-2xl p-6 border border-[#334155]">
        <p className="text-sm text-[#64748B] mb-1">Geschätztes Erstattungspotenzial</p>
        <p className="text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-[#818CF8] to-[#C084FC] bg-clip-text text-transparent">
          {hasErrors ? formatEur(total) : "0 €"}
        </p>

        {hasErrors && (
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#334155]">
            <div>
              <p className="text-xs text-[#64748B]">Sofort angreifbar</p>
              <p className="text-lg font-bold text-[#4ADE80]">{formatEur(directTotal)}</p>
              <p className="text-xs text-[#475569]">{directErrors.length} Punkt{directErrors.length !== 1 ? "e" : ""}</p>
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Nach Belegeinsicht</p>
              <p className="text-lg font-bold text-[#FCD34D]">{formatEur(reviewTotal)}</p>
              <p className="text-xs text-[#475569]">{reviewErrors.length} Punkt{reviewErrors.length !== 1 ? "e" : ""}</p>
            </div>
          </div>
        )}

        {result.summary && (
          <p className="mt-4 text-sm text-[#94A3B8] leading-relaxed border-t border-[#334155] pt-4">
            {result.summary}
          </p>
        )}
      </div>

      {/* Direct errors section */}
      {directErrors.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            badge="A"
            badgeColor="bg-[#1E293B] border border-[#334155]"
            title="Sofort angreifbar"
            subtitle="Eindeutige Rechtsverstöße – direkter Widerspruch möglich"
          />
          {directErrors.map((err, i) => (
            <ErrorCard key={i} error={err} />
          ))}
          <button
            onClick={() => setLetterModal("objection")}
            className="w-full rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold py-3.5 text-sm
              hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Widerspruch erstellen
          </button>
        </section>
      )}

      {/* Review errors section */}
      {reviewErrors.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            badge="B"
            badgeColor="bg-[#334155]"
            title="Belegeinsicht erforderlich"
            subtitle="Verdacht auf Fehler – Belege beim Vermieter anfordern"
          />
          {reviewErrors.map((err, i) => (
            <ErrorCard key={i} error={err} />
          ))}
          <button
            onClick={() => setLetterModal("document_review")}
            className="w-full rounded-xl bg-[#334155] text-[#CBD5E1] font-semibold py-3.5 text-sm
              hover:bg-[#475569] transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Belegeinsicht anfordern
          </button>
        </section>
      )}

      {/* No errors state */}
      {!hasErrors && (
        <div className="bg-[#0F2B1F] border border-[#166534] rounded-2xl p-6 text-center">
          <div className="w-12 h-12 bg-[#14532D] rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[#4ADE80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-semibold text-[#4ADE80]">Keine offensichtlichen Fehler gefunden</p>
          <p className="text-sm text-[#86EFAC] mt-1">
            Das bedeutet nicht, dass die Abrechnung fehlerfrei ist – bei Zweifeln lohnt sich eine rechtliche Prüfung.
          </p>
        </div>
      )}

      {/* Color legend */}
      {hasErrors && (
        <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 text-xs text-[#94A3B8]">
          <p className="font-semibold mb-2 text-[#F1F5F9]">Farblegende – Erfolgsaussichten:</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
              <span><strong className="text-[#4ADE80]">Sicher</strong> – klare Rechtsverletzung, hohe Erstattungsaussicht</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              <span><strong className="text-[#FCD34D]">Wahrscheinlich</strong> – überwiegende Erfolgsaussicht, Auslegung möglich</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
              <span><strong className="text-[#FCA5A5]">Unsicher</strong> – Verdacht, nur mit Belegen klärbar</span>
            </div>
          </div>
        </div>
      )}

      {/* Legal disclaimer */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 text-xs text-[#64748B] leading-relaxed">
        <strong className="text-[#94A3B8]">Hinweis:</strong> Diese Analyse ist eine automatisierte KI-Einschätzung
        ohne Rechtsverbindlichkeit. Sie ersetzt keine anwaltliche Beratung. Beträge sind Schätzungen
        und können von tatsächlich erzielbaren Erstattungen abweichen. Generierte Briefe sind Vorlagen
        und sollten vor dem Versand geprüft und ggf. angepasst werden.
      </div>

      {/* Reset CTA */}
      <button
        onClick={onReset}
        className="w-full rounded-xl border-2 border-[#334155] text-[#94A3B8] font-semibold py-3.5 text-sm
          hover:border-[#6366F1] hover:text-[#818CF8] transition-colors"
      >
        Neue Abrechnung prüfen
      </button>

      {/* Letter Modal */}
      {letterModal && (
        <LetterModal
          open={true}
          onClose={() => setLetterModal(null)}
          type={letterModal}
          initialContact={result.contactData || {}}
          errors={letterModal === "objection" ? directErrors : reviewErrors}
        />
      )}
    </div>
  );
```

- [ ] **Schritt 3: SectionHeader-Funktion aktualisieren**

Ersetze die `SectionHeader`-Funktion:

```tsx
function SectionHeader({ badge, badgeColor, title, subtitle }: {
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`shrink-0 w-8 h-8 rounded-lg ${badgeColor} text-[#F1F5F9] font-bold flex items-center justify-center text-sm`}>
        {badge}
      </div>
      <div>
        <h2 className="font-bold text-[#F1F5F9] text-base leading-tight">{title}</h2>
        <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}
```

- [ ] **Schritt 4: Visuell prüfen**

Eine Test-PDF hochladen (z.B. `NEKO Beispiele/hk.pdf`). Ergebnis-Ansicht erscheint im dunklen Design mit:
- Violett-Gradient beim Erstattungsbetrag
- Fehler-Karten in passenden Dunkel-Farben (Grün/Gelb/Rot)
- Aktionsbuttons mit Violett-Gradient

- [ ] **Schritt 5: Committen**

```bash
git add src/components/ResultView.tsx
git commit -m "style: dark theme for ResultView"
```

---

## Task 7: ContactForm redesignen

**Files:**
- Modify: `src/components/ContactForm.tsx`

- [ ] **Schritt 1: Styles aktualisieren**

Ersetze in `src/components/ContactForm.tsx` den Inhalt der `Field`-Funktion (nur die `baseClass` und die Label/Text-Klassen):

```tsx
"use client";

import { ContactData } from "@/types";

interface Props {
  contact: ContactData;
  onChange: (contact: ContactData) => void;
}

export default function ContactForm({ contact, onChange }: Props) {
  const update = (field: keyof ContactData, value: string) => {
    onChange({ ...contact, [field]: value || null });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#64748B]">
        Bitte prüfe die automatisch erkannten Daten und korrigiere sie bei Bedarf.
        Sie werden für den Brief verwendet.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Dein Name"
          value={contact.tenantName || ""}
          onChange={(v) => update("tenantName", v)}
          placeholder="Max Mustermann"
        />
        <Field
          label="Vermieter / Verwalter"
          value={contact.landlordName || ""}
          onChange={(v) => update("landlordName", v)}
          placeholder="Vonovia Kundenservice GmbH"
        />
      </div>

      <Field
        label="Deine Adresse"
        value={contact.tenantAddress || ""}
        onChange={(v) => update("tenantAddress", v)}
        placeholder="Musterstraße 1, 12345 Stadt"
        multiline
      />

      <Field
        label="Adresse Vermieter / Verwalter"
        value={contact.landlordAddress || ""}
        onChange={(v) => update("landlordAddress", v)}
        placeholder="Universitätsstr. 133, 44803 Bochum"
        multiline
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Vertragsnummer"
          value={contact.contractNumber || ""}
          onChange={(v) => update("contractNumber", v)}
          placeholder="1234567890"
        />
        <Field
          label="Abrechnungszeitraum"
          value={contact.billingPeriod || ""}
          onChange={(v) => update("billingPeriod", v)}
          placeholder="01.01.2024 - 31.12.2024"
        />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const baseClass = `
    w-full px-3 py-2 rounded-lg border border-[#334155] bg-[#0F172A]
    text-sm text-[#F1F5F9] placeholder:text-[#475569]
    focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]
  `;

  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#94A3B8] block mb-1">{label}</span>
      {multiline ? (
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClass}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClass}
        />
      )}
    </label>
  );
}
```

- [ ] **Schritt 2: Committen**

```bash
git add src/components/ContactForm.tsx
git commit -m "style: dark theme for ContactForm"
```

---

## Task 8: LetterModal redesignen

**Files:**
- Modify: `src/components/LetterModal.tsx`

- [ ] **Schritt 1: Komplette Datei ersetzen**

Ersetze den gesamten Inhalt von `src/components/LetterModal.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { ContactData, ErrorItem, LetterType } from "@/types";
import ContactForm from "./ContactForm";

interface Props {
  open: boolean;
  onClose: () => void;
  type: LetterType;
  initialContact: ContactData;
  errors: ErrorItem[];
}

export default function LetterModal({ open, onClose, type, initialContact, errors }: Props) {
  const [step, setStep] = useState<"form" | "letter">("form");
  const [contact, setContact] = useState<ContactData>(initialContact);
  const [letter, setLetter] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setStep("form");
      setContact(initialContact);
      setLetter("");
      setError(null);
      setCopied(false);
    }
  }, [open, initialContact]);

  if (!open) return null;

  const title = type === "objection" ? "Widerspruch erstellen" : "Belegeinsicht anfordern";
  const description =
    type === "objection"
      ? "Wir erstellen einen Widerspruch gegen die sofort angreifbaren Punkte."
      : "Wir erstellen ein Schreiben zur Forderung der Belegeinsicht zu den unklaren Positionen.";

  const generateLetter = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, contact, errors }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Brief konnte nicht erstellt werden");
      }
      const data = await res.json();
      setLetter(data.letter);
      setStep("letter");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAsText = () => {
    const blob = new Blob([letter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type === "objection" ? "Widerspruch" : "Belegeinsicht"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1E293B] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#334155]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[#334155]">
          <div>
            <h2 className="text-xl font-bold text-[#F1F5F9]">{title}</h2>
            <p className="text-sm text-[#64748B] mt-1">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#475569] hover:text-[#94A3B8] p-1"
            aria-label="Schließen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === "form" && (
            <ContactForm contact={contact} onChange={setContact} />
          )}

          {step === "letter" && (
            <div className="space-y-3">
              <div className="bg-[#0F172A] border border-[#334155] rounded-xl p-5 font-mono text-sm text-[#94A3B8] whitespace-pre-wrap leading-relaxed">
                {letter}
              </div>
              <p className="text-xs text-[#475569]">
                Bitte vor dem Versenden nochmal durchlesen und ggf. anpassen. Dieses Schreiben ist
                eine KI-Vorlage ohne Rechtsverbindlichkeit.
              </p>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-[#1C0F0F] border border-[#991B1B] rounded-xl p-3 text-sm text-[#FCA5A5]">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#334155] p-4 flex flex-col sm:flex-row gap-2">
          {step === "form" && (
            <>
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none rounded-xl border border-[#334155] text-[#94A3B8] font-semibold py-3 px-4 text-sm hover:bg-[#334155] transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={generateLetter}
                disabled={loading}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold py-3 px-4 text-sm
                  hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Brief wird erstellt…" : "Brief erstellen"}
              </button>
            </>
          )}

          {step === "letter" && (
            <>
              <button
                onClick={() => setStep("form")}
                className="flex-1 sm:flex-none rounded-xl border border-[#334155] text-[#94A3B8] font-semibold py-3 px-4 text-sm hover:bg-[#334155] transition-colors"
              >
                Zurück
              </button>
              <button
                onClick={downloadAsText}
                className="flex-1 sm:flex-none rounded-xl border-2 border-[#6366F1] text-[#818CF8] font-semibold py-3 px-4 text-sm hover:bg-[#6366F1] hover:text-white transition-colors"
              >
                Als .txt herunterladen
              </button>
              <button
                onClick={copyToClipboard}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold py-3 px-4 text-sm hover:opacity-90 transition-opacity"
              >
                {copied ? "✓ Kopiert!" : "In Zwischenablage kopieren"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Schritt 2: Visuell prüfen**

"Widerspruch erstellen"-Button klicken → Modal erscheint dunkel mit violetten Buttons. Kontaktdaten-Formular prüfen (dunkle Inputs). Brief generieren → Monospace-Vorschau auf dunklem Hintergrund.

- [ ] **Schritt 3: Committen**

```bash
git add src/components/LetterModal.tsx
git commit -m "style: dark theme for LetterModal"
```

---

## Task 9: page.tsx – Landing-Komponenten integrieren & Nav überarbeiten

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Schritt 1: Komplette Datei ersetzen**

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

Erwartetes Ergebnis: `✓ Compiled successfully` ohne TypeScript-Fehler. Alle Typen und Imports müssen stimmen.

- [ ] **Schritt 3: Vollständigen Flow visuell prüfen**

```bash
npm run dev
```

Auf `http://localhost:3000` prüfen:
1. Landing-Page erscheint: Hero mit Gradient-Headline → Stats-Bar → So funktioniert's → Upload-Zone
2. CTA-Button "Abrechnung jetzt prüfen →" scrollt zur Upload-Zone
3. Nach Upload: Landing-Sektionen verschwinden, Ergebnis erscheint
4. "Neue Abrechnung prüfen" setzt alles zurück → Landing erscheint wieder
5. Sticky Nav bleibt beim Scrollen oben sichtbar

- [ ] **Schritt 4: Committen**

```bash
git add src/app/page.tsx
git commit -m "feat: integrate landing sections and dark nav into page.tsx"
```

---

## Task 10: Vercel Deployment

**Voraussetzungen:**
- GitHub-Account vorhanden
- Vercel-Account vorhanden (kostenlos unter vercel.com)
- `GEMINI_API_KEY` aus `.env.local` bereit

- [ ] **Schritt 1: Alle Änderungen committen**

```bash
git status
git add -A
git commit -m "chore: final pre-deploy cleanup"
```

- [ ] **Schritt 2: GitHub-Repository erstellen und pushen**

Auf github.com ein neues Repository anlegen (z.B. `nebenkostencheck`), dann:

```bash
git remote add origin https://github.com/DEIN-USERNAME/nebenkostencheck.git
git branch -M main
git push -u origin main
```

- [ ] **Schritt 3: Vercel-Projekt anlegen**

1. Auf vercel.com → "Add New Project"
2. GitHub-Repository `nebenkostencheck` importieren
3. **Root Directory** auf `nebenkostencheck/nebenkostencheck` setzen (da das Repo von `E:\Neko-Check\nebenkostencheck\nebenkostencheck` gepusht wird — alternativ direkt aus dem Projektordner pushen)
4. Framework: Next.js (wird automatisch erkannt)

- [ ] **Schritt 4: Umgebungsvariable setzen**

In Vercel → Settings → Environment Variables:

| Name | Value |
|---|---|
| `GEMINI_API_KEY` | `dein-api-key-aus-.env.local` |

- [ ] **Schritt 5: Deploy auslösen**

"Deploy" klicken. Nach ca. 1-2 Minuten ist die App unter `*.vercel.app` erreichbar.

- [ ] **Schritt 6: Live-Test**

Die Vercel-URL öffnen und den kompletten Flow testen:
1. Landing Page erscheint korrekt
2. PDF hochladen → Analyse läuft durch
3. Ergebnis erscheint mit Fehler-Karten
4. Brief generieren → Modal erscheint, Brief kann kopiert werden

---

## Erfolgskriterien

- [ ] `npm run build` läuft ohne Fehler durch
- [ ] Alle Sektionen erscheinen im Dark-Theme mit Violett-Akzent
- [ ] Landing Page (Hero → Stats → How it works) erscheint vor dem Upload
- [ ] Upload-, Analyse- und Brief-Flow funktionieren wie bisher
- [ ] App ist unter einer Vercel-URL öffentlich erreichbar
