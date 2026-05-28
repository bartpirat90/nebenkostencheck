# Design-Spezifikation: Redesign, Landing Page & Deployment

**Datum:** 2026-05-28
**Status:** Genehmigt
**Scope:** Visuelles Redesign, Landing Page, Vercel-Deployment

---

## Ziel

Nebenkostencheck soll von einem funktionierenden MVP zu einem langfristig wartbaren, professionellen Produkt werden — mit dem Ziel der späteren Monetarisierung. Login und Bezahlfunktionen sind explizit **nicht** Teil dieser Iteration.

---

## Design-Entscheidungen

### Visuelles System

| Eigenschaft | Wert |
|---|---|
| Hintergrund (primär) | `#0F172A` (Slate 900) |
| Hintergrund (Karten) | `#1E293B` (Slate 800) |
| Akzentfarbe | Violett/Indigo — `#6366F1` → `#8B5CF6` (Gradient) |
| Text (primär) | `#F1F5F9` |
| Text (sekundär) | `#94A3B8` |
| Text (gedimmt) | `#64748B` |
| Rahmen | `#334155` |
| Border-Radius (Karten) | `16px–20px` |
| Border-Radius (Buttons) | `10px–12px` |
| Schrift | System-UI Stack (`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`) |

### Confidence-Farben (Fehler-Karten)
- **Sicher** — Grün: Text `#4ADE80`, Hintergrund `#0F2B1F`, Border `#166534`
- **Wahrscheinlich** — Gelb: Text `#FCD34D`, Hintergrund `#1C1A0E`, Border `#92400E`
- **Unsicher** — Rot: Text `#FCA5A5`, Hintergrund `#1C0F0F`, Border `#991B1B`

---

## Architektur

### Ansatz: Component-basiert (Ansatz 2)

`page.tsx` bleibt der Orchestrator. Neue und bestehende Komponenten haben je eine klar definierte Aufgabe.

### Neue Komponenten (Landing Page)

| Komponente | Zweck |
|---|---|
| `LandingHero.tsx` | Headline, Subtext, CTA-Button, Trust-Signale |
| `StatsBar.tsx` | Drei Kennzahlen: Ø Erstattung, Analyse-Dauer, Kostenlos |
| `HowItWorks.tsx` | 3-Schritt-Erklärung mit Nummern-Icons |

### Überarbeitete Komponenten

| Komponente | Änderung |
|---|---|
| `UploadZone.tsx` | Dark-Theme, Violett-Akzent, neues Spacing |
| `ResultView.tsx` | Dark-Theme, Violett-Gradient für Betrag, überarbeitete Fehler-Karten |
| `LetterModal.tsx` | Dark-Theme, Monospace-Briefvorschau auf dunklem Hintergrund |
| `ContactForm.tsx` | Dark-Theme, Input-Styling angepasst |
| `layout.tsx` | Metadata (Titel, Description) aktualisieren, `<html>` Basis-Klasse auf Dark setzen |

### Seitenstruktur (Single Page)

```
/ (page.tsx)
  ├── <nav>                   — Logo + Badge (sticky)
  ├── <LandingHero>           — nur wenn kein Ergebnis und kein Loading
  ├── <StatsBar>              — nur wenn kein Ergebnis und kein Loading
  ├── <HowItWorks>            — nur wenn kein Ergebnis und kein Loading
  ├── <UploadZone>            — wenn kein Ergebnis
  └── <ResultView>            — wenn Ergebnis vorhanden
      └── <LetterModal>       — Modal, bei Klick auf Aktions-Button
```

### globals.css

`body` bekommt `background: #0F172A` und `color: #F1F5F9` als Basis. Bestehende Tailwind-Klassen werden durch das neue Dark-System ersetzt.

---

## Landing Page Inhalt

### Hero
- **Pill:** `🏆 Bereits 2.400+ Abrechnungen geprüft`
- **H1:** `Steckt Geld in deiner Nebenkostenabrechnung?`
- **Subtext:** `Lade deine Abrechnung hoch – unsere KI prüft sie in Sekunden auf typische Fehler und berechnet dein Erstattungspotenzial.`
- **CTA:** `Abrechnung jetzt prüfen →` (verlinkt auf Upload-Sektion per `#upload`)
- **Trust-Signale:** Datei wird nicht gespeichert · DSGVO-konform · Kein Account nötig

### Stats-Bar
| Wert | Label |
|---|---|
| Ø 187 € | Erstattungspotenzial |
| 15 Sek. | Analyse-Dauer |
| 100 % | Kostenlos |

> Hinweis: Diese Zahlen sind initial Platzhalter. Sobald echte Nutzerdaten vorliegen, können sie angepasst werden.

### So funktioniert's
1. **Abrechnung hochladen** — PDF oder Foto deiner Nebenkostenabrechnung
2. **KI analysiert in Sekunden** — prüft auf HeizkV-Verstöße, falsche Umlagen, Fristfehler u.v.m.
3. **Widerspruch mit einem Klick** — fertiger Brief, direkt kopierbar oder als Download

---

## Deployment

- **Plattform:** Vercel (Free Tier ausreichend für MVP)
- **Umgebungsvariable:** `GEMINI_API_KEY` in Vercel → Settings → Environment Variables
- **Build-Kommando:** `npm run build` (Next.js Standard)
- **Domain:** zunächst `*.vercel.app`, später eigene Domain möglich
- **`.gitignore`:** `.env.local` ist bereits eingetragen — kein API-Key im Repository

---

## Explizit Out of Scope

- Nutzer-Authentifizierung / Login
- Bezahlfunktionen / Monetarisierung
- Datenbank oder Persistenz von Analysen
- Multi-Language / Internationalisierung
- Analytics / Tracking

## Geplante nächste Iteration (nicht Teil dieser Spec)

**Freemium-Modell:** Analyse bleibt kostenlos und vollständig sichtbar. Der Brief-Generator zeigt nur eine unscharfe Vorschau (Blur-Effekt) mit einem Paywall-CTA — Vollzugriff nur nach Bezahlung oder Account-Erstellung. Dies setzt Login + Payment voraus.

---

## Erfolgskriterien

- [ ] Alle Seiten-Sektionen in Dark-Theme mit Violett-Akzent gerendert
- [ ] Landing Page (Hero + Stats + How it works) erscheint vor dem Upload
- [ ] Upload-, Ergebnis- und Brief-Flow funktionieren wie bisher
- [ ] App läuft fehlerfrei auf Vercel mit `GEMINI_API_KEY`
- [ ] Keine TypeScript-Fehler (`npm run build` erfolgreich)
