import { LetterType } from "@/types";

export const LETTER_TYPES: readonly LetterType[] = ["objection", "document_review", "combined"];

export function isLetterType(v: unknown): v is LetterType {
  return typeof v === "string" && (LETTER_TYPES as readonly string[]).includes(v);
}

/** Feste Dateinamen – der Client darf keinen eigenen wählen. */
export const LETTER_FILENAMES: Record<LetterType, string> = {
  objection: "Widerspruch.pdf",
  document_review: "Belegeinsicht.pdf",
  combined: "Widerspruch_und_Belegeinsicht.pdf",
};

// Betreffzeilen gehen an den (deutschen) Vermieter → bewusst Deutsch.
export const MAIL_SUBJECTS: Record<LetterType, string> = {
  objection: "Widerspruch gegen die Nebenkostenabrechnung",
  document_review: "Aufforderung zur Belegeinsicht",
  combined: "Widerspruch und Belegeinsicht – Nebenkostenabrechnung",
};
