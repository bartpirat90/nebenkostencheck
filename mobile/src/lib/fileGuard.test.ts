import { isFileTooLarge, MAX_FILE_BYTES, MAX_FILE_MB } from "./fileGuard";

describe("isFileTooLarge", () => {
  it("erlaubt genau die Grenze", () => {
    expect(isFileTooLarge(MAX_FILE_BYTES)).toBe(false);
  });
  it("lehnt einen Byte über der Grenze ab", () => {
    expect(isFileTooLarge(MAX_FILE_BYTES + 1)).toBe(true);
  });
  it("erlaubt kleine Dateien", () => {
    expect(isFileTooLarge(1000)).toBe(false);
  });
  it("Grenze entspricht 3 MB", () => {
    expect(MAX_FILE_MB).toBe(3);
    expect(MAX_FILE_BYTES).toBe(3 * 1024 * 1024);
  });
});
