import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

const PDF_OPTS = { mimeType: "application/pdf", UTI: "com.adobe.pdf" as const };

/** Schreibt ein base64-PDF in den App-Cache und öffnet das native Teilen-Sheet. */
export async function savePdfAndShare(base64: string, filename: string): Promise<void> {
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Teilen ist auf diesem Gerät nicht verfügbar.");
  }
  await Sharing.shareAsync(uri, PDF_OPTS);
}

/** Lädt ein PDF von einer URL in den Cache und öffnet das native Teilen-Sheet. */
export async function downloadAndShare(url: string, filename: string): Promise<void> {
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  const { status } = await FileSystem.downloadAsync(url, uri);
  if (status !== 200) {
    throw new Error("Das PDF konnte nicht geladen werden. Bitte versuche es erneut.");
  }
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Teilen ist auf diesem Gerät nicht verfügbar.");
  }
  await Sharing.shareAsync(uri, PDF_OPTS);
}
