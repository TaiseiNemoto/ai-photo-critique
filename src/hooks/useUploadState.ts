import { useState, useRef } from "react";
import type { UploadedImage, CritiqueData } from "@/types/upload";

export type UploadState = {
  uploadedImage: UploadedImage | null;
  isProcessing: boolean;
  critique: {
    status: "idle" | "loading" | "success" | "error";
    data?: CritiqueData;
    error?: string;
    isRetryable?: boolean;
  };
};

export function useUploadState() {
  const [state, setState] = useState<UploadState>({
    uploadedImage: null,
    isProcessing: false,
    critique: { status: "idle" },
  });

  // グローバル汚染を削除し、useRefで管理
  const formDataRef = useRef<FormData | null>(null);

  const setUploadedImage = (image: UploadedImage | null) => {
    setState((prev) => ({ ...prev, uploadedImage: image }));
  };

  const setProcessing = (processing: boolean) => {
    setState((prev) => ({ ...prev, isProcessing: processing }));
  };

  const setCritiqueState = (critique: UploadState["critique"]) => {
    setState((prev) => ({ ...prev, critique }));
  };

  const resetState = () => {
    if (state.uploadedImage) {
      URL.revokeObjectURL(state.uploadedImage.preview);
    }
    setState({
      uploadedImage: null,
      isProcessing: false,
      critique: { status: "idle" },
    });
    formDataRef.current = null;
  };

  return {
    state,
    formDataRef,
    setUploadedImage,
    setProcessing,
    setCritiqueState,
    resetState,
  };
}
