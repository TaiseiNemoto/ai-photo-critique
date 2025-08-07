import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generatePhotoCritique,
  generatePhotoCritiqueWithRetry,
  validateCritiqueQuality,
} from "./critique";
import * as geminiModule from "./gemini";
import type { CritiqueResult, CritiqueData } from "@/types/upload";

// Geminiクライアントをモック化
vi.mock("./gemini", () => ({
  geminiClient: {
    analyzeCritique: vi.fn(),
  },
}));

// モックデータの定義
const validCritiqueData: CritiqueData = {
  technique:
    "F値2.8で背景をよくぼかせています。シャッタースピードも適切で手ブレがありません。ISO感度も低く抑えられており、ノイズの少ないクリアな画質を実現できています。",
  composition:
    "三分割法を使って被写体を配置しており、バランスの取れた構図になっています。前景・中景・後景の使い分けも効果的で、奥行きのある写真に仕上がっています。",
  color:
    "暖色系の色温度設定で温かみのある雰囲気を演出できています。色彩の統一感があり、見る人に心地よい印象を与えます。明暗のコントラストも適度で立体感があります。",
};

const mockSuccessResult: CritiqueResult = {
  success: true,
  data: validCritiqueData,
  processingTime: 3000,
};

const mockErrorResult: CritiqueResult = {
  success: false,
  error: "AI講評の生成中にエラーが発生しました",
  processingTime: 1500,
};

// テスト用のBufferとmimeTypeを作成
const createTestImageBuffer = (sizeInBytes: number = 1024): Buffer => {
  return Buffer.alloc(sizeInBytes, 0);
};

const validMimeType = "image/jpeg";
const invalidMimeType = "image/gif";

