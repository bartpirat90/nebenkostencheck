# Mehrsprachigkeit (i18n) der Website – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Website in 6 Sprachen (de/en/tr/ar/ru/uk) anbieten – UI + Rechtstexte übersetzt, Analyse-Ergebnis und generierte Briefe bleiben Deutsch.

**Architecture:** `next-intl` mit `[locale]`-Sub-Path-Routing (`localePrefix: 'as-needed'`, Default `de` ohne Präfix). Middleware erkennt die Sprache. Alle UI-Strings liegen in `messages/{locale}.json`; Komponenten nutzen `useTranslations`. Arabisch ist RTL. Deutsch bleibt auf `/`, daher bleiben bestehende URLs + SEO unverändert.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind v3, `next-intl` (neu).

**Spec:** `docs/superpowers/specs/2026-06-27-mehrsprachigkeit-i18n-design.md`

---

## File Structure

**Neu:**
- `src/i18n/routing.ts` – Locales + Routing-Konfig.
- `src/i18n/navigation.ts` – lokalisierte `Link`/`router`/`usePathname`.
- `src/i18n/request.ts` – lädt Messages je Request.
- `src/middleware.ts` – Spracherkennung/Weiterleitung.
- `messages/{de,en,tr,ar,ru,uk}.json` – Übersetzungen (de = Quelle).
- `src/app/[locale]/layout.tsx` – `<html lang dir>`, Provider, JSON-LD, Metadata.
- `src/components/LocaleSwitcher.tsx` – Sprachumschalter.

**Verschoben (nach `src/app/[locale]/`):** `page.tsx`, `impressum/page.tsx`, `datenschutz/page.tsx`, `agb/page.tsx`, `ergebnis/{page,layout}.tsx`, `opengraph-image.tsx`.

**Geändert:** `next.config.mjs` (Plugin), `src/app/layout.tsx` (→ Pass-through), `src/app/robots.ts`, `src/app/sitemap.ts`, sowie alle Komponenten mit sichtbaren Strings.

**Unverändert am Root:** `src/app/api/**`, `src/app/icon.svg`, `src/lib/constants.ts`.

> **next-intl v4-Doku bei Unsicherheit:** https://next-intl.dev/docs/getting-started/app-router

---

## Task 1: next-intl installieren + next.config-Plugin

**Files:**
- Modify: `package.json` (via npm)
- Modify: `next.config.mjs`

- [ ] **Step 1: Installieren**

Run (Repo-Root): `npm install next-intl`
Expected: `next-intl` erscheint in `package.json` dependencies.

- [ ] **Step 2: `next.config.mjs` mit Plugin umschließen**

Bestehenden Inhalt anpassen – `createNextIntlPlugin` importieren und den Export umschließen (Plugin findet `./src/i18n/request.ts` automatisch):

```js
import createNextIntlPlugin from "next-intl/plugin";

// ... bestehende nextConfig unverändert lassen ...

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
```

(Falls `next.config.mjs` aktuell `export default nextConfig;` hat: durch die zwei Zeilen oben ersetzen.)

- [ ] **Step 3: Build-Sanity**

Run: `npx tsc --noEmit`
Expected: keine Fehler (noch keine i18n-Dateien referenziert).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json next.config.mjs
git commit -m "chore(i18n): next-intl installiert + next.config-Plugin"
```

---

## Task 2: i18n-Konfiguration (routing, navigation, request)

**Files:**
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/navigation.ts`
- Create: `src/i18n/request.ts`

- [ ] **Step 1: `src/i18n/routing.ts`**

```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de", "en", "tr", "ar", "ru", "uk"],
  defaultLocale: "de",
  // Deutsch bleibt auf "/", andere Sprachen unter "/en", "/tr", ...
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

/** Sprachen, die von rechts nach links gesetzt werden. */
export const RTL_LOCALES: Locale[] = ["ar"];
export const localeNames: Record<Locale, string> = {
  de: "Deutsch",
  en: "English",
  tr: "Türkçe",
  ar: "العربية",
  ru: "Русский",
  uk: "Українська",
};
```

- [ ] **Step 2: `src/i18n/navigation.ts`**

```ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 3: `src/i18n/request.ts`**

```ts
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    // messages/ liegt im Repo-Root (zwei Ebenen über src/i18n/).
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: Fehler nur wegen noch fehlender `messages/*.json` (kommt in Task 6) – `Cannot find module '../../messages/de.json'`. Das ist hier erwartet; nach Task 6 grün.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/routing.ts src/i18n/navigation.ts src/i18n/request.ts
git commit -m "feat(i18n): routing/navigation/request-Konfiguration"
```

---

## Task 3: Middleware (Spracherkennung)

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Middleware schreiben**

```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Alle Pfade AUSSER: API-Routen, Next-Interna und Dateien mit Endung
  // (robots.txt, sitemap.xml, icon.svg etc. tragen einen Punkt → ausgeschlossen).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: wie Task 2 (nur fehlende messages/*.json).

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(i18n): Middleware fuer Spracherkennung"
```

---

## Task 4: Locale-Layout + Root-Pass-through

**Files:**
- Modify: `src/app/layout.tsx` (→ Pass-through)
- Create: `src/app/[locale]/layout.tsx`

> Ziel: `<html>`/`<body>`/Provider/JSON-LD/Metadata wandern ins Locale-Layout; das Root-Layout reicht nur noch `children` durch (Next verlangt eine Root-Datei, aber `<html>` darf im Segment-Layout liegen).

- [ ] **Step 1: `src/app/layout.tsx` zum Pass-through machen**

Kompletten Inhalt ersetzen durch:

```tsx
// Das eigentliche <html>/<body> liegt in app/[locale]/layout.tsx (lang/dir je Sprache).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

- [ ] **Step 2: `src/app/[locale]/layout.tsx` anlegen**

