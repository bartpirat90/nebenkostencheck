# Nebenkostencheck — Android-App (Expo)

Native Android-App für Nebenkostencheck (React Native + **Expo SDK 56**, TypeScript).
Reiner Client zum bestehenden Vercel-Backend — siehe die ausführliche Doku:
**[`../docs/MOBILE-APP.md`](../docs/MOBILE-APP.md)**.

> ⚠️ SDK 56 ist neu — vor Codeänderungen die versionierten Docs prüfen:
> https://docs.expo.dev/versions/v56.0.0/ (siehe `AGENTS.md`).

## Schnellstart

```bash
npm install

# Echtes Handy: Expo Go (Play Store) installieren, dann QR scannen
npx expo start

# Android-Emulator (Setup-Details siehe docs/MOBILE-APP.md):
#   1) & E:\Android\emulator\emulator.exe -avd Pixel_7
#   2) npx expo start   → im Terminal 'a' drücken
```

## Tests

```bash
npx tsc --noEmit   # Typprüfung
npx jest           # Unit-Tests
```

## Struktur

Quellcode unter `src/` (Routen in `src/app/`). Überblick, Architektur, SDK-56-Fallen
und Stand siehe **[`../docs/MOBILE-APP.md`](../docs/MOBILE-APP.md)**.
