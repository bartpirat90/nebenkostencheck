import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { colors, spacing } from "../theme";

const STEPS = [
  "Dokument wird gelesen…",
  "Posten werden geprüft…",
  "Mögliche Fehler werden bewertet…",
];

export function LoadingIndicator() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % STEPS.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={colors.accentTo} />
      <Text style={styles.text}>{STEPS[i]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xl },
  text: { color: colors.textMuted, fontSize: 16 },
});
