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

describe("generateCritiqueCore - Buffer変換最適化テスト", () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    // デフォルトのモック戻り値を設定
    const { extractExifFromFormData } = await import("./exif");
    const { generatePhotoCritiqueWithRetry } = await import("./gemini");
    const { kvClient } = await import("./kv");

    vi.mocked(extractExifFromFormData).mockReturnValue({});
    vi.mocked(generatePhotoCritiqueWithRetry).mockResolvedValue({
      success: true,
      data: {
        technique: { score: 8, feedback: "test" },
        composition: { score: 7, feedback: "test" },
        color: { score: 9, feedback: "test" },
      },
    });
    vi.mocked(kvClient.generateId).mockReturnValue("test-id");
    vi.mocked(kvClient.saveCritique).mockResolvedValue(undefined);
    vi.mocked(kvClient.saveShare).mockResolvedValue(undefined);
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
    const { extractAndValidateFile } = await import("./validation");
    vi.mocked(extractAndValidateFile).mockReturnValue(mockFile);

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

    const { extractAndValidateFile } = await import("./validation");
    vi.mocked(extractAndValidateFile).mockReturnValue(mockFile);

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
    const { extractAndValidateFile } = await import("./validation");
    const validationError = new Error("File not selected");
    vi.mocked(extractAndValidateFile).mockImplementation(() => {
      throw validationError;
    });

    const formData = new FormData();

    // Act
    const result = await generateCritiqueCore(formData);

    // Assert - RED: 現在はstring errorを返すが、AppError型を返すべき
    expect(result.success).toBe(false);
    expect(result.error).toEqual(expect.objectContaining({
      code: "FILE_NOT_SELECTED",
      message: "ファイルが選択されていません",
      timestamp: expect.any(String),
    }));
  });

  it("should return AppError when Gemini API fails", async () => {
    // Arrange
    const mockFile = {
      name: "test.jpg",
      type: "image/jpeg",
      size: 1024,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
    } as File;

    const { extractAndValidateFile } = await import("./validation");
    const { extractExifFromFormData } = await import("./exif");
    const { generatePhotoCritiqueWithRetry } = await import("./gemini");

    vi.mocked(extractAndValidateFile).mockReturnValue(mockFile);
    vi.mocked(extractExifFromFormData).mockReturnValue({});

    const geminiError = new Error("API quota exceeded");
    vi.mocked(generatePhotoCritiqueWithRetry).mockRejectedValue(geminiError);

    const formData = new FormData();
    formData.append("image", mockFile);

    // Act
    const result = await generateCritiqueCore(formData);

    // Assert - RED: 現在はstring errorを返すが、AppError型を返すべき
    expect(result.success).toBe(false);
    expect(result.error).toEqual(expect.objectContaining({
      code: "PROCESSING_ERROR", // 実際の実装では PROCESSING_ERROR が返される
      message: "処理中にエラーが発生しました",
      timestamp: expect.any(String),
      details: "API quota exceeded",
    }));
  });

  it("should return AppError when KV storage fails", async () => {
    // Arrange
    const mockFile = {
      name: "test.jpg",
      type: "image/jpeg",
      size: 1024,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
    } as File;

    const { extractAndValidateFile } = await import("./validation");
    const { extractExifFromFormData } = await import("./exif");
    const { generatePhotoCritiqueWithRetry } = await import("./gemini");
    const { kvClient } = await import("./kv");

    vi.mocked(extractAndValidateFile).mockReturnValue(mockFile);
    vi.mocked(extractExifFromFormData).mockReturnValue({});
    vi.mocked(generatePhotoCritiqueWithRetry).mockResolvedValue({
      success: true,
      data: {
        technique: { score: 8, feedback: "test" },
        composition: { score: 7, feedback: "test" },
        color: { score: 9, feedback: "test" },
      },
    });
    vi.mocked(kvClient.generateId).mockReturnValue("test-id");

    const storageError = new Error("Redis connection failed");
    vi.mocked(kvClient.saveCritique).mockRejectedValue(storageError);

    const formData = new FormData();
    formData.append("image", mockFile);

    // Act
    const result = await generateCritiqueCore(formData);

    // Assert - RED: 現在はstring errorを返すが、AppError型を返すべき
    expect(result.success).toBe(false);
    expect(result.error).toEqual(expect.objectContaining({
      code: "PROCESSING_ERROR", // 実際の実装では PROCESSING_ERROR が返される
      message: "処理中にエラーが発生しました",
      timestamp: expect.any(String),
      details: "Redis connection failed",
    }));
  });
});