import { describe, expect, it } from "vitest";
import { classifyError } from "@/lib/errors";

describe("classifyError", () => {
  it("Timeout → eigene Meldung", () => {
    expect(classifyError("Request timed out.")).toContain("zu lange gedauert");
  });
  it("Überlastung → ausgelastet", () => {
    expect(classifyError("529 overloaded_error")).toContain("ausgelastet");
  });
  it("Netzwerk → Verbindung", () => {
    expect(classifyError("fetch failed")).toContain("Verbindung");
  });
  it("unbekannt → generisch", () => {
    expect(classifyError("irgendwas")).toContain("unbekannter Fehler");
  });
});
