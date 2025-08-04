import { describe, it, expect, vi, beforeEach } from "vitest";
import { extractExifData } from "./exif";

// exifrライブラリをモック化
vi.mock("exifr", () => ({
  parse: vi.fn(),
}));

// arrayBufferメソッドを持つFileモックを作成するヘルパー
function createMockFile(
  name: string,
  type: string,
  content: string = "",
): File {
  const file = new File([content], name, { type });
  // arrayBufferメソッドを追加
  file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(content.length));
  return file;
}

describe("extractExifData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("正常系", () => {
    it("完全なメタデータを持つJPEGファイルからEXIFデータを抽出できる", async () => {
      const mockFile = createMockFile("test.jpg", "image/jpeg");
      const mockExifData = {
        Make: "Canon",
        Model: "EOS R5",
        LensModel: "RF24-70mm F2.8 L IS USM",
        FNumber: 2.8,
        ExposureTime: 1 / 250,
        ISO: 200,
        FocalLength: 35,
      };

      const { parse } = await import("exifr");
      vi.mocked(parse).mockResolvedValue(mockExifData);

      const result = await extractExifData(mockFile);

      expect(result).toEqual({
        make: "Canon",
        model: "EOS R5",
        lensModel: "RF24-70mm F2.8 L IS USM",
        fNumber: "f/2.8",
        exposureTime: "1/250s",
        iso: "200",
        focalLength: "35mm",
      });
      // 実装が変更されたため、ArrayBufferとオプションで呼び出されることを確認
      expect(parse).toHaveBeenCalledWith(
        expect.any(ArrayBuffer),
        expect.objectContaining({
          tiff: true,
          exif: true,
          gps: false,
        }),
      );
    });

    it("一部のフィールドが欠けている場合でも部分的なEXIFデータを抽出できる", async () => {
      const mockFile = createMockFile("partial.jpg", "image/jpeg");
      const mockExifData = {
        Make: "Sony",
        Model: "α7R V",
        ISO: 800,
      };

      const { parse } = await import("exifr");
      vi.mocked(parse).mockResolvedValue(mockExifData);

      const result = await extractExifData(mockFile);

      expect(result).toEqual({
        make: "Sony",
        model: "α7R V",
        iso: "800",
      });
    });

    it("小数点のF値を正しく処理できる", async () => {
      const mockFile = createMockFile("test.jpg", "image/jpeg");
      const mockExifData = {
        FNumber: 1.4,
      };

      const { parse } = await import("exifr");
      vi.mocked(parse).mockResolvedValue(mockExifData);

      const result = await extractExifData(mockFile);

      expect(result.fNumber).toBe("f/1.4");
    });

    it("適切な場合にシャッター速度を分数として表示できる", async () => {
      const mockFile = createMockFile("test.jpg", "image/jpeg");
      const mockExifData = {
        ExposureTime: 0.004, // 1/250
      };

      const { parse } = await import("exifr");
      vi.mocked(parse).mockResolvedValue(mockExifData);

      const result = await extractExifData(mockFile);

      expect(result.exposureTime).toBe("1/250s");
    });
  });

  describe("境界値テスト", () => {
    it("EXIFデータがないファイルを適切に処理できる", async () => {
      const mockFile = createMockFile("noexif.jpg", "image/jpeg");

      const { parse } = await import("exifr");
      vi.mocked(parse).mockResolvedValue(null);

      const result = await extractExifData(mockFile);

      expect(result).toEqual({});
    });

    it("空のEXIFオブジェクトを処理できる", async () => {
      const mockFile = createMockFile("empty.jpg", "image/jpeg");

      const { parse } = await import("exifr");
      vi.mocked(parse).mockResolvedValue({});

      const result = await extractExifData(mockFile);

      expect(result).toEqual({});
    });

    it("非常に高いISO値を処理できる", async () => {
      const mockFile = createMockFile("highiso.jpg", "image/jpeg");
      const mockExifData = {
        ISO: 102400,
      };

      const { parse } = await import("exifr");
      vi.mocked(parse).mockResolvedValue(mockExifData);

      const result = await extractExifData(mockFile);

      expect(result.iso).toBe("102400");
    });
  });

  describe("リファクタリングテスト", () => {
    it("本番環境では詳細なデバッグログが出力されない", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const mockFile = createMockFile("test.jpg", "image/jpeg");
      const mockExifData = { Make: "Canon", Model: "EOS R5" };

      const { parse } = await import("exifr");
      vi.mocked(parse).mockResolvedValue(mockExifData);

      await extractExifData(mockFile);

      // 現在は大量のデバッグログが出力されているので、このテストは失敗するはず
      // console.logが呼び出された回数をチェック
      const logCalls = consoleSpy.mock.calls;
      const debugLogCount = logCalls.filter((call) =>
        call.some(
          (arg) =>
            typeof arg === "string" &&
            (arg.includes("EXIF解析開始:") ||
              arg.includes("利用可能なEXIFフィールド:") ||
              arg.includes("変換後のEXIFデータ:")),
        ),
      ).length;

      // 本番環境ではデバッグログが0回であることを期待（現在は失敗するはず）
      expect(debugLogCount).toBe(0);

      consoleSpy.mockRestore();
    });
  });

  describe("異常系", () => {
    it("EXIF解析エラーを適切に処理できる", async () => {
      const mockFile = createMockFile("corrupt.jpg", "image/jpeg");

      const { parse } = await import("exifr");
      vi.mocked(parse).mockRejectedValue(new Error("Parse failed"));

      // ログ出力をモックして抑制
      const loggerErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = await extractExifData(mockFile);

      expect(result).toEqual({});
      expect(loggerErrorSpy).toHaveBeenCalled();

      loggerErrorSpy.mockRestore();
    });

    it("サポートされていないファイル形式でエラーを投げる", async () => {
      const mockFile = createMockFile("test.txt", "text/plain");

      await expect(extractExifData(mockFile)).rejects.toThrow(
        "Unsupported file type: text/plain",
      );
    });

    it("空のファイルでエラーを投げる", async () => {
      const mockFile = createMockFile("", "image/jpeg");

      await expect(extractExifData(mockFile)).rejects.toThrow(
        "Invalid file: file name is empty",
      );
    });
  });
});
