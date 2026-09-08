# Papier auf Ink Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Website von „durchgehend dunkel“ auf „Papier auf Ink“ umbauen: dunkler Rahmen (Navigation, Seitenrand, Footer) als Markenmerkmal, der gesamte Inhalt liegt als helles Papierblatt darauf. Das verkaufte Produkt (Prüfbericht, Widerspruchsbrief) wird als Musterdokument sichtbar, vier zurückhaltende unDraw-Illustrationen ersetzen die nackten Textkästen. Ergebnis gepusht auf `origin monetarisierung`.

**Architecture:** Zwei Farbwelten als Tailwind-Tokens (`ink.*` für den Rahmen, `paper.*`/`doc`/`fg`/`muted`/`faint`/`accent.*` für das Blatt). Eine Seitenshell-Komponente `SiteShell` (Nav auf Ink, Blatt, Footer) trägt Startseite, Ergebnisseite, Rechtsseiten und die Locale-404; die Root-404 bekommt eine schlanke Kopie ohne next-intl. Landing-Sektionen bleiben Client-Komponenten mit `useTranslations`. Illustrationen werden einmalig per Node-Skript aus rohen unDraw-SVGs zu Inline-TSX-Komponenten umgewandelt (kein `public/`, kein `next/image`, keine neue npm-Abhängigkeit). Zwei neue Tests sichern die Farbwelt (WCAG-Kontrast aus den Tokens) und die Illustrationen (dekorativ, ohne feste Größe) ab.

**Tech Stack:** Next.js 15.5 (App Router), React 19, TypeScript 5, Tailwind CSS 3.4, next-intl 4 (de/en/tr/ar/ru/uk), vitest 5 (node-Environment, oxc-JSX), ESLint 9 Flat Config (`eslint-config-next`).

**Spec:** docs/superpowers/specs/2026-09-08-papier-auf-ink-design.md

**Rollback:** Tag design-backup-2026-09-06

---

## Dateistruktur

### Neu

| Datei | Verantwortung |
|---|---|
| `src/components/SiteShell.tsx` | Seitenshell: Nav auf Ink (Logo, Sprungmarken, Pill, Sprachwahl), Papierblatt, Footer. Wird von Startseite, Ergebnisseite, LegalPage und der Locale-404 genutzt. |
| `src/components/ReportPreviewCard.tsx` | Statisches, dekoratives Musterbeispiel des Prüfberichts im Hero (Befunde, Summenzeile, Fußzeile „Beispiel“). |
| `src/components/ProofLine.tsx` | Beleg-Zeile mit drei Zahlen plus Quellen; ersetzt `StatsBar.tsx`. Rendert zusätzlich echte Kundenstimmen aus `src/lib/reviews.ts`, solange welche vorhanden sind. |
| `src/components/LetterPreview.tsx` | Statischer, dekorativer Musterbrief (leicht gedreht) neben `ReportFeatures`. |
| `src/components/ReportFeatures.tsx` | Sektion „Das steckt im Bericht“ mit vier Feature-Einträgen und Inline-Icons. |
| `src/components/TenantRights.tsx` | Sektion „Dein gutes Recht als Mieter“ auf `paper.2` mit `ApartmentRent`-Illustration und `<dl>`. |
| `src/components/illustrations/Receipt.tsx` | unDraw „Receipt“ als Inline-SVG-Komponente (Schritt 1). Generiert. |
| `src/components/illustrations/DocumentReview.tsx` | unDraw „Document Review“ (Schritt 2). Generiert. |
| `src/components/illustrations/MailSent.tsx` | unDraw „Mail Sent“ (Schritt 3). Generiert. |
| `src/components/illustrations/ApartmentRent.tsx` | unDraw „Apartment rent“ (Mieterrechte). Generiert. |
| `src/components/illustrations/README.md` | Lizenzhinweis unDraw, Umfärbetabelle, Hinweis auf Regenerierung per Skript. |
| `src/components/illustrations/illustrations.test.tsx` | Prüft je Komponente: `aria-hidden="true"`, `viewBox` vorhanden, kein `width=`/`height=` am Root. |
| `src/lib/design/contrast.test.ts` | Rechnet die WCAG-Paare aus Spec 2.4 aus `tailwind.config.js` nach, Schwelle 4,5. |
| `scripts/import-undraw.mjs` | Einmaliges Importskript: rohe unDraw-SVGs → TSX-Komponenten (Umfärbung, Root-Attribute, JSX-Attributnamen, Größenprüfung). |

### Geändert

| Datei | Änderung |
|---|---|
| `tailwind.config.js` | Neue Token-Welt nach Spec 2.1 bis 2.3; `surface`, `accent.bg`, `status.okSurface`, `status.warnSurface`, `status.warnBgHover`, `status.okSoft`, `status.warnSoft` entfallen. |
| `src/app/globals.css` | Ink-Hintergrund `#12171E`, Papier-Textfarbe `#1B1F24`, Fokusring `accent` bzw. `accent.bright` innerhalb `[data-on-ink]`, `text-wrap`-Regeln. |
| `src/lib/seo.ts` | `BRAND_INK` auf `#12171E`, neu `BRAND_PAPER`. |
| `src/app/icon.svg` | Haken-Stroke von `#0C1016` auf `#12171E`. |
| `src/app/og.png/route.tsx` | Neuaufbau: Ink-Rahmen mit Papierblatt, Headline in `fg`, Akzentbalken, Domain auf dem Rahmen. |
| `src/app/[locale]/page.tsx` | Randspalten entfallen, Shell statt eigener Nav/Footer, neue Sektionsreihenfolge. |
| `src/app/[locale]/ergebnis/page.tsx` | Shell statt eigener Nav. |
| `src/app/[locale]/not-found.tsx` | Shell statt eigener Nav. |
| `src/app/not-found.tsx` | Schlanke Shell-Kopie ohne next-intl (eigenes `<html>`, rohe `<a>`). |
| `src/components/LandingHero.tsx` | Zweispaltiger Hero mit `ReportPreviewCard`, ohne Eyebrow. |
| `src/components/HowItWorks.tsx` | Drei Spalten mit Illustrationen statt nummerierter Liste. |
| `src/components/UploadZone.tsx` | Dokumentfläche mit gestricheltem Rahmen, Akzent-Icon-Kachel. |
| `src/components/Faq.tsx` | Papier-Stil, ohne Eyebrow, `id="fragen"`. |
| `src/components/Footer.tsx` | Ink-Footer in einer Zeile, wird von `SiteShell` gerendert. |
| `src/components/Reveal.tsx` | Nur Opacity, 250 ms, `cubic-bezier(0.23, 1, 0.32, 1)`, Schwelle 0,1. |
| `src/components/LocaleSwitcher.tsx` | Ink-Variante für die Nav. |
| `src/components/PreviewView.tsx` | Papier-Stil, Befundzeilen wie die Berichtskarte, Primärbutton. |
| `src/components/ResultView.tsx` | Papier-Stil, Status-Karten nach Spec 2.3, Empfehlungsbox `paper.2`. |
| `src/components/LetterModal.tsx` | Backdrop `ink/70`, Dialog auf `doc`, Eingaben auf `doc`. |
| `src/components/ContactForm.tsx` | Eingaben auf `doc`, Labels in `muted`. |
| `src/components/LegalPage.tsx` | Shell, 62-ch-Lesespalte, Links in `accent`. |
| `src/components/ActivityIndicator.tsx` | Balkenspur `paper.line`, Füllung `accent`. |
| `src/components/ui/Button.tsx` | Varianten nach Spec 8, `active:scale-[0.97]`. |
| `vitest.config.ts` | `include` zusätzlich `*.test.tsx`. |
| `messages/{de,en,tr,ar,ru,uk}.json` | Neue Namespaces `heroReport`, `proof`, `reportFeatures`, `letterPreview`, `rights`; neue Keys `nav.*`, `howItWorks.lead`; entfallende Keys nach Spec 7. |
| `README.md`, `docs/ARCHITECTURE.md` | Kurzer Absatz zum Design-System. |

### Gelöscht

| Datei | Grund |
|---|---|
| `src/components/StatsBar.tsx` | Ersetzt durch `ProofLine.tsx` (Spec 5.2). |

---

## Regeln für Implementierer

