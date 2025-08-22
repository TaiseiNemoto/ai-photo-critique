import { NextRequest, NextResponse } from "next/server";
import { kvClient } from "@/lib/kv";
import type { CritiqueData, ShareData } from "@/lib/kv";

interface DataResponse {
  success: boolean;
  data?: CritiqueData;
  shareData?: ShareData;
  error?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;

    if (!id || id.trim() === "") {
      const errorResponse: DataResponse = {
        success: false,
        error: "有効なIDが必要です",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 講評データと共有データを並行して取得
    const [critiqueData, shareData] = await Promise.all([
      kvClient.getCritique(id),
      kvClient.getShare(id),
    ]);

    if (!critiqueData || !shareData) {
      const errorResponse: DataResponse = {
        success: false,
        error: "データが見つかりません",
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // 期限切れチェック
    const now = new Date();
    const expiresAt = new Date(shareData.expiresAt);

    if (now > expiresAt) {
      const errorResponse: DataResponse = {
        success: false,
        error: "このデータは期限切れです",
      };
      return NextResponse.json(errorResponse, { status: 410 });
    }

    const successResponse: DataResponse = {
      success: true,
      data: critiqueData,
      shareData: shareData,
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error("Data API error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "データの取得中にエラーが発生しました";

    const errorResponse: DataResponse = {
      success: false,
      error: errorMessage,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
