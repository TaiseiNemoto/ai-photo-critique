import { describe, it, expect, vi, beforeEach } from "vitest";
import { processImage } from "./image";

// sharpのモック
vi.mock("sharp", () => ({
  default: vi.fn(),
}));

// テスト用のファイルオブジェクト作成関数
function createMockFile(
  name: string,
  type: string,
  content: string = "",
): File {
  const file = new File([content], name, { type });
  // Node.js環境でarrayBufferメソッドを追加
  file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(content.length));
  return file;
}

describe("processImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("正常系", () => {
    it("画像を正常にリサイズ・圧縮できる", async () => {
      const mockOriginalFile = createMockFile(
        "test.jpg",
        "image/jpeg",
        "original",
      );
      const mockProcessedBuffer = Buffer.from("compressed");

      const sharp = (await import("sharp")).default;
      const mockSharpInstance = {
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockProcessedBuffer),
      };
      vi.mocked(sharp).mockReturnValue(
        mockSharpInstance as ReturnType<typeof sharp>,
      );

      const result = await processImage(mockOriginalFile);

      expect(result.originalFile).toBe(mockOriginalFile);
      expect(result.processedFile.type).toBe("image/jpeg");
      expect(result.processedFile.name).toBe("test.jpg");
      expect(result.originalSize).toBe(mockOriginalFile.size);
      expect(result.processedSize).toBe(mockProcessedBuffer.length);

      expect(mockSharpInstance.resize).toHaveBeenCalledWith(1024, 1024, {
        fit: "inside",
        withoutEnlargement: true,
      });
      expect(mockSharpInstance.jpeg).toHaveBeenCalledWith({
        quality: 80,
        progressive: true,
      });
    });

    it("小さい画像でも処理を実行する", async () => {
      const mockSmallFile = createMockFile("small.jpg", "image/jpeg", "small");
      const mockProcessedBuffer = Buffer.from("processed");

      const sharp = (await import("sharp")).default;
      const mockSharpInstance = {
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockProcessedBuffer),
      };
      vi.mocked(sharp).mockReturnValue(
        mockSharpInstance as ReturnType<typeof sharp>,
      );

      const result = await processImage(mockSmallFile);

      expect(result.processedFile.type).toBe("image/jpeg");
      expect(result.processedFile.name).toBe("small.jpg");
    });

    it("PNG画像を処理できる", async () => {
      const mockPngFile = createMockFile("test.png", "image/png", "png");
      const mockProcessedBuffer = Buffer.from("processed");

      const sharp = (await import("sharp")).default;
      const mockSharpInstance = {
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockProcessedBuffer),
      };
      vi.mocked(sharp).mockReturnValue(
        mockSharpInstance as ReturnType<typeof sharp>,
      );

      const result = await processImage(mockPngFile);

      expect(result.processedFile.type).toBe("image/jpeg");
      expect(result.processedFile.name).toBe("test.png");
    });
  });

  describe("境界値テスト", () => {
    it("最大ファイルサイズ（20MB）の画像を処理できる", async () => {
      const mockLargeFile = createMockFile(
        "large.jpg",
        "image/jpeg",
        "x".repeat(20 * 1024 * 1024),
      );
      const mockProcessedBuffer = Buffer.from("compressed");

      const sharp = (await import("sharp")).default;
      const mockSharpInstance = {
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockProcessedBuffer),
      };
      vi.mocked(sharp).mockReturnValue(
        mockSharpInstance as ReturnType<typeof sharp>,
      );

      const result = await processImage(mockLargeFile);

      expect(result.processedFile.type).toBe("image/jpeg");
    });

    it("最小ファイルサイズ（1KB）の画像を処理できる", async () => {
      const mockTinyFile = createMockFile("tiny.jpg", "image/jpeg", "tiny");
      const mockProcessedBuffer = Buffer.from("processed");

      const sharp = (await import("sharp")).default;
      const mockSharpInstance = {
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(mockProcessedBuffer),
      };
      vi.mocked(sharp).mockReturnValue(
        mockSharpInstance as ReturnType<typeof sharp>,
      );

      const result = await processImage(mockTinyFile);

      expect(result.processedFile.type).toBe("image/jpeg");
    });
  });

  describe("異常系", () => {
    it("サポートされていないファイル形式でエラーを投げる", async () => {
      const mockUnsupportedFile = createMockFile(
        "test.txt",
        "text/plain",
        "text",
      );

      await expect(processImage(mockUnsupportedFile)).rejects.toThrow(
        "サポートされていないファイル形式です: text/plain",
      );
    });

    it("ファイルサイズが制限を超える場合エラーを投げる", async () => {
      const mockTooLargeFile = createMockFile(
        "toolarge.jpg",
        "image/jpeg",
        "x".repeat(21 * 1024 * 1024),
      );

      await expect(processImage(mockTooLargeFile)).rejects.toThrow(
        "ファイルサイズが制限を超えています（最大20MB）",
      );
    });

    it("空のファイルでエラーを投げる", async () => {
      const mockEmptyFile = createMockFile("", "image/jpeg", "");

      await expect(processImage(mockEmptyFile)).rejects.toThrow(
        "無効なファイルです: ファイル名が空です",
      );
    });

    it("画像処理エラーを適切に処理する", async () => {
      const mockFile = createMockFile("test.jpg", "image/jpeg", "test");

      const sharp = (await import("sharp")).default;
      const mockSharpInstance = {
        resize: vi.fn().mockReturnThis(),
        jpeg: vi.fn().mockReturnThis(),
        toBuffer: vi
          .fn()
          .mockRejectedValue(new Error("Sharp processing failed")),
      };
      vi.mocked(sharp).mockReturnValue(
        mockSharpInstance as ReturnType<typeof sharp>,
      );

      await expect(processImage(mockFile)).rejects.toThrow(
        "画像処理に失敗しました: Sharp processing failed",
      );
    });
  });
});
