import { View, Text, StyleSheet } from "react-native";
import type { ErrorItem } from "../types";
import { confidence, spacing, radius } from "../theme";

function formatEur(value: number): string {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

export function ErrorCard({ error }: { error: ErrorItem }) {
  const c = confidence[error.confidence];
  return (
    <View style={[styles.card, { backgroundColor: c.bg, borderColor: c.border }]}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: c.dot }]} />
        <View style={styles.body}>
          <View style={styles.headerRow}>
            <View style={styles.titleWrap}>
              <Text style={[styles.title, { color: c.text }]}>{error.title}</Text>
              <Text style={[styles.confLabel, { color: c.text }]}>{c.label.toUpperCase()}</Text>
            </View>
            {error.potentialEur != null && (
              <Text style={[styles.eur, { color: c.text }]}>~{formatEur(error.potentialEur)}</Text>
            )}
          </View>
          <Text style={styles.desc}>{error.description}</Text>
          {error.legalBasis ? (
            <Text style={styles.meta}>Rechtsgrundlage: {error.legalBasis}</Text>
          ) : null}
          {error.evidence ? (
            <Text style={styles.evidence}>Beleg im Dokument: „{error.evidence}"</Text>
          ) : null}
          {error.actionText ? (
            <Text style={styles.action}>
              <Text style={styles.actionStrong}>Empfehlung: </Text>
              {error.actionText}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  row: { flexDirection: "row", gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  body: { flex: 1 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  titleWrap: { flex: 1 },
  title: { fontSize: 14, fontWeight: "700" },
  confLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1, marginTop: 2, opacity: 0.7 },
  eur: { fontSize: 13, fontWeight: "700" },
  desc: { color: "#94A3B8", fontSize: 14, marginTop: spacing.sm, lineHeight: 20 },
  meta: { color: "#64748B", fontSize: 12, marginTop: spacing.sm },
  evidence: { color: "#475569", fontSize: 12, marginTop: 4, fontStyle: "italic" },
  action: { color: "#94A3B8", fontSize: 12, marginTop: spacing.sm, lineHeight: 18 },
  actionStrong: { color: "#CBD5E1", fontWeight: "700" },
});
