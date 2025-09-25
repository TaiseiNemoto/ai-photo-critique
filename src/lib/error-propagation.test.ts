import { describe, it, expect } from "vitest";
import { ErrorPropagation } from "./error-propagation";
import { ErrorCode } from "./error-codes";
import type { AppError } from "@/types/error";

describe("ErrorPropagation", () => {
  describe("fromCoreToUI", () => {
    it("should convert core AppError to UI-friendly format", () => {
      const coreError: AppError = {
        code: ErrorCode.AI_SERVICE_ERROR,
        message: "AI講評サービスでエラーが発生しました",
        timestamp: "2023-01-01T00:00:00.000Z",
      };

      const uiError = ErrorPropagation.fromCoreToUI(coreError);

      expect(uiError).toEqual({
        message: "AI講評サービスでエラーが発生しました",
        isRetryable: false,
        userAction: "問題が解決しない場合は、サポートまでお問い合わせください",
      });
    });

    it("should handle retryable errors with proper user actions", () => {
      const networkError: AppError = {
        code: ErrorCode.NETWORK_ERROR,
        message: "ネットワーク接続でエラーが発生しました",
        timestamp: "2023-01-01T00:00:00.000Z",
      };

      const uiError = ErrorPropagation.fromCoreToUI(networkError);

      expect(uiError.isRetryable).toBe(true);
      expect(uiError.userAction).toBe("接続を確認して再度お試しください");
    });
  });

  describe("fromUIToServerAction", () => {
    it("should convert UI error to server action error format", () => {
      const serverActionError = ErrorPropagation.fromUIToServerAction(
        "FILE_NOT_SELECTED",
        "File not selected by user"
      );

      expect(serverActionError.success).toBe(false);
      expect(serverActionError.error.code).toBe("FILE_NOT_SELECTED");
    });
  });

  describe("fromServerActionToCore", () => {
    it("should convert server action errors to core AppError format", () => {
      const error = new Error("Processing failed");

      const coreError = ErrorPropagation.fromServerActionToCore(error);

      expect(coreError.code).toBe(ErrorCode.PROCESSING_ERROR);
      expect(coreError.message).toBe("処理中にエラーが発生しました");
      expect(coreError.details).toBe("Processing failed");
    });
  });

  describe("analyzeErrorType", () => {
    it("should identify validation errors", () => {
      const validationError: AppError = {
        code: ErrorCode.FILE_NOT_SELECTED,
        message: "ファイルが選択されていません",
        timestamp: "2023-01-01T00:00:00.000Z",
      };

      const errorType = ErrorPropagation.analyzeErrorType(validationError);

      expect(errorType).toBe("validation");
    });

    it("should identify network errors", () => {
      const networkError: AppError = {
        code: ErrorCode.NETWORK_ERROR,
        message: "ネットワーク接続でエラーが発生しました",
        timestamp: "2023-01-01T00:00:00.000Z",
      };

      const errorType = ErrorPropagation.analyzeErrorType(networkError);

      expect(errorType).toBe("network");
    });

    it("should identify service errors", () => {
      const serviceError: AppError = {
        code: ErrorCode.AI_SERVICE_ERROR,
        message: "AI講評サービスでエラーが発生しました",
        timestamp: "2023-01-01T00:00:00.000Z",
      };

      const errorType = ErrorPropagation.analyzeErrorType(serviceError);

      expect(errorType).toBe("service");
    });
  });

  describe("getRetryStrategy", () => {
    it("should return retry strategy for retryable errors", () => {
      const networkError: AppError = {
        code: ErrorCode.NETWORK_ERROR,
        message: "ネットワーク接続でエラーが発生しました",
        timestamp: "2023-01-01T00:00:00.000Z",
      };

      const strategy = ErrorPropagation.getRetryStrategy(networkError);

      expect(strategy.shouldRetry).toBe(true);
      expect(strategy.maxRetries).toBe(3);
      expect(strategy.delayMs).toBe(1000);
    });

    it("should return no-retry strategy for validation errors", () => {
      const validationError: AppError = {
        code: ErrorCode.FILE_NOT_SELECTED,
        message: "ファイルが選択されていません",
        timestamp: "2023-01-01T00:00:00.000Z",
      };

      const strategy = ErrorPropagation.getRetryStrategy(validationError);

      expect(strategy.shouldRetry).toBe(false);
      expect(strategy.maxRetries).toBe(0);
      expect(strategy.delayMs).toBe(0);
    });
  });
});