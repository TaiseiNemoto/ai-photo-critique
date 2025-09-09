"use server";

import { uploadImageCore, type UploadResult } from "@/lib/upload";
import { generateCritiqueCore } from "@/lib/critique-core";
import type { CritiqueResult } from "@/types/upload";

/**
 * 画像アップロード処理のServer Action
 *
 * @param formData - アップロードされた画像を含むFormData
 * @returns 処理結果（成功時はEXIFデータと処理済み画像、失敗時はエラーメッセージ）
 */
export async function uploadImage(formData: FormData): Promise<UploadResult> {
  // ライブラリ関数を直接呼び出し（API Route経由を排除）
  return await uploadImageCore(formData);
}

/**
 * 画像に対するAI講評を生成するServer Action
 *
 * @param formData - 講評対象の画像を含むFormData
 * @returns AI講評結果（成功時は3軸評価データ、失敗時はエラーメッセージ）
 */
export async function generateCritique(
  formData: FormData,
): Promise<CritiqueResult> {
  // ライブラリ関数を直接呼び出し（API Route経由を排除）
  return await generateCritiqueCore(formData);
}

/**
 * 画像アップロードとAI講評生成を統合したServer Action（最適化版）
 *
 * @param formData - アップロードされた画像を含むFormData
 * @returns アップロード結果とAI講評結果の両方
 */
export async function uploadImageWithCritique(formData: FormData): Promise<{
  upload: UploadResult;
  critique: CritiqueResult;
}> {
  const startTime = Date.now();

  try {
    // アップロード処理を直接実行（ライブラリ関数呼び出し）
    const uploadResult = await uploadImageCore(formData);

    if (!uploadResult.success) {
      const errorResult = {
        success: false as const,
        error: uploadResult.error || "アップロードに失敗しました",
      };
      return {
        upload: uploadResult,
        critique: errorResult,
      };
    }

    // 講評生成処理にアップロードIDを追加（ライブラリ関数呼び出し）
    const critiqueFormData = new FormData();
    critiqueFormData.append("image", formData.get("image") as File);
    if (uploadResult.data?.id) {
      critiqueFormData.append("uploadId", uploadResult.data.id);
    }
    const critiqueResult = await generateCritiqueCore(critiqueFormData);

    console.log(
      `Integrated processing completed in ${Date.now() - startTime}ms`,
    );

    return {
      upload: uploadResult,
      critique: critiqueResult,
    };
  } catch (error) {
    console.error("Integrated processing error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "処理中にエラーが発生しました";

    const processingTime = Date.now() - startTime;

    return {
      upload: {
        success: false,
        error: errorMessage,
      },
      critique: {
        success: false,
        error: errorMessage,
        processingTime,
      },
    };
  }
}
