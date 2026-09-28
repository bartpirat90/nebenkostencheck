import { toJpegName } from "./jpegName";

describe("toJpegName", () => {
  it("tauscht die Endung aus", () => {
    expect(toJpegName("IMG_2031.HEIC")).toBe("IMG_2031.jpg");
    expect(toJpegName("scan.png")).toBe("scan.jpg");
  });
  it("hängt .jpg an, wenn keine Endung da ist", () => {
    expect(toJpegName("abrechnung")).toBe("abrechnung.jpg");
  });
  it("lässt Punkte im Namen stehen", () => {
    expect(toJpegName("nk.2024.jpeg")).toBe("nk.2024.jpg");
  });
  it("fällt bei leerem Namen auf foto.jpg zurück", () => {
    expect(toJpegName(".jpg")).toBe("foto.jpg");
  });
});
