# Mehrsprachigkeit (i18n) der Website – Design

**Datum:** 2026-06-27
**Status:** freigegeben (Brainstorming), bereit für Implementierungsplan
**Branch:** `monetarisierung` (greift beim Merge nach `main`; Launch weiter durch Betreiber/Impressum geblockt)

## Ziel

Die Nebenkostencheck-**Website** in mehreren Sprachen anbieten – primär für Mieter:innen, die nicht muttersprachlich Deutsch sind. Der Betrieb bleibt rein deutschlandbezogen; die Übersetzung senkt die Zugangshürde, nicht den Marktfokus.

## Entscheidungen (aus dem Brainstorming)

1. **Übersetzungstiefe:** UI-Hülle **+ Rechtstexte** (Impressum/Datenschutz/AGB als *unverbindliche* Übersetzung mit Hinweis „maßgeblich ist die deutsche Fassung").
2. **Bewusst Deutsch (NICHT übersetzt):**
   - **Analyse-Ergebnis-Inhalte** (Fehler-Titel/-Beschreibungen, Zusammenfassung) – kommen aus der KI auf Deutsch und beziehen sich auf die deutsche Abrechnung/Rechtslage.
   - **Generierte Schreiben** (Widerspruch/Belegeinsicht/kombiniert) – gehen an einen deutschen Vermieter → bleiben vollständig deutsch.
   - Beim Bericht/Teaser wird nur der **UI-Rahmen** (Buttons, Überschriften, Hinweise) übersetzt, nicht der Dateninhalt.
3. **Sprachen (6):** `de` (Default), `en`, `tr`, `ar` (RTL), `ru`, `uk`.
4. **Übersetzungsquelle:** Architektur + `de` (Quelle) + `en` (hochwertig, von Claude) sofort fertig; `tr`/`ar`/`ru`/`uk` als **KI-Erstübersetzung**, klar als „vor Launch von Muttersprachlern prüfen" markiert.

## Architektur

**Bibliothek:** `next-intl` (App-Router-Standard: Sub-Path-Routing, Middleware-Spracherkennung, `useTranslations`, hreflang-Helfer, RTL-fähig). Verworfen: manuelle Lösung (mehr Eigenbau/Fehlerfläche), Paraglide (kleineres Ökosystem).

### Routing
- `[locale]`-Segment, `localePrefix: 'as-needed'`, `defaultLocale: 'de'`.
- **Deutsch bleibt auf `/`, `/impressum` usw.** → bestehende URLs **und** die bereits gebaute SEO bleiben unverändert. Andere Sprachen unter `/en`, `/tr`, `/ar`, `/ru`, `/uk` (+ Unterseiten).
- **Middleware** (`src/middleware.ts`, `createMiddleware`): Spracherkennung Cookie (`NEXT_LOCALE`) → `Accept-Language` → Default `de`. Matcher schließt `/api`, `/_next`, statische Dateien und die Metadaten-Routen (`robots.txt`, `sitemap.xml`, `icon.svg`, `opengraph-image`) aus.

### Verzeichnisstruktur
- Neu: `src/i18n/routing.ts` (`defineRouting`), `src/i18n/navigation.ts` (`createNavigation` → lokalisierte `Link`/`router`/`usePathname`), `src/i18n/request.ts` (`getRequestConfig`, lädt Messages).
- `next.config.mjs`: mit `createNextIntlPlugin()` umschließen.
- Routen wandern nach `src/app/[locale]/`: `page.tsx`, `impressum/`, `datenschutz/`, `agb/`, `ergebnis/`.
- `src/app/layout.tsx` wird **Pass-through** (`return children`); `src/app/[locale]/layout.tsx` rendert `<html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><body>`, `NextIntlClientProvider`, Font, JSON-LD (Organization/WebSite locale-unabhängig), `setRequestLocale(locale)`, `generateStaticParams` über alle Locales.
- **Unverändert am Root:** `src/app/api/**`, `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/icon.svg`.

### Übersetzungstexte
- `messages/{de,en,tr,ar,ru,uk}.json`, nach Bereichen namespaced: `common`, `nav`, `landing`, `stats`, `howItWorks`, `upload`, `teaser`, `report`, `faq`, `footer`, `legal.impressum`, `legal.datenschutz`, `legal.agb`, `errors`.
- **`de.json` ist Source of Truth.** Fehlende Keys in anderen Sprachen fallen auf `de` zurück (next-intl Fallback).
- Komponenten ersetzen hartkodierte Strings durch `useTranslations('namespace')`. Betroffen (Web): `page.tsx` (Rand-Spalten, Überschriften), `LandingHero`, `StatsBar`, `HowItWorks`, `UploadZone`, `PreviewView` (nur Rahmen), `ResultView` (nur Rahmen – Daten bleiben deutsch), `Faq`, `Footer`, `NotAStatementBox`, `LetterModal` (nur UI-Chrome), Rechtstext-Seiten (voller Body).
- **Client-Fehlermeldungen** (z. B. „Datei zu groß" aus `lib/limits`/`page.tsx`) werden übersetzt. **API-Fehlermeldungen** (von `/api/*` zurückgegeben) bleiben vorerst deutsch (Follow-up: Error-Codes statt Texte) – als bekannte Einschränkung markiert.

### RTL (Arabisch)
- `dir="rtl"` am `<html>` für `ar`.
- Richtungsabhängige Tailwind-Utilities → **logische** umstellen, damit das Layout spiegelt: `pl-*/pr-*`→`ps-*/pe-*`, `ml-*/mr-*`→`ms-*/me-*`, `ml-auto`→`ms-auto`, `border-l/r`→`border-s/e`, `text-left/right`→`text-start/end`. Betrifft v. a. die Rand-Spalten und Karten der Startseite, Footer, Bericht.
- Verbleibende Spiegel-Sonderfälle (Icons/Chevrons) per `rtl:`-Variante bei Bedarf.

### SEO / Metadaten
- `generateMetadata({ params })` je Locale: übersetzte `title`/`description`, `alternates.canonical` (locale-URL) + **`alternates.languages`** (hreflang für alle Sprachen + `x-default` = `de`).
- `sitemap.ts`: für jede Seite alle Sprach-URLs mit `alternates.languages`. `robots.ts`: zusätzlich Locale-Ergebnisseiten sperren (`/ergebnis` + `/*/ergebnis`); Hauptsignal bleibt das per-Locale `noindex` im `ergebnis/layout.tsx`.
- **OG-Bild:** `app/[locale]/opengraph-image.tsx` mit lokalisierter Headline. **Achtung Schriftrisiko:** Satori-Default-Font deckt **kein Arabisch/Kyrillisch** ab → für `ar`/`ru`/`uk` eine passende Schrift laden (Noto Sans Arabic / Noto Sans). Fallback wenn zu aufwändig: für nicht-lateinische Locales das OG-Bild auf Markenzeichen + lateinische Domain reduzieren. Im Plan als eigener Schritt.

### Sprachumschalter
- Dezente Komponente (`LocaleSwitcher`) **oben rechts in der Nav** der Startseite (konventionell + sofort sichtbar beim Einstieg). Wechselt via next-intl-`usePathname`/`Link` zur selben Route in der Zielsprache (Pfad bleibt erhalten), setzt `NEXT_LOCALE`-Cookie. Kompakte Darstellung (Sprachkürzel/Globus-Icon, Dropdown). Rechtstexte laufen über die `[locale]`-URL ohnehin in der aktiven Sprache; ein zusätzlicher Switcher dort ist optional (später).

## Umsetzungsreihenfolge (alle 6 Sprachen in einem Durchgang)

In einem zusammenhängenden Durchgang, sinnvoll geordnet (kein separater Phasen-Abschluss):
1. **Architektur:** next-intl-Setup, Routing/Middleware, Struktur-Umzug nach `[locale]`, `LocaleSwitcher`, hreflang + Sitemap-Alternates, RTL-fähige logische Utilities.
2. **String-Extraktion + Quellsprachen:** alle Komponenten auf `useTranslations` umstellen, `messages/de.json` (Quelle) + `messages/en.json` (hochwertig).
3. **KI-Sprachen:** `messages/{tr,ar,ru,uk}.json` als KI-Entwurf (Review-Markierung), Arabisch-RTL-Feinschliff, OG-Schriften für AR/RU/UK.
4. **Abnahme:** Verifikation über alle 6 Locales (s. u.).

## Verifikation
- `npx tsc --noEmit` grün; `npm run build` grün (statische Generierung aller Locales).
- Dev-Server: `/`, `/en`, `/ar`, `/ru` abrufen → korrektes `lang`/`dir`, übersetzte Inhalte, hreflang-Tags vorhanden, FAQ-`FAQPage`-JSON-LD je Locale, Sprachumschalter funktioniert.
- Arabisch: Layout-Spiegelung visuell prüfen (Rand-Spalten, Footer, Bericht-Rahmen).
- Bestätigen, dass **Bericht-Daten + generierte Briefe deutsch bleiben** (Ergebnis-/Brief-Flow im MOCK gegenprüfen).

## Risiken / offene Punkte
- **Rechtstext-Übersetzungen** (auch EN) sind unverbindlich; deutsche Fassung maßgeblich – Hinweis sichtbar einbauen. Vor Launch juristisch/muttersprachlich prüfen.
- **TR/AR/RU/UK = KI-Entwurf** → Muttersprachler-Review vor Launch (Launch ist ohnehin geblockt → Zeit vorhanden).
- **API-Fehlertexte bleiben deutsch** (Follow-up: Error-Codes).
- **OG-Bild-Schriften** für nicht-lateinische Sprachen (s. o.).
- Aufwand real groß (Routing-Umbau + ~10 Komponenten + 6 Sprachdateien + RTL) – `writing-plans` zerlegt in Tasks; Phase 1 zuerst abnahmefähig.
