import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { PreviewData } from "../types";
import { fetchReport, startCheckout, NOT_UNLOCKED_CODE } from "../api/report";
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

  const [locked, setLocked] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const openFullReport = async (id: string) => {
    setReportLoading(true);
    setErrorMsg(null);
    setCheckoutError(null);
    const res = await fetchReport(id);
    setReportLoading(false);
    if (res.ok) {
      router.push({ pathname: "/report", params: { id } });
      return;
    }
    if (res.code === NOT_UNLOCKED_CODE) {
      // Zweiter Versuch nach „Ich habe bezahlt“: der Stripe-Webhook kann ein paar
      // Sekunden brauchen – ohne Meldung sähe der Nutzer nur einen Spinner, der
      // verschwindet, und wüsste nicht, ob überhaupt etwas passiert ist.
      if (locked) {
        setErrorMsg("Die Zahlung ist noch nicht bestätigt. Bitte in ein paar Sekunden erneut versuchen.");
      }
      setLocked(true);
    } else {
      setErrorMsg(res.message);
    }
  };

  const unlockReport = async (id: string) => {
    setCheckoutLoading(true);
    setCheckoutError(null);
    let url: string;
    try {
      url = await startCheckout(id);
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : "Zahlung konnte nicht gestartet werden.");
      setCheckoutLoading(false);
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      setCheckoutError("Der Browser konnte nicht geöffnet werden. Bitte versuche es erneut.");
    } finally {
      setCheckoutLoading(false);
    }
  };

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

      {locked ? (
        <View style={styles.paywall}>
          <Text style={styles.paywallTitle}>Bericht freischalten</Text>
          <Text style={styles.muted}>
            Der vollständige Bericht mit Musterschreiben kostet einmalig 9,90 €. Die Zahlung läuft
            sicher im Browser.
          </Text>
          {checkoutError && <Text style={styles.errorText}>{checkoutError}</Text>}
          <Pressable
            style={styles.primaryBtn}
            onPress={() => unlockReport(preview.id)}
            disabled={checkoutLoading}
          >
            {checkoutLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Bericht freischalten (9,90 €)</Text>
            )}
          </Pressable>
          <Pressable
            style={styles.outlineBtn}
            onPress={() => openFullReport(preview.id)}
            disabled={reportLoading}
          >
            {reportLoading ? (
              <ActivityIndicator color={colors.textMuted} />
            ) : (
              <Text style={styles.outlineBtnText}>Ich habe bezahlt – Bericht laden</Text>
            )}
          </Pressable>
          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
        </View>
      ) : (
        <Pressable
          style={styles.paywall}
          onPress={() => openFullReport(preview.id)}
          disabled={reportLoading}
        >
          {reportLoading ? (
            <ActivityIndicator color={colors.accentTo} />
          ) : (
            <>
              <Text style={styles.paywallTitle}>Vollständigen Bericht anzeigen</Text>
              <Text style={styles.muted}>
                Detaillierte Begründung je Fehler, rechtliche Grundlage und fertige
                Schreiben zum Teilen.
              </Text>
            </>
          )}
        </Pressable>
      )}

      {!locked && errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
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
  primaryBtn: { backgroundColor: colors.accentFrom, borderRadius: radius.md, padding: spacing.md, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  outlineBtn: { borderColor: colors.border, borderWidth: 2, borderRadius: radius.md, padding: spacing.md, alignItems: "center" },
  outlineBtnText: { color: colors.textMuted, fontSize: 15, fontWeight: "700" },
  notice: { color: colors.yellow, fontSize: 20, fontWeight: "700", textAlign: "center" },
  muted: { color: colors.textMuted, fontSize: 15, textAlign: "center", lineHeight: 22 },
  errorText: { color: colors.red, fontSize: 14, textAlign: "center", lineHeight: 20 },
});
