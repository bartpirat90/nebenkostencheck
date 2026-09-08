import { describe, expect, it } from "vitest";
import { securityHeaders } from "../../security-headers.mjs";

function header(list: { key: string; value: string }[], key: string) {
  return list.find((h) => h.key === key)?.value;
}

describe("securityHeaders", () => {
  it("setzt die Basis-Header", () => {
    const h = securityHeaders(false);
    expect(header(h, "X-Frame-Options")).toBe("DENY");
    expect(header(h, "X-Content-Type-Options")).toBe("nosniff");
    expect(header(h, "Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(header(h, "Permissions-Policy")).toContain("camera=()");
    expect(header(h, "Strict-Transport-Security")).toContain("max-age=63072000");
  });
  it("CSP: Prod ohne unsafe-eval, Dev mit", () => {
    const prod = header(securityHeaders(false), "Content-Security-Policy")!;
    const dev = header(securityHeaders(true), "Content-Security-Policy")!;
    expect(prod).toContain("default-src 'self'");
    expect(prod).toContain("frame-ancestors 'none'");
    expect(prod).toContain("object-src 'none'");
    expect(prod).toContain("form-action 'self'");
    expect(prod).not.toContain("unsafe-eval");
    expect(dev).toContain("unsafe-eval");
  });
  it("CSP: vercel.live nur im Preview, Production bleibt eng", () => {
    const prod = header(securityHeaders(false), "Content-Security-Policy")!;
    const preview = header(securityHeaders(false, true), "Content-Security-Policy")!;
    expect(prod).not.toContain("vercel.live");
    expect(prod).not.toContain("frame-src");
    expect(preview).toContain("script-src 'self' 'unsafe-inline' https://vercel.live");
    expect(preview).toContain("connect-src 'self' https://vercel.live wss://ws-us3.pusher.com");
    expect(preview).toContain("frame-src 'self' https://vercel.live");
    // Die Toolbar darf die Policy nicht aufweichen, nur ergänzen.
    expect(preview).toContain("frame-ancestors 'none'");
    expect(preview).not.toContain("unsafe-eval");
  });
});
