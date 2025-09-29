"use server";

import { uploadImageCore, type UploadResult } from "@/lib/upload";
import { generateCritiqueCore } from "@/lib/critique-core";
import type { CritiqueResult } from "@/types/upload";
// 統合結果の型定義
export interface IntegratedResult {
  upload: UploadResult;
  critique: CritiqueResult;
}

/**
 * 画像アップロードとAI講評生成を統合したServer Action（リファクタリング版）
 *
 * 責任: 統合処理の管理のみ（具体的な処理は委譲）
 *
 * @param formData - アップロードされた画像を含むFormData
 * @returns アップロード結果とAI講評結果の両方
 */
export async function uploadImageWithCritique(
  formData: FormData,
): Promise<IntegratedResult> {
  try {
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

    // 講評生成処理（最適化：既処理EXIF データを再利用）
    const critiqueResult = await generateCritiqueCore(
      formData,
      uploadResult.data?.exifData,
    );

    return {
      upload: uploadResult,
      critique: critiqueResult,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "処理中にエラーが発生しました";

    return {
      upload: { success: false, error: errorMessage },
      critique: { success: false, error: errorMessage },
    };
  }
}
