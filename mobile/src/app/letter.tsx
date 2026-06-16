import { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import type { ContactData, LetterType, LetterPdfResponse } from "../types";
import { generateLetter } from "../api/report";
import { savePdfAndShare } from "../lib/pdf";
import { ContactForm } from "../components/ContactForm";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { colors, spacing, radius } from "../theme";

function parseContact(raw?: string): ContactData {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ContactData;
  } catch {
    return {};
  }
}

export default function LetterScreen() {
  const params = useLocalSearchParams<{ id: string; type: string; contact?: string }>();
  const id = params.id;
  const type = params.type as LetterType;

  const [contact, setContact] = useState<ContactData>(parseContact(params.contact));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LetterPdfResponse | null>(null);

  const create = async () => {
    setLoading(true);
    const res = await generateLetter(id, type, contact);
    setLoading(false);
    if (!res.ok) {
      Alert.alert("Hinweis", res.message);
      return;
    }
    setResult(res.data);
  };

  const share = async () => {
    if (!result) return;
    try {
      await savePdfAndShare(result.pdfBase64, result.filename);
    } catch (e) {
      Alert.alert("Hinweis", e instanceof Error ? e.message : "Teilen fehlgeschlagen.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <LoadingIndicator />
      </View>
    );
  }

  if (result) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Dein Schreiben ist fertig</Text>
        <View style={styles.preview}>
          <Text style={styles.previewText}>{result.letter}</Text>
        </View>
        <Pressable style={styles.primaryBtn} onPress={share}>
          <Text style={styles.primaryBtnText}>Als PDF teilen / speichern</Text>
        </Pressable>
        <Text style={styles.hint}>
          Über das Teilen-Menü kannst du das PDF per Mail senden, drucken oder speichern.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Kontaktdaten prüfen</Text>
      <Text style={styles.muted}>
        Diese Angaben erscheinen im Schreiben. Bitte ergänze fehlende Felder.
      </Text>
      <ContactForm contact={contact} onChange={setContact} />
      <Pressable style={styles.primaryBtn} onPress={create}>
        <Text style={styles.primaryBtnText}>PDF erstellen</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.md, backgroundColor: colors.bg, flexGrow: 1 },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: "center" },
  heading: { color: colors.text, fontSize: 22, fontWeight: "800" },
  muted: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  preview: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md },
  previewText: { color: colors.text, fontSize: 13, lineHeight: 20 },
  primaryBtn: { backgroundColor: colors.accentFrom, borderRadius: radius.lg, padding: spacing.md, alignItems: "center", marginTop: spacing.sm },
  primaryBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  hint: { color: colors.textMuted, fontSize: 13, textAlign: "center", lineHeight: 18 },
});
