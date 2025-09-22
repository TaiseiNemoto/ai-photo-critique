// EXIF抽出はクライアントサイドで実行済み（サーバーサイド重複処理を排除）
import { processImage } from "@/lib/image";
// import { kvClient } from "@/lib/kv"; // 重複保存解消のため削除
import type { ExifData, ProcessedImageData } from "@/types/upload";
import {
  extractStringFromFormData,
} from "./form-utils";
import { extractAndValidateFile } from "./validation";

/**
 * 画像アップロードの結果を表す型
 */
export interface UploadResult {
  success: boolean;
  data?: {
    id: string;
    exifData: ExifData;
    processedImage: ProcessedImageData;
  };
  error?: string;
}


/**
 * 処理済みファイルをBase64データURLに変換
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
 * 一意のIDを生成
 */
function generateUploadId(): string {
  return `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 画像アップロード処理のコア関数
 *
 * @param formData - アップロードされた画像を含むFormData
 * @returns 処理結果（成功時はEXIFデータと処理済み画像、失敗時はエラーメッセージ）
 */
export async function uploadImageCore(
  formData: FormData,
): Promise<UploadResult> {
  try {
    // ファイルの抽出と基本検証
    const file = extractAndValidateFile(formData);
    if (!file) {
      return {
        success: false,
        error: "ファイルが選択されていません",
      };
    }

    // クライアントから送信されたEXIF情報を取得
    const exifDataResult = extractStringFromFormData(formData, "exifData", {
      optional: true,
    });
    let exifData: ExifData = {}; // デフォルト空オブジェクト

    if (exifDataResult.success && exifDataResult.data) {
      try {
        exifData = JSON.parse(exifDataResult.data);
        console.log("Using client-side EXIF data");
      } catch (error) {
        console.warn(
          "Invalid EXIF data from client, using empty object:",
          error,
        );
        exifData = {}; // EXIF欠損を許容
      }
    } else {
      console.log("No client EXIF data provided, using empty object");
    }

    // 画像処理のみ実行（EXIF抽出は削除）
    const processedImageResult = await processImage(file);

    // 処理済み画像をbase64データURLに変換
    const dataUrl = await convertToDataUrl(
      processedImageResult.processedFile,
      processedImageResult.processedFile.type,
    );

    // 一意のIDを生成
    const uploadId = generateUploadId();

    // 注意: 以前はアップロードデータをKVに保存していたが、重複保存解消のため削除
    // const uploadData = { ... }; // 削除済み

    // 注意: 以前はKVにアップロードデータを保存していたが、
    // 重複保存解消のため削除。画像データは講評時にCritiqueDataに統合保存される。
    // await kvClient.saveUpload(uploadId, uploadData); // 削除

    // 成功レスポンス
    return {
      success: true,
      data: {
        id: uploadId,
        exifData,
        processedImage: {
          dataUrl,
          originalSize: processedImageResult.originalSize,
          processedSize: processedImageResult.processedSize,
        },
      },
    };
  } catch (error) {
    console.error("Upload core error:", error);

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
