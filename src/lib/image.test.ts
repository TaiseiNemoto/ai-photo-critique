import { describe, it, expect, vi, beforeEach } from "vitest";
import { processImage } from "./image";

// sharpライブラリをモック化
vi.mock("sharp", () => {
  const mockSharp = {
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toBuffer: vi.fn(),
  };
  return {
    default: vi.fn(() => mockSharp),
  };
});

// arrayBufferメソッドを持つFileモックを作成するヘルパー
function createMockFile(
  name: string,
  type: string,
  content: string = "",
): File {
  const file = new File([content], name, { type });
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
      vi.mocked(sharp).mockReturnValue(mockSharpInstance as ReturnType<typeof sharp>);

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

    it("既に小さい画像でも処理を実行する", async () => {
      const mockSmallFile = new File(["small"], "small.jpg", {
        type: "image/jpeg",
        lastModified: Date.now(),
      });

      const compress = (await import("browser-image-compression")).default;
      vi.mocked(compress).mockResolvedValue(mockSmallFile);

      const result = await processImage(mockSmallFile);

      expect(result.processedFile).toBe(mockSmallFile);
      expect(compress).toHaveBeenCalledWith(mockSmallFile, expect.any(Object));
    });

    it("PNG画像を処理できる", async () => {
      const mockPngFile = new File(["png"], "test.png", {
        type: "image/png",
        lastModified: Date.now(),
      });

      const compress = (await import("browser-image-compression")).default;
      vi.mocked(compress).mockResolvedValue(mockPngFile);

      const result = await processImage(mockPngFile);

      expect(result.processedFile).toBe(mockPngFile);
    });
  });

  describe("境界値テスト", () => {
    it("最大ファイルサイズ（10MB）の画像を処理できる", async () => {
      const mockLargeFile = new File(
        ["x".repeat(10 * 1024 * 1024)],
        "large.jpg",
        {
          type: "image/jpeg",
          lastModified: Date.now(),
        },
      );

      const mockCompressedFile = new File(["compressed"], "large.jpg", {
        type: "image/jpeg",
        lastModified: Date.now(),
      });

      const compress = (await import("browser-image-compression")).default;
      vi.mocked(compress).mockResolvedValue(mockCompressedFile);

      const result = await processImage(mockLargeFile);

      expect(result.processedFile).toBe(mockCompressedFile);
    });

    it("最小ファイルサイズ（1KB）の画像を処理できる", async () => {
      const mockTinyFile = new File(["tiny"], "tiny.jpg", {
        type: "image/jpeg",
        lastModified: Date.now(),
      });

      const compress = (await import("browser-image-compression")).default;
      vi.mocked(compress).mockResolvedValue(mockTinyFile);

      const result = await processImage(mockTinyFile);

      expect(result.processedFile).toBe(mockTinyFile);
    });
  });

  describe("異常系", () => {
    it("サポートされていないファイル形式でエラーを投げる", async () => {
      const mockUnsupportedFile = new File(["text"], "test.txt", {
        type: "text/plain",
        lastModified: Date.now(),
      });

      await expect(processImage(mockUnsupportedFile)).rejects.toThrow(
        "サポートされていないファイル形式です: text/plain",
      );
    });

    it("ファイルサイズが制限を超える場合エラーを投げる", async () => {
      const mockTooLargeFile = new File(
        ["x".repeat(11 * 1024 * 1024)],
        "toolarge.jpg",
        {
          type: "image/jpeg",
          lastModified: Date.now(),
        },
      );

      await expect(processImage(mockTooLargeFile)).rejects.toThrow(
        "ファイルサイズが制限を超えています（最大10MB）",
      );
    });

    it("空のファイルでエラーを投げる", async () => {
      const mockEmptyFile = new File([""], "", {
        type: "image/jpeg",
        lastModified: Date.now(),
      });

      await expect(processImage(mockEmptyFile)).rejects.toThrow(
        "無効なファイルです: ファイル名が空です",
      );
    });

    it("圧縮処理エラーを適切に処理する", async () => {
      const mockFile = new File(["test"], "test.jpg", {
        type: "image/jpeg",
        lastModified: Date.now(),
      });

      const compress = (await import("browser-image-compression")).default;
      vi.mocked(compress).mockRejectedValue(new Error("Compression failed"));

      await expect(processImage(mockFile)).rejects.toThrow(
        "画像処理に失敗しました: Compression failed",
      );
    });
  });
});
