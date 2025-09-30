import { useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUploadState } from "@/hooks/useUploadState";
import { useCritique } from "@/contexts/CritiqueContext";
import { uploadImageWithCritique } from "@/app/actions";
import type { UploadedImage, UploadedImageWithFormData } from "@/types/upload";
import type { AppError } from "@/types/error";
import type { UploadState } from "@/hooks/useUploadState";
import type { CritiqueData } from "@/lib/kv";

// 定数
const MESSAGES = {
  UPLOAD_SUCCESS: "画像をアップロードしました",
  UPLOAD_SUCCESS_DESC: "EXIF情報を解析中...",
  CRITIQUE_LOADING: "AI講評を生成中...",
  CRITIQUE_LOADING_DESC: "しばらくお待ちください",
  CRITIQUE_SUCCESS: "AI講評を生成しました",
  CRITIQUE_SUCCESS_DESC: "結果画面に移動します",
  RESET_SUCCESS: "画像をリセットしました",
  RESET_SUCCESS_DESC: "新しい画像を選択してください",
} as const;

const TIMING = {
  TOAST_INFO_DURATION: 3000,
  TOAST_SUCCESS_DURATION: 2000,
  NAVIGATION_DELAY: 800,
} as const;

/**
 * フォールバック用のFormDataを作成
 * formDataRefが利用できない場合の代替処理
 */
function createFallbackFormData(uploadedImage: UploadedImage): FormData {
  const formData = new FormData();
  formData.append("file", uploadedImage.file);
  if (uploadedImage.exif) {
    formData.append("exif", JSON.stringify(uploadedImage.exif));
  }
  return formData;
}

/**
 * 講評エラーのハンドリング
 */
function handleCritiqueErrorWithPropagation(
  error: string | AppError | undefined,
  onCritiqueStateChange: (state: UploadState["critique"]) => void,
): void {
  let errorMessage: string;
  if (typeof error === "string") {
    errorMessage = error;
  } else if (error && typeof error === "object" && "message" in error) {
    errorMessage = error.message;
  } else {
    errorMessage = "講評生成中にエラーが発生しました";
  }

  onCritiqueStateChange({
    status: "error",
    error: errorMessage,
    isRetryable: true,
  });
}

/**
 * ネットワークエラーのハンドリング
 */
function handleNetworkErrorWithPropagation(
  error: unknown,
  onCritiqueStateChange: (state: UploadState["critique"]) => void,
): void {
  onCritiqueStateChange({
    status: "error",
    error:
      "ネットワークエラーが発生しました。しばらく時間をおいて再試行してください。",
    isRetryable: true,
  });
}

/**
 * Upload Service Interface
 * アプリケーションの統一されたビジネスロジック層
 */
export interface UploadService {
  uploadImage: (image: UploadedImageWithFormData) => void;
  generateCritique: () => Promise<void>;
  resetUpload: () => void;
  state: UploadState;
}

/**
 * アップロード・講評生成の統合サービス
 *
 * 責任:
 * - 画像アップロード状態管理
 * - 講評生成処理の制御
 * - エラーハンドリング
 * - UI状態の更新
 */
export function useUploadService(): UploadService {
  const router = useRouter();
  const { setCritiqueData } = useCritique();
  const formDataRef = useRef<FormData | null>(null);

  const {
    state,
    setUploadedImage,
    setProcessing,
    setCritiqueState,
    resetState,
  } = useUploadState();

  const uploadImage = (image: UploadedImageWithFormData): void => {
    const uploadedImage = {
      file: image.file,
      preview: image.preview,
      exif: image.exif,
    };

    setUploadedImage(uploadedImage);
    setCritiqueState({ status: "idle" });

    toast.success(MESSAGES.UPLOAD_SUCCESS, {
      description: MESSAGES.UPLOAD_SUCCESS_DESC,
      duration: TIMING.TOAST_INFO_DURATION,
    });

    formDataRef.current = image.formData;
  };

  const generateCritique = async (): Promise<void> => {
    if (!state.uploadedImage) return;

    setProcessing(true);
    setCritiqueState({ status: "loading" });

    const loadingToastId = toast.loading(MESSAGES.CRITIQUE_LOADING, {
      description: MESSAGES.CRITIQUE_LOADING_DESC,
    });

    try {
      const formData =
        formDataRef.current || createFallbackFormData(state.uploadedImage);
      const result = await uploadImageWithCritique(formData);

      toast.dismiss(loadingToastId);

      if (result.critique.success && result.critique.data) {
        // 完全なCritiqueDataオブジェクトを構築
        const now = new Date();
        const fullCritiqueData: CritiqueData = {
          id: result.critique.data.shareId!,
          filename: state.uploadedImage!.file.name,
          uploadedAt: now.toISOString(),
          technique: result.critique.data.technique,
          composition: result.critique.data.composition,
          color: result.critique.data.color,
          overall: result.critique.data.overall,
          imageData: state.uploadedImage!.preview,
          exifData: (state.uploadedImage!.exif || {}) as Record<
            string,
            unknown
          >,
          shareId: result.critique.data.shareId!,
          createdAt: now.toISOString(),
          expiresAt: new Date(
            now.getTime() + 24 * 60 * 60 * 1000,
          ).toISOString(),
        };

        setCritiqueState({
          status: "success",
          data: fullCritiqueData,
        });

        toast.success(MESSAGES.CRITIQUE_SUCCESS, {
          description: MESSAGES.CRITIQUE_SUCCESS_DESC,
          duration: TIMING.TOAST_SUCCESS_DURATION,
        });

        setTimeout(() => {
          setCritiqueData({
            image: state.uploadedImage!,
            critique: fullCritiqueData, // 構築済みデータを再利用
          });
          router.push("/report/current");
        }, TIMING.NAVIGATION_DELAY);
      } else {
        handleCritiqueErrorWithPropagation(
          result.critique.error,
          setCritiqueState,
        );
      }
    } catch (error) {
      console.error("Critique generation error:", error);
      toast.dismiss(loadingToastId);
      handleNetworkErrorWithPropagation(error, setCritiqueState);
    } finally {
      setProcessing(false);
    }
  };

  const resetUpload = (): void => {
    resetState();
    formDataRef.current = null;

    toast(MESSAGES.RESET_SUCCESS, {
      description: MESSAGES.RESET_SUCCESS_DESC,
      duration: TIMING.TOAST_INFO_DURATION,
    });
  };

  return {
    uploadImage,
    generateCritique,
    resetUpload,
    state,
  };
}
