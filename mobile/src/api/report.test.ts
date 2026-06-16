import { fetchReport, generateLetter, reportPdfUrl } from "./report";
import type { AnalysisResult, LetterPdfResponse } from "../types";

const report: AnalysisResult = {
  summary: "S",
  errors: [
    { title: "A", description: "d", confidence: "sicher", category: "direct", potentialEur: 10 },
  ],
  totalPotentialEur: 10,
};

afterEach(() => jest.restoreAllMocks());

describe("fetchReport", () => {
  it("gibt bei 200 den AnalysisResult zurück", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => report }) as unknown as typeof fetch;
    const res = await fetchReport("abc");
    expect(res).toEqual({ ok: true, data: report });
  });

  it("reicht die deutsche Server-Fehlermeldung durch", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, json: async () => ({ error: "Abgelaufen." }) }) as unknown as typeof fetch;
    const res = await fetchReport("abc");
    expect(res).toEqual({ ok: false, message: "Abgelaufen." });
  });

  it("liefert eine Netzwerk-Meldung, wenn fetch wirft", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("net")) as unknown as typeof fetch;
    const res = await fetchReport("abc");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toMatch(/Verbindung fehlgeschlagen/);
  });
});

describe("generateLetter", () => {
  it("gibt bei 200 die LetterPdfResponse zurück", async () => {
    const letter: LetterPdfResponse = { letter: "Text", pdfBase64: "AAAA", filename: "Widerspruch.pdf" };
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => letter }) as unknown as typeof fetch;
    const res = await generateLetter("abc", "objection", {});
    expect(res).toEqual({ ok: true, data: letter });
  });

  it("reicht Server-Fehler durch", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, json: async () => ({ error: "Keine Punkte." }) }) as unknown as typeof fetch;
    const res = await generateLetter("abc", "objection", {});
    expect(res).toEqual({ ok: false, message: "Keine Punkte." });
  });
});

describe("reportPdfUrl", () => {
  it("baut die URL mit id", () => {
    expect(reportPdfUrl("abc")).toMatch(/\/api\/generate-report\?id=abc$/);
  });
});
