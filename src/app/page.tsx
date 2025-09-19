"use client";

import { useUploadFlow } from "@/hooks/useUploadFlow";
import AppHeader from "@/components/common/AppHeader";
import UploadZone from "@/components/upload/UploadZone";
import ImagePreview from "@/components/upload/ImagePreview";
import GenerateButton from "@/components/upload/GenerateButton";

export default function UploadPage() {
  const {
    state,
    handleImageUploaded,
    handleGenerateCritique,
    resetUpload,
  } = useUploadFlow();

  return (
    <div className="mobile-viewport bg-gray-50 scroll-smooth">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-4xl">
        <main
          className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-gray-200 shadow-xl gpu-accelerated tap-highlight-none"
          role="main"
        >
          <AppHeader />

          {!state.uploadedImage ? (
            <UploadZone onImageUploaded={handleImageUploaded} />
          ) : (
            <div className="space-y-6">
              <ImagePreview
                uploadedImage={state.uploadedImage}
                onReset={resetUpload}
              />
              <GenerateButton
                isProcessing={state.isProcessing}
                onGenerate={handleGenerateCritique}
                disabled={!state.uploadedImage}
                critiqueStatus={state.critique.status}
                critiqueError={state.critique.error}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
