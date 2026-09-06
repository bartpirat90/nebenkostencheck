import { describe, expect, it } from "vitest";
import { isMockEnabled } from "@/lib/mock";

describe("isMockEnabled", () => {
  it("is false when MOCK_ANALYSIS is unset", () => {
    expect(isMockEnabled({})).toBe(false);
  });
  it("is true when MOCK_ANALYSIS=true outside production", () => {
    expect(isMockEnabled({ MOCK_ANALYSIS: "true" })).toBe(true);
    expect(isMockEnabled({ MOCK_ANALYSIS: "true", VERCEL_ENV: "preview" })).toBe(true);
  });
  it("is ALWAYS false in Vercel production, even with MOCK_ANALYSIS=true", () => {
    expect(isMockEnabled({ MOCK_ANALYSIS: "true", VERCEL_ENV: "production" })).toBe(false);
  });
  it("ignores other values", () => {
    expect(isMockEnabled({ MOCK_ANALYSIS: "1" })).toBe(false);
    expect(isMockEnabled({ MOCK_ANALYSIS: "TRUE" })).toBe(false);
  });
});
