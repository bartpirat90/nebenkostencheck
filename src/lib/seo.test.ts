import { describe, expect, it } from "vitest";
import { localeUrl, pageAlternates, pageMetadata, toLocale, OG_LOCALES } from "@/lib/seo";
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
  it("maps every routing locale to the expected og:locale code", () => {
    expect(OG_LOCALES).toEqual({
      de: "de_DE",
      en: "en_US",
      tr: "tr_TR",
      ar: "ar_AR",
      ru: "ru_RU",
      uk: "uk_UA",
    });
  });
  it("covers exactly the routing locales", () => {
    expect(Object.keys(OG_LOCALES).sort()).toEqual([...routing.locales].sort());
  });
});

describe("toLocale", () => {
  it("keeps a supported locale", () => {
    expect(toLocale("uk")).toBe("uk");
  });
  it("falls back to the default locale for anything else", () => {
    expect(toLocale("xx")).toBe(routing.defaultLocale);
    expect(toLocale(undefined)).toBe(routing.defaultLocale);
  });
});

describe("pageMetadata", () => {
  const meta = pageMetadata("en", "/agb", "Terms", "Terms description", "OG alt text");

  it("carries the full openGraph object, because Next replaces it instead of merging", () => {
    expect(meta.openGraph).toMatchObject({
      type: "website",
      siteName: "Nebenkostencheck",
      locale: "en_US",
      url: `${SITE_URL}/en/agb`,
      title: "Terms",
      description: "Terms description",
    });
    expect(meta.openGraph?.images).toEqual([
      { url: "/og.png", width: 1200, height: 630, alt: "OG alt text" },
    ]);
  });
  it("canonicalises to the localised page path", () => {
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/en/agb`);
    expect(String(meta.alternates?.canonical).endsWith("/en/agb")).toBe(true);
  });
  it("repeats title, description and image on the twitter card", () => {
    expect(meta.twitter).toEqual({
      card: "summary_large_image",
      title: "Terms",
      description: "Terms description",
      images: ["/og.png"],
    });
  });
  it("uses the og:locale of the requested language", () => {
    expect(pageMetadata("de", "/impressum", "T", "D", "A").openGraph?.locale).toBe("de_DE");
    expect(pageMetadata("de", "/impressum", "T", "D", "A").alternates?.canonical).toBe(
      `${SITE_URL}/impressum`,
    );
  });
});
