import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * Geminiクライアントテスト
 * t-wada手法: テストファースト開発
 */

const mockGenerateContent = vi.fn();

// GoogleGenAIをモック
vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  // 環境変数の設定
  process.env.GOOGLE_AI_API_KEY = "test-api-key";
});

afterEach(() => {
  vi.clearAllTimers();
});

describe("GeminiClient", () => {
  describe("コンストラクタ", () => {
    it("デフォルト設定でクライアントが作成される", async () => {
      const { GeminiClient } = await import("./gemini");
      const client = new GeminiClient();
      expect(client).toBeInstanceOf(GeminiClient);
    });

    it("カスタム設定でクライアントが作成される", async () => {
      const { GeminiClient } = await import("./gemini");
      const customConfig = {
        model: "gemini-1.5-pro",
        temperature: 0.5,
        maxOutputTokens: 1024,
      };
      const client = new GeminiClient(customConfig);
      expect(client).toBeInstanceOf(GeminiClient);
    });
  });

  describe("testConnection", () => {
    it("APIキーが設定されている場合、接続テストが成功する", async () => {
      const { GeminiClient } = await import("./gemini");

      // モックのレスポンス設定
      mockGenerateContent.mockResolvedValue({
        text: "Hello, test response",
      });

      const client = new GeminiClient();
      const result = await client.testConnection();

      expect(result).toBe(true);
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: "gemini-2.0-flash-001",
        contents: "Hello, this is a connection test.",
      });
    });

    it("APIキーが設定されていない場合、接続テストが失敗する", async () => {
      const { GeminiClient } = await import("./gemini");

      // APIキーを削除
      delete process.env.GOOGLE_AI_API_KEY;

      const client = new GeminiClient();
      const result = await client.testConnection();

      expect(result).toBe(false);
    });

    it("API呼び出しが失敗した場合、接続テストが失敗する", async () => {
      const { GeminiClient } = await import("./gemini");

      // モックでエラーを発生させる
      mockGenerateContent.mockRejectedValue(new Error("API Error"));

      const client = new GeminiClient();
      const result = await client.testConnection();

      expect(result).toBe(false);
    });
  });

  describe("analyzeCritique", () => {
    const mockImageBuffer = Buffer.from("fake image data");
    const mockMimeType = "image/jpeg";

    it("正常な画像分析の場合、講評データを返す", async () => {
      const { GeminiClient } = await import("./gemini");

      // モックのレスポンス設定
      const mockResponse = {
        text: JSON.stringify({
          technique: "露出が適切で、ピントも正確に合っています。",
          composition: "三分割法を活用した安定した構図になっています。",
          color: "色のバランスが良く、自然な色調が美しいです。",
        }),
      };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const client = new GeminiClient();
      const result = await client.analyzeCritique(
        mockImageBuffer,
        mockMimeType,
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.technique).toContain("露出");
      expect(result.data?.composition).toContain("構図");
      expect(result.data?.color).toContain("色");
      expect(typeof result.processingTime).toBe("number");
    });
  });
});
