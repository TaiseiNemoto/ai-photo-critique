import { renderHook, act } from "@testing-library/react";
import { vi, MockedFunction } from "vitest";
import { toast } from "sonner";
import { useUploadFlow } from "@/hooks/useUploadFlow";
import { useUploadState } from "@/hooks/useUploadState";
import { useCritiqueGeneration } from "@/hooks/useCritiqueGeneration";
import type { UploadedImageWithFormData, UploadedImage } from "@/types/upload";

// モック設定
vi.mock("sonner");
vi.mock("@/hooks/useUploadState");
vi.mock("@/hooks/useCritiqueGeneration");

const mockSetUploadedImage = vi.fn();
const mockSetProcessing = vi.fn();
const mockSetCritiqueState = vi.fn();
const mockResetState = vi.fn();
const mockGenerateCritique = vi.fn();
const mockToastSuccess = vi.fn();
const mockToast = vi.fn();

// テスト用のモックデータ
const mockFormData = new FormData();
mockFormData.append(
  "image",
  new File(["test"], "test.jpg", { type: "image/jpeg" }),
);

const mockUploadedImageWithFormData: UploadedImageWithFormData = {
  file: new File(["test"], "test.jpg", { type: "image/jpeg" }),
  preview: "blob:mock-preview-url",
  exif: { camera: "Test Camera", iso: 100 },
  formData: mockFormData,
};

const mockUploadedImage: UploadedImage = {
  file: mockUploadedImageWithFormData.file,
  preview: mockUploadedImageWithFormData.preview,
  exif: mockUploadedImageWithFormData.exif,
};

const mockState = {
  uploadedImage: null,
  isProcessing: false,
  critique: { status: "idle" as const },
};

const mockFormDataRef = { current: null };

