import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";
import { useUploadState } from "@/hooks/useUploadState";
import type { UploadedImage, CritiqueData } from "@/types/upload";

// テスト用のモックデータ
const mockUploadedImage: UploadedImage = {
  file: new File(["test"], "test.jpg", { type: "image/jpeg" }),
  preview: "blob:mock-preview-url",
  exif: { camera: "Test Camera", iso: 100 },
};

const mockCritiqueData: CritiqueData = {
  technique: { score: 8, comment: "テスト講評" },
  composition: { score: 7, comment: "テスト講評" },
  color: { score: 9, comment: "テスト講評" },
  overall: "テスト総評",
  metadata: {
    model: "test-model",
    analysisTime: 1000,
    confidence: 0.95,
  },
};

describe("useUploadState", () => {
  beforeEach(() => {
    // URL.revokeObjectURL のモック
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("初期状態", () => {
    it("初期状態が正しく設定される", () => {
      const { result } = renderHook(() => useUploadState());

      expect(result.current.state.uploadedImage).toBeNull();
      expect(result.current.state.isProcessing).toBe(false);
      expect(result.current.state.critique.status).toBe("idle");
      expect(result.current.state.critique.data).toBeUndefined();
      expect(result.current.state.critique.error).toBeUndefined();
      expect(result.current.formDataRef.current).toBeNull();
    });
  });

  describe("setUploadedImage", () => {
    it("アップロード画像を正しく設定できる", () => {
      const { result } = renderHook(() => useUploadState());

      act(() => {
        result.current.setUploadedImage(mockUploadedImage);
      });

      expect(result.current.state.uploadedImage).toEqual(mockUploadedImage);
    });

    it("null を設定できる", () => {
      const { result } = renderHook(() => useUploadState());

      // 最初に画像を設定
      act(() => {
        result.current.setUploadedImage(mockUploadedImage);
      });

      // null に戻す
      act(() => {
        result.current.setUploadedImage(null);
      });

      expect(result.current.state.uploadedImage).toBeNull();
    });
  });

  describe("setProcessing", () => {
    it("処理状態を正しく設定できる", () => {
      const { result } = renderHook(() => useUploadState());

      act(() => {
        result.current.setProcessing(true);
      });

      expect(result.current.state.isProcessing).toBe(true);

      act(() => {
        result.current.setProcessing(false);
      });

      expect(result.current.state.isProcessing).toBe(false);
    });
  });

  describe("setCritiqueState", () => {
    it("講評状態を正しく設定できる", () => {
      const { result } = renderHook(() => useUploadState());

      const newCritiqueState = {
        status: "success" as const,
        data: mockCritiqueData,
      };

      act(() => {
        result.current.setCritiqueState(newCritiqueState);
      });

      expect(result.current.state.critique).toEqual(newCritiqueState);
    });

    it("エラー状態を正しく設定できる", () => {
      const { result } = renderHook(() => useUploadState());

      const errorState = {
        status: "error" as const,
        error: "テストエラー",
      };

      act(() => {
        result.current.setCritiqueState(errorState);
      });

      expect(result.current.state.critique).toEqual(errorState);
    });
  });

  describe("formDataRef", () => {
    it("FormDataを参照で管理できる", () => {
      const { result } = renderHook(() => useUploadState());
      const testFormData = new FormData();
      testFormData.append("test", "value");

      act(() => {
        result.current.formDataRef.current = testFormData;
      });

      expect(result.current.formDataRef.current).toBe(testFormData);
    });
  });

  describe("resetState", () => {
    it("全ての状態をリセットできる", () => {
      const { result } = renderHook(() => useUploadState());

      // 状態を設定
      act(() => {
        result.current.setUploadedImage(mockUploadedImage);
        result.current.setProcessing(true);
        result.current.setCritiqueState({
          status: "success",
          data: mockCritiqueData,
        });
        result.current.formDataRef.current = new FormData();
      });

      // リセット実行
      act(() => {
        result.current.resetState();
      });

      // 初期状態に戻ることを確認
      expect(result.current.state.uploadedImage).toBeNull();
      expect(result.current.state.isProcessing).toBe(false);
      expect(result.current.state.critique.status).toBe("idle");
      expect(result.current.state.critique.data).toBeUndefined();
      expect(result.current.state.critique.error).toBeUndefined();
      expect(result.current.formDataRef.current).toBeNull();
    });

    it("リセット時にpreview URLを適切にrevokeする", () => {
      const { result } = renderHook(() => useUploadState());

      // 画像を設定
      act(() => {
        result.current.setUploadedImage(mockUploadedImage);
      });

      // リセット実行
      act(() => {
        result.current.resetState();
      });

      // URL.revokeObjectURL が呼ばれることを確認
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(
        mockUploadedImage.preview,
      );
    });

    it("uploadedImageがnullの場合はrevokeObjectURLを呼ばない", () => {
      const { result } = renderHook(() => useUploadState());

      // 初期状態（uploadedImage = null）でリセット実行
      act(() => {
        result.current.resetState();
      });

      // URL.revokeObjectURL が呼ばれないことを確認
      expect(global.URL.revokeObjectURL).not.toHaveBeenCalled();
    });
  });

  describe("状態の独立性", () => {
    it("複数の状態変更が独立して動作する", () => {
      const { result } = renderHook(() => useUploadState());

      act(() => {
        result.current.setUploadedImage(mockUploadedImage);
      });

      act(() => {
        result.current.setProcessing(true);
      });

      act(() => {
        result.current.setCritiqueState({ status: "loading" });
      });

      expect(result.current.state.uploadedImage).toEqual(mockUploadedImage);
      expect(result.current.state.isProcessing).toBe(true);
      expect(result.current.state.critique.status).toBe("loading");
    });
  });
});
