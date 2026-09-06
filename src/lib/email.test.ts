import { describe, expect, it } from "vitest";
import { isValidEmail } from "@/lib/email";

describe("isValidEmail", () => {
  it("accepts one plain address", () => {
    expect(isValidEmail("max@example.de")).toBe(true);
    expect(isValidEmail("  first.last+tag@sub.example.co.uk ")).toBe(true);
  });
  it("rejects lists, headers and junk (no relay)", () => {
    expect(isValidEmail("a@x.de,b@y.de")).toBe(false);
    expect(isValidEmail("a@x.de; b@y.de")).toBe(false);
    expect(isValidEmail("Max <a@x.de>")).toBe(false);
    expect(isValidEmail("a@x.de\nBcc: b@y.de")).toBe(false);
    expect(isValidEmail("nope")).toBe(false);
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(42)).toBe(false);
    expect(isValidEmail("a@x.d")).toBe(false);
    expect(isValidEmail("a".repeat(250) + "@x.de")).toBe(false);
  });
});
