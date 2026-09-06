import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("manifest", () => {
  const result = manifest();

  it("sets name and short_name", () => {
    expect(result.name).toBe("Nebenkostencheck");
    expect(result.short_name).toBe("NK-Check");
  });

  it("starts at the site root in standalone display mode", () => {
    expect(result.start_url).toBe("/");
    expect(result.display).toBe("standalone");
  });

  it("uses the dark ink brand color for background and theme", () => {
    expect(result.background_color).toBe("#0C1016");
    expect(result.theme_color).toBe("#0C1016");
  });

  it("lists the svg icon and the apple-icon png", () => {
    expect(result.icons).toEqual([
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ]);
  });
});
