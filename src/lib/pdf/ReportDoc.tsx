import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { AnalysisResult } from "@/types";

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 10, lineHeight: 1.4, fontFamily: "Helvetica", color: "#111" },
  h1: { fontSize: 18, marginBottom: 8, fontFamily: "Helvetica-Bold" },
  summary: { marginBottom: 16, color: "#333" },
  item: { marginBottom: 12, paddingBottom: 12, borderBottom: "1pt solid #ddd" },
  title: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  meta: { color: "#555", marginBottom: 2 },
});

export function ReportDoc({ result }: { result: AnalysisResult }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>Prüfbericht Nebenkostenabrechnung</Text>
        <Text style={s.summary}>{result.summary}</Text>
        {result.errors.map((e, i) => (
          <View key={i} style={s.item}>
            <Text style={s.title}>{i + 1}. {e.title}</Text>
            <Text style={s.meta}>Einschätzung: {e.confidence} · {e.category === "direct" ? "sofort angreifbar" : "Belegeinsicht"}</Text>
            {e.legalBasis ? <Text style={s.meta}>Rechtsgrundlage: {e.legalBasis}</Text> : null}
            {e.potentialEur != null ? <Text style={s.meta}>Potenzial: {e.potentialEur.toFixed(2)} €</Text> : null}
            <Text>{e.description}</Text>
            {e.evidence ? <Text style={s.meta}>Beleg: {e.evidence}</Text> : null}
            {e.actionText ? <Text style={s.meta}>Empfehlung: {e.actionText}</Text> : null}
          </View>
        ))}
      </Page>
    </Document>
  );
}
