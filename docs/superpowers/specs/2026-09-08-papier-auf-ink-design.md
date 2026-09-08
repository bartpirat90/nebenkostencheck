# Design „Papier auf Ink“ – Spezifikation

Datum: 2026-09-08 · Branch: `monetarisierung` · Rücksprung: Tag `design-backup-2026-09-06` (Branch `design-backup`)

## 1. Ausgangslage und Ziel

Die Website ist bewusst dunkel, wirkt aber drückend, „KI-erstellt“ und nackt. Diagnose aus dem Brainstorming:

- **Drückend**: kein Licht, keine Ebenen, kalt-blaugraue Neutrals auf fast schwarzem `#0C1016`.
- **KI-erstellt**: Eyebrow über jeder Sektion, nummerierte Schritte, Metrik-Tabelle im Hero, drei identische Textspalten in Haarlinienkästen, ein einziger Grauton.
- **Nackt**: keinerlei Bild, das verkaufte Produkt (Prüfbericht, Widerspruchsbrief) ist nirgends zu sehen, kein Beleg von außen.

Gewählte Richtung (Mockup freigegeben am 2026-09-08): **Papier auf Ink**. Der dunkle Rahmen bleibt Markenmerkmal (Navigation, Seitenrand, Footer), der Inhalt liegt als helles Papierblatt darauf. Bildsprache: das Produkt selbst (Bericht, Brief) plus vier zurückhaltende unDraw-Illustrationen unterhalb des Heros.

**Design Read**: Landing- und Transaktionsseite für Mieterinnen und Mieter im Alltag, kein Tech-Publikum. Vertrauensmarke im Rechts- und Geldkontext, Vorbilder Conny, Taxfix, Wise. Regler: DESIGN_VARIANCE 3, MOTION_INTENSITY 2, VISUAL_DENSITY 4.

**Nicht im Scope**: Native App (`mobile/`), PDF-Layouts (`src/lib/pdf/*`, bereits Papier, Brief bewusst neutral), E-Mail-Texte, Stripe-Checkout-Seite, Rechtstext-Inhalte (Blocker 7 bleibt manuell bei Franz).

## 2. Farbsystem

Zwei Welten, beide in `tailwind.config.js` als Tokens. Kein `#000`, kein `#fff` auf Flächen außer Dokumenten (Bericht, Brief, Upload-Zone, Modal), die bewusst „weißes Papier“ sind.

### 2.1 Ink (Rahmen: `html`, Navigation, Footer, Modal-Backdrop, 404-Rahmen)

| Token | Wert | Verwendung |
|---|---|---|
| `ink.DEFAULT` | `#12171E` | Rahmenfläche, ersetzt `#0C1016` |
| `ink.2` | `#1B222B` | leicht gehobene Fläche auf Ink (Pill in der Nav) |
| `ink.line` | `#26303A` | Haarlinien auf Ink |
| `ink.fg` | `#EEF1F4` | Text auf Ink |
| `ink.muted` | `#B4BDC7` | Sekundärtext auf Ink (Nav-Links) |
| `ink.faint` | `#8F9AA6` | Footer-Text auf Ink |
| `accent.bright` | `#34D399` | Logo-Schild, Links und Fokusring auf Ink |

### 2.2 Papier (Inhalt: alles innerhalb des Blatts)

