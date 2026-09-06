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
});
