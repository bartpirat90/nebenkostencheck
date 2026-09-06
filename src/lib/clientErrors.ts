"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";
import { MAX_FILE_MB } from "@/lib/limits";

/** Minimale next-intl-Schnittstelle, die `resolveApiError` benötigt (leicht zu mocken). */
export interface ApiErrorTranslator {
  has(key: string): boolean;
  (key: string, values?: Record<string, string | number | Date>): string;
}

/**
 * Reine Mapping-Logik hinter `useApiErrorMessage`: übersetzt eine API-Fehlerantwort
 * anhand ihres `code`, fällt bei unbekanntem/fehlendem Code auf den Server-Text
 * (oder den übergebenen Fallback) zurück. Ausgelagert, damit sie ohne React
 * Testing Library unit-testbar ist.
 */
export function resolveApiError(
  t: ApiErrorTranslator,
  body: { error?: string; code?: string } | null | undefined,
  fallback: string
): string {
  const code = body?.code;
  if (code && t.has(code)) return t(code, { mb: MAX_FILE_MB });
  return body?.error || fallback;
}

/** Übersetzt eine API-Fehlerantwort; unbekannte Codes fallen auf den Server-Text zurück. */
export function useApiErrorMessage() {
  const t = useTranslations("apiErrors");
  // Stabile Referenz: die Funktion landet in useCallback-Dependency-Listen der Aufrufer.
  return useCallback(
    (body: { error?: string; code?: string } | null | undefined, fallback: string): string =>
      resolveApiError(t, body, fallback),
    [t]
  );
}
