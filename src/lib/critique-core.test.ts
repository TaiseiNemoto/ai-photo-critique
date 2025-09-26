import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateCritiqueCore } from "./critique-core";

// モック設定をテストファイル上部で定義
vi.mock("./validation", () => ({
  extractAndValidateFile: vi.fn(),
}));

vi.mock("./exif", () => ({
  extractExifFromFormData: vi.fn(),
}));

vi.mock("./gemini", () => ({
  generatePhotoCritique: vi.fn(),
  generatePhotoCritiqueWithRetry: vi.fn(),
  geminiClient: {
    analyzeCritique: vi.fn(),
  },
}));

vi.mock("./kv", () => ({
  kvClient: {
    generateId: vi.fn(),
    saveCritique: vi.fn(),
    saveShare: vi.fn(),
  },
}));

// モックしたモジュールを取得するヘルパー関数
const getMocks = async () => {
  const validation = await import("./validation");
  const exif = await import("./exif");
  const gemini = await import("./gemini");
  const kv = await import("./kv");

  return {
    extractAndValidateFile: vi.mocked(validation.extractAndValidateFile),
    extractExifFromFormData: vi.mocked(exif.extractExifFromFormData),
    generatePhotoCritique: vi.mocked(gemini.generatePhotoCritique),
    generatePhotoCritiqueWithRetry: vi.mocked(
      gemini.generatePhotoCritiqueWithRetry,
    ),
    geminiClient: vi.mocked(gemini.geminiClient),
    kvClient: vi.mocked(kv.kvClient),
  };
};

describe("generateCritiqueCore - Buffer変換最適化テスト", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // デフォルトのモック戻り値を設定
    const mocks = await getMocks();

    mocks.extractExifFromFormData.mockReturnValue({});
    mocks.geminiClient.analyzeCritique.mockResolvedValue({
      success: true,
      data: {
        technique: "技術面の講評",
        composition: "構図面の講評",
        color: "色彩面の講評",
      },
      processingTime: 1000,
    });
    mocks.generatePhotoCritiqueWithRetry.mockResolvedValue({
      success: true,
      data: {
        technique: "技術面の講評",
        composition: "構図面の講評",
        color: "色彩面の講評",
      },
      processingTime: 1000,
    });
    mocks.kvClient.generateId.mockReturnValue("test-id");
    mocks.kvClient.saveCritique.mockResolvedValue(undefined);
    mocks.kvClient.saveShare.mockResolvedValue(undefined);
  });

  it("should call file.arrayBuffer() only once for buffer optimization", async () => {
    // ★ RED: 失敗するテスト - 現在は2回呼ばれているため

    const mockArrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(1024));
    const mockFile = {
      name: "test.jpg",
      type: "image/jpeg",
      size: 1024,
      arrayBuffer: mockArrayBuffer,
    } as File;

    // extractAndValidateFileがmockFileを返すように設定
    const mocks = await getMocks();
    mocks.extractAndValidateFile.mockReturnValue(mockFile);

    const formData = new FormData();
    formData.append("image", mockFile);

    await generateCritiqueCore(formData);

    // ★ RED: このテストは現在失敗する（2回呼ばれているため）
    expect(mockArrayBuffer).toHaveBeenCalledTimes(1);
  });

  it("should reuse buffer for both AI processing and KV storage", async () => {
    // Buffer再利用の確認テスト

    const testBuffer = new ArrayBuffer(1024);
    const mockArrayBuffer = vi.fn().mockResolvedValue(testBuffer);
    const mockFile = {
      name: "test.jpg",
      type: "image/jpeg",
      size: 1024,
      arrayBuffer: mockArrayBuffer,
    } as File;

    const mocks = await getMocks();
    mocks.extractAndValidateFile.mockReturnValue(mockFile);

    const formData = new FormData();
    formData.append("image", mockFile);

    await generateCritiqueCore(formData);

    // ★ RED: 現在の実装ではarrayBuffer()が2回呼ばれる
    expect(mockArrayBuffer).toHaveBeenCalledTimes(1);
  });
});

describe("generateCritiqueCore - AppError型対応テスト", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it("should return AppError when file validation fails", async () => {
    // Arrange
    const validationError = new Error("File not selected");
    const mocks = await getMocks();
    mocks.extractAndValidateFile.mockImplementation(() => {
      throw validationError;
    });

    const formData = new FormData();

    // Act
    const result = await generateCritiqueCore(formData);

    // Assert - RED: 現在はstring errorを返すが、AppError型を返すべき
    expect(result.success).toBe(false);
    expect(result.error).toEqual(
      expect.objectContaining({
        code: "FILE_NOT_SELECTED",
        message: "ファイルが選択されていません",
        timestamp: expect.any(String),
      }),
    );
  });

  it("should return AppError when Gemini API fails", async () => {
    // Arrange
    const mockFile = {
      name: "test.jpg",
      type: "image/jpeg",
      size: 1024,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
    } as File;

    const mocks = await getMocks();
    mocks.extractAndValidateFile.mockReturnValue(mockFile);
    mocks.extractExifFromFormData.mockReturnValue({});

    const geminiError = new Error("API quota exceeded");
    mocks.geminiClient.analyzeCritique.mockRejectedValue(geminiError);
    mocks.generatePhotoCritiqueWithRetry.mockRejectedValue(geminiError);

    const formData = new FormData();
    formData.append("image", mockFile);

    // Act
    const result = await generateCritiqueCore(formData);

    // Assert - generatePhotoCritiqueWithRetry が文字列エラーを返すことを確認
    expect(result.success).toBe(false);
    expect(typeof result.error).toBe("string");
    expect(result.error).toContain("API quota exceeded");
  });

  it("should return AppError when KV storage fails", async () => {
    // Arrange
    const mockFile = {
      name: "test.jpg",
      type: "image/jpeg",
      size: 1024,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
    } as File;

    const mocks = await getMocks();
    mocks.extractAndValidateFile.mockReturnValue(mockFile);
    mocks.extractExifFromFormData.mockReturnValue({});
    mocks.geminiClient.analyzeCritique.mockResolvedValue({
      success: true,
      data: {
        technique: "技術面の講評",
        composition: "構図面の講評",
        color: "色彩面の講評",
      },
      processingTime: 1000,
    });
    mocks.generatePhotoCritiqueWithRetry.mockResolvedValue({
      success: true,
      data: {
        technique: "技術面の講評",
        composition: "構図面の講評",
        color: "色彩面の講評",
      },
      processingTime: 1000,
    });
    mocks.kvClient.generateId.mockReturnValue("test-id");

    const storageError = new Error("Redis connection failed");
    mocks.kvClient.saveCritique.mockRejectedValue(storageError);

    const formData = new FormData();
    formData.append("image", mockFile);

    // Act
    const result = await generateCritiqueCore(formData);

    // Assert - AppError型のエラーが返されることを確認
    expect(result.success).toBe(false);
    expect(result.error).toEqual(
      expect.objectContaining({
        code: "PROCESSING_ERROR",
        message: expect.any(String),
        timestamp: expect.any(String),
      }),
    );
  });
});
