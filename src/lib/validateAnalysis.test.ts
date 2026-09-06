import { describe, expect, it } from "vitest";
import { normalizeAnalysis } from "@/lib/validateAnalysis";

const valid = {
  summary: "Alles geprüft.",
  errors: [
    {
      title: "Verwaltungsgebühr",
      description: "Nicht umlagefähig.",
      confidence: "sicher",
      category: "direct",
      potentialEur: 45,
      legalBasis: "§ 1 Abs. 2 BetrKV",
      actionText: "Streichen lassen.",
      evidence: "Position 'Verwaltungsgebühr'.",
    },
  ],
  totalPotentialEur: 45,
  contactData: { tenantName: "Max", landlordName: "Vermieter GmbH" },
};

describe("normalizeAnalysis", () => {
  it("passes a valid result through", () => {
    const r = normalizeAnalysis(valid);
    expect(r).not.toBeNull();
    expect(r!.errors).toHaveLength(1);
    expect(r!.errors[0].potentialEur).toBe(45);
    expect(r!.contactData?.tenantName).toBe("Max");
  });

  it("rejects non-objects and missing summary", () => {
    expect(normalizeAnalysis(null)).toBeNull();
    expect(normalizeAnalysis("text")).toBeNull();
    expect(normalizeAnalysis([])).toBeNull();
    expect(normalizeAnalysis({ errors: [] })).toBeNull();
  });

  it("defaults unknown enum values instead of crashing the client", () => {
    const r = normalizeAnalysis({
      ...valid,
      errors: [{ ...valid.errors[0], confidence: "hoch", category: "sonstiges" }],
    });
    expect(r!.errors[0].confidence).toBe("unsicher");
    expect(r!.errors[0].category).toBe("needs_review");
  });

  it("coerces missing/invalid errors array to []", () => {
    expect(normalizeAnalysis({ summary: "x" })!.errors).toEqual([]);
    expect(normalizeAnalysis({ summary: "x", errors: "nope" })!.errors).toEqual([]);
  });

  it("drops error items without title or description", () => {
    const r = normalizeAnalysis({ summary: "x", errors: [{ title: "nur Titel" }, valid.errors[0]] });
    expect(r!.errors).toHaveLength(1);
  });

  it("nulls non-numeric or absurd amounts", () => {
    const r = normalizeAnalysis({
      ...valid,
      totalPotentialEur: "999",
      errors: [{ ...valid.errors[0], potentialEur: 1e9 }],
    });
    expect(r!.totalPotentialEur).toBeNull();
    expect(r!.errors[0].potentialEur).toBeNull();
  });

  it("caps list length and string length", () => {
    const many = Array.from({ length: 50 }, () => valid.errors[0]);
    const r = normalizeAnalysis({ summary: "s".repeat(5000), errors: many });
    expect(r!.errors.length).toBe(30);
    expect(r!.summary.length).toBe(2000);
  });

  it("strips unknown keys (prompt injection cannot add fields)", () => {
    const r = normalizeAnalysis({ ...valid, paid: true, evil: "<script>" }) as unknown as Record<string, unknown>;
    expect(r.paid).toBeUndefined();
    expect(r.evil).toBeUndefined();
  });
});
