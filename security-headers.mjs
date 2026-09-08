// Die Vercel-Toolbar (Kommentare, Feedback) lädt Skripte von vercel.live und
// spricht per WebSocket mit Pusher. Ohne diese Freigaben blockiert unsere CSP
// die Toolbar in jedem Branch-Preview. In Production bleibt die Liste leer,
// damit die enge Policy dort unangetastet bleibt.
const VERCEL_TOOLBAR = {
  script: " https://vercel.live",
  connect: " https://vercel.live wss://ws-us3.pusher.com",
  img: " https://vercel.live https://vercel.com",
  font: " https://vercel.live https://assets.vercel.com",
  style: " https://vercel.live",
  frame: " https://vercel.live",
};

export function securityHeaders(isDev, isPreview = false) {
  const t = isPreview ? VERCEL_TOOLBAR : { script: "", connect: "", img: "", font: "", style: "", frame: "" };
  const csp = [
    "default-src 'self'",
    // Next.js injiziert Inline-Bootstrap-Scripts; HMR braucht im Dev eval.
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${t.script}`,
    `style-src 'self' 'unsafe-inline'${t.style}`,
    `img-src 'self' data: blob:${t.img}`,
    `font-src 'self' data:${t.font}`,
    `connect-src 'self'${t.connect}`,
    // Ohne frame-src gilt default-src 'self'; die Toolbar öffnet ein iframe von
    // vercel.live, deshalb nur im Preview eine eigene Direktive.
    ...(isPreview ? [`frame-src 'self'${t.frame}`] : []),
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
  return [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    // Ergebnis-URL trägt ?id=<uuid> - nie an Dritte durchreichen.
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
    { key: "Strict-Transport-Security", value: "max-age=63072000" },
  ];
}
