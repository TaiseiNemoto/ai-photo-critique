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
