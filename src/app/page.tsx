"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { UploadedImage } from "@/types/upload";
import AppHeader from "@/components/common/AppHeader";
import FeatureCards from "@/components/common/FeatureCards";
import UploadZone from "@/components/upload/UploadZone";
import ImagePreview from "@/components/upload/ImagePreview";
import GenerateButton from "@/components/upload/GenerateButton";

export default function UploadPage() {
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUploaded = (image: UploadedImage) => {
    setUploadedImage(image);

    toast.success("画像をアップロードしました", {
      description: "EXIF情報を解析中...",
      duration: 2000,
    });
  };

  const handleGenerateCritique = async () => {
    if (!uploadedImage) return;

    setIsProcessing(true);

    toast.loading("AI講評を生成中...", {
      description: "技術・構図・色彩を分析しています",
      duration: 2000,
    });

    // In real app, this would call the critique API
    setTimeout(() => {
      toast.success("講評が完了しました", {
        description: "結果ページに移動します",
        duration: 1500,
      });

      setTimeout(() => {
        window.location.href = "/report/demo";
      }, 1500);
    }, 2000);
  };

  const resetUpload = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage.preview);
    }
    setUploadedImage(null);

    toast("画像をリセットしました", {
      description: "新しい画像を選択してください",
      duration: 2000,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-200 shadow-xl">
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
              />
            </div>
          )}

          <FeatureCards />
        </div>
      </div>
    </div>
  );
}