| Token | Wert | Verwendung |
|---|---|---|
| `paper.DEFAULT` | `#FBF9F4` | Blattfläche |
| `paper.2` | `#F3EFE6` | abgesetzte Sektion (Mieterrechte), Empfehlungsbox im Bericht |
| `paper.line` | `#E3DDD0` | Haarlinien, Kartenrahmen |
| `paper.line-strong` | `#C9C2B2` | dekorative Strichlinien: Schritt-Oberkanten, Phasenpunkt, Muster-Badge |
| `paper.line-control` | `#8F8878` | Rahmen von Bedienelementen (Eingaben, Upload-Zone, Sekundärbutton) – 3:1 nach WCAG 1.4.11 |
| `doc` | `#FFFFFF` | Dokumentflächen: Berichtskarte, Brief, Upload-Zone, Modal, Eingabefelder |
| `fg` | `#1B1F24` | Primärtext, Primärbutton-Fläche |
| `muted` | `#4E555C` | Sekundärtext |
| `faint` | `#5F666D` | Meta und Fußnoten (mindestens 12,5 px) |
| `accent.DEFAULT` | `#047857` | Akzent: Icons, Haken, Beträge, Berichts-Button |
| `accent.hover` | `#065F46` | Hover des Akzentbuttons |
| `accent.soft` | `#E4F2EA` | Akzent-Hintergrund (Icon-Kacheln, Feature-Marker) |
| `accent.border` | `#BFE0CF` | Rahmen auf Akzent-Hintergrund |
| `fg.hover` | `#2A3038` | Hover des Primärbuttons (Fläche `fg`) |

Der Token `accent.bg` (`#06231C`) und `surface` (`#11161D`) entfallen. `line`, `line-strong` werden zu `paper.line`, `paper.line-strong`; die Klassen `border-line` und `border-line-strong` bleiben als Aliase auf dieselben Werte bestehen, damit bestehende Komponenten ohne Umbenennung Papier werden.

### 2.3 Status auf Papier

| Gruppe | Text | Fläche | Rahmen | Punkt |
|---|---|---|---|---|
| ok (`sicher`) | `#166534` | `#EAF6EE` | `#BBE3C8` | `#16A34A` |
| warn (`wahrscheinlich`) | `#92400E` | `#FDF3E3` | `#F3D9A8` | `#D97706` |
| neutral (`unsicher`) | `#4E555C` | `#F3EFE6` | `#D9D3C6` | `#8A96A6` |
| danger (Fehlerzustände) | `#991B1B` | `#FDECEC` | `#F2B8B8` | `#DC2626` |

Token-Namen bleiben (`status.ok`, `status.okBg`, `status.okBorder`, `status.okStrong`, entsprechend warn/neutral/danger); `okSurface`, `warnSurface`, `warnBgHover` entfallen, ihre Verwendungen werden auf `okBg`/`warnBg` umgestellt. Zusätzlich `status.dangerStrong` (`#DC2626`) als Punktfarbe für danger; `okSoft`/`warnSoft` entfallen ebenfalls. Die Bedeutung bleibt: „unsicher“ ist neutral, Rot nur für echte Fehler (API, Versand, Upload).

### 2.4 Kontrast (WCAG AA, verifiziert per Rechnung)

| Paar | Verhältnis |
|---|---|
| `fg` auf `paper` | 15,7:1 |
| `muted` auf `paper` | 7,2:1 |
| `faint` auf `paper` | 5,5:1 |
| `accent` auf `paper` | 5,2:1 |
| `accent` auf `doc` | 5,5:1 |
| `ink.fg` auf `ink` | 15,9:1 |
| `ink.muted` auf `ink` | 9,5:1 |
| `ink.faint` auf `ink` | 6,3:1 |
| Status-Text auf Status-Fläche | 6,4:1 bis 7,3:1 |
| `faint` auf `paper.2` | 5,1:1 |
| `#FFFFFF` auf `accent` (Berichts-Button) | 5,5:1 |
| `paper` auf `fg` (Primärbutton) | 15,7:1 |

Ein Test (`src/lib/design/contrast.test.ts`) rechnet diese Paare aus den Tailwind-Tokens nach und schlägt unter 4,5:1 fehl.

### 2.5 Hart kodierte Farben außerhalb von Tailwind

