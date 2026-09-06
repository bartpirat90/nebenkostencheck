import { fetchReport, generateLetter, reportPdfUrl, startCheckout, NOT_UNLOCKED_CODE } from "./report";
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

  it("gibt bei 402 den Code NOT_UNLOCKED durch, damit der Client die Sperre erkennt", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Nicht freigeschaltet.", code: "NOT_UNLOCKED" }),
      }) as unknown as typeof fetch;
    const res = await fetchReport("abc");
    expect(res).toEqual({ ok: false, message: "Nicht freigeschaltet.", code: NOT_UNLOCKED_CODE });
  });
});

describe("startCheckout", () => {
  it("gibt bei 200 die Checkout-URL zurück", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ url: "https://checkout.stripe.com/xyz" }) }) as unknown as typeof fetch;
    const url = await startCheckout("abc");
    expect(url).toBe("https://checkout.stripe.com/xyz");
  });

  it("wirft bei 429 einen Fehler mit dem Server-Text", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Zu viele Zahlungsversuche. Bitte in ein paar Minuten erneut versuchen." }),
    }) as unknown as typeof fetch;
    await expect(startCheckout("abc")).rejects.toThrow(
      "Zu viele Zahlungsversuche. Bitte in ein paar Minuten erneut versuchen.",
    );
  });

  it("wirft eine Netzwerk-Meldung, wenn fetch wirft", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("net")) as unknown as typeof fetch;
    await expect(startCheckout("abc")).rejects.toThrow(/Verbindung fehlgeschlagen/);
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
