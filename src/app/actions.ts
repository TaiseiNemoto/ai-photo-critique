"use server";

import { extractExifData } from "@/lib/exif";
import { processImage } from "@/lib/image";
import { generatePhotoCritiqueWithRetry } from "@/lib/critique";
import type { ExifData, CritiqueResult } from "@/types/upload";

/**
 * 画像アップロードの結果を表す型
 */
export interface UploadResult {
  success: boolean;
  data?: {
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
 * フォームから画像ファイルを抽出し、バリデーションを行う
 */
function extractAndValidateFile(formData: FormData): File | null {
  const file = formData.get("image") as File;

  if (!file || file.size === 0) {
    return null;
  }

  return file;
}

/**
 * 処理済み画像をbase64データURLに変換する
 */
async function convertToDataUrl(
  processedFile: File,
  fileType: string,
): Promise<string> {
  const arrayBuffer = await processedFile.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return `data:${fileType};base64,${base64}`;
}

/**
 * 画像アップロード処理のServer Action
 *
 * @param formData - アップロードされた画像を含むFormData
 * @returns 処理結果（成功時はEXIFデータと処理済み画像、失敗時はエラーメッセージ）
 */
export async function uploadImage(formData: FormData): Promise<UploadResult> {
  try {
    // ファイルの抽出と基本検証
    const file = extractAndValidateFile(formData);
    if (!file) {
      return {
        success: false,
        error: "ファイルが選択されていません",
      };
    }

    // EXIF抽出と画像処理を並列実行（パフォーマンス向上）
    const [exifData, processedImageResult] = await Promise.all([
      extractExifData(file),
      processImage(file),
    ]);

    // デバッグ用：EXIF抽出結果をログ出力
    console.log("EXIF抽出結果:", exifData);

    // 処理済み画像をbase64データURLに変換
    const dataUrl = await convertToDataUrl(
      processedImageResult.processedFile,
      processedImageResult.processedFile.type,
    );

    return {
      success: true,
      data: {
        exifData,
        processedImage: {
          dataUrl,
          originalSize: processedImageResult.originalSize,
          processedSize: processedImageResult.processedSize,
        },
      },
    };
  } catch (error) {
    // エラーログ出力（デバッグ用）
    console.error("Upload error:", error);

    // ユーザーフレンドリーなエラーメッセージを返却
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
    // ファイルの抽出と基本検証
    const file = extractAndValidateFile(formData);
    if (!file) {
      return {
        success: false,
        error: "ファイルが選択されていません",
      };
    }

    // ファイルの種類確認
    if (!file.type.startsWith("image/")) {
      return {
        success: false,
        error: "画像ファイルを選択してください",
      };
    }

    // 画像をBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // AI講評生成（再試行機能付き）
    const result = await generatePhotoCritiqueWithRetry(buffer, file.type, 1);

    return result;
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
    // ファイル検証を一回だけ実行
    const file = extractAndValidateFile(formData);
    if (!file) {
      const errorResult = {
        success: false as const,
        error: "ファイルが選択されていません",
      };
      return {
        upload: errorResult,
        critique: errorResult,
      };
    }

    if (!file.type.startsWith("image/")) {
      const errorResult = {
        success: false as const,
        error: "画像ファイルを選択してください",
      };
      return {
        upload: errorResult,
        critique: errorResult,
      };
    }

    // ファイル読み込みを一回だけ実行
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // EXIF抽出、画像処理、AI講評生成を並列実行
    const [exifData, processedImageResult, critiqueResult] = await Promise.all([
      extractExifData(file),
      processImage(file),
      generatePhotoCritiqueWithRetry(buffer, file.type, 1),
    ]);

    // 処理済み画像をbase64データURLに変換
    const dataUrl = await convertToDataUrl(
      processedImageResult.processedFile,
      processedImageResult.processedFile.type,
    );

    const uploadResult: UploadResult = {
      success: true,
      data: {
        exifData,
        processedImage: {
          dataUrl,
          originalSize: processedImageResult.originalSize,
          processedSize: processedImageResult.processedSize,
        },
      },
    };

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
