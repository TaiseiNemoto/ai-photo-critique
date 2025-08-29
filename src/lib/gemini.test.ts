import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GoogleGenAI } from "@google/genai";
import { GeminiClient } from "./gemini";

/**
 * Geminiクライアントテスト
 * t-wada手法: テストファースト開発
 */

// GoogleGenAIをモック
vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn(),
}));

const mockGenerateContent = vi.fn();
const mockGoogleGenAI = vi.mocked(GoogleGenAI);

beforeEach(() => {
  vi.clearAllMocks();

  // GoogleGenAIのモック設定
  mockGoogleGenAI.mockImplementation(
    () =>
      ({
        models: {
          generateContent: mockGenerateContent,
        },
      }) as unknown as InstanceType<typeof GoogleGenAI>,
  );

  // 環境変数の設定
  process.env.GOOGLE_AI_API_KEY = "test-api-key";
});

afterEach(() => {
  vi.clearAllTimers();
});

describe("GeminiClient", () => {
  describe("コンストラクタ", () => {
    it("デフォルト設定でクライアントが作成される", () => {
      const client = new GeminiClient();
      expect(client).toBeInstanceOf(GeminiClient);
    });

    it("カスタム設定でクライアントが作成される", () => {
      const customConfig = {
        model: "gemini-1.5-pro",
        temperature: 0.5,
        maxOutputTokens: 1024,
      };
      const client = new GeminiClient(customConfig);
      expect(client).toBeInstanceOf(GeminiClient);
    });
  });

  describe("analyzeCritique", () => {
    it("正常な画像分析の場合、講評データを返す", async () => {
      // Arrange
      const mockResponse = {
        text: `{
          "technique": "露出設定が適切で、シャープネスも良好です。",
          "composition": "三分割法を活用した構図で、バランスが取れています。",
          "color": "暖色系の色調が統一されており、心地よい印象を与えます。"
        }`,
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      const client = new GeminiClient();
      const imageBuffer = Buffer.from("fake image data");
      const mimeType = "image/jpeg";

      // Act
      const result = await client.analyzeCritique(imageBuffer, mimeType);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.technique).toBe(
        "露出設定が適切で、シャープネスも良好です。",
      );
      expect(result.data?.composition).toBe(
        "三分割法を活用した構図で、バランスが取れています。",
      );
      expect(result.data?.color).toBe(
        "暖色系の色調が統一されており、心地よい印象を与えます。",
      );
      expect(typeof result.processingTime).toBe("number");

      expect(mockGenerateContent).toHaveBeenCalledOnce();
    });

    it("APIキーが設定されていない場合、エラーを返す", async () => {
      // Arrange
      delete process.env.GOOGLE_AI_API_KEY;
      const client = new GeminiClient();
      const imageBuffer = Buffer.from("fake image data");
      const mimeType = "image/jpeg";

      // Act
      const result = await client.analyzeCritique(imageBuffer, mimeType);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "GOOGLE_AI_API_KEY environment variable is not set",
      );
    });

    it("Gemini APIが無効なレスポンスを返す場合、エラーを返す", async () => {
      // Arrange
      mockGenerateContent.mockResolvedValue({ text: "" });

      const client = new GeminiClient();
      const imageBuffer = Buffer.from("fake image data");
      const mimeType = "image/jpeg";

      // Act
      const result = await client.analyzeCritique(imageBuffer, mimeType);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("No response text received from Gemini API");
    });

    it("無効なJSON形式の場合、エラーを返す", async () => {
      // Arrange
      mockGenerateContent.mockResolvedValue({
        text: "This is not a valid JSON response",
      });

      const client = new GeminiClient();
      const imageBuffer = Buffer.from("fake image data");
      const mimeType = "image/jpeg";

      // Act
      const result = await client.analyzeCritique(imageBuffer, mimeType);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to parse critique response");
    });

    it("レート制限エラー（429）の場合、適切なエラーメッセージを返す", async () => {
      // Arrange
      mockGenerateContent.mockRejectedValue(new Error("429 Too Many Requests"));

      const client = new GeminiClient();
      const imageBuffer = Buffer.from("fake image data");
      const mimeType = "image/jpeg";

      // Act
      const result = await client.analyzeCritique(imageBuffer, mimeType);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "リクエスト制限に達しました。しばらく待ってから再試行してください。",
      );
    });

    it("認証エラー（401）の場合、適切なエラーメッセージを返す", async () => {
      // Arrange
      mockGenerateContent.mockRejectedValue(new Error("401 Unauthorized"));

      const client = new GeminiClient();
      const imageBuffer = Buffer.from("fake image data");
      const mimeType = "image/jpeg";

      // Act
      const result = await client.analyzeCritique(imageBuffer, mimeType);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe("APIキーが無効です。設定を確認してください。");
    });
  });

  describe("レート制限", () => {
    it("15リクエスト/分の制限を適切に処理する", async () => {
      // Arrange
      mockGenerateContent.mockResolvedValue({
        text: `{
          "technique": "テスト",
          "composition": "テスト",
          "color": "テスト"
        }`,
      });

      const client = new GeminiClient();
      const imageBuffer = Buffer.from("fake image data");
      const mimeType = "image/jpeg";

      // Act - 15回連続リクエスト
      const promises = [];
      for (let i = 0; i < 15; i++) {
        promises.push(client.analyzeCritique(imageBuffer, mimeType));
      }

      const results = await Promise.all(promises);

      // Assert
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });

      expect(mockGenerateContent).toHaveBeenCalledTimes(15);
    });
  });

  describe("parseCritiqueResponse（プライベートメソッドのテスト）", () => {
    it("必須フィールドが欠けている場合のエラーハンドリング", async () => {
      // Arrange
      mockGenerateContent.mockResolvedValue({
        text: `{
          "technique": "テスト技術",
          "composition": "テスト構図"
        }`,
      });

      const client = new GeminiClient();
      const imageBuffer = Buffer.from("fake image data");
      const mimeType = "image/jpeg";

      // Act
      const result = await client.analyzeCritique(imageBuffer, mimeType);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain("Required critique fields missing");
    });

    it("overallフィールドがオプショナルであることを確認", async () => {
      // Arrange
      mockGenerateContent.mockResolvedValue({
        text: `{
          "technique": "テスト技術",
          "composition": "テスト構図", 
          "color": "テスト色彩",
          "overall": "全体的な評価"
        }`,
      });

      const client = new GeminiClient();
      const imageBuffer = Buffer.from("fake image data");
      const mimeType = "image/jpeg";

      // Act
      const result = await client.analyzeCritique(imageBuffer, mimeType);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.overall).toBe("全体的な評価");
    });
  });

  describe("testConnection", () => {
    it("APIキーが有効な場合、true を返す", async () => {
      // Arrange
      mockGenerateContent.mockResolvedValue({
        text: "Connection test successful",
      });
      const client = new GeminiClient();

      // Act
      const result = await client.testConnection();

      // Assert
      expect(result).toBe(true);
    });

    it("APIキーが未設定の場合、false を返す", async () => {
      // Arrange
      delete process.env.GOOGLE_AI_API_KEY;
      const client = new GeminiClient();

      // Act
      const result = await client.testConnection();

      // Assert
      expect(result).toBe(false);
    });

    it("API呼び出しが失敗した場合、false を返す", async () => {
      // Arrange
      mockGenerateContent.mockRejectedValue(new Error("API call failed"));
      const client = new GeminiClient();

      // Act
      const result = await client.testConnection();

      // Assert
      expect(result).toBe(false);
    });
  });
});
