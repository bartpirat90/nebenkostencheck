/**
 * JSON-Schema der Analyse für Structured Outputs (output_config.format).
 * Die API garantiert damit parsebares JSON in genau dieser Form; die
 * inhaltliche Härtung (Längen, Beträge, Enums) übernimmt weiterhin
 * normalizeAnalysis, weil das Schema keine Wertebereiche prüft.
 *
 * Summen fehlen hier bewusst: Sie rechnet normalizeAnalysis aus den
 * Einzelbeträgen, damit das Modell nicht nebenbei addieren muss.
 */
const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: "null" }] });

const errorItem = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "description",
    "confidence",
    "category",
    "potentialEur",
    "legalBasis",
    "actionText",
    "evidence",
  ],
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    confidence: { type: "string", enum: ["sicher", "wahrscheinlich", "unsicher"] },
    category: { type: "string", enum: ["direct", "needs_review"] },
    potentialEur: nullable({ type: "number" }),
    legalBasis: nullable({ type: "string" }),
    actionText: { type: "string" },
    evidence: { type: "string" },
  },
};

const contactData = {
  type: "object",
  additionalProperties: false,
  required: [
    "tenantName",
    "tenantAddress",
    "landlordName",
    "landlordAddress",
    "contractNumber",
    "billingPeriod",
  ],
  properties: {
    tenantName: nullable({ type: "string" }),
    tenantAddress: nullable({ type: "string" }),
    landlordName: nullable({ type: "string" }),
    landlordAddress: nullable({ type: "string" }),
    contractNumber: nullable({ type: "string" }),
    billingPeriod: nullable({ type: "string" }),
  },
};

export const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["notAStatement", "summary", "errors", "totalPotentialLabel", "contactData"],
  properties: {
    notAStatement: { type: "boolean" },
    summary: { type: "string" },
    errors: { type: "array", items: errorItem },
    totalPotentialLabel: nullable({ type: "string", enum: ["hoch", "mittel", "niedrig"] }),
    contactData,
  },
};
