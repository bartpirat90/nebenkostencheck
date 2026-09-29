import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { colors, spacing } from "../theme";

type Kind = "analysis" | "letter" | "report";

interface Preset {
  steps: readonly string[];
  stepMs: number;
  hint?: string;
  slowHint?: string;
}

/**
 * Wartezeiten wie im Web (messages/de.json, upload/letter.loadingSubtitle):
 * Die Prüfung dauert mit Sonnet 5 rund 35–45 s, ein Brief 13–15 s. Die
 * Schritte der Prüfung reichen deshalb bis ~36 s und bleiben dann auf dem
 * letzten stehen, statt im Kreis zu laufen und Fortschritt vorzutäuschen.
 */
const PRESETS: Record<Kind, Preset> = {
  analysis: {
    steps: [
      "Dokument wird gelesen…",
      "Positionen werden erfasst…",
      "Rechtsgrundlagen werden geprüft…",
      "Erstattungspotenzial wird berechnet…",
      "Bericht wird zusammengestellt…",
    ],
    stepMs: 9_000,
    hint: "Das dauert meist 30 bis 60 Sekunden.",
    slowHint: "Umfangreiche Abrechnungen brauchen etwas länger. Bitte lass die App geöffnet.",
  },
  letter: {
    steps: ["Schreiben wird formuliert…", "PDF wird erzeugt…"],
    stepMs: 8_000,
    hint: "Das dauert meist 10 bis 20 Sekunden.",
  },
  report: {
    steps: ["Bericht wird geladen…"],
    stepMs: 0,
  },
};

/** Ab hier liegt die Prüfung über dem Üblichen; ohne Hinweis brechen Nutzer ab. */
const SLOW_HINT_AFTER_MS = 60_000;

export function LoadingIndicator({ kind }: { kind: Kind }) {
  const { steps, stepMs, hint, slowHint } = PRESETS[kind];
  const [i, setI] = useState(0);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (i >= steps.length - 1) return;
    const t = setTimeout(() => setI((p) => p + 1), stepMs);
    return () => clearTimeout(t);
  }, [i, steps.length, stepMs]);

  useEffect(() => {
    if (!slowHint) return;
    const t = setTimeout(() => setSlow(true), SLOW_HINT_AFTER_MS);
    return () => clearTimeout(t);
  }, [slowHint]);

  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={colors.accentTo} />
      <Text style={styles.step}>{steps[i]}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {slow && slowHint ? (
        <Text style={styles.hint} accessibilityLiveRegion="polite">
          {slowHint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xl, paddingHorizontal: spacing.lg },
  step: { color: colors.text, fontSize: 16 },
  hint: { color: colors.textMuted, fontSize: 14, textAlign: "center" },
});
