import { Image } from "expo-image";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { visionSize, VISION_MAX_EDGE_PX } from "./visionSize";
import { toJpegName } from "./jpegName";

/** JPEG-Qualität wie im Web: 0,82 hält Zahlen und Kleingedrucktes lesbar. */
export const IMAGE_QUALITY = 0.82;

/**
 * Obergrenze beim Dekodieren. Ein 200-MP-Foto bräuchte voll dekodiert rund
 * 800 MB Speicher und brächte die App zum Absturz; expo-image verkleinert
 * deshalb schon beim Laden. Die doppelte Zielkante lässt dem letzten
 * Verkleinerungsschritt genug Pixel für scharfe Schrift.
 */
const LOAD_MAX_PX = VISION_MAX_EDGE_PX * 2;

export type PreparedImage = {
  base64: string;
  mediaType: "image/jpeg";
  fileName: string;
  width: number;
  height: number;
};

/**
 * Bringt ein Foto auf die Größe, die Claude tatsächlich ansieht, und kodiert
 * es als JPEG. Aus einem 12-MP-Handyfoto (3–6 MB) werden so wenige hundert KB –
 * die Upload-Grenze spielt für Fotos damit keine Rolle mehr, und Claude sieht
 * dieselben Pixel wie vorher.
 */
export async function prepareImage(uri: string, fileName: string): Promise<PreparedImage> {
  const loaded = await Image.loadAsync(uri, { maxWidth: LOAD_MAX_PX, maxHeight: LOAD_MAX_PX });
  const refs: { release(): void }[] = [loaded];
  try {
    // Einmal durch den Manipulator, um die echten Pixelmaße zu erfahren:
    // expo-image meldet die Größe des Drawables, und die kann je nach
    // Bildschirmdichte von den Bitmap-Pixeln abweichen.
    const decoded = await ImageManipulator.manipulate(loaded).renderAsync();
    refs.push(decoded);
    const size = visionSize(decoded.width, decoded.height);
    const context = ImageManipulator.manipulate(decoded);
    if (size.width !== decoded.width || size.height !== decoded.height) context.resize(size);
    const output = await context.renderAsync();
    refs.push(output);
    const saved = await output.saveAsync({ format: SaveFormat.JPEG, compress: IMAGE_QUALITY, base64: true });
    if (!saved.base64) throw new Error("JPEG ohne base64");
    return {
      base64: saved.base64,
      mediaType: "image/jpeg",
      fileName: toJpegName(fileName),
      width: saved.width,
      height: saved.height,
    };
  } finally {
    // Native Bitmaps sofort freigeben, nicht erst beim nächsten GC-Lauf.
    refs.forEach((ref) => ref.release());
  }
}
