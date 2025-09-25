import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCritiqueGeneration } from "./useCritiqueGeneration";
import { uploadImageWithCritique } from "@/app/actions";
import { ErrorPropagation } from "@/lib/error-propagation";
import { ErrorCode } from "@/lib/error-codes";
import type { AppError } from "@/types/error";
import type { UploadedImage } from "@/types/upload";

// Mocks
vi.mock("next/navigation");
vi.mock("sonner");
vi.mock("@/contexts/CritiqueContext", () => ({
  useCritique: () => ({
    setCritiqueData: vi.fn(),
  }),
}));
vi.mock("@/app/actions");
vi.mock("@/lib/error-handling");
vi.mock("@/lib/error-propagation");

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

vi.mocked(useRouter).mockReturnValue(mockRouter);

const mockToast = {
  loading: vi.fn().mockReturnValue("loading-id"),
  success: vi.fn(),
  error: vi.fn(),
  dismiss: vi.fn(),
};

vi.mocked(toast).mockReturnValue(mockToast);
Object.assign(toast, mockToast);

describe("useCritiqueGeneration - ErrorHandler Integration", () => {
  const mockUploadedImage: UploadedImage = {
    file: new File(["test"], "test.jpg", { type: "image/jpeg" }),
    url: "blob:test",
    exif: null,
  };

  const mockFormDataRef = {
    current: new FormData(),
  };

  const mockOnProcessingChange = vi.fn();
  const mockOnCritiqueStateChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Error Handling with ErrorHandler Integration", () => {
    it("should use ErrorHandler when server action returns error", async () => {
      // Arrange
      const serverError: AppError = {
        code: ErrorCode.AI_SERVICE_ERROR,
        message: "AI講評サービスでエラーが発生しました",
        timestamp: "2023-01-01T00:00:00.000Z",
      };

      const uiError = {
        message: "AI講評サービスでエラーが発生しました",
        isRetryable: false,
        userAction: "しばらく時間をおいてから再度お試しください",
      };

      vi.mocked(uploadImageWithCritique).mockResolvedValue({
        upload: { success: true, data: {} },
        critique: {
          success: false,
          error: serverError.message,
        },
      });

      vi.mocked(ErrorPropagation.fromCoreToUI).mockReturnValue(uiError);

      const { result } = renderHook(() => useCritiqueGeneration());

      // Act
      await act(async () => {
        await result.current.generateCritique(
          mockUploadedImage,
          mockFormDataRef,
          mockOnProcessingChange,
          mockOnCritiqueStateChange,
        );
      });

      // Assert
      expect(ErrorPropagation.fromCoreToUI).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.AI_SERVICE_ERROR,
        }),
      );

      expect(mockOnCritiqueStateChange).toHaveBeenCalledWith({
        status: "error",
        error: uiError.message,
        isRetryable: uiError.isRetryable,
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          description: uiError.userAction,
        }),
      );
    });

    it("should use ErrorHandler for network/exception errors", async () => {
      // Arrange
      const networkError = new Error("Network timeout");
      const coreError: AppError = {
        code: ErrorCode.NETWORK_ERROR,
        message: "ネットワーク接続でエラーが発生しました",
        timestamp: "2023-01-01T00:00:00.000Z",
      };

      const uiError = {
        message: "ネットワーク接続でエラーが発生しました",
        isRetryable: true,
        userAction: "接続を確認して再度お試しください",
      };

      vi.mocked(uploadImageWithCritique).mockRejectedValue(networkError);
      vi.mocked(ErrorPropagation.fromServerActionToCore).mockReturnValue(
        coreError,
      );
      vi.mocked(ErrorPropagation.fromCoreToUI).mockReturnValue(uiError);

      const { result } = renderHook(() => useCritiqueGeneration());

      // Act
      await act(async () => {
        await result.current.generateCritique(
          mockUploadedImage,
          mockFormDataRef,
          mockOnProcessingChange,
          mockOnCritiqueStateChange,
        );
      });

      // Assert
      expect(ErrorPropagation.fromServerActionToCore).toHaveBeenCalledWith(
        networkError,
      );
      expect(ErrorPropagation.fromCoreToUI).toHaveBeenCalledWith(coreError);

      expect(mockOnCritiqueStateChange).toHaveBeenCalledWith({
        status: "error",
        error: uiError.message,
        isRetryable: uiError.isRetryable,
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          description: uiError.userAction,
        }),
      );
    });

    it("should handle retryable errors with appropriate retry strategy", async () => {
      // Arrange
      const retryableError = "AI分析サービスがタイムアウトしました";

      const uiError = {
        message: "AI分析サービスがタイムアウトしました",
        isRetryable: true,
        userAction: "しばらく待ってから再度お試しください",
      };

      vi.mocked(uploadImageWithCritique).mockResolvedValue({
        upload: { success: true, data: {} },
        critique: {
          success: false,
          error: retryableError,
        },
      });

      vi.mocked(ErrorPropagation.fromCoreToUI).mockReturnValue(uiError);

      const { result } = renderHook(() => useCritiqueGeneration());

      // Act
      await act(async () => {
        await result.current.generateCritique(
          mockUploadedImage,
          mockFormDataRef,
          mockOnProcessingChange,
          mockOnCritiqueStateChange,
        );
      });

      // Assert - handleCritiqueErrorWithPropagationでfromCoreToUIが呼ばれる
      expect(ErrorPropagation.fromCoreToUI).toHaveBeenCalledWith(
        expect.objectContaining({
          code: ErrorCode.AI_SERVICE_ERROR,
        }),
      );

      expect(mockOnCritiqueStateChange).toHaveBeenCalledWith({
        status: "error",
        error: uiError.message,
        isRetryable: uiError.isRetryable,
      });
    });

    it("should use error propagation to convert error types correctly", async () => {
      // Arrange - String形式のエラーを使用して、handleCritiqueErrorWithPropagationのAnalyzeErrorTypeを確実に呼び出す
      const validationError = "ファイルが選択されていません";

      const uiError = {
        message: "ファイルが選択されていません",
        isRetryable: false,
        userAction: "入力内容を確認してください",
      };

      vi.mocked(uploadImageWithCritique).mockResolvedValue({
        upload: {
          success: false,
          error: validationError,
        },
        critique: {
          success: false,
          error: "アップロードに失敗しました",
        },
      });

      vi.mocked(ErrorPropagation.analyzeErrorType).mockReturnValue(
        "validation",
      );
      vi.mocked(ErrorPropagation.fromCoreToUI).mockReturnValue(uiError);

      const { result } = renderHook(() => useCritiqueGeneration());

      // Act
      await act(async () => {
        await result.current.generateCritique(
          mockUploadedImage,
          mockFormDataRef,
          mockOnProcessingChange,
          mockOnCritiqueStateChange,
        );
      });

      // Assert - handleCritiqueErrorWithPropagationでFromCoreToUIが呼ばれる
      expect(ErrorPropagation.fromCoreToUI).toHaveBeenCalled();
    });
  });
});
