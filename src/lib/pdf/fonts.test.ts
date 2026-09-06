import { createElement } from "react";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { LetterDoc } from "./LetterDoc";

/**
 * Entpackt alle Flate-Streams des PDFs (ToUnicode-CMaps, Inhaltsströme) und
 * liefert sie als latin1-Text. Die Offsets im latin1-String entsprechen 1:1 den
 * Byte-Offsets, daher kann direkt aus dem Buffer geschnitten werden.
 */
function inflatedStreams(buffer: Buffer): string {
  const text = buffer.toString("latin1");
  const re = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  const parts: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const start = m.index + m[0].indexOf(m[1]);
    const chunk = buffer.subarray(start, start + m[1].length);
    try {
      parts.push(inflateSync(chunk).toString("latin1"));
    } catch {
      parts.push(m[1]); // unkomprimierter Stream
    }
  }
  return parts.join("\n");
}

describe("PDF-Fonts (Noto Sans fuer Latin-Ext + Kyrillisch)", () => {
  it("bettet Noto Sans ein und bildet Sonderzeichen auf ihre Unicode-Codepunkte ab", async () => {
    const letter = "Sehr geehrte Frau Şçğüİ Іваненко,\nBetreff: Test\nЖ ő ł";
    // renderToBuffer erwartet ReactElement<DocumentProps> - createElement mit
    // den tatsaechlichen LetterDoc-Props ist strukturell enger, daher der Cast.
    const buffer = await renderToBuffer(
      createElement(LetterDoc, { letter }) as unknown as ReactElement<DocumentProps>,
    );

    expect(buffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
    const text = buffer.toString("latin1");
    // Mit den Standard-14-Fonts (Helvetica) bettet @react-pdf keine eigenen
    // Glyphen ein -> kein "FontFile2". Noto Sans wird als Subset eingebettet.
    expect(text).toContain("FontFile2");
    expect(text).toMatch(/BaseFont\s*\/[A-Z]{6}\+NotoSans-Regular/);
    // Die Betreff-Zeile ist fett -> auch der Bold-Schnitt muss eingebettet sein
    // (und zwar ueber die von `page` vererbte fontFamily, ohne eigene Angabe).
    expect(text).toMatch(/BaseFont\s*\/[A-Z]{6}\+NotoSans-Bold/);

    // Die ToUnicode-CMap des Subsets listet jeden verwendeten Codepunkt als
    // 4-stelliges Hex. Fehlt ein Glyph im Font, landet er als .notdef ohne
    // Codepunkt -> genau das wuerde hier auffallen.
    const streams = inflatedStreams(buffer);
    for (const [name, hex] of [
      ["ğ", "011f"],
      ["Ş", "015e"],
      ["İ", "0130"],
      ["І (kyrillisch)", "0406"],
      ["Ж", "0416"],
      ["ő", "0151"],
      ["ł", "0142"],
    ] as const) {
      expect(streams, `Codepunkt fuer ${name}`).toMatch(new RegExp(`<${hex}>`, "i"));
    }
  });
});
