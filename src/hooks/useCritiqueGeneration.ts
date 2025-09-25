import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCritique } from "@/contexts/CritiqueContext";
import { uploadImageWithCritique } from "@/app/actions";
import { TIMING, MESSAGES } from "@/lib/constants";
import { ErrorPropagation } from "@/lib/error-propagation";
import { ErrorCode } from "@/lib/error-codes";
import type { UploadedImage } from "@/types/upload";
import type { UploadState } from "./useUploadState";
import type { AppError } from "@/types/error";

export function useCritiqueGeneration() {
  const router = useRouter();
  const { setCritiqueData } = useCritique();

  const generateCritique = async (
    uploadedImage: UploadedImage,
    formDataRef: React.RefObject<FormData | null>,
    onProcessingChange: (processing: boolean) => void,
    onCritiqueStateChange: (state: UploadState["critique"]) => void,
  ) => {
    onProcessingChange(true);
    onCritiqueStateChange({ status: "loading" });

    const loadingToastId = toast.loading(MESSAGES.CRITIQUE_LOADING, {
      description: MESSAGES.CRITIQUE_LOADING_DESC,
    });

    try {
      const formData =
        formDataRef.current || createFallbackFormData(uploadedImage);
      const result = await uploadImageWithCritique(formData);

      toast.dismiss(loadingToastId);

      if (result.critique.success && result.critique.data) {
        onCritiqueStateChange({
          status: "success",
          data: result.critique.data,
        });

        toast.success(MESSAGES.CRITIQUE_SUCCESS, {
          description: MESSAGES.CRITIQUE_SUCCESS_DESC,
          duration: TIMING.TOAST_SUCCESS_DURATION,
        });

        setTimeout(() => {
          setCritiqueData({
            image: uploadedImage,
            critique: result.critique.data!,
          });
          router.push("/report/current");
        }, TIMING.NAVIGATION_DELAY);
      } else {
        handleCritiqueErrorWithPropagation(result.critique.error, onCritiqueStateChange);
      }
    } catch (error) {
      console.error("Critique generation error:", error);
      toast.dismiss(loadingToastId);
      handleNetworkErrorWithPropagation(error, onCritiqueStateChange);
    } finally {
      onProcessingChange(false);
    }
  };

  return { generateCritique };
}

function createFallbackFormData(uploadedImage: UploadedImage): FormData {
  const formData = new FormData();
  formData.append("image", uploadedImage.file);
  if (uploadedImage.exif) {
    formData.append("exifData", JSON.stringify(uploadedImage.exif));
  }
  return formData;
}

function handleCritiqueErrorWithPropagation(
  error: string | AppError | undefined,
  onCritiqueStateChange: (state: UploadState["critique"]) => void,
) {
  let appError: AppError;

  if (typeof error === "object" && error?.code) {
    // 既にAppError形式の場合
    appError = error as AppError;
  } else {
    // 文字列エラーの場合、AppErrorに変換
    appError = {
      code: ErrorCode.AI_SERVICE_ERROR,
      message: (typeof error === "string" ? error : undefined) || MESSAGES.CRITIQUE_ERROR,
      timestamp: new Date().toISOString(),
    };
  }

  const uiError = ErrorPropagation.fromCoreToUI(appError);

  onCritiqueStateChange({
    status: "error",
    error: uiError.message,
    isRetryable: uiError.isRetryable,
  });

  toast.error(MESSAGES.CRITIQUE_ERROR, {
    description: uiError.userAction,
    duration: TIMING.TOAST_ERROR_DURATION,
  });
}

function handleNetworkErrorWithPropagation(
  error: unknown,
  onCritiqueStateChange: (state: UploadState["critique"]) => void,
) {
  const coreError = ErrorPropagation.fromServerActionToCore(error);
  const uiError = ErrorPropagation.fromCoreToUI(coreError);

  onCritiqueStateChange({
    status: "error",
    error: uiError.message,
    isRetryable: uiError.isRetryable,
  });

  toast.error("エラーが発生しました", {
    description: uiError.userAction,
    duration: TIMING.TOAST_ERROR_DURATION,
  });
}