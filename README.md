# Nebenkostencheck

KI-gestützte Nebenkostenabrechnungsprüfung – MVP.

## Setup

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. API-Key konfigurieren (lokal)

```bash
cp .env.local.example .env.local
# Dann .env.local öffnen und ANTHROPIC_API_KEY eintragen
```

### 3. Entwicklungsserver starten

```bash
npm run dev
```

→ App läuft auf http://localhost:3000

---

## Deployment auf Vercel

1. Repository auf GitHub pushen
2. Vercel-Projekt erstellen und mit dem Repo verbinden
3. In Vercel unter **Settings → Environment Variables** eintragen:
   - `ANTHROPIC_API_KEY` = dein Anthropic API Key
4. Deploy auslösen

---

## Projektstruktur

```
src/
  app/
    page.tsx              # Hauptseite (Upload + Ergebnis)
    layout.tsx            # Root layout + Metadata
    globals.css           # Tailwind base
    api/
      analyze/
        route.ts          # API Route: PDF/Bild → Claude → JSON
  components/
    UploadZone.tsx        # Drag-and-drop Upload
    ResultView.tsx        # Fehleranzeige + Potenzial
  types/
    index.ts              # Shared TypeScript types
```

## Unterstützte Dateitypen

- PDF (empfohlen)
- JPG / JPEG
- PNG
- WebP

Max. Dateigröße: 10 MB

## KI-Modell

`claude-sonnet-4-20250514` via Anthropic API mit nativer PDF- und Vision-Unterstützung.
