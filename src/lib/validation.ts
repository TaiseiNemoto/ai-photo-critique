import { extractFileFromFormData } from "./form-utils";

export interface FileValidationResult {
  success: boolean;
  file?: File;
  error?: string;
}

/**
 * FormDataから画像ファイルを抽出・検証
 * ファイルサイズ・形式・存在性をチェック
 */
export function extractAndValidateImageFile(
  formData: FormData,
): FileValidationResult {
  const fileResult = extractFileFromFormData(formData, "image");

  if (!fileResult.success) {
    return {
      success: false,
      error: "画像ファイルが見つかりません",
    };
  }

  const file = fileResult.data;

  // ファイルサイズ制限（10MB）
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: "ファイルサイズが大きすぎます（最大10MB）",
    };
  }

  // ファイル形式チェック
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: "サポートされていないファイル形式です",
    };
  }

  return {
    success: true,
    file: file,
  };
}

/**
 * 後方互換性のための関数（既存コード用）
 * @deprecated extractAndValidateImageFileを使用してください
 */
export function extractAndValidateFile(formData: FormData): File | null {
  const result = extractAndValidateImageFile(formData);
  if (!result.success) {
    if (
      result.error?.includes("大きすぎます") ||
      result.error?.includes("サポートされていない")
    ) {
      throw new Error(result.error);
    }
    return null;
  }
  return result.file!;
}