| Datei | Änderung |
|---|---|
| `src/app/globals.css` | `html`/`body`-Hintergrund `#12171E` (Ink, damit Overscroll dunkel bleibt), `body`-Text `#1B1F24`, Fokusring `2px solid #047857` global; innerhalb `[data-on-ink]` (Nav, Footer) Fokusring `#34D399` |
| `src/lib/seo.ts` | `BRAND_INK = "#12171E"`; neu `BRAND_PAPER = "#FBF9F4"` |
| `src/app/[locale]/layout.tsx` | `viewport.themeColor` bleibt `BRAND_INK` (Nav ist dunkel) |
| `src/app/manifest.ts` | `theme_color` `BRAND_INK`, `background_color` `BRAND_INK` (Splash bleibt Rahmenfarbe) |
| `src/app/apple-icon.tsx`, `src/app/icon.svg` | unverändert bis auf den Ink-Wert (Schild `#10B981` auf Ink bleibt) |
| `src/app/og.png/route.tsx` | Neuaufbau als Ink-Rahmen mit Papierblatt: Headline in `fg`, Trennbalken `accent`, Domain in `ink.faint` auf dem Rahmen |
| `src/lib/logo.ts` | `LOGO_GREEN_ON_DARK` bleibt `#10B981` (Nav auf Ink), `LOGO_GREEN_ON_LIGHT` bleibt `#059669` (PDF) |
| `src/components/ResultView.tsx` Empfehlungsbox | `bg-ink/60` wird `bg-paper-2` |
| `src/components/ActivityIndicator.tsx` | Balkenspur `paper.line`, Füllung `accent` |

## 3. Typografie

Geist bleibt einzige Familie (Google Fonts, latin + latin-ext, Fallbacks für ru/uk/ar unverändert).

| Rolle | Desktop | Mobil (< 640 px) | Gewicht | Zeilenhöhe | Spationierung |
|---|---|---|---|---|---|
| H1 Hero | 52 px | 34 px | 800 | 1,08 | -0,025em |
| H2 Sektion | 34 px | 26 px | 800 | 1,12 | -0,02em |
| H3 (Mieterrechte, Modal) | 28 px | 22 px | 800 | 1,15 | -0,02em |
| Lead | 17 px | 16 px | 400 | 1,55 | 0 |
| Body | 16 px | 16 px | 400 | 1,55 | 0 |
| Small | 14 px | 14 px | 400 bis 500 | 1,5 | 0 |
| Meta | 12,5 px | 12,5 px | 400 | 1,4 | 0 |
| Proof-Zahl | 30 px | 26 px | 800 | 1,1 | -0,02em |

`text-wrap: balance` auf H1 bis H3, `text-wrap: pretty` auf Absätzen über 40 Zeichen. Fließtext maximal 62 ch. Keine Versalien-Eyebrows mehr; `hero.eyebrow`, `howItWorks.eyebrow`, `faq.eyebrow` und `nav.badge` in Versalien entfallen (siehe 7).

## 4. Seitenshell

```
<html bg ink>
  <nav on-ink>            Logo · Links (So funktioniert's, Bericht, Fragen) · Pill „Erst-Prüfung gratis · Bericht 9,90 €“ · LocaleSwitcher
  <main class="paper">    Blatt: max-width 1180, Radius 18 oben, Schatten 0 30px 80px rgba(0,0,0,.55), Innenabstand 56 px (Mobil 20 px)
    …Sektionen…
  </main>
  <footer on-ink>         Wortmarke · Impressum · Datenschutz · AGB · „Automatische Löschung · Keine Rechtsberatung“
</html>
```

- Die Nav ist 68 px hoch, sticky, `bg-ink/90` mit `backdrop-blur`. Links sind Sprungmarken (`#so-funktionierts`, `#bericht`, `#fragen`).
- Die bisherigen Randspalten (Zitate links, „Geprüft nach“ und Sicherheitsliste rechts in `src/app/[locale]/page.tsx`) entfallen. Ihre Inhalte wandern in die Beleg-Zeile (Zitate) und in die Berichtskarte (Fußzeile „Geprüft nach BetrKV, HeizkV und BGH-Rechtsprechung“).
- Das Blatt hat auf Mobil 8 px Seitenrand und 12 px Radius, damit der Ink-Rahmen sichtbar bleibt.
- `[data-on-ink]` auf Nav und Footer schaltet Textfarben und Fokusring auf die Ink-Welt (Utility-Klassen `text-ink-fg`, `text-ink-muted`).

