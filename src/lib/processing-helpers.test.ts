import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UploadResult } from "@/lib/upload";
import type { CritiqueResult } from "@/types/upload";
import {
  executeUploadAndCritique,
  measureProcessingTime,
  handleIntegratedError,
} from "./processing-helpers";

// モック設定
vi.mock("@/lib/upload", () => ({
  uploadImageCore: vi.fn(),
}));

vi.mock("@/lib/critique-core", () => ({
  generateCritiqueCore: vi.fn(),
}));

vi.mock("@/lib/error-handling", () => ({
  ErrorHandler: {
    handleServerActionError: vi.fn(),
  },
}));

// インポート
import { uploadImageCore } from "@/lib/upload";
import { generateCritiqueCore } from "@/lib/critique-core";
import { ErrorHandler } from "@/lib/error-handling";

// コンソールログをモック
const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

describe("processing-helpers", () => {
  const mockFormData = new FormData();
  const mockFile = new File(["test"], "test.jpg", { type: "image/jpeg" });
  mockFormData.append("file", mockFile);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("executeUploadAndCritique", () => {
    const mockUploadImageCore = vi.mocked(uploadImageCore);
    const mockGenerateCritiqueCore = vi.mocked(generateCritiqueCore);

    describe("正常系", () => {
      it("アップロードと講評生成の両方が成功する場合", async () => {
        // Arrange
        const mockUploadResult: UploadResult = {
          success: true,
          data: {
            id: "test-id",
            exifData: { camera: "Test Camera" },
            processedImage: {
              dataUrl: "data:image/jpeg;base64,test",
              originalSize: { width: 100, height: 100 },
              processedSize: { width: 100, height: 100 },
            },
          },
        };

        const mockCritiqueResult: CritiqueResult = {
          success: true,
          data: {
            technique: { score: 8, feedback: "技術的に優秀" },
            composition: { score: 7, feedback: "構図が良好" },
            color: { score: 9, feedback: "色使いが素晴らしい" },
            shareId: "share-123",
          },
          processingTime: 2000,
        };

        mockUploadImageCore.mockResolvedValueOnce(mockUploadResult);
        mockGenerateCritiqueCore.mockResolvedValueOnce(mockCritiqueResult);

        // Act
        const result = await executeUploadAndCritique(mockFormData);

        // Assert
        expect(result).toEqual({
          upload: mockUploadResult,
          critique: mockCritiqueResult,
        });
        expect(mockUploadImageCore).toHaveBeenCalledWith(mockFormData);
        expect(mockGenerateCritiqueCore).toHaveBeenCalledWith(
          mockFormData,
          mockUploadResult.data?.exifData,
        );
      });

      it("EXIF最適化：アップロード済みEXIFデータを講評生成に渡す", async () => {
        // Arrange
        const mockExifData = { camera: "Canon EOS R5", iso: 100 };
        const mockUploadResult: UploadResult = {
          success: true,
          data: {
            id: "test-id",
            exifData: mockExifData,
            processedImage: {
              dataUrl: "data:image/jpeg;base64,test",
              originalSize: { width: 100, height: 100 },
              processedSize: { width: 100, height: 100 },
            },
          },
        };

        mockUploadImageCore.mockResolvedValueOnce(mockUploadResult);
        mockGenerateCritiqueCore.mockResolvedValueOnce({
          success: true,
          data: {
            technique: { score: 8, feedback: "技術的に優秀" },
            composition: { score: 7, feedback: "構図が良好" },
            color: { score: 9, feedback: "色使いが素晴らしい" },
          },
          processingTime: 1500,
        });

        // Act
        await executeUploadAndCritique(mockFormData);

        // Assert
        expect(mockGenerateCritiqueCore).toHaveBeenCalledWith(
          mockFormData,
          mockExifData,
        );
      });
    });

    describe("異常系", () => {
      it("アップロードが失敗した場合、講評生成をスキップする", async () => {
        // Arrange
        const mockUploadError: UploadResult = {
          success: false,
          error: "ファイルサイズが大きすぎます",
        };

        mockUploadImageCore.mockResolvedValueOnce(mockUploadError);

        // Act
        const result = await executeUploadAndCritique(mockFormData);

        // Assert
        expect(result.upload).toEqual(mockUploadError);
        expect(result.critique).toEqual({
          success: false,
          error: "ファイルサイズが大きすぎます",
        });
        expect(mockGenerateCritiqueCore).not.toHaveBeenCalled();
      });

      it("アップロードエラーメッセージがない場合、デフォルトメッセージを使用", async () => {
        // Arrange
        const mockUploadError: UploadResult = {
          success: false,
          // error プロパティなし
        };

        mockUploadImageCore.mockResolvedValueOnce(mockUploadError);

        // Act
        const result = await executeUploadAndCritique(mockFormData);

        // Assert
        expect(result.critique.error).toBe("アップロードに失敗しました");
      });

      it("講評生成が失敗してもアップロード結果は返す", async () => {
        // Arrange
        const mockUploadResult: UploadResult = {
          success: true,
          data: {
            id: "test-id",
            exifData: {},
            processedImage: {
              dataUrl: "data:image/jpeg;base64,test",
              originalSize: { width: 100, height: 100 },
              processedSize: { width: 100, height: 100 },
            },
          },
        };

        const mockCritiqueError: CritiqueResult = {
          success: false,
          error: "AI サービスが利用できません",
        };

        mockUploadImageCore.mockResolvedValueOnce(mockUploadResult);
        mockGenerateCritiqueCore.mockResolvedValueOnce(mockCritiqueError);

        // Act
        const result = await executeUploadAndCritique(mockFormData);

        // Assert
        expect(result.upload).toEqual(mockUploadResult);
        expect(result.critique).toEqual(mockCritiqueError);
      });
    });
  });

  describe("measureProcessingTime", () => {
    beforeEach(() => {
      consoleSpy.mockClear();
    });

    it("処理時間を計測してログ出力する", async () => {
      // Arrange
      const mockResult = { test: "result" };
      const mockProcess = vi.fn().mockResolvedValue(mockResult);

      // Act
      const result = await measureProcessingTime(mockProcess);

      // Assert
      expect(result).toBe(mockResult);
      expect(mockProcess).toHaveBeenCalledOnce();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^Integrated processing completed in \d+ms$/),
      );
    });

    it("非同期処理でも正しく時間を計測する", async () => {
      // Arrange
      const delay = 100;
      const mockProcess = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return "delayed result";
      });

      // Act
      const startTime = Date.now();
      const result = await measureProcessingTime(mockProcess);
      const endTime = Date.now();

      // Assert
      expect(result).toBe("delayed result");
      expect(endTime - startTime).toBeGreaterThanOrEqual(delay);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^Integrated processing completed in \d+ms$/),
      );
    });

    it("処理中に例外が発生してもログは出力しない", async () => {
      // Arrange
      const mockError = new Error("Processing failed");
      const mockProcess = vi.fn().mockRejectedValue(mockError);

      // Act & Assert
      await expect(measureProcessingTime(mockProcess)).rejects.toThrow(
        "Processing failed",
      );
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe("handleIntegratedError", () => {
    const mockErrorHandler = vi.mocked(ErrorHandler.handleServerActionError);

    it("ErrorHandlerが成功レスポンスを返した場合", async () => {
      // Arrange
      const mockError = new Error("Test error");
      mockErrorHandler.mockReturnValueOnce({
        success: false,
        error: { message: "処理エラーが発生しました" },
      });

      // Act
      const result = handleIntegratedError(mockError);

      // Assert
      expect(result).toEqual({
        upload: {
          success: false,
          error: "処理エラーが発生しました",
        },
        critique: {
          success: false,
          error: "処理エラーが発生しました",
        },
      });
      expect(mockErrorHandler).toHaveBeenCalledWith(mockError);
    });

    it("ErrorHandlerがsuccessを返した場合はデフォルトメッセージを使用", async () => {
      // Arrange
      const mockError = new Error("Test error");
      mockErrorHandler.mockReturnValueOnce({
        success: true, // 通常はありえないが、フェイルセーフとして
      });

      // Act
      const result = handleIntegratedError(mockError);

      // Assert
      expect(result).toEqual({
        upload: {
          success: false,
          error: "予期しないエラーが発生しました",
        },
        critique: {
          success: false,
          error: "予期しないエラーが発生しました",
        },
      });
    });

    it("様々なエラータイプに対応する", async () => {
      // Arrange - string error
      mockErrorHandler.mockReturnValueOnce({
        success: false,
        error: { message: "文字列エラー" },
      });

      // Act
      const result1 = handleIntegratedError("string error");

      // Assert
      expect(result1.upload.error).toBe("文字列エラー");

      // Arrange - null error
      mockErrorHandler.mockReturnValueOnce({
        success: false,
        error: { message: "不明なエラー" },
      });

      // Act
      const result2 = handleIntegratedError(null);

      // Assert
      expect(result2.upload.error).toBe("不明なエラー");
    });
  });
});
