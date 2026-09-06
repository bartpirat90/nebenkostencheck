# Release-Paket „Mittel" (🟡-Audit-Punkte) – Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die zehn noch offenen 🟡-Punkte aus dem Projekt-Audit vom 2026-09-06 abarbeiten (Landing-Copy/Preis, Touch-Ziele, SEO-Meta/Manifest, Keyword-Abdeckung, Upload-Validierung, ESLint, Button-Komponente/Tokens, Client-Payload, Mobile-App-Konfiguration) und gepusht auf `origin/monetarisierung` hinterlassen.

**Architecture:** Kleine, unabhängige Änderungen pro Task; Wellen so gewählt, dass parallele Tasks keine gemeinsamen Dateien anfassen. `messages/*.json` werden nur von Tasks derselben Welle **nicht** gleichzeitig berührt. ESLint (Task 6) kommt zuletzt, weil seine Fixes viele Dateien streifen können. Alle Texte in 6 Sprachen; tr/ar/ru/uk behalten `_meta.status: "ai-draft"`.

**Tech Stack:** Next.js 15.5 App Router, React 19, next-intl 4, Tailwind 3, vitest 5, ESLint 9 (flat config), Expo/React Native (nur `mobile/`).

**Bereits erledigt (nicht mehr Teil dieses Plans):** `:focus-visible` projektweit, ContactForm-Platzhalter, Doku-Drift (Paket „Hoch").

**Bewusst nicht im Plan:** Ratgeber-/Blog-Content (eigenes Content-Projekt), Favicon `.ico` (Next liefert `icon.svg`; das 404 auf `/favicon.ico` ist kosmetisch).

**Verifikation je Task:** `cd /e/Neko-Check/nebenkostencheck/nebenkostencheck && npx tsc --noEmit && npm test && npm run build` (aktuell 80 Tests / 15 Dateien, Build grün). Paritäts-Check der Message-Dateien:

```bash
node -e "const flat=(o,p='')=>Object.entries(o).flatMap(([k,v])=>v&&typeof v==='object'&&!Array.isArray(v)?flat(v,p+k+'.'):[p+k]);const de=new Set(flat(require('./messages/de.json')).filter(k=>!k.startsWith('_meta')));for(const l of ['en','tr','ar','ru','uk']){const s=new Set(flat(require('./messages/'+l+'.json')).filter(k=>!k.startsWith('_meta')));const miss=[...de].filter(k=>!s.has(k));console.log(l+': '+(miss.length?('FEHLT '+miss.join(',')):'OK'));}"
```

**Wellen (parallel innerhalb einer Welle):**
1. Task 1 (Landing-Copy), Task 5 (Upload-Validierung), Task 9 (Mobile-App)
2. Task 2 (Touch-Ziele), Task 3 (SEO-Meta/Manifest)
3. Task 4 (Keywords/FAQ), Task 8 (Client-Payload)
4. Task 7 (Button-Komponente + Tokens)
5. Task 6 (ESLint)
6. Task 10 (Gesamt-Verifikation, Push)

---

### Task 1: Landing-Copy – Preis sichtbar, Nav-Badge, Quellen-Attribution

**Files:** `messages/{de,en,tr,ar,ru,uk}.json` (`nav.badge`, neu `hero.priceNote`, `stats.items[].source` statt `stats.source`), `src/components/StatsBar.tsx`, `src/components/LandingHero.tsx`

- [ ] **Step 1:** `nav.badge` in allen 6 Sprachen von „PRÜFBERICHT · GRATIS" auf „ERST-PRÜFUNG GRATIS · BERICHT 9,90 €" (Großschreibung wie bisher; en: „FREE FIRST CHECK · REPORT €9.90").
- [ ] **Step 2:** Neuer Key `hero.priceNote` (de: „Erst-Prüfung kostenlos · vollständiger Bericht einmalig 9,90 €, kein Abo"), in `LandingHero.tsx` als `<p className="text-sm text-faint mt-3">` direkt unter dem CTA.
- [ ] **Step 3:** `stats.source` entfernen; jedes `stats.items[]`-Objekt bekommt optional `source` (nur Zeile 0: „Quelle: Deutscher Mieterbund"). `StatsBar.tsx`: Quelle als `<span className="block text-[11px] text-faint">` unter dem Label der jeweiligen Zeile rendern; Fußnote unter der Box entfällt. Zeilen „15 Sek." und „0 €" bleiben ohne Quelle (Eigenaussagen).
- [ ] **Step 4:** Paritäts-Check, Prüf-Trio, Screenshot Startseite (de + en). Commit `feat(landing): Preis auf der Startseite sichtbar, Badge ohne Gratis-Versprechen, Quelle nur an der Mieterbund-Zahl`.

---

### Task 2: Touch-Ziele ≥ 44 px

**Files:** `src/components/LocaleSwitcher.tsx`, `src/components/LetterModal.tsx` (Schließen-Button), `src/components/Footer.tsx`, ggf. `src/components/PreviewView.tsx`/`ResultView.tsx` (kleine Text-Links wie „Neu starten")

- [ ] **Step 1:** Vor der Änderung im Browser (Mobile-Preset 375×812) per JS alle interaktiven Elemente < 44 px auflisten:
  ```js
  [...document.querySelectorAll('a,button,select,input,[role=button]')].map(e=>{const r=e.getBoundingClientRect();return [e.tagName,(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,30),Math.round(r.width),Math.round(r.height)]}).filter(([, ,w,h])=>h<44||w<44)
  ```
- [ ] **Step 2:** LocaleSwitcher: `min-h-11 px-3 text-sm`; Modal-X: `w-11 h-11 -m-2 flex items-center justify-center` (Icon bleibt 20 px); Footer-Links: `inline-flex items-center min-h-11 px-2`; weitere Treffer aus Step 1 analog (Mindest-Box per Padding, nicht Schriftgröße).
- [ ] **Step 3:** Liste aus Step 1 erneut ausführen → leer (Ausnahme: Inline-Links im Fließtext der Rechtstexte sind erlaubt). Desktop-Screenshot: Nav wirkt nicht aufgebläht. Prüf-Trio. Commit `fix(a11y): Touch-Ziele mindestens 44 px (Sprachwahl, Modal-Schliessen, Footer-Links)`.

---

### Task 3: SEO-Meta – kurze Titles, Sitemap ohne Build-Zeit, Manifest, Apple-Icon, theme-color

**Files:** `messages/*.json` (`meta.title`), `src/app/sitemap.ts`, neu `src/app/manifest.ts`, neu `src/app/apple-icon.tsx`, `src/app/[locale]/layout.tsx` (`viewport`-Export)

- [ ] **Step 1:** `meta.title` in allen 6 Sprachen auf ≤ 60 Zeichen (de: „Nebenkostenabrechnung prüfen & Geld zurück – Nebenkostencheck" ist 61 → „Nebenkostenabrechnung prüfen – Nebenkostencheck" 47; en „Check your German utility bill – Nebenkostencheck"; tr/ar/ru/uk sinngemäß, per `node -e` Längen ausgeben). Das Title-Template `%s · Nebenkostencheck` gilt nur für Unterseiten; `meta.title` ist der absolute Startseiten-Titel – im Layout prüfen (`title: { default, template }`) und beibehalten.
- [ ] **Step 2:** `sitemap.ts`: `lastModified` entfernen (Google ignoriert Build-Zeitstempel; falsche Signale schaden mehr als keine). `changeFrequency`/`priority` bleiben.
- [ ] **Step 3:** `src/app/manifest.ts` (`MetadataRoute.Manifest`): `name: "Nebenkostencheck"`, `short_name: "NK-Check"`, `start_url: "/"`, `display: "standalone"`, `background_color: "#0C1016"`, `theme_color: "#0C1016"`, `icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }, { src: "/apple-icon", sizes: "180x180", type: "image/png" }]`.
- [ ] **Step 4:** `src/app/apple-icon.tsx`: `ImageResponse` 180×180, `runtime = "nodejs"`, gefülltes grünes Schild + Haken wie `icon.svg` (SVG-Pfad aus `src/app/icon.svg` übernehmen, als JSX-`<svg>`), `contentType = "image/png"`. Next verlinkt `apple-touch-icon` automatisch.
- [ ] **Step 5:** `[locale]/layout.tsx`: `export const viewport: Viewport = { themeColor: "#0C1016", width: "device-width", initialScale: 1 }` (Typ `Viewport` aus `next`).
- [ ] **Step 6:** curl: `/manifest.webmanifest` 200 JSON, `/apple-icon` 200 `image/png`, HTML enthält `<meta name="theme-color" content="#0C1016">`, `<link rel="manifest">`, `<link rel="apple-touch-icon">`; `<title>` auf `/` ≤ 60 Zeichen, `/sitemap.xml` ohne `<lastmod>`. Prüf-Trio (Seitenzahl ändert sich um +2 Routen). Commit `feat(seo): kurze Titles, Manifest, Apple-Icon, theme-color, Sitemap ohne Build-Zeit`.

---

### Task 4: Keyword-Abdeckung – Betriebskosten-/Heizkostenabrechnung in Copy und FAQ

**Files:** `messages/*.json` (`hero.subline`, `howItWorks.steps[1].description`, `faq.items` +2), `src/components/Faq.tsx` nur falls Struktur angepasst werden muss (sollte nicht)

- [ ] **Step 1:** Ist-Zustand messen: `curl -s localhost:3000/ | grep -o -i "nebenkostenabrechnung\|betriebskostenabrechnung\|heizkostenabrechnung" | sort | uniq -c`.
- [ ] **Step 2:** Copy (de zuerst, dann 5 Übersetzungen): `hero.subline` erwähnt „Nebenkosten- oder Betriebskostenabrechnung"; `howItWorks.steps[1].description` nennt „Heizkostenabrechnung (HeizkV)"; zwei neue FAQ-Einträge: (a) „Nebenkostenabrechnung oder Betriebskostenabrechnung – was ist der Unterschied?" (rechtlich: Betriebskosten ist der Gesetzesbegriff, § 556 BGB/BetrKV; „Nebenkosten" umgangssprachlich; beide werden geprüft), (b) „Wird auch die Heizkostenabrechnung geprüft?" (ja, HeizkV: 50–70 % Verbrauchsanteil, Kürzungsrecht 15 % bei fehlender Verbrauchserfassung § 12 HeizkV – Aussagen nur, wenn sie im Prompt/Regelwerk `src/lib/prompts.ts` tatsächlich vorkommen; sonst allgemeiner formulieren). Keine neuen Rechtsbehauptungen, die der Prompt nicht prüft.
- [ ] **Step 3:** `Faq.tsx` speist Liste und FAQPage-JSON-LD aus derselben Quelle – prüfen, dass beide 9 Einträge zeigen. Messung aus Step 1 wiederholen (jedes Keyword ≥ 3×). Paritäts-Check, Prüf-Trio. Commit `feat(seo): Betriebs-/Heizkostenabrechnung in Copy und zwei neue FAQ-Eintraege (6 Sprachen)`.

---

### Task 5: Upload-Validierung – Magic Bytes, 400 statt 500 bei Typfehlern

**Files:** neu `src/lib/fileType.ts` + `src/lib/fileType.test.ts`, `src/app/api/analyze/route.ts`, ggf. `src/components/UploadZone.tsx` (accept-Liste abgleichen)

**Abweichung (umgesetzt, Commits 65edaae + Folge-Fix):** GIF nicht aufgenommen – die Dropzone bietet es per `accept` nicht an, Abrechnungen kommen nie als GIF (Anthropic würde `image/gif` akzeptieren). Fehlercodes: fehlend/leer → `NO_FILE`, falscher JSON-Typ → `INVALID_REQUEST`. `UploadZone.ACCEPTED_TYPES` importiert jetzt `ALLOWED_MEDIA_TYPES`.

- [x] **Step 1 (Test zuerst):** `fileType.test.ts`: `sniffMediaType(base64)` erkennt `%PDF` → `application/pdf`, `FF D8 FF` → `image/jpeg`, `89 50 4E 47` → `image/png`, `RIFF….WEBP` → `image/webp`, `GIF8` → `image/gif`; unbekannt → `null`; leerer String → `null`. `isAllowedUpload(declared, sniffed)` true nur wenn `sniffed` in `ALLOWED_MEDIA_TYPES` und `declared === sniffed` (Ausnahme `image/jpg` ≙ `image/jpeg`). Erwartung: FAIL (Modul fehlt).
- [x] **Step 2:** `fileType.ts` implementieren: nur die ersten 16 Base64-Zeichen dekodieren (`Buffer.from(base64.slice(0, 16), "base64")`), Signaturen vergleichen; `ALLOWED_MEDIA_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"] as const`. `UploadZone.tsx` `accept`-Liste mit derselben Konstante abgleichen (HEIC/HEIF werden weder von Anthropic noch hier unterstützt → falls im `accept`, entfernen und Hinweistext prüfen).
- [x] **Step 3:** `analyze/route.ts`: Body-Parsing in `try` mit `apiError("INVALID_REQUEST")` bei Nicht-JSON; `typeof base64 !== "string" || typeof mediaType !== "string"` → `INVALID_REQUEST`; Gate 1 = `const sniffed = sniffMediaType(base64); if (!sniffed || !isAllowedUpload(mediaType, sniffed)) return apiError("UNSUPPORTED_TYPE");` und **`sniffed` statt `mediaType`** an `countDocumentTokens`/`analyzeStatement` weiterreichen (Client-Angabe ist nur noch ein Hinweis). `fileName` auf `typeof string` und ≤ 200 Zeichen kürzen.
- [x] **Step 4:** Tests grün, Prüf-Trio; curl: `-d '{}'` → 400 INVALID_REQUEST, `-d '{"base64":"QUJD","mediaType":"application/pdf"}'` → 400 UNSUPPORTED_TYPE, `-d 'kein json'` → 400. Commit `feat(security): Magic-Byte-Pruefung beim Upload, 400 statt 500 bei ungueltigem Body`.

---

### Task 6: ESLint einrichten (Next 15.5, Flat Config)

**Files:** `package.json` (devDeps `eslint@^9`, `eslint-config-next@^15.5`, Script `"lint": "eslint ."`), neu `eslint.config.mjs`, Fixes in `src/**` nach Bedarf, `README.md`/`docs/ARCHITECTURE.md` (Prüf-Trio → Prüf-Quartett)

- [ ] **Step 1:** `npm i -D eslint@^9 eslint-config-next@^15.5 @eslint/eslintrc` (Version an installiertes `next` angleichen: `npm ls next`). `eslint.config.mjs` nach Next-Doku (`FlatCompat` + `extends: ["next/core-web-vitals", "next/typescript"]`), `ignores: [".next/**", "mobile/**", "node_modules/**", "security-headers.mjs"?]` – `security-headers.mjs` NICHT ignorieren, es ist Projektcode.
- [ ] **Step 2:** `npx eslint .` → Befunde in Kategorien: (a) echte Bugs fixen, (b) `@typescript-eslint/no-explicit-any` in `sanitizeContact` (`generate-letter`) durch `unknown` + Narrowing ersetzen, (c) `react-hooks/exhaustive-deps` in `page.tsx` `CancelRestore` (dort bewusst `[]` mit Kommentar – Disable-Kommentar behalten, nicht „fixen"), (d) reine Stil-Regeln nicht per Config abschalten außer mit Begründung im Config-Kommentar.
- [ ] **Step 3:** `npm run lint` = 0 Errors, Warnings ≤ 5 (jede im Commit-Text genannt). Prüf-Trio. Doku: `npm run lint` in README „Entwicklung" und ARCHITECTURE-Einschränkungstabelle. Commit `chore(lint): ESLint 9 Flat Config mit next/core-web-vitals, Befunde bereinigt`.

---

### Task 7: Button-Komponente + Status-Tokens

**Files:** neu `src/components/ui/Button.tsx`, `tailwind.config.js` (Tokens), `src/components/{LandingHero,UploadZone,PreviewView,ResultView,LetterModal,ContactForm}.tsx`, `src/app/[locale]/{page,not-found}.tsx`, `src/app/not-found.tsx`, `src/app/[locale]/ergebnis/page.tsx`

- [ ] **Step 1 (Inventar):** `grep -rn "rounded-xl\|rounded-lg\|rounded-full" src/ | grep -i "button\|<a\|Link"` → Tabelle aller Button-Vorkommen (Datei:Zeile, Klassen). Varianten ableiten: `primary` (bg-accent, weiß, bold), `secondary` (border-line-strong, text-muted, hover accent), `ghost` (nur Text, hover fg), `danger` nur falls vorhanden. Größen `md` (py-3 px-5 text-sm) und `lg` (py-3.5 px-7 text-base). Das Inventar im Commit-Text ablegen.
- [ ] **Step 2:** `Button.tsx`: `forwardRef`, Props `variant`, `size`, `asChild`-frei (stattdessen `href?` → rendert `Link` aus `@/i18n/navigation`, sonst `<button type="button">`), `loading?` (deaktiviert + Spinner-Slot), `className`-Merge (einfaches Join, kein `clsx` nötig – wenn `clsx` schon installiert ist, nutzen). Volle Breite über `className="w-full"`.
- [ ] **Step 3:** Status-Tokens in `tailwind.config.js`: `status.ok` (`#10B981`), `status.warn` (`#F59E0B`), `status.neutral` (`#8A96A6`), `status.danger` (`#F87171`) plus Flächen `status.okBg` … – exakt die heute in `ResultView.tsx` `CONFIDENCE_COLORS` und den anderen 17 Hex-Literalen in `src/components` verwendeten Werte (Inventar: `grep -rn "#[0-9A-Fa-f]\{6\}" src/components`). Jedes Literal durch Token ersetzen; verbleibende Literale im Commit-Text begründen.
- [ ] **Step 4:** Alle Buttons auf `<Button>` umstellen. Vorher/Nachher-Screenshots: Startseite (Hero-CTA), Teaser (PreviewView), Ergebnisseite ist ohne Redis nicht erreichbar → `ResultView`/`LetterModal` über temporäre Route `src/app/[locale]/zzuitest/page.tsx` mit Dummy-Daten rendern, danach löschen. Optische Parität (gleiche Farben/Größen) ist das Ziel, keine Neugestaltung.
- [ ] **Step 5:** `grep -rn "#[0-9A-Fa-f]\{6\}" src/components` ≤ 3 Treffer, Prüf-Trio, `zzuitest` gelöscht. Commit `refactor(ui): Button-Komponente (primary/secondary/ghost) und Status-Tokens statt Hex-Literalen`.

---

### Task 8: Client-Payload – Rechtstexte nicht mehr in jedem HTML

**Files:** `src/app/[locale]/layout.tsx`, `src/components/LegalPage.tsx` (falls Client), `src/app/[locale]/{impressum,datenschutz,agb}/page.tsx`, ggf. `src/i18n/request.ts`

**Abweichung (umgesetzt, Commit b38acb4 + Folge-Fix):** Die Keys stehen im HTML escaped (`\"legal\":`), das Messkommando muss daher `grep -o '\\"legal\\":' | wc -l` lauten. Das Ziel „≥ 35 % kleiner" war aus dem JSON-Anteil hergeleitet, nicht aus dem HTML – real sind es ~10 % (legal ≈ 8 KB von ~80 KB Dev-HTML). Abnahmekriterium ist „`legal` = 0 Treffer in allen 6 Sprachen". Liste der Server-only-Namespaces mit Test: `src/i18n/serverOnly.ts`. Größerer Hebel für später (ROADMAP): Provider pro Route-Segment scopen bzw. `"use client"` von der ganzen Startseite in Client-Inseln ziehen (−6 KB pro Seite, −15 KB auf Rechtsseiten).

- [x] **Step 1 (Messen):** `curl -s localhost:3000/ | wc -c` und `curl -s localhost:3000/ | grep -o '\\"legal\\":' | wc -l` (vor der Änderung 1: der komplette `legal`-Block hängt im Client-Payload).
- [x] **Step 2:** `LegalPage.tsx` prüfen: wenn `"use client"` → auf Server-Komponente mit `getTranslations` umstellen (Rechtsseiten haben keine Interaktion). Im `[locale]/layout.tsx` nur die Client-Namespaces an `NextIntlClientProvider` geben: `const { legal, ...clientMessages } = await getMessages();` → `messages={clientMessages}`. Falls TypeScript den Rest-Typ nicht akzeptiert, `Omit<Messages, "legal">`-Cast mit Kommentar. `notFound` und `meta` werden serverseitig genutzt und können ebenfalls raus, sind aber klein – nur `legal` ist Pflicht.
- [x] **Step 3:** Messen: HTML von `/` mindestens 35 % kleiner (real ~10 %, s. Abweichung), `"legal":` = 0; Rechtsseiten rendern weiterhin vollständig in allen 6 Sprachen (curl `/tr/agb` enthält türkischen AGB-Text); Startseite/Teaser/Modal funktionieren (Browser, keine `MISSING_MESSAGE`-Konsolenfehler). Prüf-Trio. Commit `perf(i18n): Rechtstexte nur serverseitig rendern, Client-Payload ohne legal-Namespace`.

---

### Task 9: Mobile-App – API-Basis und Bericht-Button

**Files:** `mobile/src/config.ts`, `mobile/src/app/result.tsx`, `mobile/src/api/report.ts`, `mobile/README.md` (falls vorhanden) bzw. `docs/ROADMAP.md` Mobile-Abschnitt

- [ ] **Step 1:** `config.ts`: Default `https://nebenkostencheck24.de`; Preview-URL nur als dokumentiertes Beispiel für `EXPO_PUBLIC_API_BASE_URL` im Kommentar (`.env`-Beispiel `mobile/.env.example` anlegen, falls Expo-Setup das nutzt).
- [ ] **Step 2:** `report.ts`: neue Funktion `startCheckout(id): Promise<string>` → `POST ${API_BASE_URL}/api/checkout` mit `{ id, locale: "de" }`, liefert `url`. `result.tsx`: Button „Vollständigen Bericht" → wenn `fetchResult` 402 liefert: Button „Bericht freischalten (9,90 €)" öffnet `Linking.openURL(url)`; darunter „Ich habe bezahlt – Bericht laden" ruft `fetchResult` erneut. Fehlercodes aus `{ error, code }` anzeigen (`error`-Text reicht in der App). Kein Stripe-SDK in der App (Zahlung läuft im Browser, Web-`success_url` zeigt den Bericht dort).
- [ ] **Step 3:** In `mobile/`: `npx tsc --noEmit` und `npx jest` grün (bestehende 7 Tests + neuer Test für `startCheckout` mit gemocktem `fetch`). Kein Gerätetest nötig. Commit `fix(mobile): API-Basis auf Produktionsdomain, Bericht-Button startet Web-Checkout statt 402`.

---

### Task 10: Gesamt-Verifikation

- [ ] `npx tsc --noEmit && npm test && npm run lint && npm run build` grün; `npm audit --omit=dev` = 0; Paritäts-Check OK; `_meta.status` in tr/ar/ru/uk unverändert.
- [ ] Dev-Server (vorher verwaiste `node`-Prozesse auf 3000/3002 per `Get-CimInstance Win32_Process` prüfen und beenden): `/` Titel ≤ 60 Zeichen, Preis sichtbar, Badge neu, Quelle nur an Mieterbund-Zeile; `/manifest.webmanifest`, `/apple-icon`; `/sitemap.xml` ohne lastmod; Touch-Ziel-Skript leer; `curl -s / | grep -o '\\"legal\\":' | wc -l` = 0; Upload-400er; keine Konsolenfehler auf `/`, `/en`, `/ar`, `/uk`.
- [ ] Abschluss-Review (fable, querschnittlich), Befunde einarbeiten, `git push origin monetarisierung`.
