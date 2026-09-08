#!/usr/bin/env node
// Einmaliger Import der vier unDraw-Motive nach src/components/illustrations/.
//
// Warum ein Skript und nicht Handarbeit: Umfärbetabelle, Root-Attribute und
// JSX-Attributnamen müssen bei allen vier Dateien identisch greifen. Jede
// Abweichung von Hand wäre ein stiller Farb- oder Rendering-Fehler, den man
// erst im Browser sieht. Bewusst ohne SVGO: eine neue Abhängigkeit für einen
// einmaligen Lauf lohnt sich nicht, stattdessen prüft das Skript die Größe.
//
// Aufruf: node scripts/import-undraw.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const SRC_DIR = join(ROOT, "docs", "superpowers", "assets", "undraw");
const OUT_DIR = join(ROOT, "src", "components", "illustrations");

const MOTIFS = [
  { file: "receipt.svg", component: "Receipt", maxBytes: null },
  { file: "document-review.svg", component: "DocumentReview", maxBytes: null },
  { file: "mail-sent.svg", component: "MailSent", maxBytes: null },
  // Das größte Motiv; über 40 KB wäre es für eine Inline-Komponente zu schwer
  // (Spec 10 begrenzt alle vier Illustrationen zusammen auf 60 KB).
  { file: "apartment-rent.svg", component: "ApartmentRent", maxBytes: 40 * 1024 },
];

// Umfärbetabelle aus Spec-Abschnitt 6. Nicht ersetzt werden bewusst:
// Hauttöne (#fbbebe, #a0616a, #9f616a) und #fff – Weiß sind Dokumentflächen
// in den Motiven und entspricht damit dem Token `doc`.
const RECOLOR = {
  "#090814": "#1B1F24",
  "#2f2e41": "#1B1F24",
  "#3f3d56": "#3A414A",
  "#e6e6e6": "#E3DDD0",
  "#f2f2f2": "#E7E1D4",
  "#ccc": "#CFC9BC",
  "#fafafa": "#FBF9F4",
  "#57b894": "#6DBE9A",
};

// Attribute, die unDraw am Wurzelelement mitliefert und die im JSX nichts
// verloren haben. width/height entfallen, weil die Größe aus dem Layout kommt;
// role/aria-hidden setzt das Skript unten selbst. xmlns:xlink fliegt raus, weil
// keines der vier Motive xlink:href benutzt.
const DROP_ROOT_ATTRS = new Set([
  "width",
  "height",
  "class",
  "role",
  "artist",
  "copyright",
  "scrapped",
  "source",
  "xmlns:xlink",
  "data-name",
]);

// SVG-Attribute mit Bindestrich bzw. Namensraum, die React in camelCase
// erwartet. data-* und aria-* bleiben unverändert – die reicht React durch.
const ATTR_MAP = {
  class: "className",
  "clip-path": "clipPath",
  "clip-rule": "clipRule",
  "fill-opacity": "fillOpacity",
  "fill-rule": "fillRule",
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",
  "stroke-dasharray": "strokeDasharray",
  "stroke-dashoffset": "strokeDashoffset",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-miterlimit": "strokeMiterlimit",
  "stroke-opacity": "strokeOpacity",
  "stroke-width": "strokeWidth",
  "xlink:href": "xlinkHref",
};

/** Ersetzt die Quellfarben. Der Lookahead verhindert, dass #ccc in #cccccc trifft. */
function recolor(markup) {
  let out = markup;
  for (const [from, to] of Object.entries(RECOLOR)) {
    out = out.replace(new RegExp(`${from}(?![0-9a-fA-F])`, "gi"), to);
  }
  return out;
}

/** Liest name="wert"-Paare aus einem Tag-Inhalt. */
function parseAttrs(raw) {
  const attrs = [];
  const re = /([A-Za-z_:][-\w:.]*)\s*=\s*"([^"]*)"/g;
  let match;
  while ((match = re.exec(raw)) !== null) attrs.push([match[1], match[2]]);
  return attrs;
}

/** Benennt Attribute nur innerhalb von Tags um – Pfaddaten bleiben unberührt. */
function toJsxAttributes(markup) {
  return markup.replace(/<[A-Za-z][^>]*>/g, (tag) =>
    tag.replace(/([A-Za-z_:][-\w:.]*)\s*=/g, (whole, name) =>
      ATTR_MAP[name] ? `${ATTR_MAP[name]}=` : whole,
    ),
  );
}

mkdirSync(OUT_DIR, { recursive: true });
let tooBig = false;

for (const motif of MOTIFS) {
  const raw = readFileSync(join(SRC_DIR, motif.file), "utf8");

  const open = raw.match(/<svg\b([^>]*)>/);
  if (!open) throw new Error(`${motif.file}: kein <svg>-Wurzelelement gefunden`);

  const keptRoot = parseAttrs(open[1]).filter(([name]) => !DROP_ROOT_ATTRS.has(name));
  if (!keptRoot.some(([name]) => name === "viewBox")) {
    throw new Error(`${motif.file}: viewBox fehlt, ohne sie skaliert das SVG nicht`);
  }

  let body = raw.slice(open.index + open[0].length).replace(/<\/svg>\s*$/, "");
  // <title>/<desc> raus: die Motive sind rein dekorativ und aria-hidden; ein
  // Titel würde Screenreadern einen widersprüchlichen Namen anbieten.
  body = body.replace(/<title>[\s\S]*?<\/title>/g, "").replace(/<desc>[\s\S]*?<\/desc>/g, "");
  body = recolor(body);
  body = toJsxAttributes(body);

  const rootLines = keptRoot
    .map(([name, value]) => `      ${ATTR_MAP[name] ?? name}="${value}"`)
    .join("\n");

  const tsx = `// GENERIERT von scripts/import-undraw.mjs – nicht von Hand ändern.
// Quelle, Lizenz und Umfärbetabelle: src/components/illustrations/README.md
import type * as React from "react";

export default function ${motif.component}(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
${rootLines}
      role="img"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >${body}</svg>
  );
}
`;

  const target = join(OUT_DIR, `${motif.component}.tsx`);
  writeFileSync(target, tsx, "utf8");

  const bytes = Buffer.byteLength(tsx, "utf8");
  console.log(`${motif.component}.tsx: ${(bytes / 1024).toFixed(1)} KB`);
  if (motif.maxBytes !== null && bytes > motif.maxBytes) {
    console.error(
      `FEHLER: ${motif.component}.tsx ist ${(bytes / 1024).toFixed(1)} KB, erlaubt sind ` +
        `${(motif.maxBytes / 1024).toFixed(0)} KB.`,
    );
    tooBig = true;
  }
}

if (tooBig) process.exit(1);
console.log("Import fertig.");
