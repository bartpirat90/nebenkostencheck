# Nebenkostencheck

KI-gestützte Prüfung von deutschen Nebenkostenabrechnungen. Dokument hochladen, Rechtsverstöße erkennen, Widerspruch generieren.

**Live:** [nebenkostencheck-six.vercel.app](https://nebenkostencheck-six.vercel.app)

---

## Features

- **Upload** — PDF oder Foto der Abrechnung per Drag-and-drop oder Klick
- **KI-Analyse** — Gemini 2.5 Flash prüft auf typische Rechtsverstöße nach BetrKV, HeizkV und BGB
- **Dokumentvalidierung** — falsches Dokument (kein Nebenkostenabrechnung) → freundliche Hinweisbox
- **Ergebnisanzeige** — gefundene Fehler mit Rechtsgrundlage, Erstattungspotenzial und Handlungsempfehlung
- **Briefgenerator** — fertiger Widerspruch oder Belegeinsicht-Schreiben als Text-Download

---

## Tech Stack

| Bereich | Technologie |
|---|---|
| Framework | Next.js 15 (App Router) |
| Sprache | TypeScript |
| Styling | Tailwind CSS v3 |
| KI | Google Gemini 2.5 Flash via `@google/generative-ai` |
| Deployment | Vercel (auto-deploy bei Push auf `main`) |

---

## Lokales Setup

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. API-Key konfigurieren

```bash
cp .env.local.example .env.local
```

In `.env.local` eintragen:

```
GEMINI_API_KEY=dein-google-gemini-api-key
```

Den Key erhältst du unter [aistudio.google.com](https://aistudio.google.com).

### 3. Entwicklungsserver starten

```bash
npm run dev
```

→ App läuft auf `http://localhost:3000`

---

## Deployment auf Vercel

1. Repository auf GitHub pushen
2. Vercel-Projekt erstellen und mit dem Repo verbinden
3. Unter **Settings → Environment Variables** eintragen:
   - `GEMINI_API_KEY` = dein Google Gemini API Key
4. Jeder Push auf `main` löst automatisch einen Deploy aus

---

## Projektstruktur

```
src/
  app/
    page.tsx                    # Hauptseite: Upload, Ergebnis, Landing
    layout.tsx                  # Root-Layout + Metadata
    globals.css                 # Tailwind-Basis + Dark-Background
    api/
      analyze/
        route.ts                # POST: Dokument → Gemini → AnalysisResult JSON
      generate-letter/
        route.ts                # POST: Fehler + Kontaktdaten → Brieftext

  components/
    LandingHero.tsx             # Hero-Section mit CTA
    StatsBar.tsx                # Kennzahlen-Leiste (Ø 187 €, 15 Sek., kostenlos)
    HowItWorks.tsx              # 3-Schritte-Erklärung
    UploadZone.tsx              # Drag-and-drop Upload mit Tastaturzugänglichkeit
    ResultView.tsx              # Fehleranzeige, Potenzial-Summen, Brief-Buttons
    ContactForm.tsx             # Kontaktdaten-Formular im Brief-Modal
    LetterModal.tsx             # Modal: Formular → Briefvorschau → Download/Kopieren

  types/
    index.ts                    # Shared TypeScript-Typen

docs/
  superpowers/
    specs/                      # Design-Spezifikationen
    plans/                      # Implementierungspläne
```

---

## Unterstützte Dateitypen

- PDF (empfohlen, beste Erkennungsrate)
- JPG / JPEG
- PNG
- WebP

---

## Geprüfte Rechtsverstöße

Die KI prüft auf folgende Kategorien (Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)):

| Kategorie | Beispiele |
|---|---|
| Sofort angreifbar — sicher | § 9 Abs. 2 HeizkV (Wärmemengenzähler), § 7 Abs. 1 HeizkV (Verbrauchsanteil), § 1 Abs. 2 BetrKV (Reparaturkosten), § 259 BGB (Gesamtkosten fehlen) |
| Sofort angreifbar — wahrscheinlich | Verwaltungsgebühr als Umlageposition, Umlageausfallwagnis bei Freifinanzierung |
| Belegeinsicht erforderlich | Versicherungsbeiträge, Hauswartkosten, Leerstandskosten |
| Belegeinsicht + unsicher | Sperrmüll, Rauchwarnmelder-Anschaffung, Verbrauchserfassungsgeräte |
