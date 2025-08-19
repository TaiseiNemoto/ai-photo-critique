import { NextRequest, NextResponse } from "next/server";
import { extractExifData } from "@/lib/exif";
import { processImage } from "@/lib/image";
import { kvClient } from "@/lib/kv";
import type { ExifData, ProcessedImageData } from "@/types/upload";

// Node Runtime指定（Sharp画像処理のため）
export const runtime = "nodejs";

interface UploadApiResponse {
  success: boolean;
  data?: {
    id: string;
    exifData: ExifData;
    processedImage: ProcessedImageData;
  };
  error?: string;
}

/**
 * ファイルをFormDataから抽出し、基本検証を行う
 */
function extractAndValidateFile(formData: FormData): File | null {
  const file = formData.get("image") as File;

  if (!file || file.size === 0) {
    return null;
  }

  // ファイルサイズ制限（10MB）
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("ファイルサイズが大きすぎます（最大10MB）");
  }

  // ファイル形式チェック
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("サポートされていないファイル形式です");
  }

  return file;
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // FormDataの取得
    const formData = await request.formData();

    // ファイルの抽出と基本検証
    const file = extractAndValidateFile(formData);
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "ファイルが選択されていません",
        } as UploadApiResponse,
        { status: 400 },
      );
    }

    // EXIF抽出と画像処理を並列実行（パフォーマンス向上）
    const [exifData, processedImageResult] = await Promise.all([
      extractExifData(file),
      processImage(file),
    ]);

    // 処理済み画像をbase64データURLに変換
    const dataUrl = await convertToDataUrl(
      processedImageResult.processedFile,
      processedImageResult.processedFile.type,
    );

    // 一意のIDを生成
    const uploadId = generateUploadId();

    // アップロードデータをKVに保存
    const uploadData = {
      id: uploadId,
      filename: file.name,
      exifData,
      processedImage: {
        dataUrl,
        originalSize: processedImageResult.originalSize,
        processedSize: processedImageResult.processedSize,
      },
      uploadedAt: new Date().toISOString(),
    };

    // KVストレージに保存（24時間TTL）
    await kvClient.saveUpload(uploadId, uploadData);

    // 成功レスポンス
    const response: UploadApiResponse = {
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

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // エラーログ出力（デバッグ用）
    console.error("Upload API error:", error);

    // ユーザーフレンドリーなエラーメッセージを返却
    const errorMessage =
      error instanceof Error
        ? error.message
        : "画像の処理中にエラーが発生しました";

    const response: UploadApiResponse = {
      success: false,
      error: errorMessage,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
