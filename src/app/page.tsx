"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  UploadedImage,
  UploadedImageWithFormData,
  CritiqueData,
} from "@/types/upload";
import { uploadImageWithCritique } from "@/app/actions";
import { useCritique } from "@/contexts/CritiqueContext";
import AppHeader from "@/components/common/AppHeader";
import UploadZone from "@/components/upload/UploadZone";
import ImagePreview from "@/components/upload/ImagePreview";
import GenerateButton from "@/components/upload/GenerateButton";

export default function UploadPage() {
  const router = useRouter();
  const { setCritiqueData } = useCritique();

  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [critiqueState, setCritiqueState] = useState<{
    status: "idle" | "loading" | "success" | "error";
    data?: CritiqueData;
    error?: string;
  }>({ status: "idle" });

  const handleImageUploaded = (image: UploadedImageWithFormData) => {
    // FormDataは講評生成時に使用し、UploadedImage部分のみ状態管理
    const uploadedImage: UploadedImage = {
      file: image.file,
      preview: image.preview,
      exif: image.exif,
    };

    setUploadedImage(uploadedImage);
    // 講評状態をリセット
    setCritiqueState({ status: "idle" });

    toast.success("画像をアップロードしました", {
      description: "EXIF情報を解析中...",
      duration: 2000,
    });

    // FormDataを一時保存（講評生成で使用）
    (window as Window & { __uploadFormData?: FormData }).__uploadFormData =
      image.formData;
  };

  const handleGenerateCritique = async () => {
    if (!uploadedImage) return;

    setIsProcessing(true);
    setCritiqueState({ status: "loading" });

    const loadingToastId = toast.loading("AI講評を生成中...", {
      description: "技術・構図・色彩を分析しています",
    });

    try {
      // 保存されたFormData（EXIF情報付き）を使用
      const formData = (window as Window & { __uploadFormData?: FormData })
        .__uploadFormData;
      let result;

      if (!formData) {
        // フォールバック: FormDataが存在しない場合は従来方式
        const fallbackFormData = new FormData();
        fallbackFormData.append("image", uploadedImage.file);
        // EXIFデータも追加
        if (uploadedImage.exif) {
          fallbackFormData.append("exifData", JSON.stringify(uploadedImage.exif));
        }
        result = await uploadImageWithCritique(fallbackFormData);
      } else {
        result = await uploadImageWithCritique(formData);
      }

      // ローディングトーストを削除
      toast.dismiss(loadingToastId);

      if (result.critique.success && result.critique.data) {
        setCritiqueState({
          status: "success",
          data: result.critique.data,
        });

        toast.success("講評が完了しました", {
          description: "結果ページに移動します",
          duration: 1500,
        });

        // Context APIにデータを保存してSPA的に画面遷移
        setTimeout(() => {
          if (uploadedImage && result.critique.data) {
            // Context APIに講評データを保存
            setCritiqueData({
              image: uploadedImage,
              critique: result.critique.data,
            });

            // Next.js routerでSPA的に画面遷移
            router.push("/report/current");
          }
        }, 1500);
      } else {
        setCritiqueState({
          status: "error",
          error: result.critique.error || "講評生成に失敗しました",
        });

        toast.error("講評生成に失敗しました", {
          description: result.critique.error || "再度お試しください",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Critique generation error:", error);

      // ローディングトーストを削除
      toast.dismiss(loadingToastId);

      setCritiqueState({
        status: "error",
        error: "ネットワークエラーが発生しました",
      });

      toast.error("エラーが発生しました", {
        description: "ネットワーク接続を確認してください",
        duration: 3000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetUpload = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage.preview);
    }
    setUploadedImage(null);
    setCritiqueState({ status: "idle" });

    toast("画像をリセットしました", {
      description: "新しい画像を選択してください",
      duration: 2000,
    });
  };

  return (
    <div className="mobile-viewport bg-gray-50 scroll-smooth">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl">
        <main
          className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-200 shadow-xl gpu-accelerated tap-highlight-none"
          role="main"
        >
          <AppHeader />

          {!uploadedImage ? (
            <UploadZone onImageUploaded={handleImageUploaded} />
          ) : (
            <div className="space-y-6">
              <ImagePreview
                uploadedImage={uploadedImage}
                onReset={resetUpload}
              />
              <GenerateButton
                isProcessing={isProcessing}
                onGenerate={handleGenerateCritique}
                disabled={!uploadedImage}
                critiqueStatus={critiqueState.status}
                critiqueError={critiqueState.error}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
