import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { LetterDoc } from "./LetterDoc";

describe("PDF-Fonts (Noto Sans fuer Latin-Ext + Kyrillisch)", () => {
  it("rendert einen Brief mit tuerkischen/kyrillischen Sonderzeichen als eingebettetes PDF", async () => {
    const letter = "Sehr geehrte Frau Şçğüİ Іваненко,\nBetreff: Test\nЖ ő ł";
    // renderToBuffer erwartet ReactElement<DocumentProps> - createElement mit
    // den tatsaechlichen LetterDoc-Props ist strukturell enger, daher der Cast.
    const buffer = await renderToBuffer(
      createElement(LetterDoc, { letter }) as unknown as ReactElement<DocumentProps>,
    );

    expect(buffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
    const text = buffer.toString("latin1");
    // Mit den Standard-14-Fonts (Helvetica) bettet @react-pdf keine eigenen
    // Glyphen ein -> kein "FontFile2" und das PDF bleibt winzig (~2 KB).
    // Noto Sans wird dagegen als Subset eingebettet (deutlich > 5 KB).
    expect(text).toContain("FontFile2");
    expect(text).toMatch(/BaseFont\s*\/[A-Z]{6}\+NotoSans-(Regular|Bold)/);
    expect(buffer.length).toBeGreaterThan(5_000);
  });
});
