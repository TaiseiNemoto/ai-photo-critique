"use server";

import type { ExifData, CritiqueResult } from "@/types/upload";

/**
 * 画像アップロードの結果を表す型
 */
export interface UploadResult {
  success: boolean;
  data?: {
    id: string;
    exifData: ExifData;
    processedImage: {
      dataUrl: string;
      originalSize: number;
      processedSize: number;
    };
  };
  error?: string;
}

/**
 * 画像アップロード処理のServer Action
 *
 * @param formData - アップロードされた画像を含むFormData
 * @returns 処理結果（成功時はEXIFデータと処理済み画像、失敗時はエラーメッセージ）
 */
export async function uploadImage(formData: FormData): Promise<UploadResult> {
  try {
    // APIエンドポイントに画像をアップロード
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "アップロードに失敗しました",
      };
    }

    const apiResponse = await response.json();

    if (!apiResponse.success) {
      return {
        success: false,
        error: apiResponse.error || "アップロードに失敗しました",
      };
    }

    // API Responseを既存の形式に変換
    return {
      success: true,
      data: {
        id: apiResponse.data.id,
        exifData: apiResponse.data.exifData,
        processedImage: apiResponse.data.processedImage,
      },
    };
  } catch (error) {
    console.error("Upload action error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "画像の処理中にエラーが発生しました";

    return {
      success: false,
      error: errorMessage,
    };
  }
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
  try {
    // APIエンドポイントに画像を送信して講評生成
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/critique`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || "講評生成に失敗しました",
      };
    }

    const apiResponse = await response.json();

    if (!apiResponse.success) {
      return {
        success: false,
        error: apiResponse.error || "講評生成に失敗しました",
      };
    }

    // API Responseをそのまま返却（形式は既に統一済み）
    return apiResponse;
  } catch (error) {
    console.error("Critique generation error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "AI講評の生成中にエラーが発生しました";

    return {
      success: false,
      error: errorMessage,
    };
  }
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
    // アップロード処理をAPI経由で実行
    const uploadResult = await uploadImage(formData);

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

    // 講評生成処理にアップロードIDを追加
    const critiqueFormData = new FormData();
    critiqueFormData.append("image", formData.get("image") as File);
    if (uploadResult.data?.id) {
      critiqueFormData.append("uploadId", uploadResult.data.id);
    }
    const critiqueResult = await generateCritique(critiqueFormData);

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
