import { describe, expect, it } from "vitest";
import { toLocale, localePrefix, stripeLocale } from "@/lib/checkoutLocale";

describe("toLocale", () => {
  it("falls back to de for an unknown locale string", () => {
    expect(toLocale("xx")).toBe("de");
  });
  it("falls back to de for an empty string", () => {
    expect(toLocale("")).toBe("de");
  });
  it("falls back to de for a non-string value", () => {
    expect(toLocale(42)).toBe("de");
    expect(toLocale(undefined)).toBe("de");
  });
  it("accepts a known locale", () => {
    expect(toLocale("ar")).toBe("ar");
  });
});

describe("localePrefix", () => {
  it("returns empty prefix for de (default locale)", () => {
    expect(localePrefix("de")).toBe("");
  });
  it("returns /<locale> for every other locale", () => {
    expect(localePrefix("en")).toBe("/en");
    expect(localePrefix("ar")).toBe("/ar");
    expect(localePrefix("uk")).toBe("/uk");
  });
});

describe("stripeLocale", () => {
  it("falls back to auto for uk and ar (nicht im Stripe-Enum)", () => {
    expect(stripeLocale("uk")).toBe("auto");
    expect(stripeLocale("ar")).toBe("auto");
  });
  it("passes through supported locales", () => {
    expect(stripeLocale("de")).toBe("de");
    expect(stripeLocale("en")).toBe("en");
    expect(stripeLocale("tr")).toBe("tr");
    expect(stripeLocale("ru")).toBe("ru");
  });
});
