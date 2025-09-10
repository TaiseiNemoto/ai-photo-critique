import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractExifDataClient } from "./exif-client";

// exifrライブラリをモック化
vi.mock("exifr", () => ({
  default: {
    parse: vi.fn(),
  },
}));

describe("クライアントサイドEXIF抽出", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Fileからクライアントサイドでexifデータを抽出できる", async () => {
    // モックファイルの作成
    const mockFile = new File([""], "test.jpg", { type: "image/jpeg" });
    
    // exifrのモック設定
    const { default: exifr } = await import("exifr");
    const mockedExifrParse = vi.mocked(exifr.parse);
    mockedExifrParse.mockResolvedValue({
      Make: "Canon",
      Model: "EOS R5",
      LensModel: "RF24-70mm F2.8 L IS USM",
      FNumber: 2.8,
      ExposureTime: "1/60",
      ISO: 100,
      FocalLength: 50,
    });

    // テスト実行
    const result = await extractExifDataClient(mockFile);

    // 期待値の確認
    expect(result).toEqual({
      make: "Canon",
      model: "EOS R5", 
      lensModel: "RF24-70mm F2.8 L IS USM",
      fNumber: "F2.8",
      exposureTime: "1/60",
      iso: "100",
      focalLength: "50mm",
    });

    // exifrが正しく呼び出されたことを確認
    expect(mockedExifrParse).toHaveBeenCalledWith(mockFile);
  });

  it("EXIF情報がない場合は空のオブジェクトを返す", async () => {
    const mockFile = new File([""], "test.jpg", { type: "image/jpeg" });
    
    const { default: exifr } = await import("exifr");
    const mockedExifrParse = vi.mocked(exifr.parse);
    mockedExifrParse.mockResolvedValue(null);

    const result = await extractExifDataClient(mockFile);

    expect(result).toEqual({});
  });

  it("EXIF抽出でエラーが発生した場合は空のオブジェクトを返す", async () => {
    const mockFile = new File([""], "test.jpg", { type: "image/jpeg" });
    
    const { default: exifr } = await import("exifr");
    const mockedExifrParse = vi.mocked(exifr.parse);
    mockedExifrParse.mockRejectedValue(new Error("EXIF extraction failed"));

    const result = await extractExifDataClient(mockFile);

    expect(result).toEqual({});
  });
});