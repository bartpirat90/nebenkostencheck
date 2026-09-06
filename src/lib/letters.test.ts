import { describe, expect, it } from "vitest";
import { isLetterType, LETTER_FILENAMES } from "@/lib/letters";

describe("letters", () => {
  it("recognises the three letter types only", () => {
    expect(isLetterType("objection")).toBe(true);
    expect(isLetterType("document_review")).toBe(true);
    expect(isLetterType("combined")).toBe(true);
    expect(isLetterType("foo")).toBe(false);
    expect(isLetterType(undefined)).toBe(false);
  });
  it("maps every type to a fixed .pdf filename", () => {
    expect(LETTER_FILENAMES.objection).toBe("Widerspruch.pdf");
    expect(LETTER_FILENAMES.document_review).toBe("Belegeinsicht.pdf");
    expect(LETTER_FILENAMES.combined).toBe("Widerspruch_und_Belegeinsicht.pdf");
  });
});