## 5. Sektionen der Startseite (Reihenfolge verbindlich)

### 5.1 Hero (`LandingHero.tsx`, neu `ReportPreviewCard.tsx`)

Zweispaltig ab 1024 px (1,05fr / 0,95fr, Abstand 52 px), darunter gestapelt mit der Karte unter dem Text, maximal 520 px breit.

- Links: H1 `hero.headline`, Lead `hero.subline`, Primärbutton `hero.cta` (Fläche `fg`, Text `paper`, Radius 12, 15/26 px Innenabstand, Pfeil als Zeichen), Preiszeile `hero.priceNote` in `faint`, Trust-Haken `trust.*` als horizontale Liste mit `✓` in `accent`.
- Rechts: **ReportPreviewCard**, ein statisches Beispiel des Prüfberichts auf `doc`, Rahmen `paper.line`, Radius 14, Schatten `0 12px 30px rgba(27,31,36,.08)`. Inhalt aus `messages` (`heroReport.*`): Titel „Prüfbericht“, Meta „Abrechnung 2025, 3 Befunde“, drei Befunde (Titel, Begründung mit Paragraf, Betrag; Punkt in `status.okStrong` bzw. `status.warnStrong`): Verwaltungskosten (§ 1 Abs. 2 Nr. 1 BetrKV, 96,00 €, ok), Reparaturkosten (§ 2 BetrKV, 61,40 €, ok), Heizkosten (§ 7 HeizkV, 27,10 €, warn), Summenzeile „Geschätztes Erstattungspotenzial ≈ 184,50 €“ in `accent`, Button „Widerspruch als PDF erstellen“ (Fläche `accent`, Text weiß). Fußzeile in `faint`: „Beispiel · Geprüft nach BetrKV, HeizkV und BGH-Rechtsprechung“. Die Karte ist rein dekorativ (`aria-hidden` auf der Karte, der Button ist kein `<button>`), die Kennzeichnung „Beispiel“ ist Pflicht.

### 5.2 Beleg-Zeile (`ProofLine.tsx`, ersetzt `StatsBar.tsx`)

Drei Spalten (1,4fr / 1fr / 1fr), Ober- und Unterkante `paper.line`, 24 px Innenabstand. Je Spalte Zahl in Proof-Größe, Satz in `muted`, Quelle in `faint`. Inhalt aus `proof.items[]`: „Rund die Hälfte“ (Deutscher Mieterbund), „15 Sekunden“, „12 Monate“ (§ 556 Abs. 3 BGB). Unter 768 px untereinander mit 18 px Abstand. Keine Tabelle, kein Kasten. Der Namespace `reviews` bleibt erhalten; echte Kundenstimmen erscheinen, sobald vorhanden, als eigene Zeile direkt unter der Beleg-Zeile (Zitat in `muted`, Name in `faint`), bis dahin wird nichts gerendert.

### 5.3 Drei Schritte (`HowItWorks.tsx`, neu `illustrations/*`)

`id="so-funktionierts"`. H2 `howItWorks.heading`, Lead `howItWorks.lead`. Liste `<ol>` ohne Nummern, drei Spalten (Abstand 40 px), jede mit 2 px Oberkante `paper.line-strong`, Illustration (Höhe 150 px, unten ausgerichtet, `color: accent`), Titel 18 px 700, Text `muted`. Unter 768 px untereinander, Illustration 110 px. Zuordnung: Hochladen → `Receipt`, Prüfen lassen → `DocumentReview`, Widerspruch schicken → `MailSent`.

### 5.4 Upload-Zone (`UploadZone.tsx`)

