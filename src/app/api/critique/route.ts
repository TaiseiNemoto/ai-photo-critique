import { NextRequest, NextResponse } from "next/server";
import { generatePhotoCritiqueWithRetry } from "@/lib/critique";
import type { CritiqueResult } from "@/types/upload";

export const runtime = "nodejs"; // Node Function実行環境を指定（Sharp使用のため）

/**
 * FormDataから画像ファイルを抽出し、基本的なバリデーションを行う
 */
function extractAndValidateFile(formData: FormData): File | null {
  const file = formData.get("image") as File;

  if (!file || file.size === 0) {
    return null;
  }

  return file;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();

    // アップロードIDの確認
    const uploadId = formData.get("uploadId") as string;
    if (!uploadId) {
      const errorResponse: CritiqueResult = {
        success: false,
        error: "アップロードIDが必要です",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // ファイルの抽出と基本検証
    const file = extractAndValidateFile(formData);
    if (!file) {
      const errorResponse: CritiqueResult = {
        success: false,
        error: "ファイルが選択されていません",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // ファイルの種類確認
    if (!file.type || !file.type.startsWith("image/")) {
      const errorResponse: CritiqueResult = {
        success: false,
        error: "画像ファイルを選択してください",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 画像をBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // AI講評生成（再試行機能付き）
    const result = await generatePhotoCritiqueWithRetry(buffer, file.type, 1);

    // 講評が成功した場合、KVストレージに保存
    if (result.success && result.data) {
      const { kvClient } = await import("@/lib/kv");

      // アップロードデータからEXIF情報を取得
      const uploadData = await kvClient.getUpload(uploadId);
      const exifData = uploadData?.exifData || {};

      // 共有用IDを生成
      const shareId = kvClient.generateId();

      // 講評データを保存
      await kvClient.saveCritique({
        id: shareId,
        filename: file.name,
        technique: result.data.technique,
        composition: result.data.composition,
        color: result.data.color,
        exifData: exifData as Record<string, unknown>,
        uploadedAt: new Date().toISOString(),
      });

      // 共有データを保存
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24時間後
      await kvClient.saveShare({
        id: shareId,
        critiqueId: shareId,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      });

      // レスポンスにshareIdを追加
      const enhancedResult: CritiqueResult = {
        ...result,
        data: {
          ...result.data,
          shareId: shareId,
        },
      };

      return NextResponse.json(enhancedResult, { status: 200 });
    }

    // 成功・失敗問わず、講評処理の結果をそのまま返す
    const statusCode = result.success ? 200 : 500;
    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    console.error("Critique API error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "AI講評の生成中にエラーが発生しました";

    const errorResponse: CritiqueResult = {
      success: false,
      error: errorMessage,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
