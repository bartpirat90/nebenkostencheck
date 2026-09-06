import { describe, expect, it } from "vitest";
import * as limits from "@/lib/limits";
import {
  LETTER_PER_ID_PER_DAY,
  LETTER_PER_IP_PER_DAY,
  SEND_PDF_PER_ID_PER_DAY,
  SEND_PDF_PER_IP_PER_DAY,
} from "@/lib/limits";

describe("limits", () => {
  // Alle Rate-Limit-Konstanten (Namensmuster *_PER_*) müssen ganze, positive
  // Zahlen sein – ein versehentliches 0 oder 0.5 würde Nutzer aussperren.
  it("alle *_PER_*-Limits sind positive Integer", () => {
    const rateLimits = Object.entries(limits).filter(([key]) => key.includes("_PER_"));
    expect(rateLimits.length).toBeGreaterThan(0);
    for (const [key, value] of rateLimits) {
      expect(Number.isInteger(value), `${key} sollte ein Integer sein`).toBe(true);
      expect((value as number) > 0, `${key} sollte positiv sein`).toBe(true);
    }
  });

  it("Brief-Limit pro ID ist strenger als pro IP", () => {
    expect(LETTER_PER_ID_PER_DAY).toBeLessThan(LETTER_PER_IP_PER_DAY);
  });

  it("PDF-Mailversand-Limit pro ID ist strenger als pro IP", () => {
    expect(SEND_PDF_PER_ID_PER_DAY).toBeLessThan(SEND_PDF_PER_IP_PER_DAY);
  });
});
