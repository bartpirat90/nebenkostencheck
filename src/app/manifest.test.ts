import { describe, expect, it } from "vitest";
import manifest from "./manifest";
import { APPLE_ICON_SIZE as appleIconSize, APPLE_ICON_TYPE as appleIconType, BRAND_INK } from "@/lib/seo";

describe("manifest", () => {
  const result = manifest();

  it("hat Name, Kurzname, Startpfad und Standalone-Modus", () => {
    expect(result.name).toBe("Nebenkostencheck");
    expect(result.short_name?.length).toBeLessThanOrEqual(12); // Android-Homescreen-Label
    expect(result.start_url).toBe("/");
    expect(result.display).toBe("standalone");
  });

  it("nutzt die Markenfarbe für Hintergrund und Theme (dieselbe Konstante wie viewport.themeColor)", () => {
    // viewport.themeColor im [locale]-Layout bezieht BRAND_INK aus derselben
    // Quelle; das Layout selbst lässt sich hier nicht importieren (next/font, CSS).
    expect(result.background_color).toBe(result.theme_color);
    expect(result.theme_color).toBe(BRAND_INK);
    expect(BRAND_INK).toMatch(/^#[0-9A-F]{6}$/);
  });

  it("verweist auf das Apple-Icon mit den Maßen und dem Typ aus apple-icon.tsx", () => {
    const apple = result.icons?.find((i) => i.src === "/apple-icon");
    expect(apple).toBeDefined();
    expect(apple?.sizes).toBe(`${appleIconSize.width}x${appleIconSize.height}`);
    expect(apple?.type).toBe(appleIconType);
  });

  it("bietet das SVG-Icon für beliebige Größen an", () => {
    const svg = result.icons?.find((i) => i.src === "/icon.svg");
    expect(svg?.sizes).toBe("any");
    expect(svg?.type).toBe("image/svg+xml");
  });
});