1. **Bash im Projekt:** Jeder Bash-Befehl beginnt mit `cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && …` — das Arbeitsverzeichnis wird zwischen Aufrufen zurückgesetzt.
2. **Commit-Messages ohne Umlaute** (reines ASCII: `ae`, `oe`, `ue`, `ss`). **Code-Kommentare auf Deutsch mit echten Umlauten.** Kommentare erklären das **Warum**, nicht das Was.
3. **UI-Texte:** Keine Gedankenstriche als Trenner — weder „–“ (Halbgeviert) noch „—“ (Geviert) zwischen Satzteilen. Der Mittelpunkt „·“ für Meta-Zeilen ist erlaubt. Bindestriche in zusammengesetzten Wörtern („Erst-Prüfung“) sind erlaubt. Buttons als Verb plus Objekt („Abrechnung prüfen“, nicht „Los geht's“). Keine Versalien außer Abkürzungen (BetrKV, HeizkV, BGB, PDF, DSGVO). Die bestehenden „–“ in `hero.subline` und `hero.priceNote` werden in Task 3 ersetzt.
4. **Sprachdateien:** `messages/tr.json`, `ar.json`, `ru.json`, `uk.json` behalten `_meta.status: "ai-draft"` unverändert. Alle sechs Dateien müssen am Ende strukturell paritätisch sein. **Zwischenstand:** Von Task 3 bis Task 12 wird nur `de.json` gepflegt, der Paritäts-Check schlägt in dieser Zeit erwartungsgemäß fehl; Task 13 zieht `en/tr/ar/ru/uk` nach und stellt Parität her. Paritäts-Befehl (aus `docs/I18N.md`):

   ```bash
   cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && node -e "const flat=(o,p='')=>Object.entries(o).flatMap(([k,v])=>v&&typeof v==='object'&&!Array.isArray(v)?flat(v,p+k+'.'):[p+k]);const de=new Set(flat(require('./messages/de.json')).filter(k=>!k.startsWith('_meta')));for(const l of ['en','tr','ar','ru','uk']){const s=new Set(flat(require('./messages/'+l+'.json')).filter(k=>!k.startsWith('_meta')));const miss=[...de].filter(k=>!s.has(k));const extra=[...s].filter(k=>!de.has(k));console.log(l+': '+(miss.length||extra.length?('FEHLT '+miss.join(',')+' | ZUVIEL '+extra.join(',')):'OK'));}"
   ```

   Erwartete Ausgabe am Ende: `en: OK`, `tr: OK`, `ar: OK`, `ru: OK`, `uk: OK`.
5. **Verifikations-Quartett nach jedem Task:**

   ```bash
   cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && npx tsc --noEmit && npm test && npm run lint && npm run build
   ```

   **Vor jedem `npm run build` den Dev-Server stoppen** (`preview_stop` mit der ServerId aus `preview_list`), sonst bricht der Build die laufende Dev-Instanz ab bzw. kollidiert im `.next`-Verzeichnis. Nach dem Build den Dev-Server bei Bedarf mit `preview_start` neu starten.
6. **Kein Merge nach `main`.** Push ausschließlich `git push origin monetarisierung`. Kein `git push --force`.
7. **Niemals `.env.local` ausgeben**, auch nicht auszugsweise, auch nicht in Fehlermeldungen.
8. **unDraw-Lizenz:** kommerziell frei nutzbar, keine Namensnennung nötig, aber **keine Weiterverbreitung als Sammlung**. Die vier SVGs bleiben Teil dieser Anwendung; sie werden nicht als Asset-Paket veröffentlicht.
9. **Musterdaten sind erfunden und werden exakt so verwendet:** Lena Hartmann, Gneisenaustraße 41, 10961 Berlin; Hausverwaltung Bergmann GmbH, Yorckstraße 12, 10965 Berlin; Beträge 96,00 € / 61,40 € / 27,10 €, Summe 184,50 €; Zugang 14.02.2027, Frist 30.03.2027. Jede Musterfläche trägt sichtbar „Beispiel“ bzw. „Muster“ und ist `aria-hidden`.
10. **Test-first, wo ein Test möglich ist:** Test schreiben, Fehlschlag zeigen (Ausgabe in den Task übernehmen), implementieren, grün zeigen.
11. **Keine neuen npm-Abhängigkeiten.** Icons als Inline-SVG, Illustrationen als Inline-TSX, keine SVGO-Installation.

---

### Task 1: Farbwelt umstellen (Tokens, globals.css, BRAND_INK, Kontrast-Test)

Setzt Spec 2.1 bis 2.5 und 12.1 um. Nach diesem Task sieht die Seite noch nicht fertig aus (das Layout kommt erst ab Task 2), aber alle Farbwerte stammen aus der neuen Welt und kein Verweis auf ein entferntes Token bleibt stehen.

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/app/globals.css`
- Modify: `src/lib/seo.ts`
- Modify: `src/app/icon.svg`
- Modify: `src/app/[locale]/page.tsx`, `src/components/{PreviewView,ResultView,UploadZone,LetterModal,ContactForm,LocaleSwitcher,LegalPage,ActivityIndicator}.tsx`, `src/components/ui/Button.tsx`
- Create: `src/lib/design/contrast.test.ts`
- Test: `src/lib/design/contrast.test.ts`, bestehender `src/app/manifest.test.ts`

---

- [ ] **Step 1: Inventar der entfallenden Tokens aufnehmen**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && grep -rn "bg-surface\|accent-bg\|okSurface\|warnSurface\|warnBgHover\|okSoft\|warnSoft\|accent-soft" src --include=*.tsx
  ```

  Erwartete Trefferliste (Stand vor dem Umbau, 30 Zeilen):

  ```
  src/app/[locale]/page.tsx:141   text-accent-soft   (Anfuehrungszeichen der Zitatspalte)
  src/app/[locale]/page.tsx:176   text-accent-soft   (Review-Betrag)
  src/app/[locale]/page.tsx:218   text-accent-soft   (Haken DSGVO)
  src/app/[locale]/page.tsx:219   text-accent-soft   (Haken Loeschung)
  src/app/[locale]/page.tsx:220   text-accent-soft   (Haken kein Account)
  src/app/[locale]/page.tsx:239   bg-surface         (Hinweisbox nach Stripe-Abbruch)
  src/app/[locale]/page.tsx:263   bg-status-warnSurface
  src/app/[locale]/page.tsx:265   text-status-warnSoft
  src/components/ActivityIndicator.tsx:63  bg-accent-soft
  src/components/ActivityIndicator.tsx:64  bg-accent-soft
  src/components/HowItWorks.tsx:9   text-accent-soft
  src/components/HowItWorks.tsx:14  text-accent-soft
  src/components/LandingHero.tsx:24 text-accent-soft
  src/components/LandingHero.tsx:25 text-accent-soft
  src/components/LandingHero.tsx:26 text-accent-soft
  src/components/LegalPage.tsx:39   hover:text-accent-soft
  src/components/LetterModal.tsx:250 bg-surface
  src/components/LocaleSwitcher.tsx:18 bg-surface
  src/components/PreviewView.tsx:79  text-accent-soft
  src/components/PreviewView.tsx:87  text-accent-soft
  src/components/PreviewView.tsx:107 text-accent-soft
  src/components/PreviewView.tsx:119 bg-accent-bg/40
  src/components/PreviewView.tsx:122 text-accent-soft
  src/components/PreviewView.tsx:123 text-accent-soft
  src/components/PreviewView.tsx:124 text-accent-soft
  src/components/PreviewView.tsx:125 text-accent-soft
  src/components/PreviewView.tsx:156 hover:bg-status-warnBgHover
  src/components/ResultView.tsx:43   bg-surface
  src/components/ResultView.tsx:45   text-accent-soft
  src/components/ResultView.tsx:120  bg-surface
  src/components/ResultView.tsx:135  bg-status-okSurface
  src/components/ResultView.tsx:141  text-status-okSoft
  src/components/ResultView.tsx:147  bg-surface
  src/components/ResultView.tsx:153  bg-surface
  src/components/ResultView.tsx:219  bg-surface
  src/components/StatsBar.tsx:23     text-accent-soft
  src/components/UploadZone.tsx:78   bg-accent-bg/40
  src/components/UploadZone.tsx:79   bg-surface / hover:bg-accent-bg/30
  src/components/UploadZone.tsx:97   bg-accent-bg
  src/components/UploadZone.tsx:98   text-accent-soft
  src/components/UploadZone.tsx:107  bg-surface
  src/components/ui/Button.tsx:32    hover:bg-accent-bg/40
  ```

  Zusätzlich `bg-ink` als Eingabe- bzw. Kartenfarbe:

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && grep -rn "bg-ink" src --include=*.tsx
  ```

  Erwartet: `ContactForm.tsx:84`, `LetterModal.tsx:231`, `ResultView.tsx:264` (diese drei werden hier umgestellt) sowie die Seiten-Wurzeln in `page.tsx`, `ergebnis/page.tsx`, beiden `not-found.tsx`, `LegalPage.tsx` und die Nav-Zeilen mit `bg-ink/90` (die bleiben vorerst stehen und verschwinden mit der Shell in Task 2).

  **Wichtig:** `accent.soft` wechselt die Bedeutung. Bisher ein helles Grün für Text und Icons (`#10B981`), künftig eine helle Akzentfläche (`#E4F2EA`). Jedes `text-accent-soft` wird deshalb zu `text-accent`, jedes `bg-accent-soft` als Punkt oder Icon zu `bg-accent`, jedes `bg-accent-bg` zu `bg-accent-soft`.

- [ ] **Step 2 (Test zuerst): `src/lib/design/contrast.test.ts` anlegen**

  ```ts
  import { describe, expect, it } from "vitest";
  import { createRequire } from "node:module";

  // tailwind.config.js ist CommonJS und liegt außerhalb von src/ – createRequire
  // lädt sie unverändert, damit der Test genau die Werte prüft, die auch
  // Tailwind beim Build sieht (und nicht eine Kopie, die auseinanderlaufen kann).
  const requireCjs = createRequire(import.meta.url);
  const tailwind = requireCjs("../../../tailwind.config.js") as {
    theme: { extend: { colors: Record<string, unknown> } };
  };
  const colors = tailwind.theme.extend.colors;

  /** Löst "ink.fg" oder "accent" gegen die Token-Struktur auf. */
  function token(path: string): string {
    const value = path.split(".").reduce<unknown>((node, key) => {
      if (node && typeof node === "object") return (node as Record<string, unknown>)[key];
      return undefined;
    }, colors);
    if (typeof value === "string") return value;
    if (value && typeof value === "object" && typeof (value as Record<string, unknown>).DEFAULT === "string") {
      return (value as Record<string, string>).DEFAULT;
    }
    throw new Error(`Token "${path}" fehlt in tailwind.config.js`);
  }

  /**
   * Relative Leuchtdichte nach WCAG 2.1:
   *   c  = Kanal / 255
   *   c' = c <= 0,03928 ? c / 12,92 : ((c + 0,055) / 1,055)^2,4
   *   L  = 0,2126 * R' + 0,7152 * G' + 0,0722 * B'
   */
  function luminance(hex: string): number {
    const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
    const linear = channels.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  }

  /** Kontrastverhältnis nach WCAG 2.1: (heller + 0,05) / (dunkler + 0,05). */
  function ratio(a: string, b: string): number {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  // Die Paare aus Spec-Abschnitt 2.4: Name, Vordergrund-Token, Hintergrund-Token.
  const PAIRS: Array<[string, string, string]> = [
    ["fg auf paper", "fg", "paper"],
    ["muted auf paper", "muted", "paper"],
    ["faint auf paper", "faint", "paper"],
    ["accent auf paper", "accent", "paper"],
    ["accent auf doc", "accent", "doc"],
    ["ink.fg auf ink", "ink.fg", "ink"],
    ["ink.muted auf ink", "ink.muted", "ink"],
    ["ink.faint auf ink", "ink.faint", "ink"],
    ["faint auf paper.2", "faint", "paper.2"],
    ["paper auf fg (Primaerbutton)", "paper", "fg"],
    ["accent.bright auf ink (Links im Rahmen)", "accent.bright", "ink"],
    ["status.ok auf status.okBg", "status.ok", "status.okBg"],
    ["status.warn auf status.warnBg", "status.warn", "status.warnBg"],
    ["status.neutral auf status.neutralBg", "status.neutral", "status.neutralBg"],
    ["status.danger auf status.dangerBg", "status.danger", "status.dangerBg"],
  ];

  describe("Farbkontraste des Design-Systems", () => {
    it.each(PAIRS)("%s erreicht WCAG AA (mindestens 4,5:1)", (_name, fg, bg) => {
      expect(ratio(token(fg), token(bg))).toBeGreaterThanOrEqual(4.5);
    });

    // Weißer Text auf dem Akzentbutton der Berichtskarte ist der einzige Fall,
    // in dem #FFFFFF als Textfarbe vorkommt – deshalb hart mitgeprüft.
    it("weißer Text auf accent erreicht WCAG AA", () => {
      expect(ratio("#FFFFFF", token("accent"))).toBeGreaterThanOrEqual(4.5);
    });

    it("kennt die entfernten Tokens nicht mehr", () => {
      expect(colors).not.toHaveProperty("surface");
      const accent = colors.accent as Record<string, unknown>;
      expect(accent).not.toHaveProperty("bg");
      const status = colors.status as Record<string, unknown>;
      for (const gone of ["okSurface", "warnSurface", "warnBgHover", "okSoft", "warnSoft"]) {
        expect(status).not.toHaveProperty(gone);
      }
    });
  });
  ```

  Fehlschlag zeigen:

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && npx vitest run src/lib/design/contrast.test.ts
  ```

  Erwartete Ausgabe: rot, unter anderem `Token "paper" fehlt in tailwind.config.js` und `expected { ... } not to have property "surface"`.

- [ ] **Step 3: `tailwind.config.js` vollstaendig ersetzen**

  ```js
  /** @type {import('tailwindcss').Config} */
  module.exports = {
    content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
    theme: {
      extend: {
        colors: {
          // Zwei Welten: "ink" ist der dunkle Rahmen (Navigation, Seitenrand,
          // Footer, Modal-Backdrop), alles Übrige gilt innerhalb des Blatts.
          // Hinweis: NICHT "base" nennen - kollidiert mit Tailwinds text-base.
          ink: {
            DEFAULT: "#12171E", // Rahmenfläche, html/body-Hintergrund
            2: "#1B222B", // leicht gehobene Fläche auf Ink (Pill in der Nav)
            line: "#26303A", // Haarlinien auf Ink
            fg: "#EEF1F4", // Text auf Ink
            muted: "#B4BDC7", // Sekundärtext auf Ink (Nav-Links)
            faint: "#8F9AA6", // Footer-Text auf Ink
          },

          // Papier: die Fläche, auf der der gesamte Inhalt liegt.
          paper: {
            DEFAULT: "#FBF9F4", // Blattfläche
            2: "#F3EFE6", // abgesetzte Sektion (Mieterrechte), Empfehlungsbox
            line: "#E3DDD0", // Haarlinien, Kartenrahmen
            "line-strong": "#C9C2B2", // Rahmen interaktiver Elemente, Strichlinien
          },

          // Dokumentfläche: Berichtskarte, Brief, Upload-Zone, Modal, Eingaben.
          // Der einzige Ort mit reinem Weiß - bewusst als "Papier im Papier",
          // damit gedruckte Artefakte sich vom Blatt abheben.
          doc: "#FFFFFF",

          // Aliase, damit bestehende Komponenten mit border-line und
          // border-line-strong ohne Umbenennung Papier werden (Spec 2.2).
          line: "#E3DDD0",
          "line-strong": "#C9C2B2",

          fg: {
            DEFAULT: "#1B1F24", // Primärtext, Primärbutton-Fläche
            hover: "#2A3038", // Hover des Primärbuttons
          },
          muted: "#4E555C", // Sekundärtext
          faint: "#5F666D", // Meta und Fußnoten (mindestens 12,5 px)

          // Marken-Akzent auf Papier. "bright" ist die einzige Variante für
          // dunklen Grund (Logo-Schild, Links und Fokusring im Ink-Rahmen).
          accent: {
            DEFAULT: "#047857", // Icons, Haken, Beträge, Berichts-Button
            hover: "#065F46", // Hover des Akzentbuttons
            bright: "#34D399", // Akzent auf Ink
            soft: "#E4F2EA", // Akzent-Hintergrund (Icon-Kacheln, Marker)
            border: "#BFE0CF", // Rahmen auf Akzent-Hintergrund
          },

          // Statusfarben der Befund-Ampel und der Meldungsboxen, jetzt in der
          // Papier-Welt. Bewusst getrennt vom Marken-Akzent: "ok" ist eine
          // Aussage über einen Befund, nicht die Markenfarbe. "unsicher" bleibt
          // neutral, Rot ist echten Fehlerzuständen vorbehalten.
          status: {
            ok: "#166534",
            okBg: "#EAF6EE",
            okBorder: "#BBE3C8",
            okStrong: "#16A34A",

            warn: "#92400E",
            warnBg: "#FDF3E3",
            warnBorder: "#F3D9A8",
            warnStrong: "#D97706",

            neutral: "#4E555C",
            neutralBg: "#F3EFE6",
            neutralBorder: "#D9D3C6",
            neutralStrong: "#8A96A6",

            danger: "#991B1B",
            dangerBg: "#FDECEC",
            dangerBorder: "#F2B8B8",
            dangerStrong: "#DC2626",
          },
        },
      },
    },
    plugins: [],
  };
  ```

  Test gruen zeigen:

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && npx vitest run src/lib/design/contrast.test.ts
  ```

  Erwartete Ausgabe: `Test Files  1 passed (1)`, `Tests  17 passed (17)`.

- [ ] **Step 4: `src/app/globals.css` vollstaendig ersetzen**

  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  * {
    box-sizing: border-box;
  }

  /* Ink auch auf html/body: der Overscroll-Bereich außerhalb des Papierblatts
     soll die Rahmenfarbe zeigen, nicht Weiß. */
  html {
    background-color: #12171E;
  }

  body {
    -webkit-font-smoothing: antialiased;
    background-color: #12171E;
    color: #1B1F24;
  }

  /* Kyrillisch/Arabisch: Geist deckt sie nicht ab -> saubere System-Fallbacks. */
  html[lang="ru"] body,
  html[lang="uk"] body { font-family: var(--font-geist), "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
  html[lang="ar"] body { font-family: "Segoe UI", "Noto Sans Arabic", Tahoma, Arial, sans-serif; }
  /* Negatives/positives Tracking zerreisst arabische Ligaturen. */
  html[dir="rtl"] [class*="tracking-"] { letter-spacing: 0 !important; }

  /* Überschriften brechen ausgewogen um, Fließtext vermeidet Schusterjungen.
     Beides sind Fortschritts-Eigenschaften: Browser ohne Unterstützung
     rendern unverändert weiter. */
  h1, h2, h3 { text-wrap: balance; }
  p { text-wrap: pretty; }

  /* Sichtbarer Fokusring projektweit für Tastaturbedienung (WCAG 2.4.7).
     Standard ist der Papier-Akzent; im dunklen Rahmen (Nav, Footer) wäre er
     zu dunkel, deshalb schaltet [data-on-ink] dort auf accent.bright um. */
  :focus-visible {
    outline: 2px solid #047857;
    outline-offset: 2px;
  }
  [data-on-ink]:focus-visible,
  [data-on-ink] :focus-visible {
    outline-color: #34D399;
  }
  ```

- [ ] **Step 5: `src/lib/seo.ts` und `src/app/icon.svg`**

  `src/lib/seo.ts`, vorher:

  ```ts
  export const BRAND_INK = "#0C1016";
  ```

  nachher:

  ```ts
  export const BRAND_INK = "#12171E";

  /**
   * Blattfarbe der Marke („paper“, entspricht bg-paper in tailwind.config.js).
   * Gegenstück zu BRAND_INK für Flächen, die außerhalb von Tailwind
   * gezeichnet werden (aktuell das OG-Bild).
   */
  export const BRAND_PAPER = "#FBF9F4";
  ```

  `src/app/icon.svg`, Zeile 3, vorher `stroke="#0C1016"`, nachher `stroke="#12171E"` (der Haken wird als Aussparung im gruenen Schild in Rahmenfarbe gezeichnet).

- [ ] **Step 6: Fundstellen aus Step 1 umstellen**

  Jeweils exakte Klassenersetzung, die übrigen Klassen der Zeile bleiben unverändert:

  | Datei | vorher | nachher |
  |---|---|---|
  | alle `.tsx` | `text-accent-soft` | `text-accent` |
  | `ActivityIndicator.tsx` Z. 58 | `text-accent-bright` | `text-accent` |
  | `ActivityIndicator.tsx` Z. 63, 64 | `bg-accent-soft` | `bg-accent` |
  | `ActivityIndicator.tsx` Z. 8 | `bg-line` | `bg-paper-line` |
  | `ActivityIndicator.tsx` Z. 68 | `bg-line` | `bg-paper-line-strong` |
  | `LegalPage.tsx` Z. 39 | `text-accent-bright hover:text-accent-soft` | `text-accent underline hover:text-accent-hover` |
  | `LocaleSwitcher.tsx` Z. 18 | `bg-surface border border-line text-muted` | `bg-ink-2 border border-ink-line text-ink-fg` |
  | `LetterModal.tsx` Z. 250 | `bg-surface` | `bg-doc` |
  | `LetterModal.tsx` Z. 231 | `bg-ink` | `bg-doc` |
  | `ContactForm.tsx` Z. 84 | `bg-ink` | `bg-doc` |
  | `PreviewView.tsx` Z. 119 | `bg-accent-bg/40` | `bg-accent-soft` |
  | `PreviewView.tsx` Z. 156 | `hover:bg-status-warnBgHover` | `hover:border-status-warnStrong` |
  | `ResultView.tsx` Z. 43, 120, 147, 153, 219 | `bg-surface` | `bg-doc` |
  | `ResultView.tsx` Z. 135 | `bg-status-okSurface` | `bg-status-okBg border border-status-okBorder` |
  | `ResultView.tsx` Z. 141 | `text-status-okSoft` | `text-muted` |
  | `ResultView.tsx` Z. 264 | `bg-ink/60` | `bg-paper-2` |
  | `UploadZone.tsx` Z. 78 | `border-accent bg-accent-bg/40` | `border-accent bg-accent-soft` |
  | `UploadZone.tsx` Z. 79 | `border-line-strong bg-surface hover:border-accent hover:bg-accent-bg/30` | `border-line-strong bg-doc hover:border-accent hover:bg-accent-soft` |
  | `UploadZone.tsx` Z. 97 | `bg-accent-bg` | `bg-accent-soft` |
  | `UploadZone.tsx` Z. 107 | `bg-surface border border-line text-muted` | `bg-paper-2 border border-line text-muted` |
  | `ui/Button.tsx` Z. 28 | `hover:text-accent-bright` | `hover:text-accent` |
  | `ui/Button.tsx` Z. 32 | `hover:bg-accent-bg/40` | `hover:bg-accent-soft` |
  | `[locale]/page.tsx` Z. 239 | `bg-surface` | `bg-doc` |
  | `[locale]/page.tsx` Z. 263 | `bg-status-warnSurface` | `bg-status-warnBg border border-status-warnBorder` |
  | `[locale]/page.tsx` Z. 265 | `text-status-warnSoft` | `text-muted` |

  `LegalPage.tsx` Z. 18, `[locale]/page.tsx` Z. 113 und die vier `bg-ink/90`-Navigationsleisten bleiben vorerst stehen; die Shell in Task 2 raeumt sie ab.

- [ ] **Step 7: Verifikation**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && grep -rn "bg-surface\|accent-bg\|okSurface\|warnSurface\|warnBgHover\|okSoft\|warnSoft\|text-accent-soft" src --include=*.tsx
  ```

  Erwartete Ausgabe: leer (kein Treffer). `bg-accent-soft` als Flaeche bleibt bestehen und wird von diesem Muster bewusst nicht erfasst.

  Dev-Server stoppen (`preview_list`, dann `preview_stop`), danach:

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && npx tsc --noEmit && npm test && npm run lint && npm run build
  ```

  Erwartet: `tsc` ohne Ausgabe; `npm test` `Test Files  19 passed (19)` (18 bestehende plus `contrast.test.ts`); `npm run lint` ohne Fehler; `npm run build` `Compiled successfully`. `manifest.test.ts` bleibt gruen, weil es `BRAND_INK` nur gegen sich selbst prueft.

- [ ] **Step 8: Commit**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && git add -A && git commit -m "feat(design): Papier-auf-Ink-Farbtokens, globals.css und Kontrast-Test"
  ```

---

### Task 2: Seitenshell, Footer, Sprachwahl, Button-Varianten, Reveal

Setzt Spec 4, 8 (Button, LocaleSwitcher), 9 und 12.2 um. Am Ende dieses Tasks liegt die Startseite als Papierblatt im Ink-Rahmen; die einzelnen Sektionen sind inhaltlich noch die alten.

**Files:**
- Create: `src/components/SiteShell.tsx`
- Modify: `src/components/Footer.tsx`, `src/components/LocaleSwitcher.tsx`, `src/components/Reveal.tsx`, `src/components/ui/Button.tsx`, `src/app/[locale]/page.tsx`, `messages/de.json`
- Test: bestehende Suite (kein neuer Test; die Shell wird in Task 14 visuell geprueft)

---

- [ ] **Step 1: Nav-Texte in `messages/de.json`**

  Der Block `"nav"` wird vollstaendig ersetzt (vorher nur `badge`):

  ```json
  "nav": {
    "home": "Zur Startseite",
    "links": {
      "how": "So funktioniert's",
      "report": "Bericht",
      "faq": "Fragen"
    },
    "pill": "Erst-Prüfung gratis · Bericht 9,90 €"
  },
  ```

  `nav.badge` faellt weg (Spec 7). `nav.home` ist neu und dient als `aria-label` des Logo-Links in der Shell; ohne diesen Key haette der Link in fuenf Sprachen keinen Namen. Die Pill nennt bewusst weiterhin den Preis: die Startseite darf nach dem Release-Audit nicht wieder nur „gratis“ versprechen.

- [ ] **Step 2: `src/components/ui/Button.tsx` — Varianten und Groessen austauschen**

  Vorher (Zeilen 18 bis 40):

  ```ts
  const BASE =
    "inline-flex items-center justify-center gap-2 rounded-xl transition-colors " +
    "disabled:opacity-60 disabled:cursor-not-allowed";

  const VARIANTS: Record<Variant, string> = {
    // Haupt-CTA. active:scale gibt haptisches Feedback, wird im deaktivierten
    // Zustand zurückgenommen (sonst "wackelt" ein Button, der nichts tut).
    primary:
      "bg-accent hover:bg-accent-hover text-white active:scale-[0.98] disabled:active:scale-100",
    secondary:
      "border border-line-strong text-muted hover:border-accent hover:text-accent",
    ghost: "text-muted hover:text-fg",
    // Akzent-Umriss: für nachgeordnete Aktionen, die trotzdem zum Kern gehören
    // (kombiniertes Schreiben) – sichtbar hervorgehoben, aber nicht als zweiter Haupt-CTA.
    accent: "border border-accent-border text-accent hover:bg-accent-soft",
  };

  // Beide Größen erfüllen die 44-px-Mindestfläche aus Task 2 auch dann, wenn der
  // Text kleiner wird oder das Label umbricht – deshalb zusätzlich min-h.
  const SIZES: Record<Size, string> = {
    md: "min-h-11 py-3 px-5 text-sm",
    lg: "min-h-12 py-3.5 px-7 text-base",
  };
  ```

  Nachher:

  ```ts
  const BASE =
    "inline-flex items-center justify-center gap-2 rounded-xl transition-colors duration-150 " +
    // Active-Scale gibt haptisches Feedback; im deaktivierten Zustand
    // zurückgenommen, sonst „wackelt“ ein Button, der nichts tut.
    "active:scale-[0.97] disabled:active:scale-100 " +
    "disabled:opacity-60 disabled:cursor-not-allowed";

  const VARIANTS: Record<Variant, string> = {
    // Haupt-CTA auf Papier: dunkle Fläche, Blattfarbe als Text (15,7:1).
    // Das Akzentgrün bleibt den Beträgen und dem Berichts-Button vorbehalten,
    // damit auf einer Seite nur ein Element „grün ruft“.
    primary: "bg-fg hover:bg-fg-hover text-paper",
    secondary: "border border-paper-line-strong text-fg hover:border-accent hover:text-accent",
    ghost: "text-muted hover:text-fg",
    // Akzent-Umriss auf Dokumentfläche: für nachgeordnete Aktionen, die trotzdem
    // zum Kern gehören (kombiniertes Schreiben, PDF im Bericht).
    accent: "bg-doc border border-accent-border text-accent hover:bg-accent-soft",
  };

  // Beide Größen erfüllen die 44-px-Mindestfläche auch dann, wenn der Text
  // kleiner wird oder das Label umbricht – deshalb zusätzlich min-h.
  // lg trägt exakt die 15/26 px Innenabstand aus Spec 5.1 (Hero-CTA).
  const SIZES: Record<Size, string> = {
    md: "min-h-11 py-3 px-5 text-sm",
    lg: "min-h-12 py-[15px] px-[26px] text-base",
  };
  ```

- [ ] **Step 3: `src/components/Reveal.tsx` — nur noch Opacity**

  Der `IntersectionObserver`-Block, vorher:

  ```tsx
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        },
        { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
      );
  ```

  nachher:

  ```tsx
      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        },
        { threshold: 0.1 }
      );
  ```

  Und der Style-Block, vorher:

  ```tsx
        style={{
          opacity: shown ? 1 : 0,
          transform: shown ? "none" : "translateY(16px)",
          transition: "opacity 350ms ease-out, transform 350ms ease-out",
          transitionDelay: `${delay}ms`,
        }}
  ```

  nachher:

  ```tsx
        style={{
          // Bewusst nur Opacity: ein zusätzliches Verschieben lässt die Seite
          // beim Scrollen „arbeiten“ und passt nicht zu einer Vertrauensmarke.
          opacity: shown ? 1 : 0,
          transition: "opacity 250ms cubic-bezier(0.23, 1, 0.32, 1)",
          transitionDelay: `${delay}ms`,
        }}
  ```

  Der Doc-Kommentar oben in der Datei wird angepasst (vorher „Fade + leichtes Aufsteigen“):

  ```tsx
  /**
   * Dezenter Scroll-Reveal: blendet Inhalt beim Eintreten in den Viewport
   * gestaffelt ein (nur Opacity). Respektiert `prefers-reduced-motion`
   * (dann sofort sichtbar, ohne Transition).
   */
  ```

- [ ] **Step 4: `src/components/LocaleSwitcher.tsx` — Ink-Variante**

  Vorher (Zeile 18):

  ```tsx
      className="bg-ink-2 border border-ink-line text-ink-fg text-sm rounded-md min-h-11 px-3 hover:text-fg transition-colors cursor-pointer"
  ```

  nachher:

  ```tsx
      className="bg-ink-2 border border-ink-line text-ink-fg text-sm rounded-md min-h-11 px-3 hover:border-ink-muted transition-colors cursor-pointer"
  ```

  Grund für den Hover-Wechsel: `text-fg` ist jetzt die Papier-Textfarbe und wäre auf Ink unlesbar; die Rückmeldung übernimmt der Rahmen.

- [ ] **Step 5: `src/components/Footer.tsx` vollstaendig ersetzen**

  ```tsx
  import { Link } from "@/i18n/navigation";
  import { useTranslations } from "next-intl";

  /**
   * Fuß der Seitenshell. Liegt bewusst auf Ink (nicht auf dem Papierblatt):
   * Rahmen und Fuß sind dasselbe Markenelement, das Blatt endet darüber.
   */
  export default function Footer() {
    const t = useTranslations("footer");
    return (
      <footer data-on-ink className="bg-ink px-5 sm:px-6 py-10 sm:py-12">
        <div className="max-w-[1180px] mx-auto flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <span className="font-black text-ink-fg tracking-tight text-lg">Nebenkostencheck</span>

          {/* -mx-2 gleicht das Innenpolster der Touch-Ziele optisch aus, damit die
              Linkreihe buendig mit der Wortmarke beginnt. */}
          <nav className="flex flex-wrap gap-1 -mx-2 text-sm">
            <Link href="/impressum" className="inline-flex items-center justify-center min-h-11 min-w-11 px-2 text-ink-faint hover:text-ink-fg transition-colors">{t("impressum")}</Link>
            <Link href="/datenschutz" className="inline-flex items-center justify-center min-h-11 min-w-11 px-2 text-ink-faint hover:text-ink-fg transition-colors">{t("datenschutz")}</Link>
            <Link href="/agb" className="inline-flex items-center justify-center min-h-11 min-w-11 px-2 text-ink-faint hover:text-ink-fg transition-colors">{t("agb")}</Link>
          </nav>

          <p className="text-[12.5px] leading-relaxed text-ink-faint">{t("note")}</p>
        </div>

        <p className="max-w-[1180px] mx-auto mt-6 text-[12.5px] text-ink-faint">{t("copyright")}</p>
      </footer>
    );
  }
  ```

- [ ] **Step 6: `src/components/SiteShell.tsx` anlegen**

  ```tsx
  "use client";

  import { ReactNode } from "react";
  import { useTranslations } from "next-intl";
  import { Link } from "@/i18n/navigation";
  import Logo from "@/components/Logo";
  import LocaleSwitcher from "@/components/LocaleSwitcher";
  import Footer from "@/components/Footer";

  interface Props {
    children: ReactNode;
    /** Sprungmarken erscheinen nur dort, wo die Zielsektionen existieren (Startseite). */
    withNavLinks?: boolean;
    /** Blattbreite: „wide“ für die Landingpage, „narrow“ für Lesespalten. */
    width?: "wide" | "narrow";
  }

  /**
   * Seitenshell „Papier auf Ink“: dunkler Rahmen mit Navigation und Fuß, dazwischen
   * der Inhalt als helles Blatt. Client-Komponente, weil LocaleSwitcher Hooks
   * nutzt und Nav/Footer ihre Texte per useTranslations ziehen – Server-Seiten
   * (LegalPage, Locale-404) reichen ihr fertig gerendertes children hinein.
   */
  export default function SiteShell({ children, withNavLinks = false, width = "wide" }: Props) {
    const t = useTranslations("nav");

    const navLink =
      "inline-flex items-center min-h-11 px-1 text-ink-muted hover:text-ink-fg transition-colors";

    return (
      <div className="min-h-[100dvh] bg-ink flex flex-col">
        <nav
          data-on-ink
          className="sticky top-0 z-20 h-[68px] px-4 sm:px-6 flex items-center justify-between gap-3 border-b border-ink-line bg-ink/90 backdrop-blur-sm"
        >
          <Link href="/" aria-label={t("home")} className="inline-flex items-center min-h-11">
            <Logo />
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {withNavLinks && (
              /* Echte Anker, keine Router-Links: die Ziele liegen auf derselben Seite. */
              <div className="hidden md:flex items-center gap-4 text-sm">
                <a href="#so-funktionierts" className={navLink}>{t("links.how")}</a>
                <a href="#bericht" className={navLink}>{t("links.report")}</a>
                <a href="#fragen" className={navLink}>{t("links.faq")}</a>
              </div>
            )}
            <span className="hidden sm:inline-flex items-center rounded-full border border-ink-line bg-ink-2 px-3 py-1.5 text-[12.5px] text-ink-muted">
              {t("pill")}
            </span>
            <LocaleSwitcher />
          </div>
        </nav>

        {/* px-2 auf Mobil: 8 px Seitenrand, damit der Ink-Rahmen sichtbar bleibt. */}
        <div className="flex-1 px-2 sm:px-6">
          <main
            className={`mx-auto w-full bg-paper text-fg shadow-[0_30px_80px_rgba(0,0,0,0.55)] rounded-xl sm:rounded-b-none sm:rounded-t-[18px] px-5 py-10 sm:px-14 sm:py-14 ${
              width === "wide" ? "max-w-[1180px]" : "max-w-3xl"
            }`}
          >
            {children}
          </main>
        </div>

        <Footer />
      </div>
    );
  }
  ```

- [ ] **Step 7: `src/app/[locale]/page.tsx` auf die Shell umstellen**

  Importe: `Logo`, `LocaleSwitcher`, `Footer` und `reviews` entfallen, `SiteShell` kommt dazu.

  ```tsx
  import SiteShell from "@/components/SiteShell";
  ```

  Der gesamte Rückgabewert von `Home` (bisher `<main className="min-h-[100dvh] bg-ink"> … </main>` inklusive `<nav>`, den beiden `<aside>`-Randspalten und `<Footer />`) wird ersetzt durch:

  ```tsx
    return (
      <SiteShell withNavLinks={!preview && !loading}>
        {/* Eigene, kleine Suspense-Grenze nur für useSearchParams: hält sie fern von
            preview/notice weiter oben, damit ein Re-Suspend beim URL-Cleanup nicht
            den gesamten Seiten-State zurücksetzt. */}
        <Suspense fallback={null}>
          <CancelRestore onRestore={handleCanceled} />
        </Suspense>

        {!preview && !loading ? (
          <>
            <LandingHero />
            <Reveal>
              <StatsBar />
            </Reveal>
            <Reveal delay={80}>
              <HowItWorks />
            </Reveal>
            <div id="upload" className="mt-2">
              <UploadZone onUpload={handleFileUpload} loading={loading} error={error} />
            </div>
            <Reveal delay={120}>
              <Faq />
            </Reveal>
          </>
        ) : (
          /* Laden / Teaser: schmale Lesespalte innerhalb des Blatts */
          <div id="upload" className="max-w-2xl mx-auto">
            {loading ? (
              <UploadZone onUpload={handleFileUpload} loading={loading} error={error} />
            ) : preview?.notAStatement ? (
              <NotAStatementBox onReset={handleReset} />
            ) : (
              <>
                {notice && preview && (
                  <div
                    role="status"
                    className="mb-4 rounded-xl border border-line bg-doc px-4 py-3 text-sm text-muted"
                  >
                    {notice}
                  </div>
                )}
                <PreviewView preview={preview!} onReset={handleReset} />
              </>
            )}
          </div>
        )}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
        />
      </SiteShell>
    );
  ```

  Die Hilfskomponenten `NotAStatementBox`, `CancelRestore` und `fileToBase64` am Dateiende bleiben unverändert (bis auf die Klassen aus Task 1).

- [ ] **Step 8: Verifikation**

  Dev-Server starten, `http://localhost:3000/` oeffnen: dunkle Nav mit Logo, drei Sprungmarken, Pill und Sprachwahl; darunter ein helles Blatt mit Schatten; unten dunkler Footer in einer Zeile. Auf 375 px Breite bleibt links und rechts ein 8-px-Ink-Streifen sichtbar. Konsole ohne Fehler.

  Dev-Server stoppen, dann:

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && npx tsc --noEmit && npm test && npm run lint && npm run build
  ```

  Erwartet: alles gruen, `Test Files  19 passed (19)`.

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && grep -rn "nav.badge" src messages/de.json
  ```

  Erwartet: leer.

- [ ] **Step 9: Commit**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && git add -A && git commit -m "feat(design): Seitenshell aus Ink-Rahmen und Papierblatt, Button-Varianten, ruhigerer Reveal"
  ```

---

### Task 3: Hero mit Berichtskarte

Setzt Spec 5.1 und 12.3 um. Der Hero wird zweispaltig, die Berichtskarte zeigt zum ersten Mal das verkaufte Produkt.

**Files:**
- Create: `src/components/ReportPreviewCard.tsx`
- Modify: `src/components/LandingHero.tsx`, `messages/de.json`
- Test: bestehende Suite

---

- [ ] **Step 1: Texte in `messages/de.json`**

  `hero` wird ersetzt (`eyebrow` entfaellt, `subline` und `priceNote` verlieren ihre Gedankenstriche):

  ```json
  "hero": {
    "headline": "Steckt Geld in deiner Nebenkostenabrechnung?",
    "subline": "Lade deine Nebenkosten- oder Betriebskostenabrechnung hoch. In Sekunden auf typische Fehler geprüft, mit geschätztem Erstattungspotenzial.",
    "cta": "Abrechnung prüfen",
    "priceNote": "Erst-Prüfung kostenlos · vollständiger Bericht einmalig 9,90 €, kein Abo"
  },
  ```

  Neuer Namespace `heroReport` (direkt nach `hero` einfuegen). Die Musterdaten sind erfunden und in allen Sprachen identisch:

  ```json
  "heroReport": {
    "badge": "Beispiel",
    "title": "Prüfbericht",
    "meta": "Abrechnung 2025 · 3 Befunde",
    "items": [
      {
        "title": "Verwaltungskosten umgelegt",
        "reason": "Nicht umlagefähig nach § 1 Abs. 2 Nr. 1 BetrKV",
        "amount": "96,00 €",
        "confidence": "ok"
      },
      {
        "title": "Reparaturkosten in der Abrechnung",
        "reason": "Instandsetzung ist keine Betriebskostenposition, § 2 BetrKV",
        "amount": "61,40 €",
        "confidence": "ok"
      },
      {
        "title": "Heizkosten nicht nach Verbrauch verteilt",
        "reason": "Mindestens 50 % Verbrauchsanteil verlangt § 7 HeizkV",
        "amount": "27,10 €",
        "confidence": "warn"
      }
    ],
    "totalLabel": "Geschätztes Erstattungspotenzial",
    "totalValue": "≈ 184,50 €",
    "cta": "Widerspruch als PDF erstellen",
    "footer": "Beispiel · Geprüft nach BetrKV, HeizkV und BGH-Rechtsprechung"
  },
  ```

- [ ] **Step 2: `src/components/ReportPreviewCard.tsx` anlegen**

  ```tsx
  import { useTranslations } from "next-intl";

  interface Item {
    title: string;
    reason: string;
    amount: string;
    confidence: "ok" | "warn";
  }

  /**
   * Statisches Musterbeispiel des Prüfberichts im Hero. Zeigt das verkaufte
   * Produkt, ohne es zu simulieren: die Karte ist komplett aria-hidden, der
   * „Button“ ist ein <span> ohne Interaktion, und die Kennzeichnung „Beispiel“
   * steht sichtbar oben und in der Fußzeile. Zahlen und Paragrafen sind erfunden
   * und in allen Sprachen identisch (nur der Fließtext wird übersetzt).
   */
  export default function ReportPreviewCard() {
    const t = useTranslations("heroReport");
    const items = t.raw("items") as Item[];

    return (
      <div
        aria-hidden="true"
        className="w-full max-w-[520px] rounded-[14px] border border-paper-line bg-doc shadow-[0_12px_30px_rgba(27,31,36,0.08)] overflow-hidden"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-paper-line">
          <div>
            <p className="text-lg font-extrabold tracking-tight text-fg">{t("title")}</p>
            <p className="text-[12.5px] text-faint mt-0.5">{t("meta")}</p>
          </div>
          <span className="shrink-0 rounded-full border border-paper-line-strong px-2.5 py-1 text-[12.5px] text-faint">
            {t("badge")}
          </span>
        </div>

        <ul className="divide-y divide-paper-line">
          {items.map((item) => (
            <li key={item.title} className="flex items-start gap-3 px-5 py-3.5">
              <span
                className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                  item.confidence === "ok" ? "bg-status-okStrong" : "bg-status-warnStrong"
                }`}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-fg">{item.title}</span>
                <span className="block text-[12.5px] text-muted leading-snug mt-0.5">{item.reason}</span>
              </span>
              <span className="shrink-0 text-sm font-bold tabular-nums text-fg">{item.amount}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-baseline justify-between gap-3 px-5 py-4 border-t border-paper-line bg-paper">
          <span className="text-[12.5px] text-muted">{t("totalLabel")}</span>
          <span className="text-lg font-extrabold tabular-nums text-accent">{t("totalValue")}</span>
        </div>

        <div className="px-5 pb-5 pt-1 bg-paper">
          {/* Bewusst ein <span>: die Karte ist Dekoration, kein zweiter CTA. */}
          <span className="flex items-center justify-center min-h-11 rounded-xl bg-accent px-5 text-sm font-semibold text-white">
            {t("cta")}
          </span>
          <p className="mt-3 text-[12.5px] leading-snug text-faint">{t("footer")}</p>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 3: `src/components/LandingHero.tsx` vollstaendig ersetzen**

  ```tsx
  import { useTranslations } from "next-intl";
  import Button from "@/components/ui/Button";
  import ReportPreviewCard from "@/components/ReportPreviewCard";

  export default function LandingHero() {
    const t = useTranslations("hero");
    const tt = useTranslations("trust");

    return (
      <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-[52px] lg:items-center pb-12">
        <div className="min-w-0">
          <h1 className="text-[34px] sm:text-[52px] font-extrabold leading-[1.08] tracking-[-0.025em] text-fg hyphens-auto break-words">
            {t("headline")}
          </h1>
          <p className="mt-5 text-base sm:text-[17px] leading-[1.55] text-muted max-w-[62ch]">
            {t("subline")}
          </p>

          {/* Sprungmarke, kein Routenwechsel – Button rendert dafür ein rohes <a>. */}
          <div className="mt-7">
            <Button href="#upload" size="lg">
              {t("cta")} <span aria-hidden>→</span>
            </Button>
          </div>

          <p className="mt-3 text-[12.5px] text-faint">{t("priceNote")}</p>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
            <li className="flex items-center gap-1.5"><span className="text-accent">✓</span> {tt("dsgvo")}</li>
            <li className="flex items-center gap-1.5"><span className="text-accent">✓</span> {tt("deletion")}</li>
            <li className="flex items-center gap-1.5"><span className="text-accent">✓</span> {tt("noAccount")}</li>
          </ul>
        </div>

        {/* Unter 1024 px steht die Karte unter dem Text und bleibt bei 520 px stehen. */}
        <div className="flex justify-center lg:justify-end">
          <ReportPreviewCard />
        </div>
      </section>
    );
  }
  ```

- [ ] **Step 4: Verifikation**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && grep -rn "hero.eyebrow\|hero\.eyebrow" src messages/de.json
  ```

  Erwartet: leer.

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && node -e "const h=require('./messages/de.json').hero;for(const [k,v] of Object.entries(h)) if(/[–—]/.test(v)) console.log('GEDANKENSTRICH in hero.'+k);console.log('hero geprueft');"
  ```

  Erwartet: `hero geprueft` ohne weitere Zeile.

  Browser (Dev-Server): Startseite bei 1280 px zweispaltig, Karte rechts; bei 375 px untereinander, Karte unter dem Text. Keine Konsolenfehler.

  Dev-Server stoppen, dann `npx tsc --noEmit && npm test && npm run lint && npm run build` — alles gruen.

- [ ] **Step 5: Commit**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && git add -A && git commit -m "feat(landing): zweispaltiger Hero mit Muster-Berichtskarte statt Eyebrow"
  ```

---

### Task 4: Beleg-Zeile statt Metrik-Tabelle

Setzt Spec 5.2 um. `StatsBar.tsx` wird gelöscht, die Randspalten-Inhalte (Zitate, Quellen) gehen in die Beleg-Zeile auf.

**Files:**
- Create: `src/components/ProofLine.tsx`
- Delete: `src/components/StatsBar.tsx`
- Modify: `src/app/[locale]/page.tsx`, `messages/de.json`
- Test: bestehende Suite

---

- [ ] **Step 1: Texte in `messages/de.json`**

  Die Bloecke `"stats"`, `"evidence"` und `"assurance"` werden ersatzlos entfernt (ihre letzten Verwender sind mit Task 2 und diesem Task verschwunden). An die Stelle von `"stats"` tritt:

  ```json
  "proof": {
    "items": [
      {
        "value": "Rund die Hälfte",
        "text": "aller Betriebskostenabrechnungen ist fehlerhaft.",
        "source": "Deutscher Mieterbund"
      },
      {
        "value": "15 Sekunden",
        "text": "dauert die automatische Prüfung deiner Abrechnung.",
        "source": "Eigene Messung"
      },
      {
        "value": "12 Monate",
        "text": "hast du Zeit für Einwendungen, auch nach der Zahlung.",
        "source": "§ 556 Abs. 3 BGB"
      }
    ]
  },
  ```

  `reviews` bleibt unverändert erhalten.

- [ ] **Step 2: `src/components/ProofLine.tsx` anlegen**

  ```tsx
  import { useTranslations } from "next-intl";
  import { reviews } from "@/lib/reviews";

  interface ProofItem {
    value: string;
    text: string;
    source: string;
  }

  /**
   * Beleg-Zeile unter dem Hero: drei belegte Aussagen statt einer Metrik-Tabelle.
   * Bewusst ohne Kasten und ohne Rasterlinien – nur zwei Haarlinien oben und
   * unten, damit die Zeile als Beleg und nicht als Werbeblock liest.
   */
  export default function ProofLine() {
    const t = useTranslations("proof");
    const tr = useTranslations("reviews");
    const items = t.raw("items") as ProofItem[];

    return (
      <section className="border-y border-paper-line py-6">
        <div className="grid gap-[18px] md:grid-cols-[1.4fr_1fr_1fr] md:gap-10">
          {items.map((item) => (
            <div key={item.value} className="min-w-0">
              <p className="text-[26px] sm:text-[30px] font-extrabold leading-[1.1] tracking-[-0.02em] text-fg">
                {item.value}
              </p>
              <p className="mt-1 text-sm leading-[1.5] text-muted">{item.text}</p>
              <p className="mt-1 text-[12.5px] text-faint">{item.source}</p>
            </div>
          ))}
        </div>

        {/* Echte Kundenstimmen erscheinen erst, wenn welche eingetragen sind
            (src/lib/reviews.ts). Erfundene Testimonials wären nach § 5 UWG
            abmahnbar, deshalb bleibt der Block bis dahin leer. */}
        {reviews.length > 0 && (
          <ul className="mt-6 grid gap-5 border-t border-paper-line pt-6 md:grid-cols-3">
            {reviews.map((r, i) => (
              <li key={i} className="min-w-0">
                <blockquote className="m-0 text-sm leading-relaxed text-muted">{r.text}</blockquote>
                <p className="mt-2 text-[12.5px] text-faint">
                  {r.name}
                  {r.location ? ` · ${r.location}` : ""}
                </p>
                {r.savedEur != null && (
                  <p className="mt-1 text-[12.5px] font-semibold tabular-nums text-accent">
                    {tr("saved", { amount: r.savedEur })}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }
  ```

- [ ] **Step 3: `src/components/StatsBar.tsx` loeschen und Startseite umhaengen**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && rm src/components/StatsBar.tsx
  ```

  In `src/app/[locale]/page.tsx`, vorher:

  ```tsx
  import StatsBar from "@/components/StatsBar";
  ```

  nachher:

  ```tsx
  import ProofLine from "@/components/ProofLine";
  ```

  und im JSX vorher:

  ```tsx
            <Reveal>
              <StatsBar />
            </Reveal>
  ```

  nachher:

  ```tsx
            <Reveal>
              <ProofLine />
            </Reveal>
  ```

- [ ] **Step 4: Verifikation**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && grep -rn "StatsBar\|\"stats\"\|evidence\.\|assurance\." src messages/de.json
  ```

  Erwartet: leer.

  Browser: unter dem Hero drei Spalten mit Zahl, Satz und Quelle, oben und unten je eine Haarlinie. Unter 768 px untereinander. Konsole ohne Fehler.

  Dev-Server stoppen, dann `npx tsc --noEmit && npm test && npm run lint && npm run build` — alles gruen.

- [ ] **Step 5: Commit**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && git add -A && git commit -m "feat(landing): Beleg-Zeile mit Quellen ersetzt die Metrik-Tabelle"
  ```

---

### Task 5: Illustrationen importieren

Setzt Spec 6 und den ersten Teil von 12.4 um. Ein einmaliges Node-Skript erzeugt aus den vier rohen unDraw-SVGs vier TSX-Komponenten; ein Test hält sie dekorativ und größenflexibel.

**Files:**
- Create: `scripts/import-undraw.mjs`
- Create: `src/components/illustrations/README.md`
- Create (generiert): `src/components/illustrations/{Receipt,DocumentReview,MailSent,ApartmentRent}.tsx`
- Create: `src/components/illustrations/illustrations.test.tsx`
- Modify: `vitest.config.ts`
- Test: `src/components/illustrations/illustrations.test.tsx`

---

- [ ] **Step 1: vitest für `.tsx`-Tests öffnen**

  `vitest.config.ts` erfasst bisher nur `*.test.ts`. JSX wird bereits transformiert (`oxc.jsx.runtime = "automatic"`), das `node`-Environment reicht für `react-dom/server` — also genügt eine Zeile.

  Vorher:

  ```ts
    test: {
      include: ["src/**/*.test.ts"],
      environment: "node",
    },
  ```

  Nachher:

  ```ts
    test: {
      // .tsx zusätzlich, damit Komponententests (Illustrationen) laufen. Das
      // node-Environment bleibt: gerendert wird per react-dom/server, ein DOM
      // braucht das Projekt bisher nicht (kein @testing-library/react installiert).
      include: ["src/**/*.test.{ts,tsx}"],
      environment: "node",
    },
  ```

- [ ] **Step 2 (Test zuerst): `src/components/illustrations/illustrations.test.tsx` anlegen**

  ```tsx
  import { describe, expect, it } from "vitest";
  import { renderToStaticMarkup } from "react-dom/server";
  import ApartmentRent from "./ApartmentRent";
  import DocumentReview from "./DocumentReview";
  import MailSent from "./MailSent";
  import Receipt from "./Receipt";

  const ILLUSTRATIONS = [
    ["Receipt", Receipt],
    ["DocumentReview", DocumentReview],
    ["MailSent", MailSent],
    ["ApartmentRent", ApartmentRent],
  ] as const;

  describe("Illustrationen", () => {
    it.each(ILLUSTRATIONS)("%s ist dekorativ und skaliert über CSS", (_name, Illustration) => {
      const html = renderToStaticMarkup(<Illustration />);
      const root = html.slice(0, html.indexOf(">") + 1);

      // aria-hidden: die Motive tragen keine Information, die nicht daneben steht.
      expect(root).toContain('aria-hidden="true"');
      expect(root).toContain("viewBox=");
      // Feste Maße am Root würden die Größenvorgaben der Sektionen aushebeln.
      expect(root).not.toMatch(/\swidth="/);
      expect(root).not.toMatch(/\sheight="/);
      // unDraw liefert teils ein <title> mit; es würde dem aria-hidden widersprechen.
      expect(html).not.toContain("<title>");
    });

    it("nimmt className und Style von aussen entgegen", () => {
      const html = renderToStaticMarkup(<Receipt className="h-[150px] w-auto" />);
      expect(html).toContain('class="h-[150px] w-auto"');
    });
  });
  ```

  Fehlschlag zeigen:

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && npx vitest run src/components/illustrations
  ```

  Erwartete Ausgabe: rot, `Failed to resolve import "./ApartmentRent"`.

- [ ] **Step 3: `scripts/import-undraw.mjs` anlegen**

  ```js
  #!/usr/bin/env node
  // Einmaliger Import der vier unDraw-Motive nach src/components/illustrations/.
  //
  // Warum ein Skript und nicht Handarbeit: Umfärbetabelle, Root-Attribute und
  // JSX-Attributnamen müssen bei allen vier Dateien identisch greifen. Jede
  // Abweichung von Hand wäre ein stiller Farb- oder Rendering-Fehler, den man
  // erst im Browser sieht. Bewusst ohne SVGO: eine neue Abhängigkeit für einen
  // einmaligen Lauf lohnt sich nicht, stattdessen prüft das Skript die Größe.
  //
  // Aufruf: node scripts/import-undraw.mjs
  import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
  import { dirname, join } from "node:path";
  import { fileURLToPath } from "node:url";

  const HERE = dirname(fileURLToPath(import.meta.url));
  const ROOT = join(HERE, "..");
  const SRC_DIR = join(ROOT, "docs", "superpowers", "assets", "undraw");
  const OUT_DIR = join(ROOT, "src", "components", "illustrations");

  const MOTIFS = [
    { file: "receipt.svg", component: "Receipt", maxBytes: null },
    { file: "document-review.svg", component: "DocumentReview", maxBytes: null },
    { file: "mail-sent.svg", component: "MailSent", maxBytes: null },
    // Das größte Motiv; über 40 KB wäre es für eine Inline-Komponente zu schwer
    // (Spec 10 begrenzt alle vier Illustrationen zusammen auf 60 KB).
    { file: "apartment-rent.svg", component: "ApartmentRent", maxBytes: 40 * 1024 },
  ];

  // Umfärbetabelle aus Spec-Abschnitt 6. Nicht ersetzt werden bewusst:
  // Hauttöne (#fbbebe, #a0616a, #9f616a) und #fff – Weiß sind Dokumentflächen
  // in den Motiven und entspricht damit dem Token `doc`.
  const RECOLOR = {
    "#090814": "#1B1F24",
    "#2f2e41": "#1B1F24",
    "#3f3d56": "#3A414A",
    "#e6e6e6": "#E3DDD0",
    "#f2f2f2": "#E7E1D4",
    "#ccc": "#CFC9BC",
    "#fafafa": "#FBF9F4",
    "#57b894": "#6DBE9A",
  };

  // Attribute, die unDraw am Wurzelelement mitliefert und die im JSX nichts
  // verloren haben. width/height entfallen, weil die Größe aus dem Layout kommt;
  // role/aria-hidden setzt das Skript unten selbst. xmlns:xlink fliegt raus, weil
  // keines der vier Motive xlink:href benutzt.
  const DROP_ROOT_ATTRS = new Set([
    "width",
    "height",
    "class",
    "role",
    "artist",
    "copyright",
    "scrapped",
    "source",
    "xmlns:xlink",
    "data-name",
  ]);

  // SVG-Attribute mit Bindestrich bzw. Namensraum, die React in camelCase
  // erwartet. data-* und aria-* bleiben unverändert – die reicht React durch.
  const ATTR_MAP = {
    class: "className",
    "clip-path": "clipPath",
    "clip-rule": "clipRule",
    "fill-opacity": "fillOpacity",
    "fill-rule": "fillRule",
    "stop-color": "stopColor",
    "stop-opacity": "stopOpacity",
    "stroke-dasharray": "strokeDasharray",
    "stroke-dashoffset": "strokeDashoffset",
    "stroke-linecap": "strokeLinecap",
    "stroke-linejoin": "strokeLinejoin",
    "stroke-miterlimit": "strokeMiterlimit",
    "stroke-opacity": "strokeOpacity",
    "stroke-width": "strokeWidth",
    "xlink:href": "xlinkHref",
  };

  /** Ersetzt die Quellfarben. Der Lookahead verhindert, dass #ccc in #cccccc trifft. */
  function recolor(markup) {
    let out = markup;
    for (const [from, to] of Object.entries(RECOLOR)) {
      out = out.replace(new RegExp(`${from}(?![0-9a-fA-F])`, "gi"), to);
    }
    return out;
  }

  /** Liest name="wert"-Paare aus einem Tag-Inhalt. */
  function parseAttrs(raw) {
    const attrs = [];
    const re = /([A-Za-z_:][-\w:.]*)\s*=\s*"([^"]*)"/g;
    let match;
    while ((match = re.exec(raw)) !== null) attrs.push([match[1], match[2]]);
    return attrs;
  }

  /** Benennt Attribute nur innerhalb von Tags um – Pfaddaten bleiben unberührt. */
  function toJsxAttributes(markup) {
    return markup.replace(/<[A-Za-z][^>]*>/g, (tag) =>
      tag.replace(/([A-Za-z_:][-\w:.]*)\s*=/g, (whole, name) =>
        ATTR_MAP[name] ? `${ATTR_MAP[name]}=` : whole,
      ),
    );
  }

  mkdirSync(OUT_DIR, { recursive: true });
  let tooBig = false;

  for (const motif of MOTIFS) {
    const raw = readFileSync(join(SRC_DIR, motif.file), "utf8");

    const open = raw.match(/<svg\b([^>]*)>/);
    if (!open) throw new Error(`${motif.file}: kein <svg>-Wurzelelement gefunden`);

    const keptRoot = parseAttrs(open[1]).filter(([name]) => !DROP_ROOT_ATTRS.has(name));
    if (!keptRoot.some(([name]) => name === "viewBox")) {
      throw new Error(`${motif.file}: viewBox fehlt, ohne sie skaliert das SVG nicht`);
    }

    let body = raw.slice(open.index + open[0].length).replace(/<\/svg>\s*$/, "");
    // <title>/<desc> raus: die Motive sind rein dekorativ und aria-hidden; ein
    // Titel würde Screenreadern einen widersprüchlichen Namen anbieten.
    body = body.replace(/<title>[\s\S]*?<\/title>/g, "").replace(/<desc>[\s\S]*?<\/desc>/g, "");
    body = recolor(body);
    body = toJsxAttributes(body);

    const rootLines = keptRoot
      .map(([name, value]) => `      ${ATTR_MAP[name] ?? name}="${value}"`)
      .join("\n");

    const tsx = `// GENERIERT von scripts/import-undraw.mjs – nicht von Hand ändern.
  // Quelle, Lizenz und Umfärbetabelle: src/components/illustrations/README.md
  import type * as React from "react";

  export default function ${motif.component}(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
  ${rootLines}
        role="img"
        aria-hidden="true"
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        {...props}
      >${body}</svg>
    );
  }
  `;

    const target = join(OUT_DIR, `${motif.component}.tsx`);
    writeFileSync(target, tsx, "utf8");

    const bytes = Buffer.byteLength(tsx, "utf8");
    console.log(`${motif.component}.tsx: ${(bytes / 1024).toFixed(1)} KB`);
    if (motif.maxBytes !== null && bytes > motif.maxBytes) {
      console.error(
        `FEHLER: ${motif.component}.tsx ist ${(bytes / 1024).toFixed(1)} KB, erlaubt sind ` +
          `${(motif.maxBytes / 1024).toFixed(0)} KB.`,
      );
      tooBig = true;
    }
  }

  if (tooBig) process.exit(1);
  console.log("Import fertig.");
  ```

  **Achtung beim Anlegen:** Der TSX-Template-String oben ist im Plan zur besseren Lesbarkeit mit eingerückt worden. In der Datei beginnt der Template-Literal-Inhalt (`// GENERIERT …` bis `}` plus Zeilenumbruch) **ohne** die zwei zusätzlichen Leerzeichen Einrückung, damit die erzeugten Dateien korrekt formatiert sind. Die erzeugte Datei muss so aussehen (der SVG-Rumpf ist im folgenden Ausschnitt nur angedeutet, im Ergebnis steht dort der vollständige, umgefärbte Inhalt der Quelldatei):

  ```tsx
  // GENERIERT von scripts/import-undraw.mjs – nicht von Hand ändern.
  // Quelle, Lizenz und Umfärbetabelle: src/components/illustrations/README.md
  import type * as React from "react";

  export default function Receipt(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 960.744 880"
        role="img"
        aria-hidden="true"
        focusable="false"
        preserveAspectRatio="xMidYMid meet"
        {...props}
      ><g transform="translate(-495.31 -203.368)">{/* hier der komplette, umgefaerbte Rumpf des SVG */}</g></svg>
    );
  }
  ```

- [ ] **Step 4: Skript ausführen**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && node scripts/import-undraw.mjs
  ```

  Erwartete Ausgabe (Größen ±0,3 KB):

  ```
  Receipt.tsx: 6.3 KB
  DocumentReview.tsx: 6.1 KB
  MailSent.tsx: 3.0 KB
  ApartmentRent.tsx: 36.2 KB
  Import fertig.
  ```

  Exit-Code 0. Bleibt `ApartmentRent.tsx` über 40 KB, bricht das Skript mit Exit 1 ab; dann vor dem Weitermachen klären (Motiv tauschen ist keine Option, es steht in der Spec).

  Gegenprobe, dass die Umfärbung gegriffen hat:

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && grep -o "#[0-9a-fA-F]\{3,6\}" src/components/illustrations/*.tsx | sort | uniq -c | sort -rn
  ```

  Erwartet: nur noch `currentColor` (nicht im Muster), `#1B1F24`, `#3A414A`, `#E3DDD0`, `#E7E1D4`, `#CFC9BC`, `#FBF9F4`, `#6DBE9A`, `#fff` und die Hauttöne `#fbbebe`, `#a0616a`, `#9f616a`. **Keine** Treffer für `#090814`, `#2f2e41`, `#3f3d56`, `#e6e6e6`, `#f2f2f2`, `#ccc`, `#fafafa`, `#57b894`.

- [ ] **Step 5: `src/components/illustrations/README.md` anlegen**

  ```markdown
  # Illustrationen

  Vier Motive von [unDraw](https://undraw.co/) (Katerina Limpitsouni), inline als
  React-Komponenten. Kein `public/`, kein `next/image`: nur inline greift
  `currentColor` auf den Akzentflächen, sodass der Container per `text-accent`
  die Akzentfarbe setzt.

  | Komponente | unDraw-Motiv | Einsatz |
  |---|---|---|
  | `Receipt.tsx` | Receipt | Schritt 1 „Abrechnung hochladen“ |
  | `DocumentReview.tsx` | Document Review | Schritt 2 „Automatische Prüfung“ |
  | `MailSent.tsx` | Mail Sent | Schritt 3 „Widerspruch schicken“ |
  | `ApartmentRent.tsx` | Apartment rent | Sektion „Dein gutes Recht als Mieter“ |

  ## Lizenz

  unDraw License: kommerzielle und nicht-kommerzielle Nutzung frei, **keine
  Namensnennung nötig**, aber **keine Weiterverbreitung als Sammlung** (die
  Motive dürfen also nicht als eigenes Asset-Paket veröffentlicht werden). Sie
  sind hier Teil der Anwendung, nicht Teil eines Downloads.

  ## Umfärbung

  Beim Import einmalig angewandt (Spec-Abschnitt 6):

  | Quelle | Ziel | Bedeutung |
  |---|---|---|
  | `#090814`, `#2f2e41` | `#1B1F24` | Konturen, Haare, Kleidung → `fg` |
  | `#3f3d56` | `#3A414A` | Sekundäre Konturen |
  | `#e6e6e6` | `#E3DDD0` | Flächen → `paper.line` |
  | `#f2f2f2` | `#E7E1D4` | Hellere Flächen |
  | `#ccc` | `#CFC9BC` | Mittlere Flächen |
  | `#fafafa` | `#FBF9F4` | Papierflächen → `paper` |
  | `#57b894` | `#6DBE9A` | Grüne Details |

  Unverändert bleiben die Hauttöne (`#fbbebe`, `#a0616a`, `#9f616a`) und `#fff`
  (Dokumentflächen in den Motiven, entspricht dem Token `doc`). Die
  Akzentflächen tragen `fill="currentColor"` und übernehmen damit die Farbe des
  Containers.

  ## Regenerieren

  Die vier `.tsx`-Dateien sind **generiert** und werden nicht von Hand geändert.
  Quelle sind die rohen SVGs unter `docs/superpowers/assets/undraw/`:

  ```bash
  node scripts/import-undraw.mjs
  ```

  Das Skript entfernt `width`/`height`/`class`/`role` und die unDraw-Metadaten am
  Wurzelelement, setzt `role="img" aria-hidden="true" focusable="false"
  preserveAspectRatio="xMidYMid meet"`, übersetzt Attributnamen nach JSX und
  bricht mit Exit-Code 1 ab, wenn `ApartmentRent.tsx` 40 KB überschreitet.
  `src/components/illustrations/illustrations.test.tsx` sichert das Ergebnis ab.
  ```

- [ ] **Step 6: Verifikation**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && npx vitest run src/components/illustrations
  ```

  Erwartet: `Test Files  1 passed (1)`, `Tests  5 passed (5)`.

  Dev-Server stoppen, dann `npx tsc --noEmit && npm test && npm run lint && npm run build`.

  Erwartet: `npm test` `Test Files  20 passed (20)`; `tsc`, `lint` und `build` ohne Befund. Sollte ESLint an den generierten Dateien Regeln melden, werden **nicht** die Dateien angefasst, sondern das Skript so angepasst, dass es sauberen Code erzeugt (die Dateien sind generiert und würden beim nächsten Lauf überschrieben).

- [ ] **Step 7: Commit**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && git add -A && git commit -m "feat(design): vier unDraw-Illustrationen als Inline-Komponenten inklusive Importskript"
  ```

---

### Task 6: Drei Schritte mit Illustrationen und Upload-Zone auf Papier

Setzt Spec 5.3, 5.4 und den zweiten Teil von 12.4 um.

**Files:**
- Modify: `src/components/HowItWorks.tsx`, `src/components/UploadZone.tsx`, `messages/de.json`
- Test: bestehende Suite

---

- [ ] **Step 1: Texte in `messages/de.json`**

  `howItWorks` wird ersetzt (`eyebrow` entfällt, `lead` kommt dazu, die Schritt-Titel werden Verb plus Objekt):

  ```json
  "howItWorks": {
    "heading": "In drei Schritten zu deiner Erstattung",
    "lead": "Kein Konto, keine Formulare. Du lädst hoch, wir prüfen, du verschickst.",
    "steps": [
      {
        "title": "Abrechnung hochladen",
        "description": "PDF oder Foto deiner Nebenkostenabrechnung, einfach ablegen oder auswählen."
      },
      {
        "title": "Prüfen lassen",
        "description": "Geprüft werden Nebenkosten- und Heizkostenabrechnung (HeizkV) auf nicht umlagefähige Posten, falsche Umlageschlüssel, Fristfehler und mehr."
      },
      {
        "title": "Widerspruch schicken",
        "description": "Fertiger Widerspruchsbrief als PDF, mit Begründung und Paragrafen zum Ausdrucken oder Mailen."
      }
    ]
  },
  ```

- [ ] **Step 2: `src/components/HowItWorks.tsx` vollständig ersetzen**

  ```tsx
  import { useTranslations } from "next-intl";
  import DocumentReview from "@/components/illustrations/DocumentReview";
  import MailSent from "@/components/illustrations/MailSent";
  import Receipt from "@/components/illustrations/Receipt";

  // Feste Zuordnung Schritt zu Motiv (Spec 6). Position statt Titel, damit die
  // Bilder in allen sechs Sprachen an derselben Stelle stehen.
  const ILLUSTRATIONS = [Receipt, DocumentReview, MailSent];

  export default function HowItWorks() {
    const t = useTranslations("howItWorks");
    const steps = t.raw("steps") as { title: string; description: string }[];

    return (
      <section id="so-funktionierts" className="mt-16 scroll-mt-24">
        <h2 className="text-[26px] sm:text-[34px] font-extrabold leading-[1.12] tracking-[-0.02em] text-fg">
          {t("heading")}
        </h2>
        <p className="mt-3 text-base sm:text-[17px] leading-[1.55] text-muted max-w-[62ch]">
          {t("lead")}
        </p>

        {/* <ol> ohne Nummern: die Reihenfolge ist semantisch wichtig, optisch
            zählen die Bilder, nummerierte Kästen wirkten zuletzt schematisch. */}
        <ol className="mt-10 grid gap-10 list-none p-0 md:grid-cols-3">
          {steps.map((step, i) => {
            const Illustration = ILLUSTRATIONS[i];
            return (
              <li key={step.title} className="min-w-0">
                {/* Der Container setzt die Akzentfarbe; die Motive füllen ihre
                    Akzentflächen mit currentColor. */}
                <div className="flex h-[110px] md:h-[150px] items-end text-accent">
                  <Illustration className="max-h-full w-auto" />
                </div>
                <div className="mt-5 border-t-2 border-paper-line-strong pt-4">
                  <h3 className="text-[18px] font-bold leading-snug text-fg">{step.title}</h3>
                  <p className="mt-2 text-sm leading-[1.55] text-muted">{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    );
  }
  ```

- [ ] **Step 3: `src/components/UploadZone.tsx` — Dropzone und Fehlerkasten auf Papier**

  Der Klassenblock der Dropzone, vorher:

  ```tsx
          className={`
            relative rounded-2xl border-2 border-dashed transition-colors cursor-pointer
            flex flex-col items-center justify-center
            min-h-[240px] p-8 text-center
            ${dragging
              ? "border-accent bg-accent-soft"
              : "border-line-strong bg-doc hover:border-accent hover:bg-accent-soft"
            }
            ${loading ? "pointer-events-none opacity-60" : ""}
          `}
  ```

  nachher:

  ```tsx
          className={`
            relative rounded-2xl border-2 border-dashed transition-colors cursor-pointer
            flex flex-col items-center justify-center
            min-h-[240px] p-11 text-center
            ${dragging
              ? "border-accent bg-accent-soft"
              : "border-paper-line-strong bg-doc hover:border-accent hover:bg-accent-soft"
            }
            ${loading ? "pointer-events-none opacity-60" : ""}
          `}
  ```

  Der Ruhezustand (Icon-Kachel, Titel, Hinweis, Formate), vorher:

  ```tsx
              <div className="w-14 h-14 bg-accent-soft rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="font-semibold text-fg text-base mb-1">
                {t("heading")}
              </p>
              <p className="text-sm text-muted mb-4">{t("hint")}</p>
              <span className="text-xs bg-paper-2 border border-line text-muted px-3 py-1 rounded-full">
                {t("formats", { mb: MAX_FILE_MB })}
              </span>
  ```

  nachher:

  ```tsx
              <div className="w-11 h-11 bg-accent-soft border border-accent-border rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7}
                    d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 17v1.5A2.5 2.5 0 0 0 6.5 21h11a2.5 2.5 0 0 0 2.5-2.5V17" />
                </svg>
              </div>
              <p className="text-xl font-bold text-fg mb-1">
                {t("heading")}
              </p>
              <p className="text-sm text-muted mb-4">{t("hint")}</p>
              <span className="text-[12.5px] text-faint">
                {t("formats", { mb: MAX_FILE_MB })}
              </span>
  ```

  Fehlerkasten, vorher:

  ```tsx
          <div id="upload-error" role="alert" className="flex items-start gap-2 bg-status-dangerBg border border-status-dangerBorder rounded-xl p-4 text-sm text-status-danger">
  ```

  nachher (unverändert in der Struktur, die Tokens tragen jetzt Papierwerte — nur zur Kontrolle hier aufgeführt; **keine Änderung nötig**).

  Datenschutz-Hinweis-Link, vorher:

  ```tsx
              <Link href="/datenschutz" className="underline hover:text-fg">{chunks}</Link>
  ```

  nachher:

  ```tsx
              <Link href="/datenschutz" className="underline text-accent hover:text-accent-hover">{chunks}</Link>
  ```

  Ladezustand-Spinner, vorher `border-line border-t-accent`, nachher `border-paper-line border-t-accent` (zwei Fundstellen: `UploadZone.tsx` Z. 142 und `LetterModal.tsx` Z. 279 — letztere kommt in Task 10).

- [ ] **Step 4: Startseite — Upload-Zone direkt unter die Schritte**

  In `src/app/[locale]/page.tsx`, vorher:

  ```tsx
            <Reveal delay={80}>
              <HowItWorks />
            </Reveal>
            <div id="upload" className="mt-2">
              <UploadZone onUpload={handleFileUpload} loading={loading} error={error} />
            </div>
  ```

  nachher:

  ```tsx
            <Reveal delay={80}>
              <HowItWorks />
            </Reveal>
            <div id="upload" className="mt-12 scroll-mt-24">
              <UploadZone onUpload={handleFileUpload} loading={loading} error={error} />
            </div>
  ```

- [ ] **Step 5: Verifikation**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && grep -rn "howItWorks.eyebrow\|\"eyebrow\"" src messages/de.json
  ```

  Erwartet: nur noch `faq.eyebrow` in `messages/de.json` (verschwindet in Task 8).

  Browser: Sektion „So funktioniert's“ mit drei Illustrationen in Grün auf Papier, jede Spalte mit 2-px-Oberkante. Klick auf „So funktioniert's“ in der Nav springt zur Sektion, Klick auf den Hero-CTA zur Upload-Zone. Konsole ohne Fehler.

  Dev-Server stoppen, dann `npx tsc --noEmit && npm test && npm run lint && npm run build` — alles grün.

- [ ] **Step 6: Commit**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && git add -A && git commit -m "feat(landing): Schritte mit Illustrationen, Upload-Zone als Dokumentflaeche"
  ```

---

### Task 7: Sektion „Das steckt im Bericht“ mit Musterbrief

Setzt Spec 5.5 und den ersten Teil von 12.5 um.

**Files:**
- Create: `src/components/ReportFeatures.tsx`, `src/components/LetterPreview.tsx`
- Modify: `src/app/[locale]/page.tsx`, `messages/de.json`
- Test: bestehende Suite

---

- [ ] **Step 1: Texte in `messages/de.json`**

  Neu nach `upload` einfügen:

  ```json
  "reportFeatures": {
    "heading": "Das steckt im Bericht",
    "lead": "Für 9,90 € bekommst du jeden Befund ausformuliert, mit Rechtsgrundlage und dem passenden Schreiben.",
    "items": [
      {
        "title": "Jeder Befund mit Rechtsgrundlage",
        "subtitle": "Paragraf, Begründung und der Betrag, um den es geht."
      },
      {
        "title": "Widerspruch als fertiges PDF",
        "subtitle": "Adressiert an deinen Vermieter, unterschriftsreif."
      },
      {
        "title": "Aufforderung zur Belegeinsicht",
        "subtitle": "Für Positionen, die sich ohne Belege nicht klären lassen (§ 259 BGB)."
      },
      {
        "title": "Handlungsempfehlung je Punkt",
        "subtitle": "Was du zuerst angehst und was du dabei beilegen solltest."
      }
    ]
  },
  "letterPreview": {
    "badge": "Muster",
    "senderName": "Lena Hartmann",
    "senderAddress": "Gneisenaustraße 41 · 10961 Berlin",
    "recipientName": "Hausverwaltung Bergmann GmbH",
    "recipientAddress": "Yorckstraße 12\n10965 Berlin",
    "date": "Berlin, 12.03.2027",
    "subject": "Widerspruch gegen die Betriebskostenabrechnung 2025",
    "paragraphs": [
      "sehr geehrte Damen und Herren,",
      "gegen Ihre Betriebskostenabrechnung für das Jahr 2025, zugegangen am 14.02.2027, erhebe ich hiermit Widerspruch.",
      "Die Position „Verwaltungskosten“ in Höhe von 96,00 € ist nach § 1 Abs. 2 Nr. 1 BetrKV nicht umlagefähig. Die unter „Instandhaltung“ abgerechneten 61,40 € sind Instandsetzungskosten und damit keine Betriebskosten im Sinne des § 2 BetrKV. Die Heizkosten wurden zudem nicht nach Verbrauch verteilt; § 7 HeizkV verlangt einen Verbrauchsanteil von mindestens 50 Prozent.",
      "Ich bitte Sie, die Abrechnung bis zum 30.03.2027 zu korrigieren und mir den Betrag von 184,50 € zu erstatten."
    ],
    "closing": "Mit freundlichen Grüßen",
    "signature": "Lena Hartmann"
  },
  ```

  Die Namen, Adressen, Beträge und Daten sind erfunden und bleiben in allen sechs Sprachen identisch; nur `badge`, `closing`-Formel und die Fließtext-Absätze werden übersetzt (Spec 7: der Brief selbst bleibt fachlich deutsch, weil der Empfänger ein deutscher Vermieter ist — siehe Task 13).

- [ ] **Step 2: `src/components/LetterPreview.tsx` anlegen**

  ```tsx
  import { useTranslations } from "next-intl";

  /**
   * Statischer Musterbrief neben der Feature-Liste. Wie die Berichtskarte rein
   * dekorativ (aria-hidden) und sichtbar als „Muster“ gekennzeichnet: Name,
   * Anschrift, Beträge und Fristen sind frei erfunden. Die leichte Drehung nimmt
   * dem Blatt die Katalog-Anmutung, ohne dass es kippt.
   */
  export default function LetterPreview() {
    const t = useTranslations("letterPreview");
    const paragraphs = t.raw("paragraphs") as string[];

    return (
      <div
        aria-hidden="true"
        className="w-full max-w-[480px] -rotate-1 rounded-sm border border-paper-line bg-doc px-[34px] py-[38px] text-[12.5px] leading-[1.6] text-fg shadow-[0_12px_30px_rgba(27,31,36,0.08)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-semibold">{t("senderName")}</p>
            <p className="text-faint">{t("senderAddress")}</p>
          </div>
          <span className="shrink-0 text-faint">{t("badge")}</span>
        </div>

        <div className="mt-7 whitespace-pre-line">
          <p className="font-semibold">{t("recipientName")}</p>
          <p>{t("recipientAddress")}</p>
        </div>

        <p className="mt-6 text-faint">{t("date")}</p>

        <p className="mt-6 font-semibold">{t("subject")}</p>

        <div className="mt-4 space-y-3 text-muted">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        <p className="mt-6 text-muted">{t("closing")}</p>
        {/* Kursive Systemschrift als Unterschrift-Andeutung: keine Schriftdatei
            nachladen, nur für ein Muster. */}
        <p className="mt-4 text-base italic" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          {t("signature")}
        </p>
      </div>
    );
  }
  ```

- [ ] **Step 3: `src/components/ReportFeatures.tsx` anlegen**

  ```tsx
  import { useTranslations } from "next-intl";
  import LetterPreview from "@/components/LetterPreview";

  interface Feature {
    title: string;
    subtitle: string;
  }

  // Vier Lucide-Motive als Inline-Pfade (scale, file-text, search, arrow-right).
  // Bewusst kopiert statt als Paket installiert: vier Icons rechtfertigen keine
  // neue Abhängigkeit im Client-Bundle.
  const ICONS = [
    "M12 3v18M7 6h10M6 6l-3 7h6l-3-7Zm12 0-3 7h6l-3-7ZM8 21h8",
    "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Zm0 0v5h5M9 13h6M9 17h6",
    "m21 21-4.35-4.35M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Z",
    "M5 12h14m-6-6 6 6-6 6",
  ];

  export default function ReportFeatures() {
    const t = useTranslations("reportFeatures");
    const items = t.raw("items") as Feature[];

    return (
      <section id="bericht" className="mt-16 scroll-mt-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-[56px] lg:items-center">
          <div className="min-w-0">
            <h2 className="text-[26px] sm:text-[34px] font-extrabold leading-[1.12] tracking-[-0.02em] text-fg">
              {t("heading")}
            </h2>
            <p className="mt-3 text-base sm:text-[17px] leading-[1.55] text-muted max-w-[62ch]">
              {t("lead")}
            </p>

            <ul className="mt-8 space-y-5">
              {items.map((item, i) => (
                <li key={item.title} className="flex items-start gap-4">
                  <span className="mt-0.5 shrink-0 w-7 h-7 rounded-lg bg-accent-soft border border-accent-border flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-accent"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d={ICONS[i % ICONS.length]} />
                    </svg>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-bold text-fg">{item.title}</span>
                    <span className="block mt-0.5 text-sm leading-[1.55] text-muted">{item.subtitle}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Unter 1024 px rutscht der Brief unter die Liste und bleibt bei 480 px. */}
          <div className="flex justify-center lg:justify-end">
            <LetterPreview />
          </div>
        </div>
      </section>
    );
  }
  ```

- [ ] **Step 4: Sektion in die Startseite einhängen**

  In `src/app/[locale]/page.tsx` Import ergänzen:

  ```tsx
  import ReportFeatures from "@/components/ReportFeatures";
  ```

  und im Landing-Zweig nach der Upload-Zone einfügen:

  ```tsx
            <Reveal delay={120}>
              <ReportFeatures />
            </Reveal>
  ```

  Der bestehende `<Reveal delay={120}><Faq /></Reveal>` wird auf `delay={160}` gesetzt, damit die Reihenfolge der Einblendungen der Leserichtung folgt.

- [ ] **Step 5: Verifikation**

  Browser bei 1280 px: links Überschrift, Lead und vier Feature-Zeilen mit grünen Marker-Kacheln, rechts der leicht gedrehte Musterbrief mit „Muster“ oben rechts. Bei 375 px steht der Brief unter der Liste. Der Nav-Link „Bericht“ springt hierher. Konsole ohne Fehler.

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && node -e "const l=require('./messages/de.json').letterPreview;const t=[l.subject,...l.paragraphs].join(' ');for(const s of ['96,00','61,40','184,50','14.02.2027','30.03.2027','Lena Hartmann']) if(!t.includes(s)&&!Object.values(l).join(' ').includes(s)) console.log('FEHLT: '+s);console.log('Musterdaten geprueft');"
  ```

  Erwartet: `Musterdaten geprueft` ohne weitere Zeile.

  Dev-Server stoppen, dann `npx tsc --noEmit && npm test && npm run lint && npm run build` — alles grün.

- [ ] **Step 6: Commit**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && git add -A && git commit -m "feat(landing): Sektion Das steckt im Bericht mit Musterbrief"
  ```

---

### Task 8: Mieterrechte-Sektion und Häufige Fragen

Setzt Spec 5.6, 5.7 und den zweiten Teil von 12.5 um.

**Files:**
- Create: `src/components/TenantRights.tsx`
- Modify: `src/components/Faq.tsx`, `src/app/[locale]/page.tsx`, `messages/de.json`
- Test: bestehende Suite

---

- [ ] **Step 1: Texte in `messages/de.json`**

  Neuer Namespace `rights` (nach `letterPreview` einfügen):

  ```json
  "rights": {
    "heading": "Dein gutes Recht als Mieter",
    "items": [
      {
        "term": "Zwölf Monate Widerspruchsfrist",
        "description": "Einwendungen kannst du bis zum Ablauf des zwölften Monats nach Zugang der Abrechnung erheben, auch wenn du die Nachzahlung schon geleistet hast (§ 556 Abs. 3 BGB)."
      },
      {
        "term": "Anspruch auf Belegeinsicht",
        "description": "Du darfst die Originalbelege zu jeder Position einsehen. Bleibt die Einsicht verwehrt, kannst du die Nachzahlung zurückhalten (§ 259 BGB)."
      },
      {
        "term": "Verspätete Abrechnung",
        "description": "Rechnet dein Vermieter später als zwölf Monate nach Ende des Abrechnungszeitraums ab, ist eine Nachforderung in der Regel ausgeschlossen (§ 556 Abs. 3 Satz 3 BGB)."
      }
    ]
  },
  ```

  Aus `faq` entfällt der Key `eyebrow`; `heading` und `items` bleiben unverändert (die neun bestehenden Einträge decken die in Spec 5.7 gewünschten Themen „Was passiert mit meiner Abrechnung?“ und „Funktioniert das auch mit einem Foto?“ bereits ab, siehe Self-Review).

- [ ] **Step 2: `src/components/TenantRights.tsx` anlegen**

  ```tsx
  import { useTranslations } from "next-intl";
  import ApartmentRent from "@/components/illustrations/ApartmentRent";

  interface RightItem {
    term: string;
    description: string;
  }

  /**
   * Abgesetzter Kasten auf paper.2: gibt der Seite vor den Fragen eine ruhige
   * Fläche und beantwortet die Frage „darf ich das überhaupt?“, bevor sie
   * gestellt wird.
   */
  export default function TenantRights() {
    const t = useTranslations("rights");
    const items = t.raw("items") as RightItem[];

    return (
      <section className="mt-16 rounded-[18px] bg-paper-2 px-6 py-10 sm:px-12 sm:py-11">
        <div className="grid gap-8 items-center min-[900px]:grid-cols-[0.9fr_1.1fr] min-[900px]:gap-12">
          {/* Der Container setzt die Akzentfarbe für currentColor im Motiv. */}
          <div className="mx-auto w-full max-w-[360px] min-[900px]:max-w-none text-accent">
            <ApartmentRent className="w-full h-auto" />
          </div>

          <div className="min-w-0">
            <h3 className="text-[22px] sm:text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-fg">
              {t("heading")}
            </h3>
            <dl className="mt-6 space-y-5">
              {items.map((item) => (
                <div key={item.term}>
                  <dt className="text-base font-bold text-fg">{item.term}</dt>
                  <dd className="mt-1 ms-0 text-sm leading-[1.55] text-muted max-w-[62ch]">
                    {item.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>
    );
  }
  ```

- [ ] **Step 3: `src/components/Faq.tsx` vollständig ersetzen**

  ```tsx
  import { useTranslations } from "next-intl";

  // Häufige Fragen – eine Quelle für die sichtbare Liste UND das FAQPage-JSON-LD,
  // damit beides synchron in der aktiven Sprache bleibt. Inhalte in messages/*.json
  // (Namespace "faq"). Bewusst akkurat zu Preis (9,90 €), Löschfrist (24 h),
  // Rechtsstatus (keine Rechtsberatung, RDG) und § 556 BGB.
  export default function Faq() {
    const t = useTranslations("faq");
    const items = t.raw("items") as { q: string; a: string }[];

    const faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };

    return (
      <section id="fragen" className="mt-16 scroll-mt-24" aria-labelledby="faq-heading">
        <h2
          id="faq-heading"
          className="text-[26px] sm:text-[34px] font-extrabold leading-[1.12] tracking-[-0.02em] text-fg"
        >
          {t("heading")}
        </h2>

        {/* 760 px Lesebreite: die Antworten sind lang, das Blatt ist breit. */}
        <div className="mt-8 max-w-[760px] border-t border-paper-line">
          {items.map((f, i) => (
            // Der erste Eintrag ist offen: eine geschlossene Liste wirkt wie eine
            // Wand, ein sichtbarer Antwortstil lädt zum Aufklappen ein.
            <details key={i} open={i === 0} className="group border-b border-paper-line">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none py-4 text-base font-semibold text-fg [&::-webkit-details-marker]:hidden">
                <span>{f.q}</span>
                <svg
                  className="w-4 h-4 shrink-0 text-faint transition-transform duration-200 group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="pb-4 -mt-1 text-sm leading-[1.55] text-muted max-w-[62ch]">{f.a}</p>
            </details>
          ))}
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </section>
    );
  }
  ```

- [ ] **Step 4: Sektion in die Startseite einhängen**

  Import ergänzen:

  ```tsx
  import TenantRights from "@/components/TenantRights";
  ```

  Der Landing-Zweig lautet danach vollständig:

  ```tsx
            <>
              <LandingHero />
              <Reveal>
                <ProofLine />
              </Reveal>
              <Reveal delay={80}>
                <HowItWorks />
              </Reveal>
              <div id="upload" className="mt-12 scroll-mt-24">
                <UploadZone onUpload={handleFileUpload} loading={loading} error={error} />
              </div>
              <Reveal delay={120}>
                <ReportFeatures />
              </Reveal>
              <Reveal delay={140}>
                <TenantRights />
              </Reveal>
              <Reveal delay={160}>
                <Faq />
              </Reveal>
            </>
  ```

- [ ] **Step 5: Verifikation**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && grep -rn "faq.eyebrow\|\"eyebrow\"" src messages/de.json
  ```

  Erwartet: leer.

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && curl -s localhost:3000/ | grep -c "FAQPage"
  ```

  Erwartet: `1` (Dev-Server muss dafür laufen).

  Browser: Mieterrechte-Kasten in warmem Beige mit Illustration links und drei Definitionen rechts, darunter die Fragen mit dem ersten Eintrag geöffnet. Bei 375 px steht die Illustration oben, maximal 360 px breit. Konsole ohne Fehler.

  Dev-Server stoppen, dann `npx tsc --noEmit && npm test && npm run lint && npm run build` — alles grün.

- [ ] **Step 6: Commit**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && git add -A && git commit -m "feat(landing): Sektion Mieterrechte und Fragen im Papier-Stil"
  ```

---

### Task 9: Erst-Prüfung und Bericht auf Papier

Setzt Spec 8 (`PreviewView`, `ResultView`) und den ersten Teil von 12.6 um. Beide Ansichten liegen bereits im Blatt (Task 2), hier werden Struktur und Hierarchie angepasst.

**Files:**
- Modify: `src/components/PreviewView.tsx`, `src/components/ResultView.tsx`
- Test: bestehende Suite

---

- [ ] **Step 1: `PreviewView.tsx` — Kopf, Befundzeilen und Feature-Liste**

  Bericht-Kopf, vorher (Zeilen 69 bis 81):

  ```tsx
        {/* Bericht-Kopf */}
        <div className="border border-line rounded-xl p-6">
          <p className="text-xs font-semibold tracking-wide text-accent mb-2">
            {t("firstCheckDone")}
          </p>
          <p className="text-3xl font-black text-fg tabular-nums">
            {t("findings", { count: preview.errorCount })}
          </p>
          <div className="flex items-baseline justify-between gap-3 border-t border-line mt-4 pt-4">
            <span className="text-sm text-muted">{t("potentialLabel")}</span>
            <span className="text-lg font-bold text-accent tabular-nums">{potential}</span>
          </div>
        </div>
  ```

  nachher:

  ```tsx
        {/* Bericht-Kopf */}
        <div className="rounded-[14px] border border-paper-line bg-doc p-6">
          <p className="text-[12.5px] text-faint mb-2">{t("firstCheckDone")}</p>
          <p className="text-[30px] font-extrabold leading-[1.1] tracking-[-0.02em] text-fg tabular-nums">
            {t("findings", { count: preview.errorCount })}
          </p>
          <div className="flex items-baseline justify-between gap-3 border-t border-paper-line mt-4 pt-4">
            <span className="text-sm text-muted">{t("potentialLabel")}</span>
            <span className="text-lg font-extrabold text-accent tabular-nums">{potential}</span>
          </div>
        </div>
  ```

  Befundzeilen, vorher (Zeilen 83 bis 97):

  ```tsx
        {preview.errorTitles.length > 0 && (
          <div className="border border-line rounded-xl divide-y divide-line">
            {preview.errorTitles.map((title, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xs font-medium tabular-nums text-accent w-6 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-sm font-medium text-fg">{title}</span>
                <span className="ms-auto flex items-center gap-1.5 text-xs text-faint shrink-0">
                  <LockIcon /> {t("locked")}
                </span>
              </div>
            ))}
          </div>
        )}
  ```

  nachher (Punkt statt Nummer, wie in der Berichtskarte; gesperrte Titel in `faint`):

  ```tsx
        {preview.errorTitles.length > 0 && (
          <div className="rounded-[14px] border border-paper-line bg-doc divide-y divide-paper-line">
            {preview.errorTitles.map((title, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <span className="w-2 h-2 rounded-full shrink-0 bg-status-neutralStrong" />
                {/* Titel bewusst in faint: der Inhalt ist noch nicht gekauft. */}
                <span className="text-sm font-medium text-faint min-w-0">{title}</span>
                <span className="ms-auto flex items-center gap-1.5 text-[12.5px] text-faint shrink-0">
                  <LockIcon /> {t("locked")}
                </span>
              </div>
            ))}
          </div>
        )}
  ```

  „So geht's weiter“, vorher (Zeilen 100 bis 117) — Rahmen und Nummernspalte:

  ```tsx
        <div className="rounded-xl border border-line overflow-hidden">
          <div className="px-4 py-2.5 border-b border-line">
            <span className="text-[11px] font-medium tracking-[0.12em] text-faint">{t("howItGoes")}</span>
          </div>
          <div className="divide-y divide-line">
  ```

  nachher:

  ```tsx
        <div className="rounded-[14px] border border-paper-line bg-doc overflow-hidden">
          <div className="px-4 py-2.5 border-b border-paper-line">
            <span className="text-[12.5px] text-faint">{t("howItGoes")}</span>
          </div>
          <div className="divide-y divide-paper-line">
  ```

  Die Zahlenspalte in diesem Block (`text-accent w-6`) bleibt, weil hier eine echte Reihenfolge gemeint ist.

  Feature-/Checkout-Box, vorher (Zeile 119):

  ```tsx
        <div className="border border-accent-border bg-accent-soft rounded-xl p-6">
  ```

  nachher:

  ```tsx
        <div className="rounded-[14px] border border-accent-border bg-accent-soft p-6">
  ```

  Die vier Feature-Zeilen bekommen Marker-Kacheln statt bloßer Haken, vorher:

  ```tsx
          <ul className="text-sm text-muted space-y-1.5 mb-4">
            <li className="flex gap-2"><span className="text-accent">✓</span> {t("featureAll")}</li>
            {preview.hasDirect && <li className="flex gap-2"><span className="text-accent">✓</span> {t("featureObjection")}</li>}
            {preview.hasReview && <li className="flex gap-2"><span className="text-accent">✓</span> {t("featureReview")}</li>}
            <li className="flex gap-2"><span className="text-accent">✓</span> {t("featureRecommendations")}</li>
          </ul>
  ```

  nachher:

  ```tsx
          <ul className="text-sm text-muted space-y-2.5 mb-4">
            {[
              t("featureAll"),
              preview.hasDirect ? t("featureObjection") : null,
              preview.hasReview ? t("featureReview") : null,
              t("featureRecommendations"),
            ]
              .filter((label): label is string => label !== null)
              .map((label) => (
                <li key={label} className="flex items-start gap-2.5">
                  <span className="mt-0.5 shrink-0 w-5 h-5 rounded-md bg-doc border border-accent-border flex items-center justify-center text-accent text-[12px] leading-none">
                    ✓
                  </span>
                  <span>{label}</span>
                </li>
              ))}
          </ul>
  ```

  Der Demo-Hinweis (Zeile 153 bis 160) bleibt strukturell, bekommt aber die Papier-Warnfarben (die Tokens tragen sie bereits) — hier ist **keine Änderung** nötig.

- [ ] **Step 2: `ResultView.tsx` — Kopf, PDF-Button, Legende, Empfehlungsbox**

  Kopf, vorher (Zeilen 43 bis 48):

  ```tsx
            <div className="bg-doc rounded-2xl p-6 border border-line">
              <p className="text-sm text-muted mb-1">{t("potentialLabel")}</p>
              <p className="text-4xl font-bold tracking-tight mb-4 text-accent tabular-nums">
  ```

  nachher:

  ```tsx
            <div className="bg-doc rounded-[14px] p-6 border border-paper-line">
              <p className="text-sm text-muted mb-1">{t("potentialLabel")}</p>
              <p className="text-[30px] font-extrabold leading-[1.1] tracking-[-0.02em] mb-4 text-accent tabular-nums">
  ```

  PDF-Button, vorher (Zeile 72):

  ```tsx
            <Button
              variant="secondary"
              className="w-full"
  ```

  bleibt `variant="secondary"` — die Variante trägt seit Task 2 genau das geforderte Aussehen (Rahmen `paper.line-strong`, Text `fg`, Hover Rahmen `accent`). **Keine Änderung.**

  Alle verbleibenden `border-line` und `divide-line` in dieser Datei werden auf `border-paper-line` bzw. `divide-paper-line` umgestellt (Zeilen 50, 65, 120, 147, 153, 166, 219). Die Alias-Tokens tragen denselben Wert; die explizite Schreibweise macht in den Papier-Komponenten sichtbar, welche Welt gemeint ist.

  Empfehlungszeile in `ErrorCard`, vorher (Zeile 264):

  ```tsx
              <p className="text-xs text-muted mt-2 bg-paper-2 rounded-md px-2 py-1.5">
  ```

  nachher:

  ```tsx
              <p className="text-[12.5px] text-muted mt-2 bg-paper-2 rounded-md px-2.5 py-2">
  ```

  Konfidenz-Etikett in `ErrorCard`, vorher (Zeile 242):

  ```tsx
                <span className={`inline-block text-[10px] uppercase tracking-wider font-bold mt-0.5 ${conf.text} opacity-70`}>
  ```

  nachher (keine Versalien mehr, Spec 3):

  ```tsx
                <span className={`inline-block text-[12.5px] font-semibold mt-0.5 ${conf.text}`}>
  ```

  Legenden-Überschrift, vorher (Zeile 193):

  ```tsx
        <p className="text-[11px] font-medium tracking-[0.12em] text-faint mb-4">{t("legendTitle")}</p>
  ```

  nachher:

  ```tsx
        <p className="text-[12.5px] text-faint mb-4">{t("legendTitle")}</p>
  ```

  Der Abschnitts-Badge (`SectionHeader`, Zeile 219), vorher:

  ```tsx
        <div className="shrink-0 w-8 h-8 rounded-lg bg-doc border border-line text-fg font-bold flex items-center justify-center text-sm tabular-nums">
  ```

  nachher:

  ```tsx
        <div className="shrink-0 w-8 h-8 rounded-lg bg-accent-soft border border-accent-border text-accent font-bold flex items-center justify-center text-sm tabular-nums">
  ```

- [ ] **Step 3: Verifikation**

  Ohne Redis ist `/ergebnis` nicht erreichbar. Beide Ansichten deshalb über den Mock prüfen: `MOCK_ANALYSIS=true` in `.env.local` **setzen lassen ist nicht nötig** — falls die Variable dort bereits steht, Dev-Server starten, eine beliebige PDF hochladen, die Erst-Prüfung ansehen und über den Demo-Link zur Ergebnisseite gehen. Steht sie nicht, wird dieser Schritt in Task 14 zusammen mit der Gesamt-Sichtprüfung nachgeholt und hier nur statisch geprüft:

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && grep -rn "border-line\b\|divide-line\b" src/components/PreviewView.tsx src/components/ResultView.tsx
  ```

  Erwartet: leer (alle Vorkommen tragen jetzt `paper-`).

  Dev-Server stoppen, dann `npx tsc --noEmit && npm test && npm run lint && npm run build` — alles grün.

- [ ] **Step 4: Commit**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && git add -A && git commit -m "feat(design): Erst-Pruefung und Bericht im Papier-Stil, Befundzeilen wie die Berichtskarte"
  ```

---

### Task 10: Dialog und Formular auf Dokumentfläche

Setzt Spec 8 (`LetterModal`, `ContactForm`) und den zweiten Teil von 12.6 um.

**Files:**
- Modify: `src/components/LetterModal.tsx`, `src/components/ContactForm.tsx`
- Test: bestehende Suite

---

- [ ] **Step 1: `LetterModal.tsx` — Backdrop, Dialog, Eingaben**

  Eingabe-Klassen, vorher (Zeilen 230 bis 234):

  ```tsx
    const inputClass = `
      w-full min-h-11 px-3 py-2.5 rounded-lg border border-line-strong bg-doc
      text-sm text-fg placeholder:text-faint
      focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
    `;
  ```

  nachher:

  ```tsx
    const inputClass = `
      w-full min-h-11 px-3 py-2.5 rounded-lg border border-paper-line-strong bg-doc
      text-sm text-fg placeholder:text-faint
      focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
    `;
  ```

  Backdrop, vorher (Zeile 238):

  ```tsx
        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
  ```

  nachher (kein reines Schwarz mehr, der Backdrop ist die Rahmenfarbe):

  ```tsx
        className="fixed inset-0 z-50 bg-ink/70 flex items-center justify-center p-4"
  ```

  Dialogfläche, vorher (Zeile 250):

  ```tsx
          className="bg-doc rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-line outline-none"
  ```

  nachher:

  ```tsx
          className="bg-doc rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-paper-line shadow-[0_24px_60px_rgba(18,23,30,0.35)] outline-none"
  ```

  Alle übrigen `border-line` in dieser Datei werden zu `border-paper-line` (Zeilen 254, 302, 327, 375, 385). Der Lade-Spinner (Zeile 279), vorher `border-line border-t-accent`, nachher `border-paper-line border-t-accent`.

  Die Labels über den Eingabefeldern, vorher (drei Fundstellen, Zeilen 305, 331):

  ```tsx
                    <span className="text-xs font-semibold text-muted block mb-1">
  ```

  nachher:

  ```tsx
                    <span className="text-sm text-muted block mb-1.5">
  ```

  Der Dialog-Titel, vorher (Zeile 256):

  ```tsx
              <h2 id="letter-modal-title" className="text-xl font-bold text-fg">{title}</h2>
  ```

  nachher:

  ```tsx
              <h2 id="letter-modal-title" className="text-[22px] sm:text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-fg">{title}</h2>
  ```

- [ ] **Step 2: `ContactForm.tsx` — Eingaben und Labels**

  Vorher (Zeilen 83 bis 91):

  ```tsx
      const baseClass = `
        w-full min-h-11 px-3 py-2.5 rounded-lg border border-line-strong bg-doc
        text-sm text-fg placeholder:text-faint
        focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
      `;

      return (
        <label className="block">
          <span className="text-xs font-semibold text-muted block mb-1">{label}</span>
  ```

  nachher:

  ```tsx
      const baseClass = `
        w-full min-h-11 px-3 py-2.5 rounded-lg border border-paper-line-strong bg-doc
        text-sm text-fg placeholder:text-faint
        focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent
      `;

      return (
        <label className="block">
          {/* Label über dem Feld statt Platzhalter-Beschriftung: bleibt sichtbar,
              sobald getippt wird (WCAG 3.3.2). */}
          <span className="text-sm text-muted block mb-1.5">{label}</span>
  ```

- [ ] **Step 3: Verifikation**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && grep -rn "border-line\b\|bg-black" src/components/LetterModal.tsx src/components/ContactForm.tsx
  ```

  Erwartet: leer.

  Dev-Server stoppen, dann `npx tsc --noEmit && npm test && npm run lint && npm run build` — alles grün.

- [ ] **Step 4: Commit**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && git add -A && git commit -m "feat(design): Briefdialog und Kontaktformular auf Dokumentflaeche"
  ```

---

### Task 11: Ergebnisseite, Rechtstexte und beide 404-Seiten in der Shell

Setzt Spec 8 (letzte Zeile der Tabelle) und den dritten Teil von 12.6 um.

**Files:**
- Modify: `src/app/[locale]/ergebnis/page.tsx`, `src/components/LegalPage.tsx`, `src/app/[locale]/not-found.tsx`, `src/app/not-found.tsx`
- Test: bestehende Suite

---

- [ ] **Step 1: `src/app/[locale]/ergebnis/page.tsx` — Shell statt eigener Nav**

  Importe: `Logo` entfällt, `SiteShell` kommt dazu. `Link` und `useRouter` bleiben.

  ```tsx
  import SiteShell from "@/components/SiteShell";
  ```

  Die Export-Komponente, vorher (Zeilen 100 bis 118):

  ```tsx
  export default function ErgebnisPage() {
    const t = useTranslations("ergebnis");
    return (
      <main className="min-h-[100dvh] bg-ink">
        <nav className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b border-line bg-ink/90 backdrop-blur-sm">
          <Link href="/" aria-label={t("home")} className="inline-flex items-center min-h-11">
            <Logo />
          </Link>
        </nav>

        <div className="max-w-4xl mx-auto px-6 py-10">
          <Suspense fallback={<p className="text-center text-muted py-20">{t("loading")}</p>}>
            <ErgebnisInner />
          </Suspense>
        </div>
      </main>
    );
  }
  ```

  nachher:

  ```tsx
  export default function ErgebnisPage() {
    const t = useTranslations("ergebnis");
    return (
      <SiteShell>
        <Suspense fallback={<p className="text-center text-muted py-20">{t("loading")}</p>}>
          <ErgebnisInner />
        </Suspense>
      </SiteShell>
    );
  }
  ```

  In `ErgebnisInner` bekommt der Rücklink zur Startseite die Papier-Akzentfarbe, vorher (Zeile 89):

  ```tsx
          <Link href="/" className="inline-flex items-center min-h-11 text-sm text-muted underline hover:text-fg">
  ```

  nachher:

  ```tsx
          <Link href="/" className="inline-flex items-center min-h-11 text-sm text-accent underline hover:text-accent-hover">
  ```

- [ ] **Step 2: `src/components/LegalPage.tsx` vollständig ersetzen**

  ```tsx
  import { getLocale, getTranslations } from "next-intl/server";
  import { Link } from "@/i18n/navigation";
  import SiteShell from "@/components/SiteShell";

  type LegalKey = "impressum" | "datenschutz" | "agb";

  // Generische Rechtstext-Seite: rendert Überschrift + Abschnitte aus dem
  // "legal"-Namespace. Betreiber-Platzhalter, E-Mail und URLs stehen als Literale
  // in den Body-Strings. Für Nicht-Deutsch erscheint der Unverbindlichkeits-Hinweis.
  // Server Component (getTranslations statt useTranslations): "legal" wird
  // bewusst nicht mehr an den Client-Provider gegeben (siehe [locale]/layout.tsx),
  // deshalb muss diese Seite ihre Übersetzungen serverseitig auflösen. Die Shell
  // ist eine Client-Komponente und bekommt das fertig gerenderte children.
  export default async function LegalPage({ page }: { page: LegalKey }) {
    const t = await getTranslations("legal");
    const locale = await getLocale();
    const sections = t.raw(`${page}.sections`) as { heading: string; body: string }[];

    return (
      <SiteShell width="narrow">
        <p className="text-[12.5px] text-status-warn mb-6">{t("draftNotice")}</p>

        {locale !== "de" && (
          <p className="text-[12.5px] text-muted border border-paper-line rounded-lg p-3 mb-6 leading-relaxed">
            {t("disclaimerNonDe")}
          </p>
        )}

        <h1 className="text-[26px] sm:text-[34px] font-extrabold leading-[1.12] tracking-[-0.02em] text-fg mb-6">
          {t(`${page}.title`)}
        </h1>

        {sections.map((s, i) => (
          <section key={i} className="max-w-[62ch]">
            <h2 className="text-[22px] sm:text-[28px] font-extrabold leading-[1.15] tracking-[-0.02em] text-fg mt-8 mb-2">
              {s.heading}
            </h2>
            <p className="mb-3 text-base leading-[1.55] text-muted whitespace-pre-line break-words">{s.body}</p>
          </section>
        ))}

        <Link
          href="/"
          className="inline-flex items-center min-h-11 mt-8 text-sm text-accent underline hover:text-accent-hover transition-colors"
        >
          {t("back")}
        </Link>
      </SiteShell>
    );
  }
  ```

- [ ] **Step 3: `src/app/[locale]/not-found.tsx` vollständig ersetzen**

  ```tsx
  import { getTranslations } from "next-intl/server";
  import Button from "@/components/ui/Button";
  import SiteShell from "@/components/SiteShell";

  // Zusätzlich zur Root-404: greift für unbekannte Pfade *innerhalb* einer
  // gültigen Sprache (z. B. /en/gibtsnicht). Nur hier steht eine Locale fest,
  // deshalb ist das die einzige 404, die übersetzt und mit der vollen Shell
  // gerendert werden kann; src/app/not-found.tsx fängt den Rest ohne next-intl ab.
  export default async function NotFound() {
    const t = await getTranslations("notFound");

    return (
      <SiteShell width="narrow">
        <div className="py-16 text-center space-y-6">
          <p className="text-[12.5px] font-semibold text-faint">404</p>
          <h1 className="text-[26px] sm:text-[34px] font-extrabold leading-[1.12] tracking-[-0.02em] text-fg">
            {t("title")}
          </h1>
          <p className="text-base text-muted">{t("body")}</p>
          <Button href="/">{t("home")}</Button>
        </div>
      </SiteShell>
    );
  }
  ```

- [ ] **Step 4: `src/app/not-found.tsx` vollständig ersetzen (schlanke Shell-Kopie)**

  ```tsx
  import { Geist } from "next/font/google";
  import Logo from "@/components/Logo";
  import Button from "@/components/ui/Button";
  // globals.css wird hier erneut importiert, weil das Root-Layout kein CSS lädt –
  // die Styles hängen am [locale]-Layout, das für diese 404 nie rendert.
  import "./globals.css";

  const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-geist" });

  // Greift bei Pfaden außerhalb von [locale] (z. B. /xx/foo mit unbekannter Sprache).
  // Das Root-Layout rendert kein <html>, deshalb hier ein eigenes Grundgerüst.
  //
  // Bewusst NICHT die gemeinsame SiteShell: die zieht ihre Texte per
  // useTranslations und rendert LocaleSwitcher und Footer-Links über den
  // next-intl-Router. Hier gibt es weder einen NextIntlClientProvider noch eine
  // gültige Locale – jeder dieser Aufrufe würde zur Laufzeit werfen. Deshalb
  // eine schlanke Kopie des Rahmens mit fest deutschen Texten und rohen <a>.
  // Ändert sich die Shell optisch, muss diese Datei mitgezogen werden.
  export default function RootNotFound() {
    return (
      <html lang="de" dir="ltr">
        <body className={`${geist.variable} ${geist.className}`}>
          <div className="min-h-[100dvh] bg-ink flex flex-col">
            <nav
              data-on-ink
              className="sticky top-0 z-20 h-[68px] px-4 sm:px-6 flex items-center border-b border-ink-line bg-ink/90 backdrop-blur-sm"
            >
              {/* Rohes <a> statt next/link: eine Soft-Navigation von hier in den
                  [locale]-Baum scheitert am RSC-Fetch (Konsolenfehler, danach
                  ohnehin harte Navigation) – der Reload ist hier der Normalfall. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/" aria-label="Zur Startseite" className="inline-flex items-center min-h-11">
                <Logo />
              </a>
            </nav>

            <div className="flex-1 px-2 sm:px-6">
              <main className="mx-auto w-full max-w-3xl bg-paper text-fg shadow-[0_30px_80px_rgba(0,0,0,0.55)] rounded-xl sm:rounded-b-none sm:rounded-t-[18px] px-5 py-10 sm:px-14 sm:py-14">
                <div className="py-16 text-center space-y-6">
                  <p className="text-[12.5px] font-semibold text-faint">404</p>
                  <h1 className="text-[26px] sm:text-[34px] font-extrabold leading-[1.12] tracking-[-0.02em] text-fg">
                    Seite nicht gefunden
                  </h1>
                  <p className="text-base text-muted">Die Adresse existiert nicht oder wurde entfernt.</p>
                  {/* external: diese 404 liegt außerhalb von [locale] und hat keinen
                      Locale-Kontext – der next-intl-Link wuerde hier fehlschlagen. */}
                  <Button href="/" external>
                    Zur Startseite
                  </Button>
                </div>
              </main>
            </div>

            <footer data-on-ink className="bg-ink px-5 sm:px-6 py-10">
              <p className="max-w-3xl mx-auto text-[12.5px] text-ink-faint">
                Nebenkostencheck · Automatische Löschung · Keine Rechtsberatung
              </p>
            </footer>
          </div>
        </body>
      </html>
    );
  }
  ```

- [ ] **Step 5: Verifikation**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && grep -rn "bg-ink/90\|min-h-\[100dvh\] bg-ink" src/app src/components
  ```

  Erwartete Treffer: nur `src/components/SiteShell.tsx` (Nav und Wurzel) und `src/app/not-found.tsx` (die begründete Kopie). Kein Treffer mehr in `page.tsx`, `ergebnis/page.tsx`, `[locale]/not-found.tsx` oder `LegalPage.tsx`.

  Dev-Server: `/impressum`, `/en/agb`, `/gibtsnicht` (Root-404) und `/en/gibtsnicht` (Locale-404) öffnen — überall Ink-Rahmen mit Blatt, keine Konsolenfehler, insbesondere kein `MISSING_MESSAGE`.

  Dev-Server stoppen, dann `npx tsc --noEmit && npm test && npm run lint && npm run build` — alles grün.

- [ ] **Step 6: Commit**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && git add -A && git commit -m "feat(design): Ergebnisseite, Rechtstexte und 404-Seiten in der gemeinsamen Shell"
  ```

---

### Task 12: OG-Bild, Icons und Manifest

Setzt Spec 2.5 (letzte Zeilen) und 12.7 um.

**Files:**
- Modify: `src/app/og.png/route.tsx`
- Test: bestehender `src/app/manifest.test.ts`

---

- [ ] **Step 1: `src/app/og.png/route.tsx` vollständig ersetzen**

  ```tsx
  import { ImageResponse } from "next/og";
  import { BRAND_INK, BRAND_PAPER } from "@/lib/seo";

  // ImageResponse läuft auch unter Node; das Projekt deployt durchgängig auf der
  // Node-Runtime, deshalb hier kein Edge-Sonderfall.
  export const runtime = "nodejs";
  export const dynamic = "force-static";

  const size = { width: 1200, height: 630 };

  // Gebrandetes Teilen-Vorschaubild im Design „Papier auf Ink“: dunkler Rahmen mit
  // Wortmarke und Domain, darin das helle Blatt mit der Kernaussage.
  // Bewusst als /og.png-Route (Punkt im Pfad) – so greift der Middleware-Matcher
  // nicht und Social-Crawler bekommen 200 statt eines 307-Redirects.
  // contentType/alt setzt die Route nicht: Der Dateiname liefert bereits image/png,
  // und der Alt-Text kommt lokalisiert aus den Metadaten (layout.tsx bzw.
  // pageMetadata, jeweils meta.ogAlt) – hier wäre er nur auf Deutsch möglich.
  export function GET() {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            background: BRAND_INK,
            padding: "40px",
            fontFamily: "sans-serif",
          }}
        >
          {/* Rahmenzeile oben: Logo und Wortmarke auf Ink */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "0 12px 26px" }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2l6 2.25 M20 6v5c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3"
                stroke="#34D399"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.8 11.5l3.4 3.4L21.5 2.8"
                stroke="#34D399"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div style={{ display: "flex", fontSize: "28px", fontWeight: 800, color: "#EEF1F4" }}>
              Nebenkostencheck
            </div>
          </div>

          {/* Das Blatt */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "28px",
              background: BRAND_PAPER,
              borderRadius: "18px",
              padding: "56px 64px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "64px",
                fontWeight: 800,
                color: "#1B1F24",
                lineHeight: 1.08,
                letterSpacing: "-1.6px",
              }}
            >
              Nebenkostenabrechnung in Sekunden geprüft
            </div>
            <div style={{ display: "flex", width: "130px", height: "6px", background: "#047857", borderRadius: "3px" }} />
            <div style={{ display: "flex", fontSize: "27px", color: "#4E555C", lineHeight: 1.35 }}>
              Typische Fehler finden, nach BetrKV, HeizkV und BGH-Rechtsprechung. Erst-Prüfung kostenlos.
            </div>
          </div>

          {/* Rahmenzeile unten: Domain auf Ink */}
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "22px 12px 0", fontSize: "24px", color: "#8F9AA6" }}>
            nebenkostencheck24.de
          </div>
        </div>
      ),
      { ...size },
    );
  }
  ```

- [ ] **Step 2: Manifest und Icons prüfen (keine Codeänderung erwartet)**

  `src/app/manifest.ts` und `src/app/apple-icon.tsx` beziehen `BRAND_INK` aus `src/lib/seo.ts` und ziehen den neuen Wert automatisch nach. `src/app/icon.svg` wurde in Task 1 angepasst. Gegenprobe:

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && grep -rn "0C1016" src docs/ARCHITECTURE.md README.md
  ```

  Erwartet: leer.

- [ ] **Step 3: Verifikation**

  Dev-Server starten, dann:

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && curl -s -o /dev/null -w "og=%{http_code} %{content_type}\n" localhost:3000/og.png && curl -s -o /dev/null -w "apple=%{http_code} %{content_type}\n" localhost:3000/apple-icon && curl -s localhost:3000/manifest.webmanifest | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const m=JSON.parse(s);console.log('theme_color='+m.theme_color)})"
  ```

  Erwartet:

  ```
  og=200 image/png
  apple=200 image/png
  theme_color=#12171E
  ```

  Zusätzlich `http://localhost:3000/og.png` im Browser öffnen: dunkler Rahmen, helles Blatt mit dunkler Headline, grüner Balken darunter, Domain unten rechts auf dem Rahmen. Prüfen, dass der Text nicht abgeschnitten wird.

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && curl -s localhost:3000/ | grep -o '<meta name="theme-color" content="[^"]*"'
  ```

  Erwartet: `<meta name="theme-color" content="#12171E"`.

  Dev-Server stoppen, dann `npx tsc --noEmit && npm test && npm run lint && npm run build` — alles grün, `manifest.test.ts` weiterhin bestanden.

- [ ] **Step 4: Commit**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && git add -A && git commit -m "feat(seo): OG-Bild als Papierblatt im Ink-Rahmen, Markenfarbe auf 12171E"
  ```

---

### Task 13: Übersetzungen und Schlüssel-Parität

Setzt Spec 7 und 12.8 um. Erst hier wird der Paritäts-Check wieder grün.

**Files:**
- Modify: `messages/en.json`, `messages/tr.json`, `messages/ar.json`, `messages/ru.json`, `messages/uk.json`
- Modify (nur Kontrolle): `messages/de.json`
- Test: bestehender `src/i18n/serverOnly.test.ts`

**Regeln für diesen Task:**
- `_meta` in `tr/ar/ru/uk` bleibt Zeichen für Zeichen unverändert (`status: "ai-draft"`).
- Beträge, Daten, Namen, Anschriften und Paragrafenangaben werden **nicht** übersetzt und nicht lokalisiert (kein `$`, kein `96.00`).
- `letterPreview` bleibt in allen Sprachen außer Deutsch inhaltlich deutsch — Empfänger ist ein deutscher Vermieter. Übersetzt wird nur `badge`.
- Keine Gedankenstriche als Trenner, auch nicht in den Übersetzungen.

---

- [ ] **Step 1: Entfallende Schlüssel in allen sechs Dateien entfernen**

  Zu löschen (Spec 7): `nav.badge`, `hero.eyebrow`, `howItWorks.eyebrow`, `faq.eyebrow`, der komplette Block `stats`, der komplette Block `evidence`, der komplette Block `assurance`.

  In `de.json` sind sie bereits in den Tasks 3, 4, 6 und 8 verschwunden. Kontrolle über alle Dateien:

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && node -e "for(const l of ['de','en','tr','ar','ru','uk']){const m=require('./messages/'+l+'.json');const bad=[];if(m.nav&&m.nav.badge)bad.push('nav.badge');if(m.hero&&m.hero.eyebrow)bad.push('hero.eyebrow');if(m.howItWorks&&m.howItWorks.eyebrow)bad.push('howItWorks.eyebrow');if(m.faq&&m.faq.eyebrow)bad.push('faq.eyebrow');for(const k of ['stats','evidence','assurance'])if(m[k])bad.push(k);console.log(l+': '+(bad.length?bad.join(','):'sauber'));}"
  ```

  Ziel nach diesem Step: sechsmal `sauber`.

- [ ] **Step 2: `messages/en.json` nachziehen**

  Die betroffenen Blöcke lauten danach:

  ```json
  "nav": {
    "home": "Go to the home page",
    "links": {
      "how": "How it works",
      "report": "The report",
      "faq": "Questions"
    },
    "pill": "First check free · report €9.90"
  },
  "hero": {
    "headline": "Is there money hidden in your utility bill?",
    "subline": "Upload your Nebenkostenabrechnung or Betriebskostenabrechnung. It is checked for typical errors in seconds, with your estimated refund.",
    "cta": "Check my bill",
    "priceNote": "First check free · full report once for €9.90, no subscription"
  },
  "heroReport": {
    "badge": "Example",
    "title": "Audit report",
    "meta": "Statement 2025 · 3 findings",
    "items": [
      {
        "title": "Administration costs passed on",
        "reason": "Not allocable under § 1 (2) no. 1 BetrKV",
        "amount": "96,00 €",
        "confidence": "ok"
      },
      {
        "title": "Repair costs in the statement",
        "reason": "Repairs are not an operating cost item, § 2 BetrKV",
        "amount": "61,40 €",
        "confidence": "ok"
      },
      {
        "title": "Heating costs not split by consumption",
        "reason": "§ 7 HeizkV requires at least 50 % by consumption",
        "amount": "27,10 €",
        "confidence": "warn"
      }
    ],
    "totalLabel": "Estimated refund potential",
    "totalValue": "≈ 184,50 €",
    "cta": "Create objection as PDF",
    "footer": "Example · Checked against BetrKV, HeizkV and BGH case law"
  },
  "proof": {
    "items": [
      {
        "value": "About half",
        "text": "of all operating-cost statements are incorrect.",
        "source": "German Tenants' Association"
      },
      {
        "value": "15 seconds",
        "text": "is how long the automatic check of your statement takes.",
        "source": "Own measurement"
      },
      {
        "value": "12 months",
        "text": "you have to raise objections, even after you have paid.",
        "source": "§ 556 (3) BGB"
      }
    ]
  },
  "howItWorks": {
    "heading": "Your refund in three steps",
    "lead": "No account, no forms. You upload, we check, you send.",
    "steps": [
      {
        "title": "Upload your bill",
        "description": "PDF or photo of your utility-cost statement, just drop it in or select it."
      },
      {
        "title": "Have it checked",
        "description": "Your utility and heating-cost statement (HeizkV) are checked for non-allocable items, incorrect allocation keys, deadline errors and more."
      },
      {
        "title": "Send your objection",
        "description": "A ready-made objection letter as a PDF, with reasoning and legal references, to print or email."
      }
    ]
  },
  "reportFeatures": {
    "heading": "What the report contains",
    "lead": "For €9.90 you get every finding written out, with its legal basis and the matching letter.",
    "items": [
      {
        "title": "Every finding with its legal basis",
        "subtitle": "Statute, reasoning and the amount at stake."
      },
      {
        "title": "Objection as a finished PDF",
        "subtitle": "Addressed to your landlord, ready to sign."
      },
      {
        "title": "Request to inspect the receipts",
        "subtitle": "For items that cannot be settled without receipts (§ 259 BGB)."
      },
      {
        "title": "A recommended step for each point",
        "subtitle": "What to tackle first and what to enclose."
      }
    ]
  },
  "letterPreview": {
    "badge": "Sample",
    "senderName": "Lena Hartmann",
    "senderAddress": "Gneisenaustraße 41 · 10961 Berlin",
    "recipientName": "Hausverwaltung Bergmann GmbH",
    "recipientAddress": "Yorckstraße 12\n10965 Berlin",
    "date": "Berlin, 12.03.2027",
    "subject": "Widerspruch gegen die Betriebskostenabrechnung 2025",
    "paragraphs": [
      "sehr geehrte Damen und Herren,",
      "gegen Ihre Betriebskostenabrechnung für das Jahr 2025, zugegangen am 14.02.2027, erhebe ich hiermit Widerspruch.",
      "Die Position „Verwaltungskosten“ in Höhe von 96,00 € ist nach § 1 Abs. 2 Nr. 1 BetrKV nicht umlagefähig. Die unter „Instandhaltung“ abgerechneten 61,40 € sind Instandsetzungskosten und damit keine Betriebskosten im Sinne des § 2 BetrKV. Die Heizkosten wurden zudem nicht nach Verbrauch verteilt; § 7 HeizkV verlangt einen Verbrauchsanteil von mindestens 50 Prozent.",
      "Ich bitte Sie, die Abrechnung bis zum 30.03.2027 zu korrigieren und mir den Betrag von 184,50 € zu erstatten."
    ],
    "closing": "Mit freundlichen Grüßen",
    "signature": "Lena Hartmann"
  },
  "rights": {
    "heading": "Your rights as a tenant",
    "items": [
      {
        "term": "Twelve months to object",
        "description": "You can raise objections until the end of the twelfth month after the statement reached you, even if you have already paid the balance (§ 556 (3) BGB)."
      },
      {
        "term": "Right to inspect the receipts",
        "description": "You may inspect the original receipts for every item. If inspection is refused, you can withhold the balance (§ 259 BGB)."
      },
      {
        "term": "A statement that comes too late",
        "description": "If your landlord bills more than twelve months after the end of the accounting period, an additional claim is generally excluded (§ 556 (3) sentence 3 BGB)."
      }
    ]
  },
  ```

- [ ] **Step 3: `messages/tr.json` nachziehen (`_meta` unverändert lassen)**

  ```json
  "nav": {
    "home": "Ana sayfaya git",
    "links": {
      "how": "Nasıl çalışır",
      "report": "Rapor",
      "faq": "Sorular"
    },
    "pill": "İlk kontrol ücretsiz · rapor 9,90 €"
  },
  "hero": {
    "headline": "Yan gider faturanızda para gizli mi?",
    "subline": "Nebenkostenabrechnung veya Betriebskostenabrechnung yükleyin. Saniyeler içinde tipik hatalara karşı kontrol edilir, tahmini iadenizle birlikte.",
    "cta": "Faturamı kontrol et",
    "priceNote": "İlk kontrol ücretsiz · tam rapor tek seferlik 9,90 €, abonelik yok"
  },
  "heroReport": {
    "badge": "Örnek",
    "title": "Kontrol raporu",
    "meta": "2025 faturası · 3 bulgu",
    "items": [
      {
        "title": "Yönetim giderleri yansıtılmış",
        "reason": "§ 1 Abs. 2 Nr. 1 BetrKV uyarınca yansıtılamaz",
        "amount": "96,00 €",
        "confidence": "ok"
      },
      {
        "title": "Faturada onarım giderleri",
        "reason": "Onarım, § 2 BetrKV anlamında işletme gideri değildir",
        "amount": "61,40 €",
        "confidence": "ok"
      },
      {
        "title": "Isıtma giderleri tüketime göre dağıtılmamış",
        "reason": "§ 7 HeizkV en az yüzde 50 tüketim payı ister",
        "amount": "27,10 €",
        "confidence": "warn"
      }
    ],
    "totalLabel": "Tahmini iade potansiyeli",
    "totalValue": "≈ 184,50 €",
    "cta": "İtirazı PDF olarak oluştur",
    "footer": "Örnek · BetrKV, HeizkV ve BGH içtihadına göre kontrol edildi"
  },
  "proof": {
    "items": [
      {
        "value": "Yaklaşık yarısı",
        "text": "tüm işletme gideri faturalarının hatalıdır.",
        "source": "Deutscher Mieterbund"
      },
      {
        "value": "15 saniye",
        "text": "faturanızın otomatik kontrolü bu kadar sürer.",
        "source": "Kendi ölçümümüz"
      },
      {
        "value": "12 ay",
        "text": "ödeme yapmış olsanız bile itiraz için süreniz var.",
        "source": "§ 556 Abs. 3 BGB"
      }
    ]
  },
  "howItWorks": {
    "heading": "Üç adımda iadenize",
    "lead": "Hesap yok, form yok. Siz yüklersiniz, biz kontrol ederiz, siz gönderirsiniz.",
    "steps": [
      {
        "title": "Faturanızı yükleyin",
        "description": "Yan gider faturanızın PDF veya fotoğrafı, sürükleyip bırakın ya da seçin."
      },
      {
        "title": "Kontrol ettirin",
        "description": "Yan gider ve ısıtma gideri faturanız (HeizkV) yansıtılamayan kalemler, hatalı dağıtım anahtarları, süre hataları ve daha fazlası için kontrol edilir."
      },
      {
        "title": "İtirazınızı gönderin",
        "description": "Gerekçesi ve kanun maddeleriyle hazır itiraz mektubu, PDF olarak yazdırmaya veya e-postayla göndermeye hazır."
      }
    ]
  },
  "reportFeatures": {
    "heading": "Raporda neler var",
    "lead": "9,90 € karşılığında her bulguyu gerekçesiyle, hukuki dayanağıyla ve uygun mektupla birlikte alırsınız.",
    "items": [
      {
        "title": "Her bulgu hukuki dayanağıyla",
        "subtitle": "Kanun maddesi, gerekçe ve söz konusu tutar."
      },
      {
        "title": "Hazır PDF olarak itiraz",
        "subtitle": "Ev sahibinize adreslenmiş, imzaya hazır."
      },
      {
        "title": "Belge inceleme talebi",
        "subtitle": "Belgeler olmadan açıklığa kavuşmayan kalemler için (§ 259 BGB)."
      },
      {
        "title": "Her madde için eylem önerisi",
        "subtitle": "Önce neyi ele alacağınız ve neyi ekleyeceğiniz."
      }
    ]
  },
  "letterPreview": {
    "badge": "Örnek",
    "senderName": "Lena Hartmann",
    "senderAddress": "Gneisenaustraße 41 · 10961 Berlin",
    "recipientName": "Hausverwaltung Bergmann GmbH",
    "recipientAddress": "Yorckstraße 12\n10965 Berlin",
    "date": "Berlin, 12.03.2027",
    "subject": "Widerspruch gegen die Betriebskostenabrechnung 2025",
    "paragraphs": [
      "sehr geehrte Damen und Herren,",
      "gegen Ihre Betriebskostenabrechnung für das Jahr 2025, zugegangen am 14.02.2027, erhebe ich hiermit Widerspruch.",
      "Die Position „Verwaltungskosten“ in Höhe von 96,00 € ist nach § 1 Abs. 2 Nr. 1 BetrKV nicht umlagefähig. Die unter „Instandhaltung“ abgerechneten 61,40 € sind Instandsetzungskosten und damit keine Betriebskosten im Sinne des § 2 BetrKV. Die Heizkosten wurden zudem nicht nach Verbrauch verteilt; § 7 HeizkV verlangt einen Verbrauchsanteil von mindestens 50 Prozent.",
      "Ich bitte Sie, die Abrechnung bis zum 30.03.2027 zu korrigieren und mir den Betrag von 184,50 € zu erstatten."
    ],
    "closing": "Mit freundlichen Grüßen",
    "signature": "Lena Hartmann"
  },
  "rights": {
    "heading": "Kiracı olarak haklarınız",
    "items": [
      {
        "term": "On iki ay itiraz süresi",
        "description": "Faturanın size ulaşmasından sonraki on ikinci ayın sonuna kadar itiraz edebilirsiniz, ek ödemeyi çoktan yapmış olsanız bile (§ 556 Abs. 3 BGB)."
      },
      {
        "term": "Belgeleri inceleme hakkı",
        "description": "Her kalemin asıl belgelerini inceleyebilirsiniz. İnceleme engellenirse ek ödemeyi bekletebilirsiniz (§ 259 BGB)."
      },
      {
        "term": "Geç gelen fatura",
        "description": "Ev sahibiniz hesap döneminin bitiminden on iki aydan geç fatura düzenlerse, ek talep kural olarak düşer (§ 556 Abs. 3 Satz 3 BGB)."
      }
    ]
  },
  ```

- [ ] **Step 4: `messages/ar.json` nachziehen (`_meta` unverändert lassen)**

  ```json
  "nav": {
    "home": "إلى الصفحة الرئيسية",
    "links": {
      "how": "كيف يعمل",
      "report": "التقرير",
      "faq": "أسئلة"
    },
    "pill": "الفحص الأول مجاني · التقرير 9,90 €"
  },
  "hero": {
    "headline": "هل هناك أموال مخبأة في فاتورتك؟",
    "subline": "ارفع فاتورتك Nebenkostenabrechnung أو Betriebskostenabrechnung. تُفحص خلال ثوانٍ بحثاً عن الأخطاء الشائعة، مع مبلغ الاسترداد المقدّر.",
    "cta": "افحص فاتورتي",
    "priceNote": "الفحص الأول مجاني · التقرير الكامل مقابل 9,90 € مرة واحدة، بدون اشتراك"
  },
  "heroReport": {
    "badge": "مثال",
    "title": "تقرير الفحص",
    "meta": "فاتورة 2025 · 3 ملاحظات",
    "items": [
      {
        "title": "تحميل تكاليف الإدارة على المستأجر",
        "reason": "غير قابلة للتحميل وفق § 1 Abs. 2 Nr. 1 BetrKV",
        "amount": "96,00 €",
        "confidence": "ok"
      },
      {
        "title": "تكاليف إصلاح ضمن الفاتورة",
        "reason": "الإصلاح ليس من التكاليف التشغيلية وفق § 2 BetrKV",
        "amount": "61,40 €",
        "confidence": "ok"
      },
      {
        "title": "تكاليف التدفئة غير موزّعة حسب الاستهلاك",
        "reason": "يشترط § 7 HeizkV حصة استهلاك لا تقل عن 50 %",
        "amount": "27,10 €",
        "confidence": "warn"
      }
    ],
    "totalLabel": "قيمة الاسترداد المقدّرة",
    "totalValue": "≈ 184,50 €",
    "cta": "أنشئ الاعتراض بصيغة PDF",
    "footer": "مثال · مفحوص وفق BetrKV وHeizkV وأحكام BGH"
  },
  "proof": {
    "items": [
      {
        "value": "نحو النصف",
        "text": "من فواتير التكاليف التشغيلية تحتوي على أخطاء.",
        "source": "Deutscher Mieterbund"
      },
      {
        "value": "15 ثانية",
        "text": "هي مدة الفحص التلقائي لفاتورتك.",
        "source": "قياس خاص بنا"
      },
      {
        "value": "12 شهراً",
        "text": "لديك لتقديم الاعتراض، حتى بعد الدفع.",
        "source": "§ 556 Abs. 3 BGB"
      }
    ]
  },
  "howItWorks": {
    "heading": "استردادك في ثلاث خطوات",
    "lead": "لا حساب ولا استمارات. أنت ترفع، نحن نفحص، وأنت ترسل.",
    "steps": [
      {
        "title": "ارفع فاتورتك",
        "description": "ملف PDF أو صورة لكشف التكاليف الإضافية، أفلته أو اخترّه."
      },
      {
        "title": "دعها تُفحص",
        "description": "تُفحص فاتورة التكاليف الإضافية وفاتورة التدفئة (HeizkV) بحثاً عن بنود غير قابلة للتحميل ومفاتيح توزيع خاطئة وأخطاء في المواعيد وغير ذلك."
      },
      {
        "title": "أرسل اعتراضك",
        "description": "خطاب اعتراض جاهز بصيغة PDF مع التسبيب والمواد القانونية، للطباعة أو الإرسال بالبريد."
      }
    ]
  },
  "reportFeatures": {
    "heading": "ما الذي يحتويه التقرير",
    "lead": "مقابل 9,90 € تحصل على كل ملاحظة مكتوبة بالتفصيل، مع سندها القانوني والخطاب المناسب.",
    "items": [
      {
        "title": "كل ملاحظة مع سندها القانوني",
        "subtitle": "المادة والتسبيب والمبلغ المعني."
      },
      {
        "title": "الاعتراض كملف PDF جاهز",
        "subtitle": "موجّه إلى مالك العقار وجاهز للتوقيع."
      },
      {
        "title": "طلب الاطلاع على المستندات",
        "subtitle": "للبنود التي لا تُحسم دون مستندات (§ 259 BGB)."
      },
      {
        "title": "توصية عملية لكل بند",
        "subtitle": "بماذا تبدأ وما الذي ينبغي إرفاقه."
      }
    ]
  },
  "letterPreview": {
    "badge": "نموذج",
    "senderName": "Lena Hartmann",
    "senderAddress": "Gneisenaustraße 41 · 10961 Berlin",
    "recipientName": "Hausverwaltung Bergmann GmbH",
    "recipientAddress": "Yorckstraße 12\n10965 Berlin",
    "date": "Berlin, 12.03.2027",
    "subject": "Widerspruch gegen die Betriebskostenabrechnung 2025",
    "paragraphs": [
      "sehr geehrte Damen und Herren,",
      "gegen Ihre Betriebskostenabrechnung für das Jahr 2025, zugegangen am 14.02.2027, erhebe ich hiermit Widerspruch.",
      "Die Position „Verwaltungskosten“ in Höhe von 96,00 € ist nach § 1 Abs. 2 Nr. 1 BetrKV nicht umlagefähig. Die unter „Instandhaltung“ abgerechneten 61,40 € sind Instandsetzungskosten und damit keine Betriebskosten im Sinne des § 2 BetrKV. Die Heizkosten wurden zudem nicht nach Verbrauch verteilt; § 7 HeizkV verlangt einen Verbrauchsanteil von mindestens 50 Prozent.",
      "Ich bitte Sie, die Abrechnung bis zum 30.03.2027 zu korrigieren und mir den Betrag von 184,50 € zu erstatten."
    ],
    "closing": "Mit freundlichen Grüßen",
    "signature": "Lena Hartmann"
  },
  "rights": {
    "heading": "حقك كمستأجر",
    "items": [
      {
        "term": "اثنا عشر شهراً للاعتراض",
        "description": "يمكنك تقديم الاعتراض حتى نهاية الشهر الثاني عشر بعد وصول الفاتورة إليك، حتى لو دفعت المبلغ الإضافي (§ 556 Abs. 3 BGB)."
      },
      {
        "term": "الحق في الاطلاع على المستندات",
        "description": "يحق لك الاطلاع على المستندات الأصلية لكل بند. وإذا مُنع الاطلاع، يمكنك حجز المبلغ الإضافي (§ 259 BGB)."
      },
      {
        "term": "فاتورة متأخرة",
        "description": "إذا أصدر المالك الفاتورة بعد أكثر من اثني عشر شهراً من نهاية فترة الحساب، يسقط طلب الدفع الإضافي كقاعدة عامة (§ 556 Abs. 3 Satz 3 BGB)."
      }
    ]
  },
  ```

- [ ] **Step 5: `messages/ru.json` nachziehen (`_meta` unverändert lassen)**

  ```json
  "nav": {
    "home": "На главную страницу",
    "links": {
      "how": "Как это работает",
      "report": "Отчёт",
      "faq": "Вопросы"
    },
    "pill": "Первая проверка бесплатно · отчёт 9,90 €"
  },
  "hero": {
    "headline": "В вашем счёте спрятаны деньги?",
    "subline": "Загрузите ваш счёт Nebenkostenabrechnung или Betriebskostenabrechnung. За секунды его проверят на типичные ошибки и рассчитают возможный возврат.",
    "cta": "Проверить счёт",
    "priceNote": "Первая проверка бесплатно · полный отчёт разово за 9,90 €, без подписки"
  },
  "heroReport": {
    "badge": "Пример",
    "title": "Отчёт о проверке",
    "meta": "Счёт за 2025 год · 3 замечания",
    "items": [
      {
        "title": "Расходы на управление переложены на жильца",
        "reason": "Не подлежат распределению согласно § 1 Abs. 2 Nr. 1 BetrKV",
        "amount": "96,00 €",
        "confidence": "ok"
      },
      {
        "title": "Расходы на ремонт в счёте",
        "reason": "Ремонт не относится к эксплуатационным расходам, § 2 BetrKV",
        "amount": "61,40 €",
        "confidence": "ok"
      },
      {
        "title": "Расходы на отопление распределены не по потреблению",
        "reason": "§ 7 HeizkV требует не менее 50 % по потреблению",
        "amount": "27,10 €",
        "confidence": "warn"
      }
    ],
    "totalLabel": "Предполагаемая сумма к возврату",
    "totalValue": "≈ 184,50 €",
    "cta": "Создать возражение в PDF",
    "footer": "Пример · Проверено по BetrKV, HeizkV и практике BGH"
  },
  "proof": {
    "items": [
      {
        "value": "Примерно половина",
        "text": "всех счетов за эксплуатационные расходы содержит ошибки.",
        "source": "Deutscher Mieterbund"
      },
      {
        "value": "15 секунд",
        "text": "занимает автоматическая проверка вашего счёта.",
        "source": "Собственное измерение"
      },
      {
        "value": "12 месяцев",
        "text": "у вас есть на возражение, даже если вы уже заплатили.",
        "source": "§ 556 Abs. 3 BGB"
      }
    ]
  },
  "howItWorks": {
    "heading": "Возврат за три шага",
    "lead": "Без аккаунта и анкет. Вы загружаете, мы проверяем, вы отправляете.",
    "steps": [
      {
        "title": "Загрузите счёт",
        "description": "PDF или фото счёта за дополнительные расходы, просто перетащите или выберите."
      },
      {
        "title": "Дайте проверить",
        "description": "Счёт за дополнительные расходы и за отопление (HeizkV) проверяются на нераспределяемые позиции, неверные ключи распределения, ошибки в сроках и другое."
      },
      {
        "title": "Отправьте возражение",
        "description": "Готовое письмо-возражение в PDF с обоснованием и ссылками на нормы, для печати или отправки по почте."
      }
    ]
  },
  "reportFeatures": {
    "heading": "Что входит в отчёт",
    "lead": "За 9,90 € вы получаете каждое замечание в развёрнутом виде, с правовым основанием и подходящим письмом.",
    "items": [
      {
        "title": "Каждое замечание с правовым основанием",
        "subtitle": "Норма, обоснование и сумма, о которой идёт речь."
      },
      {
        "title": "Возражение готовым PDF",
        "subtitle": "Адресовано вашему арендодателю, остаётся подписать."
      },
      {
        "title": "Требование ознакомиться с документами",
        "subtitle": "Для позиций, которые без документов не прояснить (§ 259 BGB)."
      },
      {
        "title": "Рекомендация по каждому пункту",
        "subtitle": "С чего начать и что приложить."
      }
    ]
  },
  "letterPreview": {
    "badge": "Образец",
    "senderName": "Lena Hartmann",
    "senderAddress": "Gneisenaustraße 41 · 10961 Berlin",
    "recipientName": "Hausverwaltung Bergmann GmbH",
    "recipientAddress": "Yorckstraße 12\n10965 Berlin",
    "date": "Berlin, 12.03.2027",
    "subject": "Widerspruch gegen die Betriebskostenabrechnung 2025",
    "paragraphs": [
      "sehr geehrte Damen und Herren,",
      "gegen Ihre Betriebskostenabrechnung für das Jahr 2025, zugegangen am 14.02.2027, erhebe ich hiermit Widerspruch.",
      "Die Position „Verwaltungskosten“ in Höhe von 96,00 € ist nach § 1 Abs. 2 Nr. 1 BetrKV nicht umlagefähig. Die unter „Instandhaltung“ abgerechneten 61,40 € sind Instandsetzungskosten und damit keine Betriebskosten im Sinne des § 2 BetrKV. Die Heizkosten wurden zudem nicht nach Verbrauch verteilt; § 7 HeizkV verlangt einen Verbrauchsanteil von mindestens 50 Prozent.",
      "Ich bitte Sie, die Abrechnung bis zum 30.03.2027 zu korrigieren und mir den Betrag von 184,50 € zu erstatten."
    ],
    "closing": "Mit freundlichen Grüßen",
    "signature": "Lena Hartmann"
  },
  "rights": {
    "heading": "Ваши права как арендатора",
    "items": [
      {
        "term": "Двенадцать месяцев на возражение",
        "description": "Возражения можно заявить до конца двенадцатого месяца после получения счёта, даже если доплата уже внесена (§ 556 Abs. 3 BGB)."
      },
      {
        "term": "Право ознакомиться с документами",
        "description": "Вы вправе увидеть оригиналы документов по каждой позиции. Если в ознакомлении отказано, доплату можно удержать (§ 259 BGB)."
      },
      {
        "term": "Счёт пришёл слишком поздно",
        "description": "Если арендодатель выставляет счёт позже двенадцати месяцев после окончания расчётного периода, требование доплаты, как правило, отпадает (§ 556 Abs. 3 Satz 3 BGB)."
      }
    ]
  },
  ```

- [ ] **Step 6: `messages/uk.json` nachziehen (`_meta` unverändert lassen)**

  ```json
  "nav": {
    "home": "На головну сторінку",
    "links": {
      "how": "Як це працює",
      "report": "Звіт",
      "faq": "Питання"
    },
    "pill": "Перша перевірка безкоштовна · звіт 9,90 €"
  },
  "hero": {
    "headline": "У вашому рахунку сховані гроші?",
    "subline": "Завантажте Nebenkostenabrechnung або Betriebskostenabrechnung. За секунди рахунок перевіряють на типові помилки та оцінюють можливе повернення.",
    "cta": "Перевірити рахунок",
    "priceNote": "Перша перевірка безкоштовна · повний звіт одноразово за 9,90 €, без підписки"
  },
  "heroReport": {
    "badge": "Приклад",
    "title": "Звіт про перевірку",
    "meta": "Рахунок за 2025 рік · 3 зауваження",
    "items": [
      {
        "title": "Витрати на управління перекладено на мешканця",
        "reason": "Не підлягають розподілу згідно з § 1 Abs. 2 Nr. 1 BetrKV",
        "amount": "96,00 €",
        "confidence": "ok"
      },
      {
        "title": "Витрати на ремонт у рахунку",
        "reason": "Ремонт не є експлуатаційними витратами, § 2 BetrKV",
        "amount": "61,40 €",
        "confidence": "ok"
      },
      {
        "title": "Витрати на опалення розподілені не за споживанням",
        "reason": "§ 7 HeizkV вимагає щонайменше 50 % за споживанням",
        "amount": "27,10 €",
        "confidence": "warn"
      }
    ],
    "totalLabel": "Орієнтовна сума до повернення",
    "totalValue": "≈ 184,50 €",
    "cta": "Створити заперечення у PDF",
    "footer": "Приклад · Перевірено за BetrKV, HeizkV та практикою BGH"
  },
  "proof": {
    "items": [
      {
        "value": "Приблизно половина",
        "text": "усіх рахунків за експлуатаційні витрати містить помилки.",
        "source": "Deutscher Mieterbund"
      },
      {
        "value": "15 секунд",
        "text": "триває автоматична перевірка вашого рахунку.",
        "source": "Власний вимір"
      },
      {
        "value": "12 місяців",
        "text": "ви маєте на заперечення, навіть якщо вже сплатили.",
        "source": "§ 556 Abs. 3 BGB"
      }
    ]
  },
  "howItWorks": {
    "heading": "Повернення за три кроки",
    "lead": "Без облікового запису й анкет. Ви завантажуєте, ми перевіряємо, ви надсилаєте.",
    "steps": [
      {
        "title": "Завантажте рахунок",
        "description": "PDF або фото рахунку за додаткові витрати, просто перетягніть або оберіть."
      },
      {
        "title": "Дайте перевірити",
        "description": "Рахунок за додаткові витрати та за опалення (HeizkV) перевіряються на позиції, що не підлягають розподілу, неправильні ключі розподілу, помилки у строках тощо."
      },
      {
        "title": "Надішліть заперечення",
        "description": "Готовий лист-заперечення у PDF з обґрунтуванням і посиланнями на норми, для друку або надсилання поштою."
      }
    ]
  },
  "reportFeatures": {
    "heading": "Що входить до звіту",
    "lead": "За 9,90 € ви отримуєте кожне зауваження розгорнуто, з правовою підставою та відповідним листом.",
    "items": [
      {
        "title": "Кожне зауваження з правовою підставою",
        "subtitle": "Норма, обґрунтування і сума, про яку йдеться."
      },
      {
        "title": "Заперечення готовим PDF",
        "subtitle": "Адресоване вашому орендодавцю, лишається підписати."
      },
      {
        "title": "Вимога ознайомитися з документами",
        "subtitle": "Для позицій, які без документів не з'ясувати (§ 259 BGB)."
      },
      {
        "title": "Рекомендація до кожного пункту",
        "subtitle": "З чого почати і що додати."
      }
    ]
  },
  "letterPreview": {
    "badge": "Зразок",
    "senderName": "Lena Hartmann",
    "senderAddress": "Gneisenaustraße 41 · 10961 Berlin",
    "recipientName": "Hausverwaltung Bergmann GmbH",
    "recipientAddress": "Yorckstraße 12\n10965 Berlin",
    "date": "Berlin, 12.03.2027",
    "subject": "Widerspruch gegen die Betriebskostenabrechnung 2025",
    "paragraphs": [
      "sehr geehrte Damen und Herren,",
      "gegen Ihre Betriebskostenabrechnung für das Jahr 2025, zugegangen am 14.02.2027, erhebe ich hiermit Widerspruch.",
      "Die Position „Verwaltungskosten“ in Höhe von 96,00 € ist nach § 1 Abs. 2 Nr. 1 BetrKV nicht umlagefähig. Die unter „Instandhaltung“ abgerechneten 61,40 € sind Instandsetzungskosten und damit keine Betriebskosten im Sinne des § 2 BetrKV. Die Heizkosten wurden zudem nicht nach Verbrauch verteilt; § 7 HeizkV verlangt einen Verbrauchsanteil von mindestens 50 Prozent.",
      "Ich bitte Sie, die Abrechnung bis zum 30.03.2027 zu korrigieren und mir den Betrag von 184,50 € zu erstatten."
    ],
    "closing": "Mit freundlichen Grüßen",
    "signature": "Lena Hartmann"
  },
  "rights": {
    "heading": "Ваші права як орендаря",
    "items": [
      {
        "term": "Дванадцять місяців на заперечення",
        "description": "Заперечення можна заявити до кінця дванадцятого місяця після отримання рахунку, навіть якщо доплату вже внесено (§ 556 Abs. 3 BGB)."
      },
      {
        "term": "Право ознайомитися з документами",
        "description": "Ви маєте право переглянути оригінали документів до кожної позиції. Якщо в ознайомленні відмовлено, доплату можна затримати (§ 259 BGB)."
      },
      {
        "term": "Рахунок надійшов запізно",
        "description": "Якщо орендодавець виставляє рахунок пізніше ніж через дванадцять місяців після завершення розрахункового періоду, вимога доплати зазвичай відпадає (§ 556 Abs. 3 Satz 3 BGB)."
      }
    ]
  },
  ```

- [ ] **Step 7: Parität und Invarianten prüfen**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && node -e "const flat=(o,p='')=>Object.entries(o).flatMap(([k,v])=>v&&typeof v==='object'&&!Array.isArray(v)?flat(v,p+k+'.'):[p+k]);const de=new Set(flat(require('./messages/de.json')).filter(k=>!k.startsWith('_meta')));for(const l of ['en','tr','ar','ru','uk']){const s=new Set(flat(require('./messages/'+l+'.json')).filter(k=>!k.startsWith('_meta')));const miss=[...de].filter(k=>!s.has(k));const extra=[...s].filter(k=>!de.has(k));console.log(l+': '+(miss.length||extra.length?('FEHLT '+miss.join(',')+' | ZUVIEL '+extra.join(',')):'OK'));}"
  ```

  Erwartet: `en: OK`, `tr: OK`, `ar: OK`, `ru: OK`, `uk: OK`.

  Arraylängen der neuen Namespaces gleichziehen (Parität prüft nur Schlüssel, nicht Arrays):

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && node -e "for(const l of ['de','en','tr','ar','ru','uk']){const m=require('./messages/'+l+'.json');console.log(l+': heroReport='+m.heroReport.items.length+' proof='+m.proof.items.length+' steps='+m.howItWorks.steps.length+' features='+m.reportFeatures.items.length+' rights='+m.rights.items.length+' letterParagraphs='+m.letterPreview.paragraphs.length+' faq='+m.faq.items.length);}"
  ```

  Erwartet in allen sechs Zeilen: `heroReport=3 proof=3 steps=3 features=4 rights=3 letterParagraphs=4 faq=9`.

  `_meta` unverändert:

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && git diff -- messages/tr.json messages/ar.json messages/ru.json messages/uk.json | grep -E "^[-+].*_meta|^[-+].*ai-draft"
  ```

  Erwartet: leer.

  Musterdaten in allen Sprachen identisch:

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && node -e "const keys=['senderName','senderAddress','recipientName','recipientAddress','date','subject','closing','signature'];const de=require('./messages/de.json').letterPreview;for(const l of ['en','tr','ar','ru','uk']){const m=require('./messages/'+l+'.json').letterPreview;const bad=keys.filter(k=>m[k]!==de[k]);const p=JSON.stringify(m.paragraphs)!==JSON.stringify(de.paragraphs)?['paragraphs']:[];console.log(l+': '+([...bad,...p].length?'ABWEICHUNG '+[...bad,...p].join(','):'identisch'));}"
  ```

  Erwartet: fünfmal `identisch`.

  Keine Gedankenstriche in den Landing-Namespaces:

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && node -e "const ns=['nav','hero','heroReport','proof','howItWorks','reportFeatures','rights','trust','footer','upload','faq'];const walk=(v,p,l)=>{if(typeof v==='string'){if(/[–—]/.test(v))console.log(l+' '+p+': '+v);}else if(v&&typeof v==='object')for(const [k,x] of Object.entries(v))walk(x,p+'.'+k,l);};for(const l of ['de','en','tr','ar','ru','uk']){const m=require('./messages/'+l+'.json');for(const n of ns) if(m[n]) walk(m[n],n,l);}console.log('Gedankenstrich-Pruefung fertig');"
  ```

  Erwartet: nur `Gedankenstrich-Pruefung fertig`. (`letterPreview` ist bewusst ausgenommen: der Musterbrief ist deutscher Fließtext ohne Trenner-Gedankenstriche, wird aber nicht in dieses Muster gezwungen.)

- [ ] **Step 8: Verifikation**

  Dev-Server stoppen, dann:

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && npx tsc --noEmit && npm test && npm run lint && npm run build
  ```

  Erwartet: alles grün, `serverOnly.test.ts` weiterhin bestanden (`legal` und `notFound` bleiben Server-only; die fünf neuen Namespaces sind Client-Namespaces und dürfen dort **nicht** eingetragen werden).

- [ ] **Step 9: Commit**

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && git add -A && git commit -m "feat(i18n): neue Landing-Namespaces in sechs Sprachen, entfallene Keys entfernt"
  ```

---

### Task 14: Gesamtverifikation, Sichtprüfung, Dokumentation, Push

Setzt Spec 11 und den Abschluss von 12.8 um.

**Files:**
- Modify: `README.md`, `docs/ARCHITECTURE.md`
- Test: gesamte Suite

---

- [ ] **Step 1: Automatische Gesamtverifikation**

  Dev-Server stoppen, dann:

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && npx tsc --noEmit && npm test && npm run lint && npm run build && npm audit --omit=dev
  ```

  Erwartet: `tsc` ohne Ausgabe; `npm test` `Test Files  20 passed (20)`; `npm run lint` ohne Fehler; `Compiled successfully`; `found 0 vulnerabilities`.

  Paritäts-Check aus „Regeln für Implementierer“ Punkt 4: fünfmal `OK`.

  Restbestände suchen:

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && grep -rn "0C1016\|bg-surface\|accent-bg\|okSurface\|warnSurface\|warnBgHover\|StatsBar\|nav.badge" src messages docs/ARCHITECTURE.md README.md
  ```

  Erwartet: leer (Treffer in `docs/superpowers/` sind Historie und werden nicht angefasst).

  Illustrationsgröße gegen Spec 10 (zusammen unter 60 KB):

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && du -bc src/components/illustrations/*.tsx | tail -1
  ```

  Erwartet: unter `61440` Bytes.

- [ ] **Step 2: Sichtprüfung im Browser**

  Dev-Server starten. Jede Position in einem **frischen Tab** öffnen und die Konsole auf Fehler prüfen (`read_console_messages`, `onlyErrors: true` → leer):

  - [ ] `/` bei 1280 × 900: Nav auf Ink mit drei Sprungmarken und Pill; Blatt mit Schatten; Hero zweispaltig mit Berichtskarte; Beleg-Zeile dreispaltig; drei Schritte mit Illustrationen; Upload-Zone weiß mit gestricheltem Rahmen; „Das steckt im Bericht“ zweispaltig mit gedrehtem Musterbrief; Mieterrechte-Kasten beige; Fragen mit erstem Eintrag offen; Ink-Footer einzeilig.
  - [ ] `/` bei 375 × 812: alles einspaltig, links und rechts 8 px Ink sichtbar, keine horizontale Scrollleiste (`document.documentElement.scrollWidth <= window.innerWidth`).
  - [ ] Erst-Prüfung mit Mock: Datei hochladen, Vorschau erscheint auf Papier, Befundtitel in `faint` mit Schloss, Checkout-Button dunkel, Demo-Kachel in Warnfarben.
  - [ ] Ergebnisseite über den Demo-Link: Potenzial in Grün, Befundkarten mit Status-Rahmen, Legende, PDF-Button als Umriss.
  - [ ] LetterModal öffnen: Backdrop in Ink, Dialog weiß, Eingaben weiß mit Rahmen, Fokusring grün, Escape schließt im Formular-Schritt.
  - [ ] `/impressum`: schmale Lesespalte, Fließtext 16 px, Rücklink in Akzentgrün mit Unterstreichung.
  - [ ] `/gibtsnicht` (Root-404, deutsch, ohne Sprachwahl) und `/en/gibtsnicht` (Locale-404 mit voller Shell).
  - [ ] `/ar`: Blatt und Raster gespiegelt, Illustrationen **nicht** gespiegelt.
  - [ ] Tastatur: Tab durch Nav, Hero-CTA, Upload-Zone und Fragen; Fokusring auf Ink grün-hell, auf Papier grün-dunkel, immer sichtbar.

- [ ] **Step 3: Dokumentation**

  In `README.md` nach der Tech-Stack-Tabelle einen kurzen Absatz ergänzen:

  ```markdown
  ### Design-System „Papier auf Ink“

  Zwei Farbwelten in `tailwind.config.js`: `ink.*` trägt den dunklen Rahmen
  (Navigation, Seitenrand, Footer, Modal-Backdrop), alles Übrige liegt auf dem
  hellen Blatt (`paper.*`, `doc`, `fg`, `muted`, `faint`, `accent.*`). Die
  Seitenshell `src/components/SiteShell.tsx` setzt Rahmen und Blatt; `[data-on-ink]`
  schaltet den Fokusring auf die helle Akzentvariante. `src/lib/design/contrast.test.ts`
  rechnet die WCAG-Paare aus den Tokens nach. Illustrationen liegen inline unter
  `src/components/illustrations/` und werden per `node scripts/import-undraw.mjs`
  erzeugt (siehe README dort). Spezifikation:
  `docs/superpowers/specs/2026-09-08-papier-auf-ink-design.md`.
  ```

  In `docs/ARCHITECTURE.md` die Testzeile aktualisieren (`18 Dateien / 102 Tests` → tatsächlicher Stand aus Step 1) und denselben Absatz in Kurzform ergänzen.

- [ ] **Step 4: Abschluss-Review und Push**

  Querschnittliches Review der Änderungen (`superpowers:requesting-code-review`), Befunde einarbeiten, danach:

  ```bash
  cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && git add -A && git commit -m "docs: Design-System Papier auf Ink in README und ARCHITECTURE" && git push origin monetarisierung
  ```

  Kein Merge nach `main`, kein `--force`.

---

## Self-Review

Durchgeführt nach dem Schreiben des Plans. Gefundene Lücken sind oben direkt behoben; was bleibt, steht als bewusste Abweichung in Abschnitt 3.

### 1. Spec-Abdeckung

| Spec-Abschnitt | Task |
|---|---|
| 1 Ausgangslage und Ziel | Kontext (Goal/Architecture im Header) |
| 2.1 Ink-Tokens | Task 1, Step 3 |
| 2.2 Papier-Tokens (inkl. Aliase `line`, `line-strong`) | Task 1, Step 3 |
| 2.3 Status auf Papier | Task 1, Step 3 und Step 6 |
| 2.4 Kontrast (Rechnung im Test) | Task 1, Step 2 (`src/lib/design/contrast.test.ts`) |
| 2.5 Hart kodierte Farben: `globals.css` | Task 1, Step 4 |
| 2.5 `src/lib/seo.ts` (`BRAND_INK`, `BRAND_PAPER`) | Task 1, Step 5 |
| 2.5 `viewport.themeColor`, `manifest.ts`, `apple-icon.tsx`, `icon.svg` | Task 1, Step 5 (icon.svg) und Task 12, Step 2 (Kontrolle) |
| 2.5 `og.png/route.tsx` | Task 12, Step 1 |
| 2.5 `src/lib/logo.ts` (unverändert) | Task 12, Step 2 (Kontrolle, keine Änderung) |
| 2.5 `ResultView` Empfehlungsbox, `ActivityIndicator` | Task 1, Step 6 |
| 3 Typografie (Größen, Gewichte, `text-wrap`, 62 ch) | Task 1 Step 4 (`text-wrap`), Tasks 3, 6, 7, 8, 9, 10, 11 (Größen je Komponente) |
| 4 Seitenshell (Nav 68 px, Blatt 1180/18/Schatten, `[data-on-ink]`) | Task 2, Steps 5 bis 7 |
| 4 Randspalten entfallen | Task 2, Step 7 |
| 5.1 Hero und `ReportPreviewCard` | Task 3 |
| 5.2 `ProofLine` ersetzt `StatsBar`, `reviews` bleibt | Task 4 |
| 5.3 Drei Schritte mit Illustrationen | Task 6, Steps 1 bis 2 (Motive aus Task 5) |
| 5.4 Upload-Zone | Task 6, Step 3 |
| 5.5 `ReportFeatures` und `LetterPreview` | Task 7 |
| 5.6 `TenantRights` | Task 8, Steps 1 bis 2 |
| 5.7 Häufige Fragen | Task 8, Step 3 |
| 5.8 Footer auf Ink | Task 2, Step 5 |
| 6 Illustrationen (Umfärbung, Root-Attribute, Ablage, README) | Task 5 |
| 7 Neue Namespaces und Keys (de) | Tasks 2, 3, 4, 6, 7, 8 |
| 7 Entfallende Keys, `en` vollständig, `tr/ar/ru/uk` als Draft, Parität | Task 13 |
| 8 `PreviewView`, `ResultView` | Task 9 |
| 8 `LetterModal`, `ContactForm` | Task 10 |
| 8 `ergebnis`, `LegalPage`, beide 404 | Task 11 |
| 8 `Button.tsx` | Task 2, Step 2 |
| 8 `LocaleSwitcher.tsx` | Task 2, Step 4 |
| 8 `Logo.tsx` (unverändert) | keine Änderung, in Task 12 Step 2 mitgeprüft |
| 9 Bewegung (`Reveal`, Buttons, `<details>`) | Task 2, Steps 2 und 3 |
| 10 Barrierefreiheit und Qualität | Task 1 (Kontrast, Fokus), Task 5 (`aria-hidden`), Task 14 (Sichtprüfung, Größenbudget) |
| 11 Verifikation | Verifikationsschritt in jedem Task, Gesamtlauf in Task 14 |
| 12 Umsetzungsreihenfolge | 12.1 → T1 · 12.2 → T2 · 12.3 → T3, T4 · 12.4 → T5, T6 · 12.5 → T7, T8 · 12.6 → T9, T10, T11 · 12.7 → T12 · 12.8 → T13, T14 |

Keine Spec-Zeile ohne Task. Nach der ersten Fassung fehlten drei Punkte, die nachgetragen wurden: `src/app/icon.svg` (hart kodiertes `#0C1016`, jetzt Task 1 Step 5), die Semantik-Umkehr von `accent.soft` (jetzt explizit in Task 1 Step 1 und Step 6) und die vitest-Konfiguration für `.tsx`-Tests (jetzt Task 5 Step 1).

### 2. Placeholder-Scan

```bash
cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && grep -n "TBD\|analog zu\|siehe oben\|XXX\|FIXME" docs/superpowers/plans/2026-09-08-papier-auf-ink.md
```

Erwartet: leer. Weitere Prüfungen von Hand:

- Kein „…“ in Code, der übernommen werden soll. Die einzige Auslassung steht in Task 5 Step 3 im **Beispiel** der erzeugten Datei und ist dort als solche gekennzeichnet (`{/* hier der komplette, umgefaerbte Rumpf des SVG */}`); die Datei selbst erzeugt das Skript.
- Jede neue Komponente ist vollständig ausgeschrieben: `SiteShell`, `ReportPreviewCard`, `ProofLine`, `LetterPreview`, `ReportFeatures`, `TenantRights`, `Footer`, `HowItWorks`, `Faq`, `LegalPage`, `[locale]/not-found.tsx`, `not-found.tsx`, `og.png/route.tsx`, `contrast.test.ts`, `illustrations.test.tsx`, `import-undraw.mjs`, `illustrations/README.md`, `tailwind.config.js`, `globals.css`.
- Dateien mit kleinen Eingriffen (`Button.tsx`, `Reveal.tsx`, `LocaleSwitcher.tsx`, `UploadZone.tsx`, `PreviewView.tsx`, `ResultView.tsx`, `LetterModal.tsx`, `ContactForm.tsx`, `ergebnis/page.tsx`, `seo.ts`, `icon.svg`, `vitest.config.ts`) haben exakte Vorher-/Nachher-Snippets.
- Jeder Task endet mit Verifikationsbefehl **und** erwarteter Ausgabe sowie einem Commit-Schritt in ASCII.
- Alle 14 Commit-Messages wurden auf Umlaute geprüft: keine.

### 3. Typ- und Namenskonsistenz

Geprüft und in Ordnung:

- **Tailwind-Klassen gegen Tokens:** Jede im Plan verwendete Klasse ist aus der Konfiguration in Task 1 Step 3 ableitbar — `bg-ink`, `bg-ink/70`, `bg-ink/90`, `bg-ink-2`, `border-ink-line`, `text-ink-fg`, `text-ink-muted`, `text-ink-faint`, `bg-paper`, `bg-paper-2`, `border-paper-line`, `divide-paper-line`, `border-paper-line-strong`, `bg-doc`, `text-fg`, `bg-fg`, `hover:bg-fg-hover`, `text-paper`, `text-muted`, `text-faint`, `text-accent`, `bg-accent`, `hover:text-accent-hover`, `bg-accent-soft`, `border-accent-border`, `text-accent-bright`, `border-line`, `border-line-strong`, `bg-status-*`, `border-status-*`, `text-status-*`.
- **Komponenten- und Dateinamen** stimmen überein (Default-Export gleich Dateiname), Importpfade durchgehend über den `@/`-Alias.
- **Lokale Typen** (`Item` in `ReportPreviewCard`, `ProofItem`, `Feature`, `RightItem`) sind dateilokal, keine Namenskollision.
- **`React.SVGProps<SVGSVGElement>`** in den generierten Komponenten setzt `import type * as React from "react"` voraus — das erzeugt das Skript mit.
- **Neue Namespaces sind Client-Namespaces** und dürfen **nicht** in `SERVER_ONLY_NAMESPACES` landen; `legal` und `notFound` bleiben dort. In Task 13 Step 8 explizit vermerkt.
- **Arraylängen** über alle sechs Sprachen werden in Task 13 Step 7 geprüft (der Paritäts-Check erfasst nur Schlüssel, nicht Arrays) — das war eine Lücke der ersten Fassung und ist nachgetragen.
- **`nav.home`** ist ein neuer Key, der in der Spec nicht steht, aber ohne ihn hätte der Logo-Link in der Shell keinen zugänglichen Namen. In allen sechs Sprachen angelegt.

Bewusste Abweichungen von der Spec, jeweils mit Grund:

| Abweichung | Grund |
|---|---|
| `ApartmentRent` darf 40 KB statt 30 KB (Spec 6) | Ohne SVGO-Abhängigkeit (Projektregel: kein neues npm-Paket) bleibt die Rohgröße bei rund 36 KB. Das Gesamtbudget aus Spec 10 (60 KB für alle vier) wird mit rund 51 KB eingehalten. |
| `faq.items` bleibt bei 9 Einträgen statt der in Spec 5.7 genannten 6 | Die beiden dort geforderten Themen („Was passiert mit meiner Abrechnung?“, „Funktioniert das auch mit einem Foto?“) sind als Einträge 6 und 7 bereits vorhanden. Neue Einträge wären Dubletten, das Löschen bestehender Einträge wäre ein SEO-Rückschritt (die FAQ speist das FAQPage-JSON-LD). |
| `nav.pill` lautet „Erst-Prüfung gratis · Bericht 9,90 €“ statt nur „Erst-Prüfung gratis“ (Spec 4) | Das Release-Audit vom 2026-09-06 hat den reinen Gratis-Hinweis ausdrücklich beanstandet; der Preis muss oben sichtbar bleiben. |
| Zusätzlich entfallen `status.okSoft` und `status.warnSoft` | Spec 2.3 zählt die überlebenden Statusnamen abschließend auf, die beiden sind nicht darunter. Ihre zwei Fundstellen gehen auf `text-muted`. |
| Neues Token `fg.hover` (`#2A3038`) und `status.dangerStrong` (`#DC2626`) | Spec 8 bzw. 2.3 nennen die Werte, aber keinen Tokennamen. Ohne Token blieben zwei Hex-Literale im Code. |
| `text-wrap: pretty` gilt für alle `<p>`, nicht nur für Absätze über 40 Zeichen (Spec 3) | CSS kann nicht nach Textlänge unterscheiden; bei kurzen Absätzen hat die Eigenschaft ohnehin keine Wirkung. |
| Die Zitate der Verbraucherzentrale aus `evidence.*` entfallen ersatzlos | Spec 5.2 nennt für die Beleg-Zeile genau drei Aussagen (Mieterbund, 15 Sekunden, 12 Monate). Für das vierte Zitat gibt es keine Fläche mehr. |
| Neuer Key `letterPreview.date` | Spec 5.5 nennt Absender, Empfänger, Betreff, vier Absätze, Grußformel und Unterschrift. Ein Brief ohne Datum wirkt unfertig; das Datum liegt konsistent zwischen Zugang (14.02.2027) und Frist (30.03.2027). |
| Die Root-404 (`src/app/not-found.tsx`) nutzt eine schlanke Kopie der Shell statt `SiteShell` | Dort gibt es weder `NextIntlClientProvider` noch eine gültige Locale; `useTranslations`, `LocaleSwitcher` und die `next-intl`-Links würden zur Laufzeit werfen. Im Code als Kommentar begründet, inklusive Hinweis auf die Pflege-Kopplung an die Shell. |
| Der Paritäts-Check ist zwischen Task 3 und Task 12 rot | Alle Übersetzungen in einem Task zu bündeln (Spec 12.8) hält die fünf Sprachdateien in einem einzigen Review zusammen. In den „Regeln für Implementierer“ ausdrücklich vermerkt. |
| Bestehende Code-Kommentare, die der Plan wörtlich zitiert, behalten ihre ASCII-Schreibweise | Sonst würden die Vorher-Snippets nicht mehr auf den Ist-Stand der Dateien passen. Neu geschriebene Kommentare tragen echte Umlaute. |
