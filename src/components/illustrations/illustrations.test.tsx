import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ApartmentRent from "./ApartmentRent";
import DocumentReview from "./DocumentReview";
import MailSent from "./MailSent";
import Receipt from "./Receipt";

const ILLUSTRATIONS = [
  ["Receipt", Receipt],
  ["DocumentReview", DocumentReview],
  ["MailSent", MailSent],
  ["ApartmentRent", ApartmentRent],
] as const;

describe("Illustrationen", () => {
  it.each(ILLUSTRATIONS)("%s ist dekorativ und skaliert über CSS", (_name, Illustration) => {
    const html = renderToStaticMarkup(<Illustration />);
    const root = html.slice(0, html.indexOf(">") + 1);

    // aria-hidden: die Motive tragen keine Information, die nicht daneben steht.
    expect(root).toContain('aria-hidden="true"');
    expect(root).toContain("viewBox=");
    // Feste Maße am Root würden die Größenvorgaben der Sektionen aushebeln.
    expect(root).not.toMatch(/\swidth="/);
    expect(root).not.toMatch(/\sheight="/);
    // unDraw liefert teils ein <title> mit; es würde dem aria-hidden widersprechen.
    expect(html).not.toContain("<title>");
  });

  it("nimmt className und Style von aussen entgegen", () => {
    const html = renderToStaticMarkup(<Receipt className="h-[150px] w-auto" />);
    expect(html).toContain('class="h-[150px] w-auto"');
  });
});
