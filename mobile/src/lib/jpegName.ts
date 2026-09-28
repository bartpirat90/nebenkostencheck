/** Ersetzt die Endung durch .jpg, damit Dateiname und Inhalt nach dem Umrechnen zusammenpassen. */
export function toJpegName(fileName: string): string {
  const base = fileName.replace(/\.[^./\\]+$/, "");
  return `${base || "foto"}.jpg`;
}
