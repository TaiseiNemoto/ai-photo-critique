import { NextRequest, NextResponse } from "next/server";
import { kvClient } from "@/lib/kv";

interface ShareRequest {
  critiqueId: string;
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

    try {
      body = await request.json();
    } catch {
      const errorResponse: ShareResponse = {
        success: false,
        error: "リクエストの形式が正しくありません",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { critiqueId } = body;

    if (!critiqueId) {
      const errorResponse: ShareResponse = {
        success: false,
        error: "講評IDが必要です",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 講評データが存在することを確認
    const critiqueData = await kvClient.getCritique(critiqueId);
    if (!critiqueData) {
      const errorResponse: ShareResponse = {
        success: false,
        error: "講評データが見つかりません",
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    // 短縮IDを生成
    const shareId = kvClient.generateId();

    // 共有データを保存（24時間TTL）
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await kvClient.saveShare({
      id: shareId,
      critiqueId: critiqueId,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });

    const successResponse: ShareResponse = {
      success: true,
      shareId: shareId,
      url: `/s/${shareId}`,
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    console.error("Share API error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "共有URLの生成中にエラーが発生しました";

    const errorResponse: ShareResponse = {
      success: false,
      error: errorMessage,
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
