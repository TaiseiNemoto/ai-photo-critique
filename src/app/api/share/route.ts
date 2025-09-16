import { NextRequest, NextResponse } from "next/server";
import { kvClient } from "@/lib/kv";

interface ShareRequest {
  critique: {
    shareId: string;
  };
}

interface ShareResponse {
  success: boolean;
  shareId?: string;
  url?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: ShareRequest;

    // JSONパース処理
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "リクエストの形式が正しくありません",
        } as ShareResponse,
        { status: 400 },
      );
    }

    const { critique } = body;

    // shareIdの必須チェック
    if (!critique?.shareId) {
      return NextResponse.json(
        {
          success: false,
          error: "講評データにshareIdが見つかりません",
        } as ShareResponse,
        { status: 400 },
      );
    }

    // 既存データの存在確認（保存処理は一切なし）
    const existingData = await kvClient.getCritique(critique.shareId);
    if (!existingData) {
      return NextResponse.json(
        {
          success: false,
          error: "講評データが見つかりません",
        } as ShareResponse,
        { status: 404 },
      );
    }

    // 既存のshareIdを活用してレスポンス生成（重複保存防止）
    return NextResponse.json(
      {
        success: true,
        shareId: critique.shareId,
        url: `/s/${critique.shareId}`,
      } as ShareResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error("Share API error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "共有URLの生成中にエラーが発生しました";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      } as ShareResponse,
      { status: 500 },
    );
  }
}
