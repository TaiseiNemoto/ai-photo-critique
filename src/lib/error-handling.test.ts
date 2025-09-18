/**
 * エラーハンドリング統一機能のテスト
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { ErrorHandler } from "./error-handling";
import { ErrorCode } from "./error-codes";
import type { AppError } from "@/types/error";

describe("ErrorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("createError", () => {
    it("should create standardized error objects with required fields", () => {
      const error = ErrorHandler.createError(ErrorCode.FILE_NOT_SELECTED);

      expect(error.code).toBe("FILE_NOT_SELECTED");
      expect(error.message).toBe("ファイルが選択されていません");
      expect(error.timestamp).toBeDefined();
      expect(typeof error.timestamp).toBe("string");
    });

    it("should include details when provided", () => {
      const details = "Additional error context";
      const error = ErrorHandler.createError(ErrorCode.UPLOAD_FAILED, details);

      expect(error.details).toBe(details);
    });

    it("should include statusCode for API errors", () => {
      const error = ErrorHandler.createError(ErrorCode.FILE_TOO_LARGE);

      expect(error.statusCode).toBe(413);
    });

    it("should include stack trace in development environment", () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error = ErrorHandler.createError(ErrorCode.PROCESSING_ERROR);

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe("string");

      process.env.NODE_ENV = originalNodeEnv;
    });

    it("should not include stack trace in production environment", () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error = ErrorHandler.createError(ErrorCode.PROCESSING_ERROR);

      expect(error.stack).toBeUndefined();

      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe("handleServerActionError", () => {
    it("should handle Server Action errors with proper Result type", () => {
      const testError = new Error("test error message");
      const result = ErrorHandler.handleServerActionError(testError);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe("PROCESSING_ERROR");
      expect(result.error.message).toBe("処理中にエラーが発生しました");
      expect(result.error.details).toBe("test error message");
    });

    it("should handle unknown error types", () => {
      const result = ErrorHandler.handleServerActionError("unknown error");

      expect(result.success).toBe(false);
      expect(result.error.code).toBe("UNKNOWN_ERROR");
      expect(result.error.details).toBe("unknown error");
    });

    it("should handle null/undefined errors", () => {
      const result = ErrorHandler.handleServerActionError(null);

      expect(result.success).toBe(false);
      expect(result.error.code).toBe("UNKNOWN_ERROR");
      expect(result.error.details).toBe("Unknown error occurred");
    });
  });

  describe("handleAPIRouteError", () => {
    it("should return proper NextResponse for API Route errors", () => {
      const testError = new Error("API error");
      const response = ErrorHandler.handleAPIRouteError(testError);

      expect(response).toBeInstanceOf(NextResponse);
    });

    it("should include proper error response structure", async () => {
      const testError = new Error("API error");
      const response = ErrorHandler.handleAPIRouteError(testError);
      const responseBody = await response.json();

      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toBeDefined();
      expect(typeof responseBody.error).toBe("string");
    });

    it("should set correct status code based on error type", () => {
      const testError = new Error("Validation failed");
      const response = ErrorHandler.handleAPIRouteError(testError);

      expect(response.status).toBe(500); // デフォルトのサーバーエラー
    });
  });

  describe("logError", () => {
    it("should log error with proper format", () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const error: AppError = {
        code: "TEST_ERROR",
        message: "Test message",
        timestamp: new Date().toISOString(),
      };

      ErrorHandler.logError(error);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Application Error:",
        expect.objectContaining({
          code: "TEST_ERROR",
          message: "Test message",
          timestamp: expect.any(String),
        }),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("isRetryableError", () => {
    it("should identify retryable network errors", () => {
      const networkError = ErrorHandler.createError(ErrorCode.NETWORK_ERROR);
      expect(ErrorHandler.isRetryableError(networkError)).toBe(true);
    });

    it("should identify retryable timeout errors", () => {
      const timeoutError = ErrorHandler.createError(ErrorCode.GEMINI_TIMEOUT);
      expect(ErrorHandler.isRetryableError(timeoutError)).toBe(true);
    });

    it("should not identify validation errors as retryable", () => {
      const validationError = ErrorHandler.createError(
        ErrorCode.FILE_NOT_SELECTED,
      );
      expect(ErrorHandler.isRetryableError(validationError)).toBe(false);
    });

    it("should not identify unauthorized errors as retryable", () => {
      const authError = ErrorHandler.createError(ErrorCode.GEMINI_UNAUTHORIZED);
      expect(ErrorHandler.isRetryableError(authError)).toBe(false);
    });
  });
});
