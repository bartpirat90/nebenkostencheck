import { describe, expect, it } from "vitest";
import { API_ERRORS, apiError, ApiErrorCode } from "@/lib/apiErrors";
import { MAX_FILE_MB } from "@/lib/limits";
import de from "../../messages/de.json";
import en from "../../messages/en.json";
import tr from "../../messages/tr.json";
import ar from "../../messages/ar.json";
import ru from "../../messages/ru.json";
import uk from "../../messages/uk.json";

describe("API_ERRORS", () => {
  it("jeder Eintrag hat einen Status zwischen 400 und 599 und nicht-leeren Text", () => {
    for (const [code, [status, message]] of Object.entries(API_ERRORS)) {
      expect(status, `${code}: Status`).toBeGreaterThanOrEqual(400);
      expect(status, `${code}: Status`).toBeLessThanOrEqual(599);
      expect(message.trim().length, `${code}: Text`).toBeGreaterThan(0);
    }
  });

  it("jeder ApiErrorCode ist in allen sechs Sprachdateien unter apiErrors vorhanden", () => {
    const files = { de, en, tr, ar, ru, uk } as Record<string, { apiErrors?: Record<string, string> }>;
    for (const [locale, messages] of Object.entries(files)) {
      const apiErrors = messages.apiErrors ?? {};
      for (const code of Object.keys(API_ERRORS)) {
        expect(apiErrors, `apiErrors.${code} fehlt in ${locale}.json`).toHaveProperty(code);
        expect(apiErrors[code].trim().length, `apiErrors.${code} leer in ${locale}.json`).toBeGreaterThan(0);
      }
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
    expect(API_ERRORS.MISSING_ID[0]).toBe(400);
    const res = apiError("MISSING_ID", 500);
    expect(res.status).toBe(500);
  });

  it("FILE_TOO_LARGE nennt das Limit in MB im Fallback-Text", () => {
    expect(API_ERRORS.FILE_TOO_LARGE[1]).toContain(`${MAX_FILE_MB} MB`);
  });

  it("verwendet ansonsten den Default-Status des Codes", () => {
    const res = apiError("RATE_LIMITED");
    expect(res.status).toBe(429);
  });
});

// Nur zur Kompilierzeit: stellt sicher, dass ApiErrorCode exportiert wird.
const _typeCheck: ApiErrorCode = "UNKNOWN";
void _typeCheck;
