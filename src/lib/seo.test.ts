import { describe, expect, it } from "vitest";
import { localeUrl, pageAlternates, OG_LOCALES } from "@/lib/seo";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/constants";

describe("localeUrl", () => {
  it("returns the bare site URL for the default locale without a path", () => {
    expect(localeUrl("de")).toBe(SITE_URL);
  });
  it("omits the prefix for the default locale", () => {
    expect(localeUrl("de", "/impressum")).toBe(`${SITE_URL}/impressum`);
  });
  it("prefixes non-default locales", () => {
    expect(localeUrl("ar", "/agb")).toBe(`${SITE_URL}/ar/agb`);
    expect(localeUrl("en")).toBe(`${SITE_URL}/en`);
  });
});

describe("pageAlternates", () => {
  it("canonicalises a legal page for the default locale without a prefix", () => {
    expect(pageAlternates("de", "/impressum").canonical).toBe(`${SITE_URL}/impressum`);
  });
  it("canonicalises a legal page for a non-default locale with a prefix", () => {
    expect(pageAlternates("en", "/impressum").canonical).toBe(`${SITE_URL}/en/impressum`);
  });
  it("lists every locale in languages, keeping the page path", () => {
    const { languages } = pageAlternates("en", "/agb");
    expect(languages.ar).toBe(`${SITE_URL}/ar/agb`);
    expect(languages.de).toBe(`${SITE_URL}/agb`);
    for (const l of routing.locales) expect(languages[l]).toBeTruthy();
  });
  it("points x-default at the German version of the same page", () => {
    expect(pageAlternates("ru", "/datenschutz").languages["x-default"]).toBe(
      `${SITE_URL}/datenschutz`,
    );
    expect(pageAlternates("ru").languages["x-default"]).toBe(SITE_URL);
  });
  it("defaults the path to the start page", () => {
    expect(pageAlternates("tr").canonical).toBe(`${SITE_URL}/tr`);
  });
});

describe("OG_LOCALES", () => {
  it("maps every routing locale to an og:locale code", () => {
    for (const l of routing.locales) expect(OG_LOCALES[l]).toMatch(/^[a-z]{2}_[A-Z]{2}$/);
  });
});
