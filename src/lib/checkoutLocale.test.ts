import { describe, expect, it } from "vitest";
import { toLocale, localePrefix, stripeLocale } from "@/lib/checkoutLocale";

describe("toLocale", () => {
  it("falls back to de for an unknown locale string", () => {
    expect(toLocale("xx")).toBe("de");
  });
  it("falls back to de for a non-string value", () => {
    expect(toLocale(42)).toBe("de");
  });
  it("accepts a known locale", () => {
    expect(toLocale("ar")).toBe("ar");
  });
});

describe("localePrefix", () => {
  it("returns empty prefix for de (default locale)", () => {
    expect(localePrefix("de")).toBe("");
  });
  it("returns /en for en", () => {
    expect(localePrefix("en")).toBe("/en");
  });
});

describe("stripeLocale", () => {
  it("falls back to auto for uk (Stripe hat kein Ukrainisch)", () => {
    expect(stripeLocale("uk")).toBe("auto");
  });
  it("returns tr for tr", () => {
    expect(stripeLocale("tr")).toBe("tr");
  });
});
