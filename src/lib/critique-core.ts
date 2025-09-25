import { generatePhotoCritiqueWithRetry } from "@/lib/critique";
import { kvClient } from "@/lib/kv";
import { ErrorHandler } from "@/lib/error-handling";
import { ErrorCode } from "@/lib/error-codes";
import type { CritiqueResult, ExifData } from "@/types/upload";
import type { AppError } from "@/types/error";
import { extractAndValidateFile } from "./validation";
import { extractExifFromFormData } from "./exif";

/**
 * AI講評生成処理のコア関数（画像ファイル付き）
 *
 * @param formData - 講評対象の画像を含むFormData
 * @param preProcessedExifData - 既に処理済みのEXIFデータ（重複処理最適化用）
 * @returns AI講評結果（成功時は3軸評価データ、失敗時はエラーメッセージ）
 */
export async function generateCritiqueCore(
  formData: FormData,
  preProcessedExifData?: ExifData,
): Promise<CritiqueResult> {
  try {
    // ファイルの抽出と基本検証
    const file = extractAndValidateFile(formData);
    if (!file) {
      return {
        success: false,
        error: ErrorHandler.createError(ErrorCode.FILE_NOT_SELECTED),
      };
    }

    // ファイルの種類確認
    if (!file.type || !file.type.startsWith("image/")) {
      return {
        success: false,
        error: ErrorHandler.createError(ErrorCode.INVALID_FILE_TYPE, "画像ファイルを選択してください"),
      };
    }

    // EXIF情報を取得（最適化：既処理データがあればそれを使用）
    const exifData = preProcessedExifData || extractExifFromFormData(formData);

    // ★ 最適化: 画像を1回だけBuffer変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // AI講評生成（再試行機能付き）
    const result = await generatePhotoCritiqueWithRetry(buffer, file.type, 1);

    // 講評が成功した場合、KVストレージに保存
    if (result.success && result.data) {
      // 共有用IDを生成
      const shareId = kvClient.generateId();

      // ★ 最適化: 既存のbufferを再利用してBase64変換
      const base64 = buffer.toString("base64");
      const imageData = `data:${file.type};base64,${base64}`;

      // 講評データを保存（画像データも含めて統合）
      await kvClient.saveCritique({
        id: shareId,
        filename: file.name,
        technique: result.data.technique,
        composition: result.data.composition,
        color: result.data.color,
        exifData: exifData as Record<string, unknown>,
        imageData: imageData,
        uploadedAt: new Date().toISOString(),
      });

      // 共有データを保存
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24時間後
      await kvClient.saveShare({
        id: shareId,
        critiqueId: shareId,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      });

      // レスポンスにshareIdを追加
      const enhancedResult: CritiqueResult = {
        ...result,
        data: {
          ...result.data,
          shareId: shareId,
        },
      };

      return enhancedResult;
    }

    // 成功・失敗問わず、講評処理の結果をそのまま返す
    return result;
  } catch (error) {
    console.error("Critique core error:", error);

    let appError: AppError;

    if (error instanceof Error) {
      // Geminiエラーの詳細分析
      const geminiErrorCode = ErrorHandler.analyzeGeminiError(error);
      if (geminiErrorCode !== ErrorCode.GEMINI_API_ERROR) {
        appError = ErrorHandler.createError(geminiErrorCode, error.message);
      } else {
        // 一般的なファイル検証エラーの分析
        const fileErrorCode = ErrorHandler.analyzeFileValidationError(error);
        if (fileErrorCode !== ErrorCode.INVALID_FILE_TYPE) {
          appError = ErrorHandler.createError(fileErrorCode, error.message);
        } else {
          // その他の処理エラー
          appError = ErrorHandler.createError(ErrorCode.PROCESSING_ERROR, error.message);
        }
      }
    } else {
      appError = ErrorHandler.createError(
        ErrorCode.UNKNOWN_ERROR,
        typeof error === "string" ? error : "AI講評の生成中にエラーが発生しました"
      );
    }

    return {
      success: false,
      error: appError,
    };
  }
}
