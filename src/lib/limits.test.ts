import { describe, expect, it } from "vitest";
import * as limits from "@/lib/limits";
import {
  LETTER_PER_ID_PER_DAY,
  LETTER_PER_IP_PER_DAY,
  SEND_PDF_PER_ID_PER_DAY,
  SEND_PDF_PER_IP_PER_DAY,
} from "@/lib/limits";

describe("limits", () => {
  it("exportiert nur positive Integer", () => {
    for (const [key, value] of Object.entries(limits)) {
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
