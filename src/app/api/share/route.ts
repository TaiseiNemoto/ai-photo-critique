import { NextRequest, NextResponse } from "next/server";
import { kvClient } from "@/lib/kv";

interface ShareRequest {
  // 既存のcritiqueIdを使用する場合（後方互換性）
  critiqueId?: string;
  // 新しい直接データを使用する場合
  image?: {
    preview: string;
    original: string;
    processedSize: { width: number; height: number };
    originalSize: { width: number; height: number };
    size: number;
    exif?: Record<string, unknown>;
  };
  critique?: {
    technique: string;
    composition: string;
    color: string;
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

    try {
      body = await request.json();
    } catch {
      const errorResponse: ShareResponse = {
        success: false,
        error: "リクエストの形式が正しくありません",
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { critiqueId, image, critique } = body;

    // 新しい形式のデータが提供された場合
    if (image && critique) {
      // 短縮IDを生成
      const shareId = kvClient.generateId();

      // 現在の講評データを直接保存
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // 講評データを保存
      const critiqueData = {
        id: shareId,
        image,
        critique,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      await kvClient.saveCritique(critiqueData);

      // 共有データを保存
      await kvClient.saveShare({
        id: shareId,
        critiqueId: shareId,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      });

      const successResponse: ShareResponse = {
        success: true,
        shareId: shareId,
        url: `/s/${shareId}`,
      };

      return NextResponse.json(successResponse, { status: 200 });
    }

    // 既存の形式（critiqueId使用）の処理
    if (!critiqueId) {
      const errorResponse: ShareResponse = {
        success: false,
        error: "講評IDまたは講評データが必要です",
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
