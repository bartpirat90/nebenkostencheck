import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { analyzeDocument } from "../api/analyze";
import { isFileTooLarge, MAX_FILE_MB } from "../lib/fileGuard";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { colors, spacing, radius } from "../theme";

type Picked = { uri: string; mediaType: string; fileName: string };

export default function UploadScreen() {
  const router = useRouter();
  const [picked, setPicked] = useState<Picked | null>(null);
  const [loading, setLoading] = useState(false);

  async function pickPdf() {
    const res = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    if (res.canceled) return;
    const a = res.assets[0];
    setPicked({ uri: a.uri, mediaType: a.mimeType ?? "application/pdf", fileName: a.name });
  }

  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (res.canceled) return;
    const a = res.assets[0];
    setPicked({ uri: a.uri, mediaType: a.mimeType ?? "image/jpeg", fileName: a.fileName ?? "foto.jpg" });
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Kamera", "Bitte erlaube den Kamerazugriff, um ein Foto aufzunehmen.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (res.canceled) return;
    const a = res.assets[0];
    setPicked({ uri: a.uri, mediaType: a.mimeType ?? "image/jpeg", fileName: a.fileName ?? "foto.jpg" });
  }

  async function submit() {
    if (!picked) return;
    const file = new File(picked.uri);
    const byteSize = file.size ?? 0;
    if (isFileTooLarge(byteSize)) {
      Alert.alert(
        "Datei zu groß",
        `Die Datei ist zu groß (max. ${MAX_FILE_MB} MB). Bitte lade nur die Nebenkostenabrechnung hoch.`,
      );
      return;
    }
    setLoading(true);
    const base64 = await file.base64();
    const result = await analyzeDocument(base64, picked.mediaType, picked.fileName);
    setLoading(false);
    if (!result.ok) {
      Alert.alert("Hinweis", result.message);
      return;
    }
    router.push({ pathname: "/result", params: { data: JSON.stringify(result.data) } });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <LoadingIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Abrechnung auswählen</Text>
      <Text style={styles.hint}>PDF oder Foto deiner Nebenkostenabrechnung (max. {MAX_FILE_MB} MB).</Text>

      <Pressable style={styles.choice} onPress={pickPdf}>
        <Text style={styles.choiceText}>📄  PDF auswählen</Text>
      </Pressable>
      <Pressable style={styles.choice} onPress={pickPhoto}>
        <Text style={styles.choiceText}>🖼️  Foto aus Galerie</Text>
      </Pressable>
      <Pressable style={styles.choice} onPress={takePhoto}>
        <Text style={styles.choiceText}>📷  Foto aufnehmen</Text>
      </Pressable>

      {picked && (
        <View style={styles.selected}>
          <Text style={styles.selectedText} numberOfLines={1}>
            Ausgewählt: {picked.fileName}
          </Text>
        </View>
      )}

      <Pressable
        onPress={submit}
        disabled={!picked}
        style={[styles.submit, !picked && styles.submitDisabled]}
      >
        <Text style={styles.submitText}>Prüfen</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, gap: spacing.md, backgroundColor: colors.bg, flexGrow: 1 },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: "center" },
  heading: { color: colors.text, fontSize: 24, fontWeight: "800" },
  hint: { color: colors.textMuted, fontSize: 14, marginBottom: spacing.sm },
  choice: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  choiceText: { color: colors.text, fontSize: 16 },
  selected: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  selectedText: { color: colors.textMuted, fontSize: 14 },
  submit: { backgroundColor: colors.accentFrom, borderRadius: radius.lg, padding: spacing.md, alignItems: "center", marginTop: spacing.lg },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