describe("generatePhotoCritique", () => {
  const mockGeminiClient = vi.mocked(geminiModule.geminiClient);

  beforeEach(() => {
    vi.clearAllMocks();
    // コンソールログをモック化してテスト出力をクリーンに
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("正常な画像に対して講評を生成する", async () => {
    // Arrange
    const imageBuffer = createTestImageBuffer();
    mockGeminiClient.analyzeCritique.mockResolvedValue(mockSuccessResult);

    // Act
    const result = await generatePhotoCritique(imageBuffer, validMimeType);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validCritiqueData);
    expect(result.processingTime).toBeGreaterThanOrEqual(0);
    expect(mockGeminiClient.analyzeCritique).toHaveBeenCalledWith(
      imageBuffer,
      validMimeType,
    );
  });

  it("不正な画像形式でエラーを返す", async () => {
    // Arrange
    const imageBuffer = createTestImageBuffer();

    // Act
    const result = await generatePhotoCritique(imageBuffer, invalidMimeType);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain("サポートされていない画像形式");
    expect(result.error).toContain(invalidMimeType);
    expect(result.processingTime).toBeGreaterThanOrEqual(0);
    expect(mockGeminiClient.analyzeCritique).not.toHaveBeenCalled();
  });

  it("画像サイズが20MBを超える場合エラーを返す", async () => {
    // Arrange
    const oversizedBuffer = createTestImageBuffer(21 * 1024 * 1024); // 21MB

    // Act
    const result = await generatePhotoCritique(oversizedBuffer, validMimeType);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain("20MBを超えています");
    expect(result.processingTime).toBeGreaterThanOrEqual(0);
    expect(mockGeminiClient.analyzeCritique).not.toHaveBeenCalled();
  });

  it("Gemini API エラー時に適切にハンドリングする", async () => {
    // Arrange
    const imageBuffer = createTestImageBuffer();
    mockGeminiClient.analyzeCritique.mockResolvedValue(mockErrorResult);

    // Act
    const result = await generatePhotoCritique(imageBuffer, validMimeType);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe(mockErrorResult.error);
    expect(result.processingTime).toBeGreaterThanOrEqual(0);
    expect(mockGeminiClient.analyzeCritique).toHaveBeenCalledWith(
      imageBuffer,
      validMimeType,
    );
  });

  it("Gemini API が例外を投げた場合のエラーハンドリング", async () => {
    // Arrange
    const imageBuffer = createTestImageBuffer();
    const errorMessage = "Network timeout";
    mockGeminiClient.analyzeCritique.mockRejectedValue(new Error(errorMessage));

    // Act
    const result = await generatePhotoCritique(imageBuffer, validMimeType);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe(errorMessage);
    expect(result.processingTime).toBeGreaterThanOrEqual(0);
  });

  it("未知の例外をキャッチしてデフォルトメッセージを返す", async () => {
    // Arrange
    const imageBuffer = createTestImageBuffer();
    mockGeminiClient.analyzeCritique.mockRejectedValue("Unknown error");

    // Act
    const result = await generatePhotoCritique(imageBuffer, validMimeType);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain("予期しないエラーが発生しました");
    expect(result.processingTime).toBeGreaterThanOrEqual(0);
  });

  it("極端に短い講評に対して警告を出す", async () => {
    // Arrange
    const imageBuffer = createTestImageBuffer();
    const shortCritiqueData: CritiqueData = {
      technique: "短い", // 2文字
      composition: "短い",
      color: "短い",
    };
    const shortCritiqueResult: CritiqueResult = {
      success: true,
      data: shortCritiqueData,
      processingTime: 1000,
    };
    mockGeminiClient.analyzeCritique.mockResolvedValue(shortCritiqueResult);

    // Act
    const result = await generatePhotoCritique(imageBuffer, validMimeType);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual(shortCritiqueData);
    expect(console.warn).toHaveBeenCalledTimes(3); // 3つの講評すべてが短い
  });

  it("極端に長い講評に対して警告を出す", async () => {
    // Arrange
    const imageBuffer = createTestImageBuffer();
    const longText = "あ".repeat(250); // 250文字
    const longCritiqueData: CritiqueData = {
      technique: longText,
      composition: longText,
      color: longText,
    };
    const longCritiqueResult: CritiqueResult = {
      success: true,
      data: longCritiqueData,
      processingTime: 1000,
    };
    mockGeminiClient.analyzeCritique.mockResolvedValue(longCritiqueResult);

    // Act
    const result = await generatePhotoCritique(imageBuffer, validMimeType);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual(longCritiqueData);
    expect(console.warn).toHaveBeenCalledTimes(3); // 3つの講評すべてが長い
  });
});

describe("generatePhotoCritiqueWithRetry", () => {
  const mockGeminiClient = vi.mocked(geminiModule.geminiClient);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("初回で成功した場合、再試行しない", async () => {
    // Arrange
    const imageBuffer = createTestImageBuffer();
    mockGeminiClient.analyzeCritique.mockResolvedValue(mockSuccessResult);

    // Act
    const promise = generatePhotoCritiqueWithRetry(
      imageBuffer,
      validMimeType,
      2,
    );
    const result = await promise;

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validCritiqueData);
    expect(mockGeminiClient.analyzeCritique).toHaveBeenCalledTimes(1);
  });

  it("1回目失敗、2回目成功の場合", async () => {
    // Arrange
    const imageBuffer = createTestImageBuffer();
    mockGeminiClient.analyzeCritique
      .mockResolvedValueOnce(mockErrorResult)
      .mockResolvedValueOnce(mockSuccessResult);

    // Act - タイマーを非同期で進める
    const promise = generatePhotoCritiqueWithRetry(
      imageBuffer,
      validMimeType,
      1,
    );

    // Promise.resolve()を使って待機時間をスキップ
    await vi.runAllTimersAsync();
    const result = await promise;

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validCritiqueData);
    expect(mockGeminiClient.analyzeCritique).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("講評生成成功（2回目の試行）"),
    );
  });

  it("すべての試行が失敗した場合、最後のエラーを返す", async () => {
    // Arrange
    const imageBuffer = createTestImageBuffer();
    mockGeminiClient.analyzeCritique.mockResolvedValue(mockErrorResult);

    // Act - タイマーを非同期で進める
    const promise = generatePhotoCritiqueWithRetry(
      imageBuffer,
      validMimeType,
      2,
    );
    await vi.runAllTimersAsync();
    const result = await promise;

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe(mockErrorResult.error);
    expect(mockGeminiClient.analyzeCritique).toHaveBeenCalledTimes(3); // 初回 + 2回の再試行
  });

  it("例外が発生した場合の再試行動作", async () => {
    // Arrange
    const imageBuffer = createTestImageBuffer();
    const networkError = new Error("Network timeout");
    mockGeminiClient.analyzeCritique
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce(mockSuccessResult);

    // Act - タイマーを非同期で進める
    const promise = generatePhotoCritiqueWithRetry(
      imageBuffer,
      validMimeType,
      1,
    );
    await vi.runAllTimersAsync();
    const result = await promise;

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toEqual(validCritiqueData);
    expect(mockGeminiClient.analyzeCritique).toHaveBeenCalledTimes(2);
  });

  it("指数バックオフの動作確認", async () => {
    // Arrange
    const imageBuffer = createTestImageBuffer();
    mockGeminiClient.analyzeCritique.mockResolvedValue(mockErrorResult);

    // Act - タイマーを非同期で進める
    const promise = generatePhotoCritiqueWithRetry(
      imageBuffer,
      validMimeType,
      3,
    );
    await vi.runAllTimersAsync();
    await promise;

    // Assert - 指数バックオフのログメッセージを確認
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("1000ms後に再試行"),
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("2000ms後に再試行"),
    );
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("4000ms後に再試行"),
    );
  });
});