`id="upload"`, direkt unter den Schritten. Fläche `doc`, 2 px gestrichelter Rahmen `paper.line-strong`, Radius 16, 44 px Innenabstand, zentriert: Icon-Kachel 44 px `accent.soft` mit Pfeil-Icon in `accent`, Titel 20 px 700, Hinweis `muted`, Formate in `faint`. Drag-over: Rahmen `accent`, Fläche `accent.soft`. Fehlerkasten `status.dangerBg`/`dangerBorder`/`danger`. Ladezustand unverändert (Balken nach 2.5).

### 5.5 Das steckt im Bericht (`ReportFeatures.tsx`, neu `LetterPreview.tsx`)

`id="bericht"`. Zwei Spalten (Abstand 56 px). Links H2 `reportFeatures.heading`, Lead, Liste `reportFeatures.items[]` (4 Einträge: Titel, Untertitel), jeder mit 28 px Marker-Kachel `accent.soft` und Icon in `accent` (Lucide-Motive `scale`, `file-text`, `search`, `arrow-right` als Inline-SVG kopiert, kein neues npm-Paket). Rechts **LetterPreview**: statischer Musterbrief auf `doc`, Rahmen `paper.line`, 34/38 px Innenabstand, 12,5 px Schrift, um -1° gedreht, gleicher Schatten wie die Berichtskarte. Inhalt aus `letterPreview.*` (Absender, Empfänger, Betreff, vier Absätze, Grußformel, Unterschrift in kursivem Fallback). Namen und Adressen sind erfunden und bleiben so; Kennzeichnung „Muster“ oben rechts in `faint`. Unter 1024 px: Brief unter der Liste, maximal 480 px.

### 5.6 Dein gutes Recht als Mieter (`TenantRights.tsx`)

Kasten auf `paper.2`, Radius 18, 44/48 px Innenabstand, zwei Spalten (0,9fr / 1,1fr). Links Illustration `ApartmentRent` (volle Spaltenbreite). Rechts H2 `rights.heading` (visuell in H3-Größe) und `<dl>` mit drei Einträgen `rights.items[]` (Frist, Belegeinsicht, verspätete Abrechnung). Unter 900 px: Illustration oben, maximal 360 px breit.

### 5.7 Häufige Fragen (`Faq.tsx`)

`id="fragen"`. H2 `faq.heading`, Liste maximal 760 px mit `<details>`, Trennlinien `paper.line`, Frage 16 px 600, Antwort `muted`; erster Eintrag geöffnet. JSON-LD bleibt. Inhalt bleibt `faq.items[]` mit den bestehenden neun Einträgen; Datenschutz und Foto-Upload sind dort bereits beantwortet, neue Einträge kommen nicht dazu.

### 5.8 Footer (`Footer.tsx`)

Auf Ink, 40/48 px Innenabstand, eine Zeile ab 768 px: Wortmarke `ink.fg`, Links `ink.faint` mit Hover `ink.fg`, Hinweis `footer.note`. Darunter gestapelt.

## 6. Illustrationen

Quelle unDraw (Katerina Limpitsouni), Lizenz: unDraw License, kommerziell frei, keine Namensnennung, keine Weiterverbreitung als Sammlung. Genau vier Motive, keine weiteren:

| Komponente | unDraw-Name | Einsatz |
|---|---|---|
| `Receipt` | Receipt | Schritt 1 |
| `DocumentReview` | Document Review | Schritt 2 |
| `MailSent` | Mail Sent | Schritt 3 |
| `ApartmentRent` | Apartment rent | Mieterrechte |

