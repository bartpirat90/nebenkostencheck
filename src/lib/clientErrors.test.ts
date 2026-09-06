import { describe, expect, it } from "vitest";
import { resolveApiError, ApiErrorTranslator } from "@/lib/clientErrors";

/** Minimaler next-intl-Mock: kennt nur die übergebenen Keys. */
function makeT(known: Record<string, string>): ApiErrorTranslator {
  const t = ((key: string) => known[key]) as ApiErrorTranslator;
  t.has = (key: string) => key in known;
  return t;
}

describe("resolveApiError", () => {
  it("übersetzt einen bekannten Code", () => {
    const t = makeT({ NOT_UNLOCKED: "Nicht freigeschaltet." });
    expect(resolveApiError(t, { error: "Nicht freigeschaltet.", code: "NOT_UNLOCKED" }, "Fallback")).toBe(
      "Nicht freigeschaltet."
    );
  });

  it("fällt bei unbekanntem Code auf den Server-Text zurück", () => {
    const t = makeT({ NOT_UNLOCKED: "Nicht freigeschaltet." });
    expect(resolveApiError(t, { error: "Server-Text", code: "SOME_NEW_CODE" }, "Fallback")).toBe("Server-Text");
  });

  it("fällt ohne Body auf den Fallback zurück", () => {
    const t = makeT({});
    expect(resolveApiError(t, null, "Fallback")).toBe("Fallback");
  });

  it("fällt bei fehlendem Code auf den Server-Text zurück", () => {
    const t = makeT({});
    expect(resolveApiError(t, { error: "Server-Text" }, "Fallback")).toBe("Server-Text");
  });
});
