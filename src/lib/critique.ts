import { geminiClient } from "./gemini";
import type { CritiqueResult } from "@/types/upload";

/**
 * 画像の講評生成に特化した関数
 * Geminiクライアントのラッパー関数として機能
 */
export async function generatePhotoCritique(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<CritiqueResult> {
  const startTime = Date.now();

  try {
    // サポートされている画像形式の確認
    const supportedFormats = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
    ];
    if (!supportedFormats.includes(mimeType)) {
      return {
        success: false,
        error: `サポートされていない画像形式です: ${mimeType}`,
        processingTime: Date.now() - startTime,
      };
    }

    // 画像サイズの確認（20MB制限）
    if (imageBuffer.length > 20 * 1024 * 1024) {
      return {
        success: false,
        error: "画像サイズが20MBを超えています",
        processingTime: Date.now() - startTime,
      };
    }

    // Geminiクライアントを使用してAI講評生成
    const result = await geminiClient.analyzeCritique(imageBuffer, mimeType);

    // 成功時の追加検証
    if (result.success && result.data) {
      // 各講評の文字数チェック（50-100文字の範囲推奨）
      const { technique, composition, color } = result.data;

      if (technique.length < 10 || technique.length > 200) {
        console.warn("技術面講評の文字数が範囲外:", technique.length);
      }
      if (composition.length < 10 || composition.length > 200) {
        console.warn("構図面講評の文字数が範囲外:", composition.length);
      }
      if (color.length < 10 || color.length > 200) {
        console.warn("色彩面講評の文字数が範囲外:", color.length);
      }
    }

    return result;
  } catch (error) {
    console.error("Photo critique generation failed:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "講評生成中に予期しないエラーが発生しました",
      processingTime: Date.now() - startTime,
    };
  }
}

/**
 * 画像講評生成の再試行機能付きラッパー
 */
export async function generatePhotoCritiqueWithRetry(
  imageBuffer: Buffer,
  mimeType: string,
  maxRetries: number = 1,
): Promise<CritiqueResult> {
  let lastError: CritiqueResult | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await generatePhotoCritique(imageBuffer, mimeType);

      // 成功した場合は即座に返す
      if (result.success) {
        if (attempt > 0) {
          console.log(`講評生成成功（${attempt + 1}回目の試行）`);
        }
        return result;
      }

      // 最後の試行でない場合は少し待機
      if (attempt < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 5000); // 指数バックオフ（最大5秒）
        console.log(
          `講評生成失敗、${waitTime}ms後に再試行（${attempt + 1}/${maxRetries + 1}）`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      lastError = result;
    } catch (error) {
      const errorResult: CritiqueResult = {
        success: false,
        error:
          error instanceof Error ? error.message : "不明なエラーが発生しました",
        processingTime: 0,
      };

      if (attempt === maxRetries) {
        return errorResult;
      }

      lastError = errorResult;
    }
  }

  // すべての試行が失敗した場合、最後のエラーを返す
  return (
    lastError || {
      success: false,
      error: "講評生成に失敗しました",
      processingTime: 0,
    }
  );
}

/**
 * 講評データの品質チェック
 */

