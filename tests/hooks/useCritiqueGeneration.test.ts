import { renderHook, act } from "@testing-library/react";
import { vi, MockedFunction } from "vitest";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCritiqueGeneration } from "@/hooks/useCritiqueGeneration";
import { useCritique } from "@/contexts/CritiqueContext";
import { uploadImageWithCritique } from "@/app/actions";
import type { UploadedImage, CritiqueData } from "@/types/upload";

// モック設定
vi.mock("next/navigation");
vi.mock("sonner");
vi.mock("@/contexts/CritiqueContext");
vi.mock("@/app/actions");

const mockPush = vi.fn();
const mockSetCritiqueData = vi.fn();
const mockToastLoading = vi.fn().mockReturnValue("loading-toast-id");
const mockToastDismiss = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockUploadImageWithCritique = uploadImageWithCritique as MockedFunction<
  typeof uploadImageWithCritique
>;

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

describe("useCritiqueGeneration", () => {
  beforeEach(() => {
    // useRouter のモック
    (useRouter as MockedFunction<typeof useRouter>).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    });

    // useCritique のモック
    (useCritique as MockedFunction<typeof useCritique>).mockReturnValue({
      critiqueData: null,
      setCritiqueData: mockSetCritiqueData,
      clearCritiqueData: vi.fn(),
    });

    // toast のモック
    (toast.loading as MockedFunction<typeof toast.loading>).mockImplementation(
      mockToastLoading,
    );
    (toast.dismiss as MockedFunction<typeof toast.dismiss>).mockImplementation(
      mockToastDismiss,
    );
    (toast.success as MockedFunction<typeof toast.success>).mockImplementation(
      mockToastSuccess,
    );
    (toast.error as MockedFunction<typeof toast.error>).mockImplementation(
      mockToastError,
    );

    // setTimeout のモック
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe("generateCritique", () => {
    it("正常系: 講評生成が成功する", async () => {
      const { result } = renderHook(() => useCritiqueGeneration());

      const formDataRef = { current: new FormData() };
      const mockOnProcessingChange = vi.fn();
      const mockOnCritiqueStateChange = vi.fn();

      // 成功レスポンスのモック
      mockUploadImageWithCritique.mockResolvedValueOnce({
        critique: {
          success: true,
          data: mockCritiqueData,
        },
      });

      // 講評生成実行
      const promise = act(async () => {
        await result.current.generateCritique(
          mockUploadedImage,
          formDataRef,
          mockOnProcessingChange,
          mockOnCritiqueStateChange,
        );
      });

      // ローディングトーストが表示されることを確認
      expect(mockToastLoading).toHaveBeenCalledWith("AI講評を生成中...", {
        description: "技術・構図・色彩を分析しています",
      });

      // 処理中状態がtrueになることを確認
      expect(mockOnProcessingChange).toHaveBeenCalledWith(true);
      expect(mockOnCritiqueStateChange).toHaveBeenCalledWith({
        status: "loading",
      });

      await promise;

      // 成功時の処理を確認
      expect(mockToastDismiss).toHaveBeenCalledWith("loading-toast-id");
      expect(mockOnCritiqueStateChange).toHaveBeenCalledWith({
        status: "success",
        data: mockCritiqueData,
      });
      expect(mockToastSuccess).toHaveBeenCalledWith("講評が完了しました", {
        description: "結果ページに移動します",
        duration: 1500,
      });

      // タイマーを進めて遷移処理を確認
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(mockSetCritiqueData).toHaveBeenCalledWith({
        image: mockUploadedImage,
        critique: mockCritiqueData,
      });
      expect(mockPush).toHaveBeenCalledWith("/report/current");
      expect(mockOnProcessingChange).toHaveBeenCalledWith(false);
    });

    it("異常系: 講評生成が失敗する", async () => {
      const { result } = renderHook(() => useCritiqueGeneration());

      const formDataRef = { current: new FormData() };
      const mockOnProcessingChange = vi.fn();
      const mockOnCritiqueStateChange = vi.fn();

      // 失敗レスポンスのモック
      mockUploadImageWithCritique.mockResolvedValueOnce({
        critique: {
          success: false,
          error: "テストエラーメッセージ",
        },
      });

      await act(async () => {
        await result.current.generateCritique(
          mockUploadedImage,
          formDataRef,
          mockOnProcessingChange,
          mockOnCritiqueStateChange,
        );
      });

      // エラー時の処理を確認
      expect(mockOnCritiqueStateChange).toHaveBeenCalledWith({
        status: "error",
        error: "テストエラーメッセージ",
      });
      expect(mockToastError).toHaveBeenCalledWith("講評生成に失敗しました", {
        description: "テストエラーメッセージ",
        duration: 3000,
      });
      expect(mockOnProcessingChange).toHaveBeenCalledWith(false);
    });

    it("異常系: ネットワークエラーが発生する", async () => {
      const { result } = renderHook(() => useCritiqueGeneration());

      const formDataRef = { current: new FormData() };
      const mockOnProcessingChange = vi.fn();
      const mockOnCritiqueStateChange = vi.fn();

      // ネットワークエラーのモック
      mockUploadImageWithCritique.mockRejectedValueOnce(
        new Error("Network error"),
      );

      await act(async () => {
        await result.current.generateCritique(
          mockUploadedImage,
          formDataRef,
          mockOnProcessingChange,
          mockOnCritiqueStateChange,
        );
      });

      // ネットワークエラー時の処理を確認
      expect(mockOnCritiqueStateChange).toHaveBeenCalledWith({
        status: "error",
        error: "ネットワークエラーが発生しました",
      });
      expect(mockToastError).toHaveBeenCalledWith("エラーが発生しました", {
        description: "ネットワーク接続を確認してください",
        duration: 3000,
      });
      expect(mockOnProcessingChange).toHaveBeenCalledWith(false);
    });

    it("フォールバック: FormDataがnullの場合は自動生成する", async () => {
      const { result } = renderHook(() => useCritiqueGeneration());

      const formDataRef = { current: null };
      const mockOnProcessingChange = vi.fn();
      const mockOnCritiqueStateChange = vi.fn();

      // 成功レスポンスのモック
      mockUploadImageWithCritique.mockResolvedValueOnce({
        critique: {
          success: true,
          data: mockCritiqueData,
        },
      });

      await act(async () => {
        await result.current.generateCritique(
          mockUploadedImage,
          formDataRef,
          mockOnProcessingChange,
          mockOnCritiqueStateChange,
        );
      });

      // uploadImageWithCritiqueが適切なFormDataで呼ばれることを確認
      expect(mockUploadImageWithCritique).toHaveBeenCalledWith(
        expect.any(FormData),
      );

      // 呼ばれたFormDataの内容を確認
      const calledFormData = mockUploadImageWithCritique.mock.calls[0][0];
      expect(calledFormData.get("image")).toBe(mockUploadedImage.file);
      expect(calledFormData.get("exifData")).toBe(
        JSON.stringify(mockUploadedImage.exif),
      );
    });

    it("EXIF データがない場合はexifDataを追加しない", async () => {
      const { result } = renderHook(() => useCritiqueGeneration());

      const imageWithoutExif: UploadedImage = {
        ...mockUploadedImage,
        exif: undefined,
      };

      const formDataRef = { current: null };
      const mockOnProcessingChange = vi.fn();
      const mockOnCritiqueStateChange = vi.fn();

      mockUploadImageWithCritique.mockResolvedValueOnce({
        critique: {
          success: true,
          data: mockCritiqueData,
        },
      });

      await act(async () => {
        await result.current.generateCritique(
          imageWithoutExif,
          formDataRef,
          mockOnProcessingChange,
          mockOnCritiqueStateChange,
        );
      });

      // exifDataが追加されないことを確認
      const calledFormData = mockUploadImageWithCritique.mock.calls[0][0];
      expect(calledFormData.get("image")).toBe(imageWithoutExif.file);
      expect(calledFormData.get("exifData")).toBeNull();
    });
  });

  describe("定数値", () => {
    it("適切なタイミングとメッセージが使用される", async () => {
      const { result } = renderHook(() => useCritiqueGeneration());

      const formDataRef = { current: new FormData() };
      const mockOnProcessingChange = vi.fn();
      const mockOnCritiqueStateChange = vi.fn();

      mockUploadImageWithCritique.mockResolvedValueOnce({
        critique: {
          success: true,
          data: mockCritiqueData,
        },
      });

      await act(async () => {
        await result.current.generateCritique(
          mockUploadedImage,
          formDataRef,
          mockOnProcessingChange,
          mockOnCritiqueStateChange,
        );
      });

      // 定数化されたメッセージが使用されることを確認
      expect(mockToastLoading).toHaveBeenCalledWith("AI講評を生成中...", {
        description: "技術・構図・色彩を分析しています",
      });

      expect(mockToastSuccess).toHaveBeenCalledWith("講評が完了しました", {
        description: "結果ページに移動します",
        duration: 1500, // TIMING.TOAST_SUCCESS_DURATION
      });
    });
  });
});