- Ablage als React-Komponenten unter `src/components/illustrations/<Name>.tsx`, die das SVG inline rendern (kein `public/`, kein `next/image`), damit `currentColor` als Akzent greift. Root-Attribute: `viewBox`, `role="img"`, `aria-hidden="true"`, `focusable="false"`, `preserveAspectRatio="xMidYMid meet"`; `width`/`height` entfernt, Größe kommt per CSS.
- Einmalige Umfärbung beim Import, dokumentiert in `src/components/illustrations/README.md`: `#090814` und `#2f2e41` → `#1B1F24`; `#3f3d56` → `#3A414A`; `#e6e6e6` → `#E3DDD0`; `#f2f2f2` → `#E7E1D4`; `#ccc` → `#CFC9BC`; `#fafafa` → `#FBF9F4`; `#57b894` → `#6DBE9A`. Hauttöne (`#fbbebe`, `#a0616a`, `#9f616a`) bleiben. Akzentflächen sind `currentColor`.
- Der Container setzt `color: accent`. Jede Illustration wird beim Import per Skript (`scripts/import-undraw.mjs`, ohne neue Abhängigkeit) bereinigt und umgefärbt; `ApartmentRent` darf nach Optimierung höchstens 40 KB haben (das Motiv liegt roh bei 36 KB; der Import-Schritt räumt nur Attribute auf, ein zusätzliches SVGO-Paket kommt nicht ins Projekt).
- Illustrationen sind rein dekorativ, tragen keinen Text und erscheinen nie im Hero, in Modals oder auf der Ergebnisseite.

## 7. Texte und Übersetzungen

- Neue Namespaces in `messages/de.json`: `heroReport`, `proof`, `reportFeatures`, `letterPreview`, `rights`. Neue Keys: `howItWorks.lead`, `nav.home`, `nav.links.{how,report,faq}`, `nav.pill`, `letterPreview.date`. Die FAQ bleibt bei den bestehenden neun Einträgen, weil Frist und Belegeinsicht dort schon beantwortet werden.
- Entfallende Keys: `hero.eyebrow`, `howItWorks.eyebrow`, `faq.eyebrow`, `nav.badge`, `stats.*`, `evidence.*`, `assurance.*` (Inhalte gehen in `proof` und `heroReport.footer` auf). Der Test `src/i18n/serverOnly.test.ts` muss danach grün sein; der Paritäts-One-Liner ist zwischen dem deutschen Textumbau und dem Übersetzungsschritt planmäßig rot und erst am Ende wieder grün.
- Schreibregeln für alle Landing-Texte: keine Gedankenstriche als Trenner (bestehende „–“ in `hero.subline` und `hero.priceNote` werden zu Punkt oder Komma), Buttons als Verb plus Objekt, keine Versalien außer Abkürzungen, keine Marketing-Floskeln.
- `en.json` wird vollständig nachgezogen; `tr`, `ar`, `ru`, `uk` erhalten Übersetzungen mit unverändertem `_meta.status: "ai-draft"`. Die Musterdaten im Brief und Bericht (Namen, Adressen, Beträge) bleiben in allen Sprachen identisch, nur Fließtext wird übersetzt. Der Brief bleibt in jeder Locale deutsch (Empfänger ist ein deutscher Vermieter); nur die Kennzeichnung „Muster“ wird übersetzt.
- Für RTL (`ar`) spiegeln sich Grid-Spalten automatisch; Illustrationen werden nicht gespiegelt.

## 8. Übrige Oberflächen auf Papier

| Oberfläche | Änderung |
|---|---|
| `PreviewView.tsx` (Erst-Prüfung) | Liegt im Blatt. Befundzeilen wie die Berichtskarte (Punkt, Titel, Betrag), gesperrte Titel in `faint` mit Schloss-Icon, Feature-Liste mit `accent.soft`-Markern, Checkout-Button primär (`fg`-Fläche), Demo-Hinweis `status.warn*`. Kein `accent.bg` mehr |
| `ResultView.tsx` (Bericht) | Kopf mit Potenzial in `accent` 30 px, Befundkarten auf `doc` mit Status-Rahmen nach 2.3, Legende in `faint`, Empfehlungsbox `paper.2`, PDF-Button sekundär (Rahmen `paper.line-strong`, Text `fg`, Hover Rahmen `accent`) |
| `LetterModal.tsx`, `ContactForm.tsx` | Backdrop `ink/70`, Dialog auf `doc`, Radius 16, Schatten `0 24px 60px rgba(18,23,30,.35)`, Eingaben auf `doc` mit Rahmen `paper.line-strong`, Fokus Rahmen `accent` plus Ring; Labels über den Feldern in `muted` 14 px |
| `ergebnis/page.tsx`, `LegalPage.tsx`, beide `not-found.tsx` | Gleiche Shell wie die Startseite (Nav auf Ink, Blatt, Footer). Rechtstexte 16 px auf 62 ch, Überschriften nach 3, Links in `accent` mit Unterstreichung |
| `Button.tsx` | primary: `fg` auf `paper`, Hover `#2A3038`; secondary: Rahmen `paper.line-strong`, Text `fg`; ghost: `muted`, Hover `fg`; accent: `accent` auf `doc` mit Rahmen `accent.border`. Alle: `:active { transform: scale(.97) }`, Mindesthöhe 44 px |
| `LocaleSwitcher.tsx` | In der Nav: `ink.2`-Fläche, Rahmen `ink.line`, Text `ink.fg` |
| `Logo.tsx` | Wortmarke auf `ink.fg`, damit sie auf Ink lesbar bleibt; Schild `#10B981` unverändert |