```tsx
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing, RTL_LOCALES, type Locale } from "@/i18n/routing";
import { SITE_URL } from "@/lib/constants";
import "../globals.css";

const geist = Geist({ subsets: ["latin"] });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  // hreflang: alle Sprachen + x-default (= de)
  const languages: Record<string, string> = { "x-default": SITE_URL };
  for (const l of routing.locales) {
    languages[l] = l === routing.defaultLocale ? SITE_URL : `${SITE_URL}/${l}`;
  }

  const canonical = locale === routing.defaultLocale ? "/" : `/${locale}`;

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: t("title"), template: `%s · Nebenkostencheck` },
    description: t("description"),
    alternates: { canonical, languages },
    openGraph: {
      type: "website",
      locale,
      url: canonical,
      siteName: "Nebenkostencheck",
      title: t("title"),
      description: t("description"),
    },
    twitter: { card: "summary_large_image", title: t("title"), description: t("description") },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  };
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "Nebenkostencheck", url: SITE_URL, logo: `${SITE_URL}/icon.svg` },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: "Nebenkostencheck", publisher: { "@id": `${SITE_URL}/#organization` } },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = RTL_LOCALES.includes(locale as Locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body className={geist.className}>
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
```

> Die `Service`-JSON-LD (Offer 9,90 €) wandert in die Landing-Page (Task 7), da sie zur Startseite gehört. Die alte globale Metadata in `app/layout.tsx` ist durch das Pass-through entfallen.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: noch Fehler wegen fehlender `messages/*.json` + weil die Routen noch nicht unter `[locale]/` liegen (Task 5).

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/[locale]/layout.tsx
git commit -m "feat(i18n): Locale-Layout (html lang/dir, Provider, Metadata, hreflang)"
```

---

## Task 5: Routen nach `[locale]/` verschieben

**Files:**
- Move: `src/app/page.tsx` → `src/app/[locale]/page.tsx`
- Move: `src/app/impressum/page.tsx` → `src/app/[locale]/impressum/page.tsx`
- Move: `src/app/datenschutz/page.tsx` → `src/app/[locale]/datenschutz/page.tsx`
- Move: `src/app/agb/page.tsx` → `src/app/[locale]/agb/page.tsx`
- Move: `src/app/ergebnis/page.tsx` + `layout.tsx` → `src/app/[locale]/ergebnis/`
- Move: `src/app/opengraph-image.tsx` → `src/app/[locale]/opengraph-image.tsx`

- [ ] **Step 1: Dateien per git verschieben (Historie erhalten)**

```bash
git mv src/app/page.tsx src/app/[locale]/page.tsx
git mv src/app/impressum src/app/[locale]/impressum
git mv src/app/datenschutz src/app/[locale]/datenschutz
git mv src/app/agb src/app/[locale]/agb
git mv src/app/ergebnis src/app/[locale]/ergebnis
git mv src/app/opengraph-image.tsx src/app/[locale]/opengraph-image.tsx
```

(Unter Windows/Git-Bash funktioniert `git mv` mit den eckigen Klammern; bei Problemen Pfade in Anführungszeichen setzen.)

- [ ] **Step 2: Interne Navigations-Links auf next-intl umstellen**

In allen verschobenen Seiten **und** Komponenten, die `<a href="/...">` oder `next/link` für **interne** Routen nutzen, auf den lokalisierten `Link` umstellen:

- `import Link from "next/link"` → `import { Link } from "@/i18n/navigation"`
- Reine `<a href="/impressum">`-Tags (z. B. in `Footer.tsx`, `agb/page.tsx`, „← Zurück"-Links) → `<Link href="/impressum">`.
- `router.push("/...")`/`useRouter` aus `next/navigation` für interne Navigation → aus `@/i18n/navigation`.
- **Nicht** anfassen: externe Links (`https://…`, `mailto:`), Anker (`#upload`), API-Aufrufe (`/api/...` via `fetch`).

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: nur noch fehlende `messages/*.json` (Task 6).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(i18n): Routen nach [locale]/ verschoben + lokalisierte Links"
```

---

## Task 6: `messages/de.json` (Quellsprache)

**Files:**
- Create: `messages/de.json`

> **Vorgehen:** Alle aktuell hartkodierten deutschen Strings der Komponenten in eine namespaced JSON sammeln. `de.json` ist die **Quelle der Wahrheit**. Namespaces: `meta`, `common`, `nav`, `landing`, `evidence` (linke Belege), `assurance` (rechte Spalte), `stats`, `howItWorks`, `upload`, `teaser`, `report`, `faq`, `footer`, `notAStatement`, `letter`, `errors`, `legal` (mit `impressum`/`datenschutz`/`agb`), `localeSwitcher`.

- [ ] **Step 1: `messages/de.json` mit dem vollständigen Schlüsselsatz anlegen**

Gerüst (Werte = die **exakten** deutschen Texte aus den heutigen Komponenten übernehmen; lange Rechtstext-Bodies 1:1 aus den bestehenden `impressum/datenschutz/agb`-Seiten in `legal.*` übertragen):

```json
{
  "meta": {
    "title": "Nebenkostencheck – Nebenkostenabrechnung prüfen & Geld zurückholen",
    "description": "Lade deine Nebenkostenabrechnung hoch und finde in Sekunden typische Fehler – geprüft nach aktuellem Mietrecht (BetrKV, HeizkV) und höchstrichterlicher BGH-Rechtsprechung. Erst-Prüfung kostenlos."
  },
  "common": { "back": "← Zurück" },
  "nav": { "badge": "Erst-Prüfung gratis" },
  "landing": { "...": "alle Hero-/Abschnitts-Strings aus LandingHero.tsx" },
  "evidence": { "...": "die drei Belegzitate (Mieterbund/Verbraucherzentrale/§556) aus page.tsx" },
  "assurance": { "...": "GEPRÜFT NICHT GESCHÄTZT + DEINE SICHERHEIT aus page.tsx" },
  "stats": { "...": "Zeilen aus StatsBar.tsx" },
  "howItWorks": { "...": "Schritte aus HowItWorks.tsx" },
  "upload": { "...": "Texte aus UploadZone.tsx" },
  "teaser": { "...": "SO GEHT'S WEITER + Schritte aus PreviewView.tsx" },
  "report": { "...": "Überschriften/Buttons/Disclaimer/Legende aus ResultView.tsx (NUR Rahmen)" },
  "faq": { "heading": "Was du vor der Prüfung wissen solltest", "items": [ { "q": "...", "a": "..." } ] },
  "footer": { "...": "Footer.tsx" },
  "notAStatement": { "...": "NotAStatementBox.tsx" },
  "letter": { "...": "UI-Chrome aus LetterModal.tsx (Buttons/Labels, NICHT der Brieftext)" },
  "errors": { "fileTooLarge": "Die Datei ist zu groß (max. {mb} MB). Bitte lade nur die Nebenkostenabrechnung hoch." },
  "legal": {
    "disclaimerNonDe": "Diese Übersetzung dient nur der Verständlichkeit. Maßgeblich ist die deutsche Fassung.",
    "impressum": { "...": "voller deutscher Body aus impressum/page.tsx" },
    "datenschutz": { "...": "voller deutscher Body aus datenschutz/page.tsx" },
    "agb": { "...": "voller deutscher Body aus agb/page.tsx" }
  },
  "localeSwitcher": { "label": "Sprache wählen" }
}
```

> Der `faq.items`-Array spiegelt die 7 Fragen aus `Faq.tsx`. Die `report`-Keys decken **nur** UI-Rahmen ab (z. B. „Sofort angreifbar", „Widerspruch erstellen", „Bericht als PDF herunterladen", „ERFOLGSAUSSICHTEN", Disclaimer) – **nicht** die Fehler-Daten.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: grün (alle Module auflösbar, Routen unter `[locale]/`).

- [ ] **Step 3: Build-Sanity (nur de existiert noch → andere Sprachen 404, ok für jetzt)**

Run: `npm run build`
Expected: Build erstellt `/` (de). Routen für en/tr/… scheitern noch am fehlenden `messages/<l>.json` → in Task 11/14 ergänzt. Falls der Build wegen fehlender Sprachdateien bricht: vorerst `de.json` nach `en/tr/ar/ru/uk.json` kopieren (Platzhalter), in Task 11/14 ersetzen.

- [ ] **Step 4: Commit**

```bash
git add messages/de.json
git commit -m "feat(i18n): deutsche Quell-Messages (de.json)"
```

---

## Task 7: Landing-Komponenten auf `useTranslations` umstellen

**Files:**
- Modify: `src/app/[locale]/page.tsx` (Rand-Spalten, Service-JSON-LD)
- Modify: `src/components/LandingHero.tsx`
- Modify: `src/components/StatsBar.tsx`
- Modify: `src/components/HowItWorks.tsx`
- Modify: `src/components/UploadZone.tsx`
- Modify: `src/components/Faq.tsx`
- Modify: `src/components/Footer.tsx`

- [ ] **Step 1: Muster anwenden (pro Komponente)**

In **Client-Komponenten** (`"use client"`):

```tsx
import { useTranslations } from "next-intl";
// ...
const t = useTranslations("landing"); // passender Namespace
// JSX: {t("headline")} statt hartkodiertem Text
```

In **Server-Komponenten** (z. B. `Faq.tsx`, falls ohne `"use client"`):

```tsx
import { useTranslations } from "next-intl";
// useTranslations funktioniert auch in Server-Komponenten (synchron, via Provider/Request).
```

Für Listen (Stats-Zeilen, HowItWorks-Schritte, FAQ-Items): die Daten-Arrays aus den Komponenten in `de.json` verlagern und über `t.raw("items")` bzw. einzelne Keys rendern.

- [ ] **Step 2: `Faq.tsx` – FAQPage-JSON-LD aus Messages bauen**

Das `faqJsonLd` aus den übersetzten Items erzeugen (UI **und** strukturierte Daten in der aktiven Sprache, synchron):

```tsx
const items = t.raw("items") as { q: string; a: string }[];
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};
```

- [ ] **Step 3: `page.tsx` – Service-JSON-LD (lokalisiert) ergänzen**

Die `Service`-JSON-LD (Offer 9,90 €) hier rendern, `description` aus `t("meta.description")` o. ä. Preis bleibt `"9.90"`/`"EUR"`.

- [ ] **Step 4: Typecheck + Dev-Sichtprüfung**

Run: `npx tsc --noEmit` → grün.
Run: `npm run dev`, öffne `/` → deutsche Startseite unverändert; `/en` → englische Strings (sofern en.json schon Platzhalter=de, sonst deutsch). Keine fehlenden Keys in der Konsole.

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/page.tsx src/components/LandingHero.tsx src/components/StatsBar.tsx src/components/HowItWorks.tsx src/components/UploadZone.tsx src/components/Faq.tsx src/components/Footer.tsx
git commit -m "feat(i18n): Landing-Komponenten auf useTranslations"
```

---

## Task 8: Teaser/Bericht-Rahmen + Sonderfälle übersetzen

**Files:**
- Modify: `src/components/PreviewView.tsx`
- Modify: `src/components/ResultView.tsx`
- Modify: `src/components/NotAStatementBox.tsx`
- Modify: `src/components/LetterModal.tsx`
- Modify: `src/app/[locale]/page.tsx` (Client-Fehlermeldung „Datei zu groß")

- [ ] **Step 1: NUR den UI-Rahmen übersetzen**

`ResultView`/`PreviewView`: Überschriften, Button-Beschriftungen, Abschnitts-Titel, Disclaimer, Legenden-Labels über `useTranslations("report")`/`("teaser")`. **NICHT** übersetzen: `error.title`, `error.description`, `result.summary`, `error.legalBasis`, `error.evidence`, `error.actionText` (kommen deutsch aus der API), sowie der generierte Brieftext in `LetterModal`.

- [ ] **Step 2: Client-Fehlertext übersetzen**

Die „Datei zu groß"-Meldung in `page.tsx` über `t("errors.fileTooLarge", { mb: MAX_FILE_MB })` ausgeben. **API-Fehlertexte** (aus `result.error`/`fetch`-Antworten) bleiben unverändert deutsch (bewusste Einschränkung laut Spec).

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit` → grün.

- [ ] **Step 4: Commit**

```bash
git add src/components/PreviewView.tsx src/components/ResultView.tsx src/components/NotAStatementBox.tsx src/components/LetterModal.tsx src/app/[locale]/page.tsx
git commit -m "feat(i18n): Teaser/Bericht-Rahmen + Client-Fehler uebersetzt (Daten bleiben dt.)"
```

---

## Task 9: Rechtstexte aus Messages rendern + Disclaimer

**Files:**
- Modify: `src/app/[locale]/impressum/page.tsx`
- Modify: `src/app/[locale]/datenschutz/page.tsx`
- Modify: `src/app/[locale]/agb/page.tsx`

- [ ] **Step 1: Bodies aus `legal.*` rendern**

Die hartkodierten deutschen Absätze durch `t("...")`-Aufrufe (Namespace `legal.impressum` etc.) ersetzen. Struktur (Überschriften + Absätze) als Keys abbilden.

- [ ] **Step 2: Unverbindlichkeits-Hinweis für Nicht-Deutsch**

Oben auf jeder Rechtstext-Seite, **nur wenn `locale !== 'de'`**, den Hinweis `t("legal.disclaimerNonDe")` einblenden (dezent, amber). Locale via `useLocale()` aus `next-intl`.

- [ ] **Step 3: Per-Page-Metadata (Title) lokalisiert**

`generateMetadata` je Seite mit `getTranslations({locale, namespace:"legal.<x>"})` → übersetzter `title`. (Diese Seiten sind Server-Komponenten – `export const metadata` durch `generateMetadata` ersetzen.)

- [ ] **Step 4: Typecheck + Dev-Sicht**

Run: `npx tsc --noEmit` → grün. `npm run dev`: `/impressum` (de) ohne Hinweis, `/en/impressum` mit Disclaimer.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/impressum/page.tsx" "src/app/[locale]/datenschutz/page.tsx" "src/app/[locale]/agb/page.tsx"
git commit -m "feat(i18n): Rechtstexte aus Messages + Unverbindlichkeits-Hinweis"
```

---

## Task 10: LocaleSwitcher + in die Nav einbauen

**Files:**
- Create: `src/components/LocaleSwitcher.tsx`
- Modify: `src/app/[locale]/page.tsx` (Nav oben rechts)

- [ ] **Step 1: `LocaleSwitcher.tsx`**

```tsx
"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, localeNames, type Locale } from "@/i18n/routing";

export default function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <select
      aria-label="Sprache wählen"
      value={locale}
      onChange={(e) => router.replace(pathname, { locale: e.target.value as Locale })}
      className="bg-surface border border-line text-muted text-xs rounded-md px-2 py-1.5 hover:text-fg transition-colors cursor-pointer"
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>
          {localeNames[l]}
        </option>
      ))}
    </select>
  );
}
```

> `usePathname` aus `@/i18n/navigation` liefert den Pfad OHNE Locale-Präfix; `router.replace(pathname, {locale})` wechselt die Sprache und behält die Seite. Cookie `NEXT_LOCALE` wird von next-intl gesetzt.

- [ ] **Step 2: In die Nav der Startseite einsetzen**

In `page.tsx` in das `<nav>`-Element (oben rechts, neben/anstatt des Badges) `<LocaleSwitcher />` einfügen. Import ergänzen.

- [ ] **Step 3: Typecheck + Dev-Test**

Run: `npx tsc --noEmit` → grün. `npm run dev`: Sprache wechseln → URL wechselt (`/` ↔ `/en`), Seite bleibt, Inhalt in Zielsprache.

- [ ] **Step 4: Commit**

```bash
git add src/components/LocaleSwitcher.tsx "src/app/[locale]/page.tsx"
git commit -m "feat(i18n): LocaleSwitcher in der Nav"
```

---

## Task 11: `messages/en.json` (hochwertiges Englisch)

**Files:**
- Create/Replace: `messages/en.json`

- [ ] **Step 1: Vollständige englische Übersetzung**

`de.json` 1:1 als Schlüsselgerüst übernehmen, **alle Werte ins Englische** übersetzen (hochwertig, idiomatisch). Eigennamen/Gesetze stehen lassen (BetrKV, HeizkV, BGB, BGH), aber erklärend einbetten. `meta.title`/`description` als echte EN-SEO-Texte. Preis-/€-Angaben beibehalten.

- [ ] **Step 2: Vollständigkeit prüfen (Schlüsselparität)**

Run (Repo-Root):
```bash
node -e "const a=require('./messages/de.json'),b=require('./messages/en.json');const flat=(o,p='')=>Object.entries(o).flatMap(([k,v])=>v&&typeof v==='object'&&!Array.isArray(v)?flat(v,p+k+'.'):[p+k]);const da=new Set(flat(a)),db=new Set(flat(b));const miss=[...da].filter(k=>!db.has(k));console.log(miss.length?('FEHLT in en: '+miss.join(', ')):'OK: Schluessel vollstaendig');"
```
Expected: `OK: Schluessel vollstaendig`.

- [ ] **Step 3: Dev-Sicht**

`npm run dev`, `/en`, `/en/impressum`, `/en/agb` → durchgängig Englisch, Disclaimer auf Rechtstexten sichtbar.

- [ ] **Step 4: Commit**

```bash
git add messages/en.json
git commit -m "feat(i18n): englische Uebersetzung (en.json)"
```

---

## Task 12: RTL-Unterstützung (Arabisch)

**Files:**
- Modify: diverse Komponenten/Seiten mit richtungsabhängigen Tailwind-Klassen

- [ ] **Step 1: Richtungsabhängige Utilities auf logische umstellen**

Repo-weit (in `src/`) ersetzen, wo es um Layout-Richtung geht:
- `pl-` → `ps-`, `pr-` → `pe-`
- `ml-` → `ms-`, `mr-` → `me-`, `ml-auto` → `ms-auto`, `mr-auto` → `me-auto`
- `border-l` → `border-s`, `border-r` → `border-e`
- `text-left` → `text-start`, `text-right` → `text-end`
- `left-`/`right-` bei absoluter Positionierung → `start-`/`end-`

Betroffen v. a.: `page.tsx` (Rand-Spalten `border-r`/`border-l`/`pr-6`/`pl-6`), `Footer.tsx`, `ResultView.tsx` (Legenden-Randleiste `border-l pl-6`), Karten mit `ml-auto`.

> **Nicht** flippen: rein visuelle, nicht-richtungsbezogene Abstände, wo Symmetrie gewollt ist. Im Zweifel testen.

- [ ] **Step 2: Dev-Test Arabisch**

`npm run dev`, `/ar` öffnen → `dir="rtl"` aktiv, Layout spiegelt (Rand-Spalten/Trennlinien auf der anderen Seite, Text rechtsbündig beginnend). Chevrons/Pfeil-Icons prüfen; bei Bedarf `rtl:rotate-180` ergänzen.

- [ ] **Step 3: Typecheck + Commit**

Run: `npx tsc --noEmit` → grün.
```bash
git add -A
git commit -m "feat(i18n): RTL-faehige logische Tailwind-Utilities"
```

---

## Task 13: SEO – Sitemap-Alternates, robots, lokalisiertes OG-Bild

**Files:**
- Modify: `src/app/sitemap.ts`
- Modify: `src/app/robots.ts`
- Modify: `src/app/[locale]/opengraph-image.tsx`

- [ ] **Step 1: `sitemap.ts` – alle Locales + hreflang-Alternates**

Für jede Seite (`/`, `/impressum`, `/datenschutz`, `/agb`) einen Eintrag je Locale mit `alternates.languages`. Default-Locale ohne Präfix, andere mit `/<locale>`:

```ts
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { routing } from "@/i18n/routing";

const PAGES = ["", "/impressum", "/datenschutz", "/agb"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PAGES.flatMap((page) => {
    const languages: Record<string, string> = {};
    for (const l of routing.locales) {
      languages[l] = l === routing.defaultLocale ? `${SITE_URL}${page}` : `${SITE_URL}/${l}${page}`;
    }
    return routing.locales.map((l) => ({
      url: l === routing.defaultLocale ? `${SITE_URL}${page}` : `${SITE_URL}/${l}${page}`,
      lastModified: now,
      changeFrequency: (page === "" ? "monthly" : "yearly") as "monthly" | "yearly",
      priority: page === "" ? 1 : 0.3,
      alternates: { languages },
    }));
  });
}
```

- [ ] **Step 2: `robots.ts` – Locale-Ergebnisseiten sperren**

`disallow` erweitern: `["/ergebnis", "/api/", "/*/ergebnis"]` (Hauptsignal bleibt das per-Locale `noindex` im `ergebnis/layout.tsx`, das bereits existiert und durch den Umzug je Sprache greift).

