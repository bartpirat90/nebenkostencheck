import { analyzeDocument } from "./analyze";
import type { PreviewData } from "../types";

const preview: PreviewData = {
  id: "abc",
  errorCount: 2,
  totalPotentialEur: 120,
  totalPotentialLabel: null,
  errorTitles: ["A", "B"],
  hasDirect: true,
  hasReview: false,
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe("analyzeDocument", () => {
  it("gibt bei 200 die PreviewData zurück", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => preview }) as unknown as typeof fetch;
    const res = await analyzeDocument("Zm9v", "application/pdf", "a.pdf");
    expect(res).toEqual({ ok: true, data: preview });
  });

  it("reicht die deutsche Server-Fehlermeldung durch", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, json: async () => ({ error: "Datei zu groß." }) }) as unknown as typeof fetch;
    const res = await analyzeDocument("x", "application/pdf", "a.pdf");
    expect(res).toEqual({ ok: false, message: "Datei zu groß." });
  });

  it("liefert eine Netzwerk-Meldung, wenn fetch wirft", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network")) as unknown as typeof fetch;
    const res = await analyzeDocument("x", "application/pdf", "a.pdf");
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.message).toMatch(/Verbindung fehlgeschlagen/);
  });
});
