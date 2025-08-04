import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { uploadImage } from "@/app/actions";

// ライブラリをモック化
vi.mock("@/lib/exif", () => ({
  extractExifData: vi.fn().mockResolvedValue({
    make: "Sony",
    model: "α7R V",
    lensModel: "Sony FE 24-70mm F2.8 GM",
    fNumber: "f/2.8",
    exposureTime: "1/250s",
    iso: "200",
  }),
}));

vi.mock("@/lib/image", () => ({
  processImage: vi.fn().mockResolvedValue({
    originalFile: null,
    processedFile: {
      type: "image/jpeg",
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(256)),
    },
    originalSize: 1024,
    processedSize: 512,
  }),
}));

// テストファイルのモック作成
function createMockImageFile(
  name: string = "test.jpg",
  type: string = "image/jpeg",
  size: number = 1024,
): File {
  const content = new Uint8Array(size);
  return new File([content], name, { type });
}

describe("uploadImage Server Action", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // 各テストでデフォルトのモック設定をリセット
    const { extractExifData } = await import("@/lib/exif");
    const { processImage } = await import("@/lib/image");

    vi.mocked(extractExifData).mockResolvedValue({
      make: "Sony",
      model: "α7R V",
      lensModel: "Sony FE 24-70mm F2.8 GM",
      fNumber: "f/2.8",
      exposureTime: "1/250s",
      iso: "200",
    });

    vi.mocked(processImage).mockResolvedValue({
      originalFile: null as any,
      processedFile: {
        type: "image/jpeg",
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(256)),
      } as any,
      originalSize: 1024,
      processedSize: 512,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("正常系", () => {
    it("有効な画像ファイルをアップロードできる", async () => {
      // Arrange: テストデータの準備
      const mockFile = createMockImageFile();
      const formData = new FormData();
      formData.append("image", mockFile);

      // Act: Server Actionの実行
      const result = await uploadImage(formData);

      // Assert: 結果の検証
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.exifData).toBeDefined();
      expect(result.data?.processedImage).toBeDefined();
      expect(result.data?.processedImage.dataUrl).toMatch(
        /^data:image\/(jpeg|png);base64,/,
      );
      expect(result.error).toBeUndefined();
    });

    it("EXIF情報を正しく抽出する", async () => {
      // Arrange: EXIF付き画像のモック
      const mockFile = createMockImageFile("camera.jpg");
      const formData = new FormData();
      formData.append("image", mockFile);

      // Act
      const result = await uploadImage(formData);

      // Assert: EXIF情報の構造を検証
      expect(result.success).toBe(true);
      expect(result.data?.exifData).toEqual(
        expect.objectContaining({
          make: expect.any(String),
          model: expect.any(String),
        }),
      );
    });

    it("画像を適切にリサイズ・圧縮する", async () => {
      // Arrange: 大きな画像ファイル用のモック設定
      const { processImage } = await import("@/lib/image");
      const mockFileSize = 5 * 1024 * 1024; // 5MB
      vi.mocked(processImage).mockResolvedValue({
        originalFile: null as any,
        processedFile: {
          type: "image/jpeg",
          arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(256)),
        } as any,
        originalSize: mockFileSize,
        processedSize: 512,
      });

      const mockFile = createMockImageFile(
        "large.jpg",
        "image/jpeg",
        mockFileSize,
      );
      const formData = new FormData();
      formData.append("image", mockFile);

      // Act
      const result = await uploadImage(formData);

      // Assert: 圧縮結果を検証
      expect(result.success).toBe(true);
      expect(result.data?.processedImage.originalSize).toBe(mockFileSize);
      expect(result.data?.processedImage.processedSize).toBeLessThan(
        mockFileSize,
      );
    });
  });

  describe("異常系", () => {
    it("ファイルが選択されていない場合はエラーを返す", async () => {
      // Arrange: 空のFormData
      const formData = new FormData();

      // Act
      const result = await uploadImage(formData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("ファイルが選択されていません");
      expect(result.data).toBeUndefined();
    });

    it("空のファイルの場合はエラーを返す", async () => {
      // Arrange: サイズ0のファイル
      const mockFile = createMockImageFile("empty.jpg", "image/jpeg", 0);
      const formData = new FormData();
      formData.append("image", mockFile);

      // Act
      const result = await uploadImage(formData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("ファイルが選択されていません");
    });

    it("サポートされていないファイル形式の場合はエラーを返す", async () => {
      // Arrange: 非対応形式のファイル、extractExifDataが失敗するようにモック
      const { extractExifData } = await import("@/lib/exif");
      vi.mocked(extractExifData).mockRejectedValueOnce(
        new Error("Unsupported file type: text/plain"),
      );

      const unsupportedFile = new File(["content"], "test.txt", {
        type: "text/plain",
        lastModified: Date.now(),
      });

      const formData = new FormData();
      formData.append("image", unsupportedFile);

      // ログ出力をモックして抑制
      const loggerErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Act
      const result = await uploadImage(formData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unsupported file type: text/plain");
      }

      loggerErrorSpy.mockRestore();
    });
  });

  describe("境界値テスト", () => {
    it("最大ファイルサイズ(10MB)ギリギリのファイルを処理できる", async () => {
      // Arrange: 10MBファイル
      const mockFile = createMockImageFile(
        "max-size.jpg",
        "image/jpeg",
        10 * 1024 * 1024,
      );
      const formData = new FormData();
      formData.append("image", mockFile);

      // Act
      const result = await uploadImage(formData);

      // Assert
      expect(result.success).toBe(true);
    });

    it("最小ファイルサイズ(1KB)のファイルを処理できる", async () => {
      // Arrange: 1KBファイル
      const mockFile = createMockImageFile("min-size.jpg", "image/jpeg", 1024);
      const formData = new FormData();
      formData.append("image", mockFile);

      // Act
      const result = await uploadImage(formData);

      // Assert
      expect(result.success).toBe(true);
    });
  });
});