- [ ] **Step 3: OG-Bild lokalisieren**

In `[locale]/opengraph-image.tsx` die Headline/Subline aus `getTranslations({locale, namespace:"meta"})` ziehen. **Schrift-Sonderfall:** Für `ar` (Arabisch) und `ru`/`uk` (Kyrillisch) deckt die Satori-Default-Font die Glyphen NICHT ab. Lösung: passende Schrift laden (z. B. Noto Sans Arabic / Noto Sans) via `fetch` einer `.ttf` und `fonts`-Option der `ImageResponse`. Falls das den Rahmen sprengt: für nicht-lateinische Locales auf eine **textarme** OG-Variante ausweichen (Logo + Domain + Markenfarbe, ohne langen Fließtext). Diesen Schritt isoliert testen (OG-Bild je Locale abrufen, s. Verifikation).

- [ ] **Step 4: Typecheck + Commit**

Run: `npx tsc --noEmit` → grün.
```bash
git add src/app/sitemap.ts src/app/robots.ts "src/app/[locale]/opengraph-image.tsx"
git commit -m "feat(i18n,seo): Sitemap-Alternates, robots, lokalisiertes OG-Bild"
```

---

## Task 14: `messages/{tr,ar,ru,uk}.json` (KI-Entwurf)

**Files:**
- Create/Replace: `messages/tr.json`, `messages/ar.json`, `messages/ru.json`, `messages/uk.json`

