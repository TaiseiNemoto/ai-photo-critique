import sharp from "sharp";

export interface ProcessedImageResult {
  originalFile: File;
  processedFile: File;
  originalSize: number;
  processedSize: number;
}

export async function processImage(file: File): Promise<ProcessedImageResult> {
  // サポートされているファイル形式をチェック
  const supportedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/tiff",
    "image/webp",
    "image/heic",
  ];
  if (!supportedTypes.includes(file.type)) {
    throw new Error(`サポートされていないファイル形式です: ${file.type}`);
  }

  // ファイル名の検証
  if (!file.name) {
    throw new Error("無効なファイルです: ファイル名が空です");
  }

  // ファイルサイズ制限（20MB）
  const maxSizeBytes = 20 * 1024 * 1024; // 20MB
  if (file.size > maxSizeBytes) {
    throw new Error("ファイルサイズが制限を超えています（最大20MB）");
  }

  try {
    // ファイルをArrayBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Sharpで画像を処理（リサイズ・圧縮）
    const processedBuffer = await sharp(buffer)
      .resize(1024, 1024, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 80,
        progressive: true,
      })
      .toBuffer();

    // 処理済みファイルを作成
    const processedFile = new File([processedBuffer], file.name, {
      type: "image/jpeg",
    });

    return {
      originalFile: file,
      processedFile,
      originalSize: file.size,
      processedSize: processedBuffer.length,
    };
  } catch (error) {
    throw new Error(
      `画像処理に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}
