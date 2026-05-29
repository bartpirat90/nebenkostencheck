import { AnalysisResult } from "@/types";

/**
 * Beispiel-Daten für den Testmodus (MOCK_ANALYSIS=true).
 * Enthält bewusst BEIDE Fehlerkategorien (direct + needs_review),
 * damit alle UI-Pfade inkl. kombiniertem Schreiben testbar sind –
 * ohne echten (kostenpflichtigen) Claude-Aufruf.
 */
export const MOCK_ANALYSIS_RESULT: AnalysisResult = {
  summary:
    "Beispiel-Analyse (Testmodus): Die Abrechnung für den Zeitraum 01.01.2024–31.12.2024 wurde geprüft. Es wurden mehrere auffällige Positionen mit Erstattungspotenzial gefunden.",
  errors: [
    {
      title: "Warmwasser ohne Wärmemengenzähler",
      description:
        "Die Wärmemenge für Warmwasser wird per Formel berechnet statt mit einem Wärmemengenzähler gemessen. Seit dem 31.12.2013 ist die Installation eines Zählers vorgeschrieben (§ 9 Abs. 2 HeizkV). Es besteht ein Kürzungsrecht von 15 % der Heizkosten (§ 12 HeizkV).",
      confidence: "sicher",
      category: "direct",
      potentialEur: 87.5,
      legalBasis: "§ 9 Abs. 2, § 12 HeizkV",
      actionText: "Kürzung von 15 % der Heizkosten geltend machen.",
      evidence: "Position 'Anteilige Heizkosten', Formelberechnung mit Faktor 2,5 × V × (tw-10).",
    },
    {
      title: "Verwaltungsgebühr nicht umlagefähig",
      description:
        "Es wird eine explizite Position 'Verwaltungsgebühr' abgerechnet. Reine Verwaltungskosten sind nach § 1 Abs. 2 BetrKV nicht auf den Mieter umlagefähig.",
      confidence: "wahrscheinlich",
      category: "direct",
      potentialEur: 45.0,
      legalBasis: "§ 1 Abs. 2 BetrKV",
      actionText:
        "Streichung der Position fordern. Falls es sich um einen Sammelbegriff für Hausmeister/Reinigung handelt: nicht relevant.",
      evidence: "Position 'Verwaltungsgebühr: 45,00 €'.",
    },
    {
      title: "Auffällig hohe Versicherungskosten",
      description:
        "Die Versicherungsbeiträge erscheinen ungewöhnlich hoch. Möglicherweise ist eine nicht umlagefähige Elementarversicherung enthalten. Zur Klärung ist eine Belegeinsicht erforderlich.",
      confidence: "wahrscheinlich",
      category: "needs_review",
      potentialEur: null,
      legalBasis: "§ 259 BGB",
      actionText:
        "Belege zur Versicherung anfordern und auf nicht umlagefähige Bestandteile prüfen.",
      evidence: "Position 'Versicherung: 412,00 €'.",
    },
  ],
  totalPotentialEur: 132.5,
  directPotentialEur: 132.5,
  reviewPotentialEur: null,
  totalPotentialLabel: null,
  contactData: {
    tenantName: "Max Mustermann",
    tenantAddress: "Musterstraße 1, 12345 Musterstadt",
    landlordName: "Vermietung Beispiel GmbH",
    landlordAddress: "Hauptstraße 99, 12345 Musterstadt",
    contractNumber: "MV-2024-0815",
    billingPeriod: "01.01.2024 - 31.12.2024",
  },
};

/** Beispiel-Brieftext für den Testmodus. */
export const MOCK_LETTER =
  "[Testmodus – Beispielschreiben]\n\n" +
  "Max Mustermann\nMusterstraße 1\n12345 Musterstadt\n\n" +
  "Vermietung Beispiel GmbH\nHauptstraße 99\n12345 Musterstadt\n\n" +
  "Musterstadt, [Datum]\n\n" +
  "Betreff: Widerspruch gegen die Nebenkostenabrechnung 2024\n\n" +
  "Sehr geehrte Damen und Herren,\n\n" +
  "gegen Ihre Nebenkostenabrechnung für den Zeitraum 01.01.2024–31.12.2024 lege ich " +
  "fristgerecht Widerspruch ein. Folgende Positionen beanstande ich:\n\n" +
  "1. Warmwasser ohne Wärmemengenzähler (§ 9 Abs. 2, § 12 HeizkV) – Kürzungsrecht 15 %.\n" +
  "2. Verwaltungsgebühr (§ 1 Abs. 2 BetrKV) – nicht umlagefähig.\n\n" +
  "Ich fordere Sie auf, die Abrechnung entsprechend zu korrigieren. Hierfür setze ich " +
  "eine Frist von 14 Tagen.\n\n" +
  "Mit freundlichen Grüßen\nMax Mustermann\n\n" +
  "(Dies ist ein Beispieltext aus dem Testmodus – im Echtbetrieb wird ein auf Ihre " +
  "Abrechnung zugeschnittenes Schreiben erstellt.)";
