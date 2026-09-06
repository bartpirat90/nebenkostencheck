/**
 * Namespaces aus messages/*.json, die ausschließlich in Server-Komponenten
 * übersetzt werden (getTranslations) und deshalb nicht in den
 * NextIntlClientProvider gehören. Spart Client-Payload auf jeder Seite –
 * `legal` allein sind ~8 KB Rechtstext pro HTML-Dokument.
 *
 * Wer einen dieser Namespaces in einer "use client"-Komponente braucht, muss
 * ihn hier entfernen – sonst wirft useTranslations zur Laufzeit MISSING_MESSAGE.
 */
export const SERVER_ONLY_NAMESPACES = ["legal", "notFound"] as const;

export function isServerOnlyNamespace(namespace: string): boolean {
  return (SERVER_ONLY_NAMESPACES as readonly string[]).includes(namespace);
}
