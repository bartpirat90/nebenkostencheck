import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { AnalysisResult, ErrorItem, LetterType } from "../types";
import { fetchReport, reportPdfUrl } from "../api/report";
import { downloadAndShare } from "../lib/pdf";
import { ErrorCard } from "../components/ErrorCard";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { colors, spacing, radius } from "../theme";

function formatEur(value: number): string {
  return `${value.toFixed(2).replace(".", ",")} €`;
}
function sumPotential(errors: ErrorItem[]): number {
  return errors.reduce((s, e) => s + (e.potentialEur ?? 0), 0);
}

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setData(null);
    const res = await fetchReport(id);
    if (res.ok) setData(res.data);
    else setError(res.message);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>{error}</Text>
        <Pressable style={styles.retry} onPress={load}>
          <Text style={styles.retryText}>Erneut versuchen</Text>
        </Pressable>
      </View>
    );
  }
  if (!data) {
    return (
      <View style={styles.center}>
        <LoadingIndicator />
      </View>
    );
  }

  const directErrors = data.errors.filter((e) => e.category === "direct");
  const reviewErrors = data.errors.filter((e) => e.category === "needs_review");
  const directTotal = data.directPotentialEur ?? sumPotential(directErrors);
  const reviewTotal = data.reviewPotentialEur ?? sumPotential(reviewErrors);
  const total = data.totalPotentialEur ?? directTotal + reviewTotal;
  const hasErrors = data.errors.length > 0;

  const goLetter = (type: LetterType) =>
    router.push({
      pathname: "/letter",
      params: { id, type, contact: JSON.stringify(data.contactData ?? {}) },
    });

  const shareReportPdf = async () => {
    try {
      await downloadAndShare(reportPdfUrl(id), "Pruefbericht.pdf");
    } catch (e) {
      Alert.alert("Hinweis", e instanceof Error ? e.message : "Aktion fehlgeschlagen.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Geschätztes Erstattungspotenzial</Text>
        <Text style={styles.summaryValue}>{hasErrors ? formatEur(total) : "0 €"}</Text>
        {hasErrors && (
          <View style={styles.splitRow}>
            <View style={styles.splitCol}>
              <Text style={styles.splitLabel}>Sofort angreifbar</Text>
              <Text style={[styles.splitValue, { color: colors.green }]}>{formatEur(directTotal)}</Text>
              <Text style={styles.splitCount}>{directErrors.length} Punkt{directErrors.length !== 1 ? "e" : ""}</Text>
            </View>
            <View style={styles.splitCol}>
              <Text style={styles.splitLabel}>Nach Belegeinsicht</Text>
              <Text style={[styles.splitValue, { color: colors.yellow }]}>{formatEur(reviewTotal)}</Text>
              <Text style={styles.splitCount}>{reviewErrors.length} Punkt{reviewErrors.length !== 1 ? "e" : ""}</Text>
            </View>
          </View>
        )}
        {data.summary ? <Text style={styles.summaryText}>{data.summary}</Text> : null}
      </View>

      <Pressable style={styles.outlineBtn} onPress={shareReportPdf}>
        <Text style={styles.outlineBtnText}>Bericht als PDF teilen</Text>
      </Pressable>

      {/* Section A */}
      {directErrors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sofort angreifbar</Text>
          <Text style={styles.sectionSub}>Eindeutige Rechtsverstöße – direkter Widerspruch möglich</Text>
          {directErrors.map((e, i) => (
            <ErrorCard key={`d-${i}`} error={e} />
          ))}
          <Pressable style={styles.primaryBtn} onPress={() => goLetter("objection")}>
            <Text style={styles.primaryBtnText}>Widerspruch erstellen</Text>
          </Pressable>
        </View>
      )}

      {/* Section B */}
      {reviewErrors.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Belegeinsicht erforderlich</Text>
          <Text style={styles.sectionSub}>Verdacht auf Fehler – Belege beim Vermieter anfordern</Text>
          {reviewErrors.map((e, i) => (
            <ErrorCard key={`r-${i}`} error={e} />
          ))}
          <Pressable style={styles.secondaryBtn} onPress={() => goLetter("document_review")}>
            <Text style={styles.secondaryBtnText}>Belegeinsicht anfordern</Text>
          </Pressable>
        </View>
      )}

      {/* Combined */}
      {directErrors.length > 0 && reviewErrors.length > 0 && (
        <Pressable style={styles.outlineAccentBtn} onPress={() => goLetter("combined")}>
          <Text style={styles.outlineAccentText}>Kombiniertes Schreiben erstellen</Text>
        </Pressable>
      )}

      {!hasErrors && (
        <View style={styles.okBox}>
          <Text style={styles.okTitle}>Keine offensichtlichen Fehler gefunden</Text>
          <Text style={styles.okText}>
            Das bedeutet nicht, dass die Abrechnung fehlerfrei ist – bei Zweifeln lohnt sich eine rechtliche Prüfung.
          </Text>
        </View>
      )}

      {/* Disclaimer */}
      <Text style={styles.disclaimer}>
        Hinweis: Diese Analyse ist eine automatisierte Einschätzung ohne Rechtsverbindlichkeit und ersetzt keine
        anwaltliche Beratung. Beträge sind Schätzungen. Generierte Briefe sind Vorlagen und sollten vor dem
        Versand geprüft werden.
      </Text>

      <Pressable style={styles.outlineBtn} onPress={() => router.navigate("/")}>
        <Text style={styles.outlineBtnText}>Neue Abrechnung prüfen</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.md, backgroundColor: colors.bg, flexGrow: 1 },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", padding: spacing.xl, gap: spacing.md },
  muted: { color: colors.textMuted, fontSize: 15, textAlign: "center", lineHeight: 22 },
  retry: { backgroundColor: colors.accentFrom, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryText: { color: "#fff", fontWeight: "700" },
  summary: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  summaryLabel: { color: colors.textMuted, fontSize: 13 },
  summaryValue: { color: colors.accentTo, fontSize: 34, fontWeight: "800", marginTop: 4 },
  splitRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md, paddingTop: spacing.md, borderTopColor: colors.border, borderTopWidth: 1 },
  splitCol: { flex: 1 },
  splitLabel: { color: colors.textMuted, fontSize: 12 },
  splitValue: { fontSize: 18, fontWeight: "800", marginTop: 2 },
  splitCount: { color: "#475569", fontSize: 12 },
  summaryText: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: spacing.md, paddingTop: spacing.md, borderTopColor: colors.border, borderTopWidth: 1 },
  section: { gap: spacing.sm, marginTop: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  sectionSub: { color: "#64748B", fontSize: 12, marginBottom: spacing.xs },
  primaryBtn: { backgroundColor: colors.accentFrom, borderRadius: radius.md, padding: spacing.md, alignItems: "center", marginTop: spacing.xs },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  secondaryBtn: { backgroundColor: colors.border, borderRadius: radius.md, padding: spacing.md, alignItems: "center", marginTop: spacing.xs },
  secondaryBtnText: { color: "#CBD5E1", fontSize: 15, fontWeight: "700" },
  outlineAccentBtn: { borderColor: colors.accentFrom, borderWidth: 2, borderRadius: radius.md, padding: spacing.md, alignItems: "center" },
  outlineAccentText: { color: colors.accentTo, fontSize: 15, fontWeight: "700" },
  outlineBtn: { borderColor: colors.border, borderWidth: 2, borderRadius: radius.md, padding: spacing.md, alignItems: "center" },
  outlineBtnText: { color: colors.textMuted, fontSize: 15, fontWeight: "700" },
  okBox: { backgroundColor: "#0F2B1F", borderColor: "#166534", borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs },
  okTitle: { color: colors.green, fontSize: 16, fontWeight: "700" },
  okText: { color: "#86EFAC", fontSize: 14, lineHeight: 20 },
  disclaimer: { color: "#64748B", fontSize: 12, lineHeight: 18, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
});
