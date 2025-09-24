import type { UploadResult } from "@/lib/upload";
import type { CritiqueResult } from "@/types/upload";
import { uploadImageCore } from "@/lib/upload";
import { generateCritiqueCore } from "@/lib/critique-core";
import { ErrorHandler } from "@/lib/error-handling";

// 処理結果の統合型
export interface IntegratedResult {
  upload: UploadResult;
  critique: CritiqueResult;
}

/**
 * メイン処理ロジック（アップロード + 講評生成）
 * 責任: ビジネスロジックの実行順序管理
 */
export async function executeUploadAndCritique(
  formData: FormData,
): Promise<IntegratedResult> {
  // アップロード処理
  const uploadResult = await uploadImageCore(formData);

  if (!uploadResult.success) {
    return {
      upload: uploadResult,
      critique: {
        success: false,
        error: uploadResult.error || "アップロードに失敗しました",
      },
    };
  }

  // 講評生成処理（最適化：既処理EXIFデータを再利用）
  const critiqueResult = await generateCritiqueCore(
    formData,
    uploadResult.data?.exifData,
  );

  return {
    upload: uploadResult,
    critique: critiqueResult,
  };
}

/**
 * 処理時間計測ヘルパー
 * 責任: パフォーマンス計測とログ出力
 */
export async function measureProcessingTime<T>(
  processFunction: () => Promise<T>,
): Promise<T> {
  const startTime = Date.now();
  const result = await processFunction();
  const processingTime = Date.now() - startTime;

  console.log(`Integrated processing completed in ${processingTime}ms`);
  return result;
}

/**
 * 統一エラーハンドリング
 * 責任: エラーの統一的な処理とレスポンス生成
 */
export function handleIntegratedError(error: unknown): IntegratedResult {
  const errorResult = ErrorHandler.handleServerActionError(error);
  const errorMessage = !errorResult.success
    ? errorResult.error.message
    : "予期しないエラーが発生しました";

  return {
    upload: {
      success: false,
      error: errorMessage,
    },
    critique: {
      success: false,
      error: errorMessage,
    },
  };
}
