import { NextRequest, NextResponse } from "next/server";
import { kvClient } from "@/lib/kv";
import { ErrorHandler } from "@/lib/error-handling";
import { ErrorCode } from "@/lib/error-codes";

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
      const appError = ErrorHandler.createError("INVALID_REQUEST" as ErrorCode);
      return NextResponse.json(
        {
          success: false,
          error: appError.message,
        } as ShareResponse,
        { status: appError.statusCode },
      );
    }

    const { critique } = body;

    // shareIdの必須チェック
    if (!critique?.shareId) {
      const appError = ErrorHandler.createError("INVALID_FORM_DATA" as ErrorCode, "講評データにshareIdが見つかりません");
      return NextResponse.json(
        {
          success: false,
          error: appError.message,
        } as ShareResponse,
        { status: appError.statusCode },
      );
    }

    // 既存データの存在確認（保存処理は一切なし）
    const existingData = await kvClient.getCritique(critique.shareId);
    if (!existingData) {
      const appError = ErrorHandler.createError("DATA_NOT_FOUND" as ErrorCode);
      return NextResponse.json(
        {
          success: false,
          error: appError.message,
        } as ShareResponse,
        { status: appError.statusCode },
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
    return ErrorHandler.handleAPIRouteError(error);
  }
}
