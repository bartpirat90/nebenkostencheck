// API-Basis-URL. Dev zeigt auf die Preview mit MOCK_ANALYSIS=true (kostenlos),
// Prod später auf https://nebenkostencheck24.de. Override via EXPO_PUBLIC_API_BASE_URL.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  "https://nebenkostencheck-git-monetarisierung-bartpirat-s-projects.vercel.app";
