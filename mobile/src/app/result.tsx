import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { PreviewData } from "../types";
import { colors, spacing, radius } from "../theme";

export default function ResultScreen() {
  const { data } = useLocalSearchParams<{ data: string }>();
  const router = useRouter();
  let preview: PreviewData | null = null;
  try {
    preview = JSON.parse(data);
  } catch {
    preview = null;
  }

  if (!preview) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Kein Ergebnis vorhanden.</Text>
      </View>
    );
  }

  if (preview.notAStatement) {
    return (
      <View style={styles.center}>
        <Text style={styles.notice}>Das sieht nicht nach einer Nebenkostenabrechnung aus</Text>
        <Text style={styles.muted}>Bitte lade die eigentliche Abrechnung als PDF oder Foto hoch.</Text>
      </View>
    );
  }

  const eur =
    preview.totalPotentialLabel ??
    (preview.totalPotentialEur != null ? `≈ ${preview.totalPotentialEur} €` : "—");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.statRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{preview.errorCount}</Text>
          <Text style={styles.statLabel}>mögliche Fehler</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{eur}</Text>
          <Text style={styles.statLabel}>Sparpotenzial</Text>
        </View>
      </View>

      <Text style={styles.heading}>Gefundene Punkte</Text>
      {preview.errorTitles.map((title, idx) => (
        <View key={idx} style={styles.item}>
          <Text style={styles.itemText}>• {title}</Text>
        </View>
      ))}

      {/* Im Demo führt diese Aktion direkt zum Bericht.
          Hier kommt später die Bezahlung dazwischen (Google Play Billing). */}
      <Pressable
        style={styles.paywall}
        onPress={() => router.push({ pathname: "/report", params: { id: preview.id } })}
      >
        <Text style={styles.paywallTitle}>Vollständigen Bericht anzeigen</Text>
        <Text style={styles.muted}>
          Detaillierte Begründung je Fehler, rechtliche Grundlage und fertige
          Schreiben zum Teilen.
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.md, backgroundColor: colors.bg, flexGrow: 1 },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center", padding: spacing.xl, gap: spacing.md },
  statRow: { flexDirection: "row", gap: spacing.md },
  statCard: { flex: 1, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, alignItems: "center" },
  statValue: { color: colors.text, fontSize: 26, fontWeight: "800" },
  statLabel: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  heading: { color: colors.text, fontSize: 20, fontWeight: "700", marginTop: spacing.md },
  item: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md },
  itemText: { color: colors.text, fontSize: 15 },
  paywall: { marginTop: spacing.lg, borderColor: colors.accentFrom, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  paywallTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  notice: { color: colors.yellow, fontSize: 20, fontWeight: "700", textAlign: "center" },
  muted: { color: colors.textMuted, fontSize: 15, textAlign: "center", lineHeight: 22 },
});
