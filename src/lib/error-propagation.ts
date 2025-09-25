import { ErrorHandler } from "./error-handling";
import { ErrorCode } from "./error-codes";
import type { AppError, Result } from "@/types/error";

export interface UIError {
  message: string;
  isRetryable: boolean;
  userAction: string;
}

export interface RetryStrategy {
  shouldRetry: boolean;
  maxRetries: number;
  delayMs: number;
}

export type ErrorType =
  | "validation"
  | "network"
  | "service"
  | "storage"
  | "unknown";

export class ErrorPropagation {
  /**
   * Core層からUI層へのエラー変換
   */
  static fromCoreToUI(coreError: AppError): UIError {
    const errorType = this.analyzeErrorType(coreError);
    const isRetryable = ErrorHandler.isRetryableError(coreError);

    return {
      message: coreError.message,
      isRetryable,
      userAction: this.getUserActionForErrorType(errorType, isRetryable),
    };
  }

  /**
   * UI層からServer Action層へのエラー変換
   */
  static fromUIToServerAction(code: string, details: string): Result<never> {
    const errorCode = code as ErrorCode;
    const appError = ErrorHandler.createError(errorCode, details);

    return {
      success: false,
      error: appError,
    };
  }

  /**
   * Server Action層からCore層へのエラー変換
   */
  static fromServerActionToCore(error: unknown): AppError {
    if (error instanceof Error) {
      // Geminiエラーの詳細分析
      const geminiErrorCode = ErrorHandler.analyzeGeminiError(error);
      if (geminiErrorCode !== ErrorCode.GEMINI_API_ERROR) {
        return ErrorHandler.createError(geminiErrorCode, error.message);
      }

      // ファイル検証エラーの詳細分析
      const fileErrorCode = ErrorHandler.analyzeFileValidationError(error);
      if (fileErrorCode !== ErrorCode.INVALID_FILE_TYPE) {
        return ErrorHandler.createError(fileErrorCode, error.message);
      }

      // 一般的な処理エラー
      return ErrorHandler.createError(
        ErrorCode.PROCESSING_ERROR,
        error.message,
      );
    }

    return ErrorHandler.createError(
      ErrorCode.UNKNOWN_ERROR,
      typeof error === "string" ? error : "Unknown error occurred",
    );
  }

  /**
   * エラーの種別を分析
   */
  static analyzeErrorType(error: AppError): ErrorType {
    const validationCodes = [
      ErrorCode.FILE_NOT_SELECTED,
      ErrorCode.FILE_TOO_LARGE,
      ErrorCode.UNSUPPORTED_FORMAT,
      ErrorCode.INVALID_FORM_DATA,
      ErrorCode.FILE_EMPTY,
      ErrorCode.INVALID_FILE_TYPE,
      ErrorCode.INVALID_REQUEST,
    ];

    const networkCodes = [ErrorCode.NETWORK_ERROR, ErrorCode.GEMINI_TIMEOUT];

    const serviceCodes = [
      ErrorCode.AI_SERVICE_ERROR,
      ErrorCode.GEMINI_API_ERROR,
      ErrorCode.GEMINI_QUOTA_EXCEEDED,
      ErrorCode.GEMINI_UNAUTHORIZED,
    ];

    const storageCodes = [
      ErrorCode.STORAGE_ERROR,
      ErrorCode.REDIS_CONNECTION_ERROR,
      ErrorCode.DATA_NOT_FOUND,
      ErrorCode.DATA_EXPIRED,
    ];

    if (validationCodes.includes(error.code as ErrorCode)) {
      return "validation";
    }

    if (networkCodes.includes(error.code as ErrorCode)) {
      return "network";
    }

    if (serviceCodes.includes(error.code as ErrorCode)) {
      return "service";
    }

    if (storageCodes.includes(error.code as ErrorCode)) {
      return "storage";
    }

    return "unknown";
  }

  /**
   * エラータイプに応じたリトライ戦略の取得
   */
  static getRetryStrategy(error: AppError): RetryStrategy {
    const isRetryable = ErrorHandler.isRetryableError(error);

    if (!isRetryable) {
      return {
        shouldRetry: false,
        maxRetries: 0,
        delayMs: 0,
      };
    }

    // エラータイプ別のリトライ戦略
    const errorType = this.analyzeErrorType(error);

    switch (errorType) {
      case "network":
        return {
          shouldRetry: true,
          maxRetries: 3,
          delayMs: 1000, // 1秒
        };

      case "service":
        if (error.code === ErrorCode.GEMINI_QUOTA_EXCEEDED) {
          return {
            shouldRetry: true,
            maxRetries: 2,
            delayMs: 5000, // 5秒
          };
        }
        return {
          shouldRetry: true,
          maxRetries: 2,
          delayMs: 2000, // 2秒
        };

      case "storage":
        return {
          shouldRetry: true,
          maxRetries: 3,
          delayMs: 1000, // 1秒
        };

      default:
        return {
          shouldRetry: false,
          maxRetries: 0,
          delayMs: 0,
        };
    }
  }

  /**
   * エラータイプに応じたユーザーアクション提案
   */
  private static getUserActionForErrorType(
    errorType: ErrorType,
    isRetryable: boolean,
  ): string {
    if (isRetryable) {
      switch (errorType) {
        case "network":
          return "接続を確認して再度お試しください";
        case "service":
          return "しばらく時間をおいてから再度お試しください";
        case "storage":
          return "しばらく時間をおいてから再度お試しください";
        default:
          return "再度お試しください";
      }
    }

    switch (errorType) {
      case "validation":
        return "入力内容を確認してください";
      default:
        return "問題が解決しない場合は、サポートまでお問い合わせください";
    }
  }
}
