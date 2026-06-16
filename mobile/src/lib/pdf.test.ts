import { savePdfAndShare } from "./pdf";

jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "file:///cache/",
  EncodingType: { Base64: "base64" },
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  downloadAsync: jest.fn().mockResolvedValue({ status: 200, uri: "file:///cache/x.pdf" }),
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

afterEach(() => jest.clearAllMocks());

describe("savePdfAndShare", () => {
  it("schreibt das base64-PDF und öffnet das Teilen-Sheet", async () => {
    await savePdfAndShare("AAAA", "Brief.pdf");
    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      "file:///cache/Brief.pdf",
      "AAAA",
      { encoding: "base64" },
    );
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      "file:///cache/Brief.pdf",
      expect.objectContaining({ mimeType: "application/pdf" }),
    );
  });

  it("wirft eine deutsche Meldung, wenn Teilen nicht verfügbar ist", async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
    await expect(savePdfAndShare("AAAA", "Brief.pdf")).rejects.toThrow(/nicht verfügbar/);
  });
});