- [ ] **Step 1: Je Sprache aus `de.json` übersetzen**

Gleiche Schlüsselstruktur, alle Werte in die jeweilige Sprache übersetzen (Türkisch / Arabisch / Russisch / Ukrainisch). Gesetzeskürzel (BetrKV/HeizkV/BGB/BGH) stehen lassen + erklären. Arabisch in arabischer Schrift (RTL-Inhalt, kein Transliteration).

- [ ] **Step 2: Review-Markierung**

In jeder der vier Dateien einen `"_meta"`-Schlüssel ganz oben ergänzen:
```json
"_meta": { "status": "ai-draft", "review": "Vor Launch von Muttersprachler:in prüfen lassen." }
```
(`_meta` wird nirgends gerendert – reiner Hinweis im Code.)

- [ ] **Step 3: Schlüsselparität aller Sprachen prüfen**

Run (Repo-Root):
```bash
node -e "const fs=require('fs');const flat=(o,p='')=>Object.entries(o).flatMap(([k,v])=>v&&typeof v==='object'&&!Array.isArray(v)?flat(v,p+k+'.'):[p+k]);const de=new Set(flat(require('./messages/de.json')).filter(k=>!k.startsWith('_meta')));for(const l of ['en','tr','ar','ru','uk']){const s=new Set(flat(require('./messages/'+l+'.json')).filter(k=>!k.startsWith('_meta')));const miss=[...de].filter(k=>!s.has(k));console.log(l+': '+(miss.length?('FEHLT '+miss.join(', ')):'OK'));}"
```
Expected: jede Sprache `OK`.

