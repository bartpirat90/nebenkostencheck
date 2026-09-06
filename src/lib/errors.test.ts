import { describe, expect, it } from "vitest";
import { classifyErrorCode } from "@/lib/errors";

describe("classifyErrorCode", () => {
  it("Timeout → TIMEOUT (inkl. SDK-Text 'Request timed out.')", () => {
    expect(classifyErrorCode("Request timed out.")).toBe("TIMEOUT");
    expect(classifyErrorCode("fetch timeout after 45000ms")).toBe("TIMEOUT");
  });
  it("Überlastung/Rate-Limit → OVERLOADED (SDK-Texte 529 und 429)", () => {
    expect(classifyErrorCode("529 overloaded_error")).toBe("OVERLOADED");
    expect(classifyErrorCode("503 Service Unavailable")).toBe("OVERLOADED");
    expect(
      classifyErrorCode("429 This request would exceed your organization's rate limit of 50 requests per minute")
    ).toBe("OVERLOADED");
  });
  it("Netzwerk → NETWORK (inkl. SDK-Text 'Connection error.')", () => {
    expect(classifyErrorCode("fetch failed")).toBe("NETWORK");
    expect(classifyErrorCode("connect ECONNREFUSED 127.0.0.1:443")).toBe("NETWORK");
    expect(classifyErrorCode("Connection error.")).toBe("NETWORK");
  });
  it("unbekannt → UNKNOWN", () => {
    expect(classifyErrorCode("irgendwas")).toBe("UNKNOWN");
    expect(classifyErrorCode("")).toBe("UNKNOWN");
  });
});
