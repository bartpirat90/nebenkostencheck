# Startseite-Redesign: Charakter „Ledger / Prüfbericht"

**Datum:** 2026-06-14
**Scope:** Web-Startseite (`src/app/page.tsx` + Landing-Komponenten). Teaser/Bericht/Result und Rechtstexte sind Folge-Arbeit.
**Ziel:** Die Startseite von „seriös, aber generisch" zu „seriös UND unverwechselbar" heben — ohne Layout-Akrobatik und ohne Effekt-Gewitter.

## Design Read & Regler
> Conversion-Landingpage für deutsche Mieter, Charakter „Prüfbericht/Ledger", dunkel-premium, Bewegung dezent.

- **DESIGN_VARIANCE 4** — konventionelle, vertraute Struktur (Trust), eigener Charakter über Detail/Typo, nicht über Asymmetrie.
- **MOTION_INTENSITY 3** — nur dezente Reveals + Button-Feedback. Kein Parallax, keine Show-Effekte.
- **VISUAL_DENSITY 5** — Ledger darf strukturiert/dicht wirken.

## Leitidee
Die Seite sieht aus wie ein **edler Prüfbericht / eine Abrechnung selbst**. Das Konzept ist ownbar (passt nur zu diesem Produkt) und seriös.

### Signatur-Elemente
- **Tabellenziffern statt Monospace:** Zahlen in Geist mit `font-variant-numeric: tabular-nums` (fluchten wie auf einer Abrechnung, bleiben edel — KEIN Schreibmaschinen-Font, kein Geist Mono).
- **Ledger-Zeilen:** Kennzahlen als abrechnungsartige Posten — Label links, Wert rechtsbündig, Haarlinien zwischen den Zeilen.
- **Dokument-Anmutung:** dünner Kopf mit dezentem Tag („PRÜFBERICHT · GRATIS", getrackte Sans-Versalien), Haarlinien-Rahmen statt Karten-Wülste, dezentes Ledger-Raster im Hintergrund.
- **Grün = Geld/positiv** (Erstattung, „0 €", „~50 %"); sonst ruhige Tinte.

## Visuelles System (Token-Erweiterung)
Aufbauend auf den bestehenden Tokens (`tailwind.config.js`). Akzent = Erstattungs-Grün bleibt.
- `base` vertiefen zu neutralerem Ink (~`#0C1016`), `surface` entsprechend.
- Neue Haarlinien-Farbe fürs Ledger-Raster/Trenner (~`#1B2430`).
- Tag-Stil: kleine getrackte Sans-Versalien (`text-[11px] tracking-[0.12em] text-muted`).
- Zahlenklasse: `tabular-nums` + `font-medium`.
- Kein zusätzlicher Webfont (Geist deckt alles ab).

## Komponenten-Änderungen
- **Nav/Header** → schlanker Dokument-Kopf: Logo links, „PRÜFBERICHT · GRATIS"-Tag rechts, Haarlinie darunter.
- **LandingHero** → Mono-freier Eyebrow „§ geprüft nach BetrKV / HeizkV / BGH" (grün), Headline solide, CTA solid-grün + „kein Account nötig" daneben. Trust-Strip aus dem Hero raus (Hero ≤ 4 Elemente).
- **StatsBar** → **Ledger-Summary**: Posten-Zeilen (Label links / Wert rechts, Haarlinien), Werte in `tabular-nums`. Inhalt: „Abrechnungen mit Fehlern → ~50 %", „Analyse-Dauer → 15 Sek.", „Erst-Prüfung → 0 €" + Fußnote „Quelle: Deutscher Mieterbund".
- **HowItWorks** → nummerierte Ledger-Einträge (01/02/03 als tabular-nums-Marker, Haarlinien-Trenner statt Karten).
- **UploadZone** → „Beleg einreichen"-Anmutung (dokumentarischer Rahmen), bestehende A11y/Logik unverändert.
- **Footer** → dokumentarisch, Haarlinie, max. 1 `·` pro Zeile (bereits umgesetzt).

## Bewegung (dezent)
- **Scroll-Reveal:** gestaffeltes Fade-Rise (~16px, 250–400 ms, ease-out) beim Eintreten in den Viewport.
- **Technik:** leichtgewichtiger `IntersectionObserver`-Reveal (kleine Client-Komponente + CSS-Transition). KEIN framer-motion (Bundle), keine `scroll`-Listener.
- **Button:** `active:scale-[0.98]`, `transition-colors` (bereits umgesetzt).
- **Pflicht:** `prefers-reduced-motion: reduce` → Reveals sofort sichtbar, keine Transition.

## Copy-Regeln
- Echte, belegbare Zahlen (Mieterbund ~50 %); keine erfundenen Kennzahlen.
- **Null Em-Dashes** (`—`/`–`) irgendwo sichtbar.
- Button = Verb + Objekt.

## Out of Scope
Teaser (`PreviewView`), `ResultView`/`ergebnis`, `LetterModal`, `ContactForm`, Rechtstexte, Bezahlung. (Folge-Durchlauf im selben Stil.)

## Definition of Done
- [ ] Startseite rendert im Ledger-Stil, Desktop + Mobile ohne Overflow.
- [ ] Alle Texte WCAG AA (≥ 4,5:1 Body) gegen ihren Grund.
- [ ] Keine Konsolenfehler; `tsc`/Lint sauber.
- [ ] Reduced-Motion respektiert (Reveals deaktiviert).
- [ ] Keine erfundenen Zahlen, keine Em-Dashes.
- [ ] Live im Browser verifiziert (Screenshot Desktop + Mobile).
