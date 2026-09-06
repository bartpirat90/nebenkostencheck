// API-Basis-URL. Standard ist die Produktionsdomain. Für Entwicklung gegen die
// Vercel-Branch-Preview (kostenlos dank MOCK_ANALYSIS=true) in mobile/.env setzen:
//   EXPO_PUBLIC_API_BASE_URL=https://nebenkostencheck-git-monetarisierung-bartpirat-s-projects.vercel.app
// Siehe mobile/.env.example.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://nebenkostencheck24.de";
