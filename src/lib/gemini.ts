import { GoogleGenAI } from "@google/genai";
import type { CritiqueContent, CritiqueResult } from "@/types/upload";

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY || "",
});

export interface GeminiConfig {
  model: string;
  maxOutputTokens: number;
  temperature: number;
}

const defaultConfig: GeminiConfig = {
  model: "gemini-2.0-flash-001",
  maxOutputTokens: 2048,
  temperature: 0.7,
};

export class GeminiClient {
  private config: GeminiConfig;
  private requestCount: number = 0;
  private lastRequestTime: number = 0;

  constructor(config?: Partial<GeminiConfig>) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * レート制限チェック（Google AI Studio: 15 RPM）
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    // 1分間に15リクエストの制限をチェック
    if (timeSinceLastRequest < 60000 && this.requestCount >= 15) {
      const waitTime = 60000 - timeSinceLastRequest;
      console.warn(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    // カウンターのリセット（1分経過した場合）
    if (timeSinceLastRequest >= 60000) {
      this.requestCount = 0;
    }

    this.requestCount++;
    this.lastRequestTime = now;
  }

  async analyzeCritique(
    imageBuffer: Buffer,
    mimeType: string,
  ): Promise<CritiqueResult> {
    const startTime = Date.now();

    try {
      if (!process.env.GOOGLE_AI_API_KEY) {
        throw new Error("GOOGLE_AI_API_KEY environment variable is not set");
      }

      // レート制限チェック
      await this.checkRateLimit();

      const prompt = this.buildCritiquePrompt();

      // 画像データの準備
      const imageContent = {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: mimeType,
        },
      };

      // @google/genaiの正しいAPI使用方法
      const result = await genAI.models.generateContent({
        model: this.config.model,
        contents: [
          {
            parts: [{ text: prompt }, imageContent],
          },
        ],
        config: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxOutputTokens,
        },
      });

      const text = result.text;

      if (!text) {
        throw new Error("No response text received from Gemini API");
      }

      const critiqueData = this.parseCritiqueResponse(text);

      return {
        success: true,
        data: critiqueData,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error("Gemini API error:", error);

      let errorMessage = "Unknown error occurred";

      if (error instanceof Error) {
        // Gemini API特有のエラーハンドリング
        if (error.message.includes("429") || error.message.includes("quota")) {
          errorMessage =
            "リクエスト制限に達しました。しばらく待ってから再試行してください。";
        } else if (
          error.message.includes("401") ||
          error.message.includes("API key")
        ) {
          errorMessage = "APIキーが無効です。設定を確認してください。";
        } else if (error.message.includes("403")) {
          errorMessage = "アクセスが拒否されました。権限を確認してください。";
        } else if (error.message.includes("timeout")) {
          errorMessage =
            "リクエストがタイムアウトしました。再試行してください。";
        } else if (error.message.includes("network")) {
          errorMessage =
            "ネットワークエラーが発生しました。接続を確認してください。";
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
        processingTime: Date.now() - startTime,
      };
    }
  }

  private buildCritiquePrompt(): string {
    return `写真を3つの観点から分析し、日本語で建設的な講評を提供してください。

以下のJSON形式で回答してください：

{
  "technique": "技術面の講評（50-100文字、F値・シャッター速度・ISO・ピントなどについて）",
  "composition": "構図面の講評（50-100文字、被写体の配置・バランス・視線誘導などについて）",
  "color": "色彩面の講評（50-100文字、色の調和・明暗・雰囲気などについて）"
}

講評のガイドライン：
- 建設的で具体的なアドバイス
- 初心者から中級者向け
- 日本語で自然な表現
- 各項目50-100文字程度
- JSONフォーマット厳守`;
  }

  private parseCritiqueResponse(response: string): CritiqueContent {
    try {
      // JSON部分を抽出
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("JSON response not found");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // 必須フィールドの検証
      if (!parsed.technique || !parsed.composition || !parsed.color) {
        throw new Error("Required critique fields missing");
      }

      return {
        technique: String(parsed.technique),
        composition: String(parsed.composition),
        color: String(parsed.color),
        overall: parsed.overall ? String(parsed.overall) : undefined,
      };
    } catch (error) {
      throw new Error(
        `Failed to parse critique response: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!process.env.GOOGLE_AI_API_KEY) {
        return false;
      }

      const result = await genAI.models.generateContent({
        model: this.config.model,
        contents: "Hello, this is a connection test.",
      });

      return Boolean(result.text);
    } catch {
      return false;
    }
  }
}

export const geminiClient = new GeminiClient();
