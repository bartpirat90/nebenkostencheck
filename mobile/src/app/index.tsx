import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Logo } from "../components/Logo";
import { colors, spacing, radius } from "../theme";

export default function HomeScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Logo size={72} />
      <Text style={styles.title}>Nebenkosten{"\n"}schnell geprüft</Text>
      <Text style={styles.subtitle}>
        Lade deine Abrechnung hoch und finde mögliche Fehler — geprüft nach
        aktuellem Mietrecht (BetrKV, HeizkV) und höchstrichterlicher
        BGH-Rechtsprechung.
      </Text>
      <Pressable onPress={() => router.push("/upload")} style={styles.ctaWrap}>
        <LinearGradient
          colors={[colors.accentFrom, colors.accentTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>Abrechnung prüfen</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: { color: colors.text, fontSize: 32, fontWeight: "800", textAlign: "center" },
  subtitle: { color: colors.textMuted, fontSize: 16, textAlign: "center", lineHeight: 24 },
  ctaWrap: { width: "100%", marginTop: spacing.md },
  cta: { paddingVertical: spacing.md, borderRadius: radius.lg, alignItems: "center" },
  ctaText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
