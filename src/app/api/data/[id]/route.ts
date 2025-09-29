import { NextRequest, NextResponse } from "next/server";
import { kvClient } from "@/lib/kv";
import type { CritiqueData } from "@/lib/kv";
import { ErrorHandler } from "@/lib/error-handling";
import { ErrorCode } from "@/lib/error-codes";

interface DataResponse {
  success: boolean;
  data?: CritiqueData;
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

    const critiqueData = await kvClient.getCritique(id);

    if (!critiqueData) {
      const appError = ErrorHandler.createError("DATA_NOT_FOUND" as ErrorCode);
      const errorResponse: DataResponse = {
        success: false,
        error: appError.message,
      };
      return NextResponse.json(errorResponse, { status: appError.statusCode });
    }

    const now = new Date();
    const expiresAt = new Date(critiqueData.expiresAt);

    if (now > expiresAt) {
      const appError = ErrorHandler.createError("DATA_EXPIRED" as ErrorCode);
      const errorResponse: DataResponse = {
        success: false,
        error: appError.message,
      };
      return NextResponse.json(errorResponse, {
        status: appError.statusCode,
      });
    }

    const successResponse: DataResponse = {
      success: true,
      data: critiqueData,
    };

    return NextResponse.json(successResponse, { status: 200 });
  } catch (error) {
    return ErrorHandler.handleAPIRouteError(error);
  }
}