- [ ] **Step 4: Commit**

```bash
git add messages/tr.json messages/ar.json messages/ru.json messages/uk.json
git commit -m "feat(i18n): KI-Erstuebersetzungen tr/ar/ru/uk (Review ausstehend)"
```

---

## Task 15: Gesamt-Verifikation (alle 6 Locales)

**Files:** keine (nur Prüfung)

- [ ] **Step 1: Typecheck + Build**

Run: `npx tsc --noEmit && npm run build`
Expected: grün; im Build-Output erscheinen die statisch generierten Locale-Routen (`/`, `/en`, `/tr`, `/ar`, `/ru`, `/uk` + Unterseiten).

- [ ] **Step 2: Dev-Server – Sprachen durchgehen**

`npm run dev`, dann je Locale prüfen:
- `/` (de): unverändert; `/en`, `/tr`, `/ar`, `/ru`, `/uk`: Inhalt in Zielsprache, keine fehlenden-Key-Warnungen in der Server-Konsole.
- `<html lang>`/`dir`: `/ar` → `dir="rtl"`, Layout gespiegelt.
- hreflang: im HTML-`<head>` von `/` die `<link rel="alternate" hreflang=...>` für alle Sprachen + `x-default` vorhanden.
- FAQ: `FAQPage`-JSON-LD je Locale in der jeweiligen Sprache.
- `/robots.txt` enthält `/*/ergebnis`; `/sitemap.xml` enthält alle Locale-URLs mit `<xhtml:link rel="alternate" hreflang>`.
- LocaleSwitcher wechselt Sprache und behält die Route.

