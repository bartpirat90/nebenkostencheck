import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearPreview, isPreviewData, loadPreview, PREVIEW_STORAGE_KEY, savePreview } from "@/lib/previewStorage";
import { PreviewData } from "@/types";

const valid: PreviewData = {
  id: "abc",
  errorCount: 2,
  errorTitles: ["Grundsteuer", "Hausmeister"],
  hasDirect: true,
  hasReview: false,
};

describe("isPreviewData", () => {
  it("akzeptiert eine vollständige Vorschau", () => {
    expect(isPreviewData(valid)).toBe(true);
  });
  it("lehnt null, Strings und Objekte ohne Pflichtfelder ab", () => {
    expect(isPreviewData(null)).toBe(false);
    expect(isPreviewData("abc")).toBe(false);
    expect(isPreviewData({ id: "abc" })).toBe(false);
    expect(isPreviewData({ ...valid, errorTitles: "keine Liste" })).toBe(false);
    expect(isPreviewData({ ...valid, errorTitles: [1, 2] })).toBe(false);
  });
});

describe("sessionStorage-Helfer", () => {
  // Node hat keine sessionStorage – minimaler In-Memory-Ersatz.
  let store: Map<string, string>;
  beforeEach(() => {
    store = new Map();
    (globalThis as { sessionStorage?: unknown }).sessionStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    };
  });
  afterEach(() => {
    delete (globalThis as { sessionStorage?: unknown }).sessionStorage;
  });

  it("speichert und lädt die Vorschau für die passende ID", () => {
    savePreview(valid);
    expect(store.has(PREVIEW_STORAGE_KEY)).toBe(true);
    expect(loadPreview("abc")).toEqual(valid);
  });
  it("liefert null bei fremder ID, fehlender ID oder kaputtem JSON", () => {
    savePreview(valid);
    expect(loadPreview("xyz")).toBeNull();
    expect(loadPreview(null)).toBeNull();
    store.set(PREVIEW_STORAGE_KEY, "{nicht json");
    expect(loadPreview("abc")).toBeNull();
  });
  it("liefert null bei manipulierter Struktur", () => {
    store.set(PREVIEW_STORAGE_KEY, JSON.stringify({ id: "abc" }));
    expect(loadPreview("abc")).toBeNull();
  });
  it("clearPreview entfernt den Eintrag", () => {
    savePreview(valid);
    clearPreview();
    expect(loadPreview("abc")).toBeNull();
  });
  it("wirft nicht, wenn sessionStorage fehlt", () => {
    delete (globalThis as { sessionStorage?: unknown }).sessionStorage;
    expect(() => savePreview(valid)).not.toThrow();
    expect(loadPreview("abc")).toBeNull();
    expect(() => clearPreview()).not.toThrow();
  });
});
