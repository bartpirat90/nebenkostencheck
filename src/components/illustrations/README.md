# Illustrationen

Vier Motive von [unDraw](https://undraw.co/) (Katerina Limpitsouni), inline als
React-Komponenten. Kein `public/`, kein `next/image`: nur inline greift
`currentColor` auf den Akzentflächen, sodass der Container per `text-accent`
die Akzentfarbe setzt.

| Komponente | unDraw-Motiv | Einsatz |
|---|---|---|
| `Receipt.tsx` | Receipt | Schritt 1 „Abrechnung hochladen" |
| `DocumentReview.tsx` | Document Review | Schritt 2 „Automatische Prüfung" |
| `MailSent.tsx` | Mail Sent | Schritt 3 „Widerspruch schicken" |
| `ApartmentRent.tsx` | Apartment rent | Sektion „Dein gutes Recht als Mieter" |

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
