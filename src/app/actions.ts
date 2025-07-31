"use server";

import { extractExifData } from "@/lib/exif";
import { processImage } from "@/lib/image";
import type { ExifData } from "@/types/upload";

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