describe("useUploadFlow", () => {
  beforeEach(() => {
    // useUploadState のモック
    (useUploadState as MockedFunction<typeof useUploadState>).mockReturnValue({
      state: mockState,
      formDataRef: mockFormDataRef,
      setUploadedImage: mockSetUploadedImage,
      setProcessing: mockSetProcessing,
      setCritiqueState: mockSetCritiqueState,
      resetState: mockResetState,
    });

    // useCritiqueGeneration のモック
    (
      useCritiqueGeneration as MockedFunction<typeof useCritiqueGeneration>
    ).mockReturnValue({
      generateCritique: mockGenerateCritique,
    });

    // toast のモック
    (toast.success as MockedFunction<typeof toast.success>).mockImplementation(
      mockToastSuccess,
    );
    (toast as MockedFunction<typeof toast>).mockImplementation(mockToast);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("handleImageUploaded", () => {
    it("画像アップロード時に適切な処理を実行する", () => {
      const { result } = renderHook(() => useUploadFlow());

      act(() => {
        result.current.handleImageUploaded(mockUploadedImageWithFormData);
      });

      // uploadedImageが設定されることを確認
      expect(mockSetUploadedImage).toHaveBeenCalledWith({
        file: mockUploadedImageWithFormData.file,
        preview: mockUploadedImageWithFormData.preview,
        exif: mockUploadedImageWithFormData.exif,
      });

      // 講評状態がリセットされることを確認
      expect(mockSetCritiqueState).toHaveBeenCalledWith({ status: "idle" });

      // 成功トーストが表示されることを確認
      expect(mockToastSuccess).toHaveBeenCalledWith(
        "画像をアップロードしました",
        {
          description: "EXIF情報を解析中...",
          duration: 2000,
        },
      );

      // FormDataが参照に保存されることを確認
      expect(mockFormDataRef.current).toBe(
        mockUploadedImageWithFormData.formData,
      );
    });

    it("EXIF情報がない画像でも正常に処理される", () => {
      const { result } = renderHook(() => useUploadFlow());

      const imageWithoutExif: UploadedImageWithFormData = {
        ...mockUploadedImageWithFormData,
        exif: undefined,
      };

      act(() => {
        result.current.handleImageUploaded(imageWithoutExif);
      });

      expect(mockSetUploadedImage).toHaveBeenCalledWith({
        file: imageWithoutExif.file,
        preview: imageWithoutExif.preview,
        exif: undefined,
      });
    });
  });

  describe("handleGenerateCritique", () => {
    it("画像がある場合に講評生成を実行する", async () => {
      // モック状態を更新（画像あり）
      const stateWithImage = {
        ...mockState,
        uploadedImage: mockUploadedImage,
      };

      (useUploadState as MockedFunction<typeof useUploadState>).mockReturnValue(
        {
          state: stateWithImage,
          formDataRef: mockFormDataRef,
          setUploadedImage: mockSetUploadedImage,
          setProcessing: mockSetProcessing,
          setCritiqueState: mockSetCritiqueState,
          resetState: mockResetState,
        },
      );

      const { result } = renderHook(() => useUploadFlow());

      await act(async () => {
        await result.current.handleGenerateCritique();
      });

      // generateCritiqueが適切な引数で呼ばれることを確認
      expect(mockGenerateCritique).toHaveBeenCalledWith(
        mockUploadedImage,
        mockFormDataRef,
        mockSetProcessing,
        mockSetCritiqueState,
      );
    });

    it("画像がない場合は何もしない", async () => {
      const { result } = renderHook(() => useUploadFlow());

      await act(async () => {
        await result.current.handleGenerateCritique();
      });

      // generateCritiqueが呼ばれないことを確認
      expect(mockGenerateCritique).not.toHaveBeenCalled();
    });
  });

  describe("resetUpload", () => {
    it("アップロード状態をリセットする", () => {
      const { result } = renderHook(() => useUploadFlow());

      act(() => {
        result.current.resetUpload();
      });

      // resetStateが呼ばれることを確認
      expect(mockResetState).toHaveBeenCalled();

      // リセットトーストが表示されることを確認
      expect(mockToast).toHaveBeenCalledWith("画像をリセットしました", {
        description: "新しい画像を選択してください",
        duration: 2000,
      });
    });
  });

  describe("state の返却", () => {
    it("useUploadStateからの状態をそのまま返す", () => {
      const { result } = renderHook(() => useUploadFlow());

      expect(result.current.state).toBe(mockState);
    });

    it("状態変更が正しく反映される", () => {
      const updatedState = {
        ...mockState,
        uploadedImage: mockUploadedImage,
        isProcessing: true,
      };

      (useUploadState as MockedFunction<typeof useUploadState>).mockReturnValue(
        {
          state: updatedState,
          formDataRef: mockFormDataRef,
          setUploadedImage: mockSetUploadedImage,
          setProcessing: mockSetProcessing,
          setCritiqueState: mockSetCritiqueState,
          resetState: mockResetState,
        },
      );

      const { result } = renderHook(() => useUploadFlow());

      expect(result.current.state).toBe(updatedState);
    });
  });

  describe("統合テスト", () => {
    it("アップロードから講評生成までの一連の流れが正常に動作する", async () => {
      const { result } = renderHook(() => useUploadFlow());

      // 1. 画像アップロード
      act(() => {
        result.current.handleImageUploaded(mockUploadedImageWithFormData);
      });

      expect(mockSetUploadedImage).toHaveBeenCalled();
      expect(mockSetCritiqueState).toHaveBeenCalledWith({ status: "idle" });

      // 2. 状態を画像ありに更新
      const stateWithImage = {
        ...mockState,
        uploadedImage: mockUploadedImage,
      };

      (useUploadState as MockedFunction<typeof useUploadState>).mockReturnValue(
        {
          state: stateWithImage,
          formDataRef: mockFormDataRef,
          setUploadedImage: mockSetUploadedImage,
          setProcessing: mockSetProcessing,
          setCritiqueState: mockSetCritiqueState,
          resetState: mockResetState,
        },
      );

      // 3. 新しいhookインスタンスを取得（状態更新後）
      const { result: updatedResult } = renderHook(() => useUploadFlow());

      // 講評生成実行
      await act(async () => {
        await updatedResult.current.handleGenerateCritique();
      });

      expect(mockGenerateCritique).toHaveBeenCalledWith(
        mockUploadedImage,
        mockFormDataRef,
        mockSetProcessing,
        mockSetCritiqueState,
      );

      // 4. リセット
      act(() => {
        result.current.resetUpload();
      });

      expect(mockResetState).toHaveBeenCalled();
    });
  });
});
