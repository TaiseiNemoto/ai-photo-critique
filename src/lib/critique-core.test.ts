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