- [ ] **Step 3: Deutsch-bleibt-Deutsch gegenprüfen (MOCK-Flow)**

Mit `MOCK_ANALYSIS`-Preview oder lokalem MOCK: Upload → Teaser → Ergebnis in einer Nicht-DE-Sprache (z. B. `/en`) → **Fehler-Inhalte + generierter Brief sind weiterhin Deutsch**, nur der UI-Rahmen ist Englisch.

- [ ] **Step 4: Doku + Memory**

- `docs/` (ggf. neue `docs/I18N.md` oder Abschnitt in bestehender Doku): Sprachen, Architektur, „Daten/Briefe bleiben Deutsch", Review-Status der KI-Sprachen, wie eine weitere Sprache ergänzt wird (Locale in `routing.ts` + `messages/<l>.json`).
- Memory `project-nebenkostencheck.md`: i18n-Stand + offene Reviews festhalten.

- [ ] **Step 5: Commit + Push**

```bash
git add -A
git commit -m "docs(i18n): Mehrsprachigkeit dokumentiert"
git push origin monetarisierung
```

---

## Self-Review-Notiz (Plan ↔ Spec)

- **Spec „Routing/Struktur"** → Tasks 1–5. **„Übersetzungstexte"** → Tasks 6–9, 11, 14. **„RTL"** → Task 12. **„SEO/hreflang/OG"** → Tasks 4, 13. **„Sprachumschalter"** → Task 10. **„Verifikation"** → Task 15.
- **Bewusst Deutsch** (Ergebnis-Daten + Briefe): in Task 8 explizit ausgenommen, in Task 15/Step 3 gegengeprüft.
- **API-Fehlertexte bleiben Deutsch:** Task 8/Step 2 festgehalten.
- **OG-Schriftrisiko (AR/RU/UK):** Task 13/Step 3 mit Fallback.
- **KI-Sprachen-Review:** Task 14/Step 2 (`_meta`-Marker) + Doku Task 15.
- Schlüssel-Parität automatisiert geprüft (Tasks 11, 14).
- Konsistente Namen: `routing`, `Locale`, `RTL_LOCALES`, `localeNames` (routing.ts) durchgängig genutzt; `Link/usePathname/useRouter` stets aus `@/i18n/navigation`.
