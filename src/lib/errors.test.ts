import { describe, expect, it } from "vitest";
import { classifyErrorCode } from "@/lib/errors";

describe("classifyErrorCode", () => {
  it("Timeout → TIMEOUT", () => {
    expect(classifyErrorCode("Request timed out.")).toBe("TIMEOUT");
    expect(classifyErrorCode("fetch timeout after 45000ms")).toBe("TIMEOUT");
  });
  it("Überlastung → OVERLOADED", () => {
    expect(classifyErrorCode("529 overloaded_error")).toBe("OVERLOADED");
    expect(classifyErrorCode("503 Service Unavailable")).toBe("OVERLOADED");
  });
  it("Netzwerk → NETWORK", () => {
    expect(classifyErrorCode("fetch failed")).toBe("NETWORK");
    expect(classifyErrorCode("connect ECONNREFUSED 127.0.0.1:443")).toBe("NETWORK");
  });
  it("unbekannt → UNKNOWN", () => {
    expect(classifyErrorCode("irgendwas")).toBe("UNKNOWN");
    expect(classifyErrorCode("")).toBe("UNKNOWN");
  });
});
