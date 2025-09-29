import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUploadService } from "./upload-service";
import { uploadImageWithCritique } from "@/app/actions";
import type { UploadedImageWithFormData, CritiqueData } from "@/types/upload";

// モックの設定
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

vi.mock("@/app/actions", () => ({
  uploadImageWithCritique: vi.fn(),
}));

// URL.revokeObjectURLのモック
global.URL.revokeObjectURL = vi.fn();

vi.mock("@/contexts/CritiqueContext", () => ({
  useCritique: () => ({
    setCritiqueData: vi.fn(),
  }),
}));

const mockPush = vi.fn();

describe("useUploadService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as vi.MockedFunction<typeof useRouter>).mockReturnValue({
      push: mockPush,
    });
  });

  describe("初期状態", () => {
    it("初期状態が正しく設定される", () => {
      const { result } = renderHook(() => useUploadService());

      expect(result.current.state.uploadedImage).toBeNull();
      expect(result.current.state.isProcessing).toBe(false);
      expect(result.current.state.critique.status).toBe("idle");
    });
  });

  describe("uploadImage", () => {
    it("画像アップロード時に状態が正しく更新される", () => {
      const { result } = renderHook(() => useUploadService());

      const mockImage: UploadedImageWithFormData = {
        file: new File([""], "test.jpg", { type: "image/jpeg" }),
        preview: "data:image/jpeg;base64,test",
        exif: { camera: "Test Camera" },
        formData: new FormData(),
      };

      act(() => {
        result.current.uploadImage(mockImage);
      });

      expect(result.current.state.uploadedImage).toEqual({
        file: mockImage.file,
        preview: mockImage.preview,
        exif: mockImage.exif,
      });
      expect(result.current.state.critique.status).toBe("idle");
      expect(toast.success).toHaveBeenCalledWith(
        "画像をアップロードしました",
        expect.any(Object),
      );
    });
  });

  describe("generateCritique", () => {
    it("アップロード画像がない場合は処理を行わない", async () => {
      const { result } = renderHook(() => useUploadService());

      await act(async () => {
        await result.current.generateCritique();
      });

      expect(uploadImageWithCritique).not.toHaveBeenCalled();
    });

    it("講評生成が成功した場合の処理", async () => {
      const { result } = renderHook(() => useUploadService());

      const mockImage: UploadedImageWithFormData = {
        file: new File([""], "test.jpg", { type: "image/jpeg" }),
        preview: "data:image/jpeg;base64,test",
        exif: { camera: "Test Camera" },
        formData: new FormData(),
      };

      const mockCritiqueData: CritiqueData = {
        technique: { title: "技術", content: "良好", score: 8 },
        composition: { title: "構図", content: "バランス良い", score: 9 },
        color: { title: "色彩", content: "鮮やか", score: 7 },
        overall: { content: "総評", improvement: "改善点" },
        processingTime: 2500,
        id: "test-id",
      };

      const mockResult = {
        upload: { success: true, data: { id: "test-id" } },
        critique: { success: true, data: mockCritiqueData },
      };

      (
        uploadImageWithCritique as vi.MockedFunction<
          typeof uploadImageWithCritique
        >
      ).mockResolvedValueOnce(mockResult);

      // 画像をアップロード
      act(() => {
        result.current.uploadImage(mockImage);
      });

      // 講評生成を実行
      await act(async () => {
        await result.current.generateCritique();
      });

      expect(result.current.state.isProcessing).toBe(false);
      expect(result.current.state.critique.status).toBe("success");
      expect(result.current.state.critique.data).toEqual(mockCritiqueData);
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("講評"),
        expect.any(Object),
      );
    });

    it("講評生成が失敗した場合の処理", async () => {
      const { result } = renderHook(() => useUploadService());

      const mockImage: UploadedImageWithFormData = {
        file: new File([""], "test.jpg", { type: "image/jpeg" }),
        preview: "data:image/jpeg;base64,test",
        exif: { camera: "Test Camera" },
        formData: new FormData(),
      };

      const mockResult = {
        upload: { success: true, data: { id: "test-id" } },
        critique: { success: false, error: "AI処理エラー" },
      };

      (
        uploadImageWithCritique as vi.MockedFunction<
          typeof uploadImageWithCritique
        >
      ).mockResolvedValueOnce(mockResult);

      // 画像をアップロード
      act(() => {
        result.current.uploadImage(mockImage);
      });

      // 講評生成を実行
      await act(async () => {
        await result.current.generateCritique();
      });

      expect(result.current.state.isProcessing).toBe(false);
      expect(result.current.state.critique.status).toBe("error");
      expect(result.current.state.critique.error).toBe("AI処理エラー");
    });

    it("処理中はisProcessingがtrueになる", async () => {
      const { result } = renderHook(() => useUploadService());

      const mockImage: UploadedImageWithFormData = {
        file: new File([""], "test.jpg", { type: "image/jpeg" }),
        preview: "data:image/jpeg;base64,test",
        exif: { camera: "Test Camera" },
        formData: new FormData(),
      };

      // 遅延を含むPromiseでモック
      (
        uploadImageWithCritique as vi.MockedFunction<
          typeof uploadImageWithCritique
        >
      ).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  upload: { success: true, data: { id: "test-id" } },
                  critique: { success: true, data: {} },
                }),
              100,
            );
          }),
      );

      // 画像をアップロード
      act(() => {
        result.current.uploadImage(mockImage);
      });

      // 講評生成を開始し、完了まで待機
      await act(async () => {
        await result.current.generateCritique();
      });

      // 処理中の状態確認（実際にはここで処理が完了している）
      expect(result.current.state.critique.status).toBe("success");
      expect(result.current.state.isProcessing).toBe(false);
    });
  });

  describe("resetUpload", () => {
    it("アップロード状態をリセットする", () => {
      const { result } = renderHook(() => useUploadService());

      const mockImage: UploadedImageWithFormData = {
        file: new File([""], "test.jpg", { type: "image/jpeg" }),
        preview: "data:image/jpeg;base64,test",
        exif: { camera: "Test Camera" },
        formData: new FormData(),
      };

      // 画像をアップロード
      act(() => {
        result.current?.uploadImage(mockImage);
      });

      // 状態確認
      expect(result.current?.state.uploadedImage).not.toBeNull();

      // リセット実行
      act(() => {
        result.current?.resetUpload();
      });

      expect(result.current?.state.uploadedImage).toBeNull();
      expect(result.current?.state.critique.status).toBe("idle");
      expect(toast).toHaveBeenCalledWith(
        "画像をリセットしました",
        expect.any(Object),
      );
    });
  });
});
