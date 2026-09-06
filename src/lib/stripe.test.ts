import { describe, expect, it } from "vitest";
import { sessionUnlocksAnalysis } from "@/lib/stripe";

const base = {
  payment_status: "paid",
  metadata: { analysisId: "abc" },
  client_reference_id: "abc",
} as unknown as import("stripe").Stripe.Checkout.Session;

describe("sessionUnlocksAnalysis", () => {
  it("unlocks a paid session for its own analysis id", () => {
    expect(sessionUnlocksAnalysis(base, "abc")).toBe(true);
  });
  it("unlocks a 100% promo-code session (no_payment_required)", () => {
    expect(sessionUnlocksAnalysis({ ...base, payment_status: "no_payment_required" }, "abc")).toBe(true);
  });
  it("refuses unpaid sessions (Klarna/SEPA pending)", () => {
    expect(sessionUnlocksAnalysis({ ...base, payment_status: "unpaid" }, "abc")).toBe(false);
  });
  it("refuses a session that belongs to another analysis", () => {
    expect(sessionUnlocksAnalysis(base, "other")).toBe(false);
  });
  it("accepts client_reference_id when metadata is missing", () => {
    expect(sessionUnlocksAnalysis({ ...base, metadata: null }, "abc")).toBe(true);
  });
});
