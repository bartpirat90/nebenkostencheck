import { describe, expect, it } from "vitest";
import { API_ERRORS, apiError, ApiErrorCode } from "@/lib/apiErrors";
import de from "../../messages/de.json";

describe("API_ERRORS", () => {
  it("jeder Eintrag hat einen Status zwischen 400 und 599 und nicht-leeren Text", () => {
    for (const [code, [status, message]] of Object.entries(API_ERRORS)) {
      expect(status, `${code}: Status`).toBeGreaterThanOrEqual(400);
      expect(status, `${code}: Status`).toBeLessThanOrEqual(599);
      expect(message.trim().length, `${code}: Text`).toBeGreaterThan(0);
    }
  });

  it("jeder ApiErrorCode ist als Key in messages/de.json apiErrors vorhanden", () => {
    const apiErrors = (de as { apiErrors?: Record<string, string> }).apiErrors ?? {};
    for (const code of Object.keys(API_ERRORS)) {
      expect(apiErrors, `apiErrors.${code} fehlt in de.json`).toHaveProperty(code);
    }
  });
});

describe("apiError", () => {
  it("NOT_UNLOCKED -> Status 402, Body { error, code }", async () => {
    const res = apiError("NOT_UNLOCKED");
    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body).toEqual({ error: API_ERRORS.NOT_UNLOCKED[1], code: "NOT_UNLOCKED" });
  });

  it("Status-Override ueberschreibt den Default", () => {
    const res = apiError("UNKNOWN", 500);
    expect(res.status).toBe(500);
  });

  it("verwendet ansonsten den Default-Status des Codes", () => {
    const res = apiError("RATE_LIMITED");
    expect(res.status).toBe(429);
  });
});

// Nur zur Kompilierzeit: stellt sicher, dass ApiErrorCode exportiert wird.
const _typeCheck: ApiErrorCode = "UNKNOWN";
void _typeCheck;
