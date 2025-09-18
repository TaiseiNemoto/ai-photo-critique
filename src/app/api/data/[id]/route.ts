import { NextRequest, NextResponse } from "next/server";
import { kvClient } from "@/lib/kv";
import type { CritiqueData, ShareData } from "@/lib/kv";
import { ErrorHandler } from "@/lib/error-handling";
import { ErrorCode } from "@/lib/error-codes";

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
      const appError = ErrorHandler.createError("INVALID_ID" as ErrorCode);
      const errorResponse: DataResponse = {
        success: false,
        error: appError.message,
      };
      return NextResponse.json(errorResponse, { status: appError.statusCode });
    }

    // まず講評データを直接取得を試みる（新しい形式）
    let critiqueData = await kvClient.getCritique(id);
    const shareData = await kvClient.getShare(id);

    // 新しい形式でデータが見つからない場合、従来の形式を試す
    if (!critiqueData && shareData) {
      // 従来の形式：shareDataのcritiqueIdから講評データを取得
      critiqueData = await kvClient.getCritique(shareData.critiqueId);
    }

    if (!critiqueData) {
      const appError = ErrorHandler.createError("DATA_NOT_FOUND" as ErrorCode);
      const errorResponse: DataResponse = {
        success: false,
        error: appError.message,
      };
      return NextResponse.json(errorResponse, { status: appError.statusCode });
    }

    // 期限切れチェック（shareDataがある場合のみ）
    if (shareData) {
      const now = new Date();
      const expiresAt = new Date(shareData.expiresAt);

      if (now > expiresAt) {
        const appError = ErrorHandler.createError("DATA_EXPIRED" as ErrorCode);
        const errorResponse: DataResponse = {
          success: false,
          error: appError.message,
        };
        return NextResponse.json(errorResponse, { status: appError.statusCode });
      }
    } else {
      // 新しい形式では講評データ自体に期限が含まれている
      const critiqueDataWithExpiry = critiqueData as CritiqueData & {
        expiresAt?: string;
      };
      if (critiqueDataWithExpiry.expiresAt) {
        const now = new Date();
        const expiresAt = new Date(critiqueDataWithExpiry.expiresAt);

        if (now > expiresAt) {
          const appError = ErrorHandler.createError("DATA_EXPIRED" as ErrorCode);
          const errorResponse: DataResponse = {
            success: false,
            error: appError.message,
          };
          return NextResponse.json(errorResponse, { status: appError.statusCode });
        }
      }
    }

    const successResponse: DataResponse = {
      success: true,
      data: critiqueData,
      shareData: shareData || undefined,
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    return ErrorHandler.handleAPIRouteError(error);
  }
}