## 9. Bewegung

- `Reveal.tsx` bleibt, aber nur Opacity (kein Translate), 250 ms, `cubic-bezier(0.23, 1, 0.32, 1)`, Schwelle 0,1. `prefers-reduced-motion` wie bisher sofort sichtbar.
- Buttons: Hover-Farbwechsel 150 ms, Active-Scale 0,97. Karten haben keinen Hover.
- `<details>` ohne Animation. Ladebalken unverändert.
- Kein Parallax, keine schwebenden Illustrationen, kein Glow.

## 10. Barrierefreiheit und Qualität

- Alle Text-Flächen-Paare nach 2.4, geprüft durch `contrast.test.ts`.
- Fokus immer sichtbar: 2 px Außenlinie, Offset 2 px, `accent` auf Papier, `accent.bright` auf Ink.
- Illustrationen und Musterdokumente `aria-hidden`; Sprungmarken in der Nav sind echte Anker.
- Touch-Ziele mindestens 44 px; Upload-Zone per Tastatur erreichbar (bestehendes Verhalten).
- Lighthouse Accessibility auf der Startseite bleibt bei 100, Performance nicht unter dem Stand vor dem Umbau (Illustrationen inline, gesamt unter 60 KB).

## 11. Verifikation

- `npx tsc --noEmit && npm test && npm run lint && npm run build` grün; `npm audit --omit=dev` ohne Befund; Paritäts-One-Liner für `messages/*.json` grün.
- Neue Tests: `src/lib/design/contrast.test.ts` (Token-Paare); `src/components/illustrations/illustrations.test.tsx` (jede Komponente rendert ein `<svg aria-hidden="true">` ohne `width`/`height`-Attribut).
- Bestehender `manifest.test.ts` bleibt gültig (`theme_color === BRAND_INK`).
- Sichtprüfung im Browser-Pane: Startseite Desktop 1280 und Mobil 375, Erst-Prüfung (Mock), Ergebnisseite, LetterModal, Impressum, 404, jeweils ohne Konsolenfehler in einem frischen Tab.

## 12. Umsetzungsreihenfolge (Grundlage für den Plan)

1. Tokens und `globals.css`, `BRAND_INK`, Kontrast-Test.
2. Seitenshell (Nav, Blatt, Footer) und Button-Varianten.
3. Hero mit `ReportPreviewCard`, Beleg-Zeile, Texte in `de.json`.
4. Illustrationen importieren, Schritte-Sektion, Upload-Zone.
5. `ReportFeatures` mit `LetterPreview`, `TenantRights`, FAQ-Umbau.
6. `PreviewView`, `ResultView`, `LetterModal`, Ergebnis-, Rechts- und 404-Seiten.
7. OG-Bild, Manifest, Icons.
8. Übersetzungen `en` vollständig, `tr/ar/ru/uk` als Draft, Paritäts-Check, Sichtprüfung, Push auf `origin monetarisierung`.
