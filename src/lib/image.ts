import imageCompression from "browser-image-compression";

export interface ProcessedImageResult {
  originalFile: File;
  processedFile: File;
  originalSize: number;
  processedSize: number;
}

export async function processImage(file: File): Promise<ProcessedImageResult> {
  // サポートされているファイル形式をチェック
  const supportedTypes = ["image/jpeg", "image/jpg", "image/png", "image/tiff"];
  if (!supportedTypes.includes(file.type)) {
    throw new Error(`サポートされていないファイル形式です: ${file.type}`);
  }

  // ファイル名の検証
  if (!file.name) {
    throw new Error("無効なファイルです: ファイル名が空です");
  }

  // ファイルサイズ制限（10MB）
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSizeBytes) {
    throw new Error("ファイルサイズが制限を超えています（最大10MB）");
  }

  try {
    // 圧縮オプション
    const options = {
      maxSizeMB: 2, // 最大2MB
      maxWidthOrHeight: 1024, // 最大1024px
      useWebWorker: true, // WebWorkerを使用（非ブロッキング）
      quality: 0.8, // 品質80%
    };

    const processedFile = await imageCompression(file, options);

    return {
      originalFile: file,
      processedFile,
      originalSize: file.size,
      processedSize: processedFile.size,
    };
  } catch (error) {
    throw new Error(
      `画像処理に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
