import path from "node:path";
import { Font } from "@react-pdf/renderer";

export const PDF_FONT = "NotoSans";
const dir = path.join(process.cwd(), "src/lib/pdf/fonts");
let registered = false;

/** Einmalig registrieren – Latin-Ext + Kyrillisch (Helvetica-WinAnsi kann kein ş/ğ/İ, kein Кириллица). */
export function registerPdfFonts(): void {
  if (registered) return;
  Font.register({
    family: PDF_FONT,
    fonts: [
      { src: path.join(dir, "NotoSans-Regular.ttf"), fontWeight: "normal" },
      { src: path.join(dir, "NotoSans-Bold.ttf"), fontWeight: "bold" },
    ],
  });
  Font.registerHyphenationCallback((w) => [w]); // keine Silbentrennung in Briefen
  registered = true;
}
