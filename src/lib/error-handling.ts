/**
 * 統一されたエラーハンドリング機能
 */

import { NextResponse } from "next/server";
import { ErrorCode, ERROR_MESSAGES, ERROR_STATUS_CODES } from "./error-codes";
import type { AppError, Result, APIErrorResponse } from "@/types/error";

export class ErrorHandler {
  /**
   * 標準化されたエラーオブジェクトを作成
   */
  static createError(code: ErrorCode, details?: string): AppError {
    return {
      code,
      message: ERROR_MESSAGES[code],
      details,
      statusCode: ERROR_STATUS_CODES[code],
      timestamp: new Date().toISOString(),
      stack: process.env.NODE_ENV === "development" ? new Error().stack : undefined,
    };
  }

  /**
   * Server Action用のエラーハンドリング
   */
  static handleServerActionError(error: unknown): Result<never> {
    let appError: AppError;

    if (error instanceof Error) {
      appError = this.createError(ErrorCode.PROCESSING_ERROR, error.message);
    } else if (typeof error === "string") {
      appError = this.createError(ErrorCode.UNKNOWN_ERROR, error);
    } else {
      appError = this.createError(ErrorCode.UNKNOWN_ERROR, "Unknown error occurred");
    }

    this.logError(appError);

    return {
      success: false,
      error: appError,
    };
  }

  /**
   * API Route用のエラーハンドリング
   */
  static handleAPIRouteError(error: unknown): NextResponse<APIErrorResponse> {
    let appError: AppError;

    if (error instanceof Error) {
      appError = this.createError(ErrorCode.PROCESSING_ERROR, error.message);
    } else {
      appError = this.createError(ErrorCode.UNKNOWN_ERROR, "Unknown error occurred");
    }

    this.logError(appError);

    const response: APIErrorResponse = {
      success: false,
      error: appError.message,
      code: appError.code,
      timestamp: appError.timestamp,
    };

    return NextResponse.json(response, {
      status: appError.statusCode || 500,
    });
  }


  /**
   * エラーのログ出力
   */
  static logError(error: AppError): void {
    console.error("Application Error:", {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: error.timestamp,
      stack: error.stack,
    });
  }

  /**
   * リトライ可能なエラーかどうかを判定
   */
  static isRetryableError(error: AppError): boolean {
    const retryableCodes = [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.GEMINI_TIMEOUT,
      ErrorCode.REDIS_CONNECTION_ERROR,
      ErrorCode.GEMINI_QUOTA_EXCEEDED,
    ];

    return retryableCodes.includes(error.code as ErrorCode);
  }

  /**
   * Gemini APIエラーの詳細分析と適切なErrorCodeへの変換
   */
  static analyzeGeminiError(error: Error): ErrorCode {
    const message = error.message.toLowerCase();

    if (message.includes("429") || message.includes("quota")) {
      return ErrorCode.GEMINI_QUOTA_EXCEEDED;
    }
    if (message.includes("401") || message.includes("api key")) {
      return ErrorCode.GEMINI_UNAUTHORIZED;
    }
    if (message.includes("403")) {
      return ErrorCode.GEMINI_UNAUTHORIZED;
    }
    if (message.includes("timeout")) {
      return ErrorCode.GEMINI_TIMEOUT;
    }
    if (message.includes("network")) {
      return ErrorCode.NETWORK_ERROR;
    }

    return ErrorCode.GEMINI_API_ERROR;
  }

  /**
   * ファイルバリデーションエラーの分析
   */
  static analyzeFileValidationError(error: Error): ErrorCode {
    const message = error.message.toLowerCase();

    if (message.includes("選択されていません") || message.includes("not selected")) {
      return ErrorCode.FILE_NOT_SELECTED;
    }
    if (message.includes("大きすぎます") || message.includes("too large") || message.includes("20mb")) {
      return ErrorCode.FILE_TOO_LARGE;
    }
    if (message.includes("サポートされていない") || message.includes("unsupported")) {
      return ErrorCode.UNSUPPORTED_FORMAT;
    }
    if (message.includes("空です") || message.includes("empty")) {
      return ErrorCode.FILE_EMPTY;
    }

    return ErrorCode.INVALID_FILE_TYPE;
  }
}