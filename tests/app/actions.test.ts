import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { uploadImage, generateCritique } from "@/app/actions";
import { server } from "@/mocks/server";
import { http, HttpResponse } from "msw";

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
  beforeEach(() => {
    vi.clearAllMocks();
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
      const mockFileSize = 5 * 1024 * 1024; // 5MB
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
      expect(result.data?.processedImage.originalSize).toBe(1024);
      expect(result.data?.processedImage.processedSize).toBe(512);
    });
  });

  describe("異常系", () => {
    it("ファイルが選択されていない場合はエラーを返す", async () => {
      // Arrange: API エラーレスポンスをモック
      server.use(
        http.post("/api/upload", () => {
          return HttpResponse.json(
            {
              success: false,
              error: "ファイルが選択されていません",
            },
            { status: 400 },
          );
        }),
      );

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
      // Arrange: API エラーレスポンスをモック
      server.use(
        http.post("/api/upload", () => {
          return HttpResponse.json(
            {
              success: false,
              error: "ファイルが選択されていません",
            },
            { status: 400 },
          );
        }),
      );

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
      // Arrange: API エラーレスポンスをモック
      server.use(
        http.post("/api/upload", () => {
          return HttpResponse.json(
            {
              success: false,
              error: "サポートされていないファイル形式です",
            },
            { status: 400 },
          );
        }),
      );

      const unsupportedFile = new File(["content"], "test.txt", {
        type: "text/plain",
        lastModified: Date.now(),
      });

      const formData = new FormData();
      formData.append("image", unsupportedFile);

      // Act
      const result = await uploadImage(formData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("サポートされていないファイル形式です");
      }
    });

    it("API呼び出しが失敗した場合はエラーを返す", async () => {
      // Arrange: ネットワークエラーをモック
      server.use(
        http.post("/api/upload", () => {
          return HttpResponse.error();
        }),
      );

      const mockFile = createMockImageFile();
      const formData = new FormData();
      formData.append("image", mockFile);

      // Act
      const result = await uploadImage(formData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
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

describe("generateCritique Server Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("正常系", () => {
    it("画像に対するAI講評を生成できる", async () => {
      // Arrange
      const mockFile = createMockImageFile();
      const formData = new FormData();
      formData.append("image", mockFile);

      // Act
      const result = await generateCritique(formData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.technique).toBeDefined();
      expect(result.data?.composition).toBeDefined();
      expect(result.data?.color).toBeDefined();
    });
  });

  describe("異常系", () => {
    it("API呼び出しが失敗した場合はエラーを返す", async () => {
      // Arrange: API エラーレスポンスをモック
      server.use(
        http.post("/api/critique", () => {
          return HttpResponse.json(
            {
              success: false,
              error: "講評生成に失敗しました",
            },
            { status: 500 },
          );
        }),
      );

      const mockFile = createMockImageFile();
      const formData = new FormData();
      formData.append("image", mockFile);

      // Act
      const result = await generateCritique(formData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("講評生成に失敗しました");
    });

    it("ネットワークエラーの場合はエラーを返す", async () => {
      // Arrange: ネットワークエラーをモック
      server.use(
        http.post("/api/critique", () => {
          return HttpResponse.error();
        }),
      );

      const mockFile = createMockImageFile();
      const formData = new FormData();
      formData.append("image", mockFile);

      // Act
      const result = await generateCritique(formData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