describe("validateCritiqueQuality", () => {
  it("正常な講評データを検証する", () => {
    // Act
    const result = validateCritiqueQuality(validCritiqueData);

    // Assert
    expect(result.isValid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("空の講評を検出する", () => {
    // Arrange
    const emptyCritiqueData = {
      technique: "",
      composition: "構図の講評です",
      color: "色彩の講評です",
    };

    // Act
    const result = validateCritiqueQuality(emptyCritiqueData);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain("技術面の講評が空です");
  });

  it("短すぎる講評を検出する", () => {
    // Arrange
    const shortCritiqueData = {
      technique: "短い", // 2文字
      composition: "これは十分な長さの構図講評です",
      color: "これは十分な長さの色彩講評です",
    };

    // Act
    const result = validateCritiqueQuality(shortCritiqueData);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain("技術面の講評が短すぎます");
  });

  it("長すぎる講評を検出する", () => {
    // Arrange
    const longText = "あ".repeat(350); // 350文字
    const longCritiqueData = {
      technique: longText,
      composition: "正常な長さの構図講評です",
      color: "正常な長さの色彩講評です",
    };

    // Act
    const result = validateCritiqueQuality(longCritiqueData);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain("技術面の講評が長すぎます");
  });

  it("重複する講評内容を検出する", () => {
    // Arrange
    const duplicatedText = "同じ内容の講評です";
    const duplicatedCritiqueData = {
      technique: duplicatedText,
      composition: duplicatedText, // 重複
      color: "異なる色彩の講評です",
    };

    // Act
    const result = validateCritiqueQuality(duplicatedCritiqueData);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain("講評内容に重複があります");
  });

  it("複数の問題を同時に検出する", () => {
    // Arrange
    const problematicCritiqueData = {
      technique: "", // 空
      composition: "短い", // 短すぎる
      color: "あ".repeat(350), // 長すぎる
    };

    // Act
    const result = validateCritiqueQuality(problematicCritiqueData);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.issues).toHaveLength(3);
    expect(result.issues).toContain("技術面の講評が空です");
    expect(result.issues).toContain("構図面の講評が短すぎます");
    expect(result.issues).toContain("色彩面の講評が長すぎます");
  });

  it("trimされた空白のみの講評を検出する", () => {
    // Arrange
    const whitespaceCritiqueData = {
      technique: "   ", // 空白のみ
      composition: "正常な構図講評です",
      color: "正常な色彩講評です",
    };

    // Act
    const result = validateCritiqueQuality(whitespaceCritiqueData);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.issues).toContain("技術面の講評が空です");
  });
});
