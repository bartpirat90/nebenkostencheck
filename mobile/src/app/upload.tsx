import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { analyzeDocument } from "../api/analyze";
import { isFileTooLarge, MAX_FILE_MB } from "../lib/fileGuard";
import { LoadingIndicator } from "../components/LoadingIndicator";
import { Icon } from "../components/Icon";
import { colors, spacing, radius } from "../theme";

// Bei Bildern liefert der ImagePicker base64 direkt mit (kein Dateilesen nötig);
// bei PDF lesen wir die Cache-Datei per File-API. base64 ist daher optional.
type Picked = { uri: string; mediaType: string; fileName: string; base64?: string };

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
      base64: true,
    });
    if (res.canceled) return;
    const a = res.assets[0];
    setPicked({
      uri: a.uri,
      mediaType: a.mimeType ?? "image/jpeg",
      fileName: a.fileName ?? "foto.jpg",
      base64: a.base64 ?? undefined,
    });
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Kamera", "Bitte erlaube den Kamerazugriff, um ein Foto aufzunehmen.");
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8, base64: true });
    if (res.canceled) return;
    const a = res.assets[0];
    setPicked({
      uri: a.uri,
      mediaType: a.mimeType ?? "image/jpeg",
      fileName: a.fileName ?? "foto.jpg",
      base64: a.base64 ?? undefined,
    });
  }

  function tooLarge(byteSize: number): boolean {
    if (isFileTooLarge(byteSize)) {
      Alert.alert(
        "Datei zu groß",
        `Die Datei ist zu groß (max. ${MAX_FILE_MB} MB). Bitte lade nur die Nebenkostenabrechnung hoch.`,
      );
      return true;
    }
    return false;
  }

  async function submit() {
    if (!picked) return;
    try {
      let base64 = picked.base64;
      if (base64) {
        // Bild: base64 liegt schon vor (ImagePicker). Größe aus base64-Länge.
        if (tooLarge(Math.floor((base64.length * 3) / 4))) return;
        setLoading(true);
      } else {
        // PDF: aus der Cache-Datei lesen (neue File-API, SDK 56).
        const file = new File(picked.uri);
        if (tooLarge(file.size ?? 0)) return;
        setLoading(true);
        base64 = await file.base64();
      }
      const result = await analyzeDocument(base64, picked.mediaType, picked.fileName);
      setLoading(false);
      if (!result.ok) {
        Alert.alert("Hinweis", result.message);
        return;
      }
      router.push({ pathname: "/result", params: { data: JSON.stringify(result.data) } });
    } catch {
      setLoading(false);
      Alert.alert(
        "Hinweis",
        "Die Datei konnte nicht gelesen werden. Bitte versuche es mit einer anderen Datei.",
      );
    }
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
        <Icon name="document" size={22} color={colors.text} />
        <Text style={styles.choiceText}>PDF auswählen</Text>
      </Pressable>
      <Pressable style={styles.choice} onPress={pickPhoto}>
        <Icon name="image" size={22} color={colors.text} />
        <Text style={styles.choiceText}>Foto aus Galerie</Text>
      </Pressable>
      <Pressable style={styles.choice} onPress={takePhoto}>
        <Icon name="camera" size={22} color={colors.text} />
        <Text style={styles.choiceText}>Foto aufnehmen</Text>
      </Pressable>

      {picked && (
        <View style={styles.selected}>
          <Icon
            name={picked.mediaType.startsWith("image") ? "image" : "document"}
            size={18}
            color={colors.textMuted}
          />
          <Text style={styles.selectedText} numberOfLines={1}>
            {picked.fileName}
          </Text>
          <Pressable
            onPress={() => setPicked(null)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Auswahl entfernen"
            style={styles.removeBtn}
          >
            <Icon name="close" size={16} color={colors.text} />
          </Pressable>
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
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  choiceText: { color: colors.text, fontSize: 16 },
  selected: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  selectedText: { color: colors.text, fontSize: 14, flex: 1 },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.border,
  },
  submit: { backgroundColor: colors.accentFrom, borderRadius: radius.lg, padding: spacing.md, alignItems: "center", marginTop: spacing.lg },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
