import { Document, Page, Text, View, StyleSheet, Svg, Path } from "@react-pdf/renderer";
import { AnalysisResult } from "@/types";
import {
  LOGO_VIEWBOX,
  LOGO_SHIELD_PATH,
  LOGO_CHECK_PATH,
  LOGO_GREEN_ON_LIGHT,
} from "@/lib/logo";
import { PDF_FONT, registerPdfFonts } from "./fonts";

registerPdfFonts();

const s = StyleSheet.create({
  page: { paddingHorizontal: 48, paddingTop: 40, paddingBottom: 56, fontSize: 9.5, lineHeight: 1.4, fontFamily: PDF_FONT, color: "#111" },
  // Briefkopf
  header: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  wordmark: { fontSize: 14, fontWeight: "bold", color: "#0C1016", marginLeft: 7, letterSpacing: -0.3 },
  eyebrow: { marginLeft: "auto", fontSize: 8, color: "#6B7280", letterSpacing: 0.5 },
  rule: { borderBottomWidth: 1, borderBottomColor: "#E5E7EB", marginTop: 8, marginBottom: 18 },
  h1: { fontSize: 17, marginBottom: 8, fontWeight: "bold", color: "#0C1016" },
  summary: { marginBottom: 16, color: "#333" },
  item: { marginBottom: 12, paddingBottom: 12, borderBottom: "1pt solid #ddd" },
  title: { fontSize: 12, fontWeight: "bold", marginBottom: 3 },
  meta: { color: "#555", marginBottom: 2 },
  footer: { position: "absolute", bottom: 28, left: 48, right: 48, fontSize: 8, color: "#9CA3AF", textAlign: "center" },
});

function LogoMark() {
  return (
    <Svg width={22} height={22} viewBox={LOGO_VIEWBOX}>
      <Path d={LOGO_SHIELD_PATH} stroke={LOGO_GREEN_ON_LIGHT} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d={LOGO_CHECK_PATH} stroke={LOGO_GREEN_ON_LIGHT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function ReportDoc({ result }: { result: AnalysisResult }) {
  const dateStr = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <LogoMark />
          <Text style={s.wordmark}>Nebenkostencheck</Text>
          <Text style={s.eyebrow}>Prüfbericht · {dateStr}</Text>
        </View>
        <View style={s.rule} fixed />

        <Text style={s.h1}>Prüfbericht Nebenkostenabrechnung</Text>
        <Text style={s.summary}>{result.summary}</Text>
        {result.errors.map((e, i) => (
          <View key={i} style={s.item} wrap={false}>
            <Text style={s.title}>{i + 1}. {e.title}</Text>
            <Text style={s.meta}>Einschätzung: {e.confidence} · {e.category === "direct" ? "sofort angreifbar" : "Belegeinsicht"}</Text>
            {e.legalBasis ? <Text style={s.meta}>Rechtsgrundlage: {e.legalBasis}</Text> : null}
            {e.potentialEur != null ? <Text style={s.meta}>Potenzial: {e.potentialEur.toFixed(2)} €</Text> : null}
            <Text>{e.description}</Text>
            {e.evidence ? <Text style={s.meta}>Beleg: {e.evidence}</Text> : null}
            {e.actionText ? <Text style={s.meta}>Empfehlung: {e.actionText}</Text> : null}
          </View>
        ))}

        <Text style={s.footer} fixed>
          Automatisierte Einschätzung ohne Gewähr · keine Rechtsberatung · nebenkostencheck24.de
        </Text>
      </Page>
    </Document>
  );
}
